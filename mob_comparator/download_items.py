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

def process_item_task(item_id):
    """Worker function to process a single item."""
    # Download Images
    small_path = os.path.join(IMG_DIR, f"{item_id}.gif")
    large_path = os.path.join(IMG_DIR, f"{item_id}_large.gif")
    
    download_image(SMALL_IMG_URL.format(item_id), small_path)
    download_image(LARGE_IMG_URL.format(item_id), large_path)
    
    return item_id

def process_file(filepath):
    print(f"Processing {filepath}...")
    
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
    all_ids = [item['Id'] for item in items if 'Id' in item]
    
    # Filter for items that are missing images
    items_to_download = []
    for iid in all_ids:
        small_path = os.path.join(IMG_DIR, f"{iid}.gif")
        large_path = os.path.join(IMG_DIR, f"{iid}_large.gif")
        
        # If either is missing, add to list
        if not (os.path.exists(small_path) and os.path.exists(large_path)):
            items_to_download.append(iid)

    total = len(items_to_download)
    if total == 0:
        print(f"  All {len(all_ids)} items in this file have images. Skipping.")
        return

    print(f"  Found {len(all_ids)} items. Downloading {total} missing images with {MAX_WORKERS} threads...")
    
    processed_count = 0
    
    # ThreadPool Execution
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit filtered tasks
        futures = {executor.submit(process_item_task, iid): iid for iid in items_to_download}
        
        for future in as_completed(futures):
            processed_count += 1
            if processed_count % 50 == 0:
                print(f"  Progress: {processed_count}/{total}")
                
            try:
                future.result()
            except Exception as e:
                print(f"  Task failed: {e}")

if __name__ == "__main__":
    ensure_dir(IMG_DIR)
    for db_file in DB_FILES:
        if os.path.exists(db_file):
            process_file(db_file)
        else:
            print(f"File not found: {db_file}")