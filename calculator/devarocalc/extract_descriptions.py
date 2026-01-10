import re
import os
import json

def extract_item_data(file_path, is_etc=False):
    items_data = {}
    if not os.path.exists(file_path):
        return items_data
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    items = content.split("- Id: ")
    for item in items[1:]:
        lines = item.splitlines()
        if not lines: continue
        item_id = lines[0].strip()
        name = None
        desc_lines = []
        in_description = False
        desc_indent = 0
        
        data = {
            "id": int(item_id),
            "atk": 0,
            "matk": 0,
            "def": 0,
            "weight": 0,
            "slots": 0,
            "wpnLvl": 0,
            "armLvl": 0,
            "minLvl": 0,
            "desc": ""
        }
        
        for line in lines[1:]:
            # Use regex with anchors to avoid partial matches (like Attack in MagicAttack)
            if re.match(r'^\s+Name:', line):
                m = re.match(r'^\s+Name:\s*(.*)', line)
                if m:
                    name = m.group(1).strip()
                    if (name.startswith('"') and name.endswith('"')) or (name.startswith("'") and name.endswith("'")):
                        name = name[1:-1].strip()
            elif re.match(r'^\s+Attack:', line):
                m = re.search(r'Attack:\s*(\d+)', line)
                if m: data["atk"] = int(m.group(1))
            elif re.match(r'^\s+MagicAttack:', line):
                m = re.search(r'MagicAttack:\s*(\d+)', line)
                if m: data["matk"] = int(m.group(1))
            elif re.match(r'^\s+Defense:', line):
                m = re.search(r'Defense:\s*(\d+)', line)
                if m: data["def"] = int(m.group(1))
            elif re.match(r'^\s+Weight:', line):
                m = re.search(r'Weight:\s*(\d+)', line)
                if m: data["weight"] = int(m.group(1))
            elif re.match(r'^\s+Slots:', line):
                m = re.search(r'Slots:\s*(\d+)', line)
                if m: data["slots"] = int(m.group(1))
            elif re.match(r'^\s+WeaponLevel:', line):
                m = re.search(r'WeaponLevel:\s*(\d+)', line)
                if m: data["wpnLvl"] = int(m.group(1))
            elif re.match(r'^\s+ArmorLevel:', line):
                m = re.search(r'ArmorLevel:\s*(\d+)', line)
                if m: data["armLvl"] = int(m.group(1))
            elif re.match(r'^\s+EquipLevelMin:', line):
                m = re.search(r'EquipLevelMin:\s*(\d+)', line)
                if m: data["minLvl"] = int(m.group(1))
            elif re.match(r'^\s+Description:', line):
                in_description = True
                desc_indent_match = re.match(r'^(\s*)', line)
                desc_indent = len(desc_indent_match.group(1)) if desc_indent_match else 0
                continue
            
            if in_description:
                current_indent_match = re.match(r'^(\s*)', line)
                current_indent = len(current_indent_match.group(1)) if current_indent_match else 0
                if line.strip() == '' or current_indent > desc_indent:
                    desc_lines.append(line.strip())
                else:
                    in_description = False
        
        if name and item_id:
            clean_desc = '<br/>'.join(desc_lines).strip()
            while clean_desc.endswith('<br/>'): clean_desc = clean_desc[:-5]
            while clean_desc.startswith('<br/>'): clean_desc = clean_desc[5:]
            if clean_desc == 'Not Available': clean_desc = ""
            data["desc"] = clean_desc
            
            # Use lowercase name as key for easier lookup
            key = name.lower().strip()
            if key not in items_data or data["id"] < items_data[key]["id"]:
                items_data[key] = data
                
    return items_data

def main():
    equip_path = 'db/pre-re/item_db_equip.yml'
    etc_path = 'db/pre-re/item_db_etc.yml'
    all_data = {}
    all_data.update(extract_item_data(equip_path))
    all_data.update(extract_item_data(etc_path, is_etc=True))
    output_path = 'calculator/devarocalc/src/data/item_db_descriptions.ts'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        print('export interface DbItem { id: number; atk: number; matk: number; def: number; weight: number; slots: number; wpnLvl: number; armLvl: number; minLvl: number; desc: string; }', file=f)
        print('', file=f)
        print('export const ItemDbData: Record<string, DbItem> = {', file=f)
        for name_key in sorted(all_data.keys()):
            item_info = all_data[name_key]
            key_val = json.dumps(name_key)
            info_val = json.dumps(item_info)
            line = "  {}: {},".format(key_val, info_val)
            print(line, file=f)
        print('};', file=f)
    print("Saved to {}".format(output_path))

if __name__ == '__main__':
    main()