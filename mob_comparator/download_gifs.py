import os
import yaml
import requests
import time

# Configuration
DB_PATH = '../db/pre-re/mob_db.yml'
OUTPUT_DIR = 'static/mob_gifs'
BASE_URL = 'https://file5s.ratemyserver.net/mobs/{}.gif'

def load_mob_ids(filepath):
    """Loads mob IDs from the YAML database."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if not data or 'Body' not in data:
                print("Invalid YAML format or empty 'Body'.")
                return []
            
            ids = [mob['Id'] for mob in data['Body'] if 'Id' in mob]
            return ids
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def download_gifs(mob_ids):
    """Downloads GIFs for the given mob IDs."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    # Filter out mobs that already have an image
    missing_ids = [
        mob_id for mob_id in mob_ids 
        if not os.path.exists(os.path.join(OUTPUT_DIR, f"{mob_id}.gif"))
    ]

    total = len(missing_ids)
    if total == 0:
        print("All mob GIFs already exist. Nothing to download.")
        return

    print(f"Found {len(mob_ids)} mobs in DB. Downloading {total} missing images...")

    for i, mob_id in enumerate(missing_ids):
        file_path = os.path.join(OUTPUT_DIR, f"{mob_id}.gif")
        
        # Double check (though list was just filtered)
        if os.path.exists(file_path):
            continue

        url = BASE_URL.format(mob_id)
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                print(f"[{i+1}/{total}] Downloaded {mob_id}.gif")
            else:
                print(f"[{i+1}/{total}] Failed {mob_id} (Status: {response.status_code})")
        except Exception as e:
            print(f"[{i+1}/{total}] Error downloading {mob_id}: {e}")
        
        # Be nice to the server
        time.sleep(0.1)

if __name__ == "__main__":
    ids = load_mob_ids(DB_PATH)
    if ids:
        download_gifs(ids)
    else:
        print("No mob IDs found.")
