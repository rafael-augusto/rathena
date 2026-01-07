import os
import re
import time
import requests
import yaml
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
DB_FILES = [
    '../db/pre-re/item_db_equip.yml',
    '../db/pre-re/item_db_etc.yml',
    '../db/pre-re/item_db_usable.yml'
]
IMG_DIR = 'static/items'
SMALL_IMG_URL = 'https://file5s.ratemyserver.net/items/small/{}.gif'
LARGE_IMG_URL = 'https://file5s.ratemyserver.net/items/large/{}.gif'
DESC_URL = 'https://ratemyserver.net/item_db.php?item_id={}&small=1&back=1'
MAX_WORKERS = 20

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_image(url, save_path):
    if os.path.exists(save_path):
        return # Skip if exists
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(r.content)
            # print(f"Downloaded {save_path}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def get_item_description(item_id):
    url = DESC_URL.format(item_id)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200:
            return None
        
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Search for "Description" text
        candidates = soup.find_all(string=re.compile(r"Description"))
        
        for cand in candidates:
            text = cand.strip()
            # We are looking for the label "Description" or "Description :"
            if not re.match(r"^Description\s*:?$", text, re.IGNORECASE):
                continue
                
            # Found the label. Now extract text following it.
            parent = cand.parent
            
            # Gather text from siblings
            content = []
            
            # Determine start node
            curr = cand.next_sibling
            if not curr:
                # If no sibling text/tag, assume we are inside a label container (b, th, td, span, strong)
                # and want the next sibling of that container.
                if parent.name in ['b', 'th', 'td', 'span', 'strong']:
                    curr = parent.next_sibling
                
            while curr:
                if curr.name == 'br':
                    content.append('\n')
                elif curr.name in ['hr', 'table']: 
                    break
                elif isinstance(curr, str):
                    t = curr.strip()
                    if t: content.append(t + " ")
                elif curr.name:
                    t = curr.get_text(separator=" ", strip=True)
                    if t: content.append(t + " ")
                
                curr = curr.next_sibling
            
            full_desc = "".join(content).strip()
            if full_desc:
                # Basic cleanup
                if "Item ID#" in full_desc:
                    continue
                return full_desc

    except Exception as e:
        print(f"Error fetching description for {item_id}: {e}")
    
    return None

def process_item_task(item_id, item_data):
    """Worker function to process a single item."""
    # Download Images
    small_path = os.path.join(IMG_DIR, f"{item_id}.gif")
    large_path = os.path.join(IMG_DIR, f"{item_id}_large.gif")
    
    download_image(SMALL_IMG_URL.format(item_id), small_path)
    download_image(LARGE_IMG_URL.format(item_id), large_path)
    
    # Fetch Description if missing
    desc = None
    if 'Description' not in item_data:
        desc = get_item_description(item_id)
    
    return item_id, desc

def process_file(filepath):
    print(f"Processing {filepath} with {MAX_WORKERS} threads...")
    
    # 1. Parse YAML to get IDs
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"YAML Error in {filepath}: {e}")
            return

    if not data or 'Body' not in data:
        print("No 'Body' found in YAML.")
        return

    items = data['Body']
    # Map ID to Item Data for reference
    id_map = {item['Id']: item for item in items if 'Id' in item}
    
    # We will collect descriptions to insert
    descriptions = {}
    
    total = len(id_map)
    processed_count = 0
    
    # ThreadPool Execution
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        futures = {executor.submit(process_item_task, iid, idata): iid for iid, idata in id_map.items()}
        
        for future in as_completed(futures):
            processed_count += 1
            if processed_count % 10 == 0:
                print(f"  Progress: {processed_count}/{total}")
                
            try:
                item_id, desc = future.result()
                if desc:
                    descriptions[item_id] = desc
            except Exception as e:
                print(f"  Task failed: {e}")

    if not descriptions:
        print("No new descriptions found or fetched.")
        return

    # 2. Insert descriptions into file preserving structure
    update_file_with_descriptions(filepath, descriptions)

def update_file_with_descriptions(filepath, descriptions):
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    current_id = None
    processed_ids = set()
    
    # Regex to capture "  - Id: 1234"
    id_pattern = re.compile(r'^\s*-\s*Id:\s*(\d+)')
    
    for line in lines:
        new_lines.append(line)
        
        # Check for ID
        match = id_pattern.match(line)
        if match:
            current_id = int(match.group(1))
            continue
            
        # If we are inside an item block (current_id is set)
        if current_id in descriptions and current_id not in processed_ids:
            # Insert after 'Name:'
            if re.match(r'^\s*Name:', line):
                desc_text = descriptions[current_id]
                indent = re.match(r'^(\s*)', line).group(1)
                desc_block = f"{indent}Description: |\n"
                for d_line in desc_text.split('\n'):
                    desc_block += f"{indent}  {d_line}\n"
                
                new_lines.append(desc_block)
                processed_ids.add(current_id)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Updated {filepath} with {len(processed_ids)} descriptions.")

if __name__ == "__main__":
    ensure_dir(IMG_DIR)
    for db_file in DB_FILES:
        if os.path.exists(db_file):
            process_file(db_file)
        else:
            print(f"File not found: {db_file}")