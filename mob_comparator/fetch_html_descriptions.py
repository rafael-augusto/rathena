import os
import re
import requests
import yaml
import time
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Configuration
DB_FILES = [
    '../db/pre-re/item_db_equip.yml',
    '../db/pre-re/item_db_etc.yml',
    '../db/pre-re/item_db_usable.yml'
]
DESC_URL = 'https://ratemyserver.net/item_db.php?item_id={}&small=1&back=1'
MAX_WORKERS = 1 # Set to 1 to strictly respect the 1-second delay and avoid rate limits

# Use a session for connection pooling
session = requests.Session()
session.headers.update({'User-Agent': 'Mozilla/5.0'})

# Event to signal cancellation
stop_event = threading.Event()

def get_item_description_html(item_id):
    if stop_event.is_set(): return None
    url = DESC_URL.format(item_id)
    try:
        r = session.get(url, timeout=15)
        if r.status_code == 200:
            soup = BeautifulSoup(r.content, 'html.parser')
            desc_el = soup.find(class_="longtext")
            if desc_el:
                for a in desc_el.find_all('a'):
                    a.unwrap()
                html_content = desc_el.decode_contents()
                html_content = re.sub(r'<br\s*/?>\s*More Information on Combo.*$', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                html_content = re.sub(r'More Information on Combo.*$', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                return html_content.strip()
        elif r.status_code == 429:
            print(f"[{item_id}] Rate limited (429).")
            return "RETRY" # Signal to retry later if we want, or just skip
    except Exception as e:
        print(f"[{item_id}] Error: {e}")
    return None

def process_item_task(item_id):
    if stop_event.is_set(): return item_id, None
    desc = get_item_description_html(item_id)
    time.sleep(1) # Wait 1 second after each request
    return item_id, desc

def apply_descriptions_to_file(filepath, descriptions):
    print(f"[{filepath}] Writing batch of {len(descriptions)} descriptions to disk...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file {filepath}: {e}")
        return

    new_lines = []
    current_id = None
    written_ids = set()
    skipping = False
    base_indent = 0
    id_pattern = re.compile(r'^\s*-\s*Id:\s*(\d+)')
    
    for line in lines:
        if stop_event.is_set(): return
        id_match = id_pattern.match(line)
        if id_match:
            current_id = int(id_match.group(1))
            skipping = False
            new_lines.append(line)
            continue
            
        if skipping:
            if not line.strip(): continue
            curr_line_indent = len(line) - len(line.lstrip())
            if curr_line_indent <= base_indent: skipping = False
            else: continue 
        
        if current_id in descriptions and current_id not in written_ids:
            name_match = re.match(r'^(\s*)Name:', line)
            if name_match:
                new_lines.append(line)
                indent = name_match.group(1)
                desc_html = descriptions[current_id]
                formatted_desc = re.sub(r'(<br\s*/?>)', r'\1\n', desc_html)
                new_lines.append(f"{indent}Description: |\n")
                for d_line in formatted_desc.split('\n'):
                    if d_line.strip(): new_lines.append(f"{indent}  {d_line.strip()}\n")
                    else: new_lines.append(f"\n") 
                written_ids.add(current_id)
                continue

        desc_match = re.match(r'^(\s*)Description:', line)
        if desc_match:
            if current_id in descriptions:
                if current_id in written_ids:
                    skipping = True
                    base_indent = len(desc_match.group(1))
                    continue
                else:
                    indent = desc_match.group(1)
                    desc_html = descriptions[current_id]
                    formatted_desc = re.sub(r'(<br\s*/?>)', r'\1\n', desc_html)
                    new_lines.append(f"{indent}Description: |\n")
                    for d_line in formatted_desc.split('\n'):
                        if d_line.strip(): new_lines.append(f"{indent}  {d_line.strip()}\n")
                        else: new_lines.append(f"\n")
                    written_ids.add(current_id)
                    skipping = True
                    base_indent = len(indent)
                    continue
            else:
                new_lines.append(line)
                continue
        new_lines.append(line)

    if not stop_event.is_set():
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

def update_file(filepath):
    if stop_event.is_set(): return
    print(f"Starting processing for {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if not data or 'Body' not in data: return
            items_to_fetch = []
            for item in data['Body']:
                if 'Id' not in item: continue
                desc = item.get('Description', '')
                if desc and '<br' in desc: continue
                items_to_fetch.append(item['Id'])
            print(f"[{filepath}] Found {len(items_to_fetch)} items needing HTML description.")
    except Exception as e:
        print(f"Error parsing YAML {filepath}: {e}")
        return

    CHUNK_SIZE = 50
    total_ids = len(items_to_fetch)
    for i in range(0, total_ids, CHUNK_SIZE):
        if stop_event.is_set(): break
        chunk_ids = items_to_fetch[i:i + CHUNK_SIZE]
        descriptions = {}
        print(f"[{filepath}] Processing batch {i+1}-{min(i+CHUNK_SIZE, total_ids)} of {total_ids}...")
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(process_item_task, iid): iid for iid in chunk_ids}
            try:
                for future in as_completed(futures):
                    if stop_event.is_set(): return
                    iid, desc = future.result()
                    if desc == "RETRY":
                        print("Rate limit hit. Stopping this file for now.")
                        stop_event.set()
                        return
                    if desc: descriptions[iid] = desc
            except KeyboardInterrupt:
                stop_event.set()
                raise
        if descriptions: apply_descriptions_to_file(filepath, descriptions)
    print(f"Finished processing {filepath}")

if __name__ == "__main__":
    try:
        for f in DB_FILES:
            if stop_event.is_set(): break
            if os.path.exists(f): update_file(f)
    except KeyboardInterrupt:
        stop_event.set()
