import requests
from bs4 import BeautifulSoup
import re

url = 'https://ratemyserver.net/item_db.php?item_id=1632&small=1&back=1'
print(f"Fetching {url}...")
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get(url, headers=headers, timeout=15)
    print(f"Status Code: {r.status_code}")
    
    soup = BeautifulSoup(r.content, 'html.parser')
    desc_el = soup.find(class_="longtext")
    
    if desc_el:
        print("\n--- Raw Content of .longtext ---")
        print(desc_el.decode_contents())
        
        # Simulate the script's logic
        for a in desc_el.find_all('a'):
            a.unwrap()
        
        html_content = desc_el.decode_contents()
        html_content = re.sub(r'<br\s*/?>\s*More Information on Combo.*$', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'More Information on Combo.*$', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        print("\n--- Processed Content ---")
        print(html_content.strip())
    else:
        print("No element with class 'longtext' found.")

except Exception as e:
    print(f"Error: {e}")
