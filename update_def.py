import sys
import re
import yaml
import collections

def parse_equip_db(file_path):
    """Parses the item_db_equip.yml file to extract base defense values and a mapping from AegisName to item ID."""
    print(f"Reading base DEF from {file_path}...")
    base_def_map = {}
    aegis_to_id_map = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Use load_all for multi-document YAML files, though not expected here
            data = yaml.safe_load(f)
            if not data or 'Body' not in data:
                print(f"Warning: Could not find 'Body' in {file_path}. Skipping.")
                return {}, {}
            
            for item in data['Body']:
                if not isinstance(item, dict) or 'Id' not in item or 'AegisName' not in item:
                    continue
                
                item_id = item['Id']
                aegis_name = item['AegisName']
                
                # The key for defense is 'Defense'
                base_def = item.get('Defense', 0)
                base_def_map[item_id] = base_def
                
                aegis_to_id_map[aegis_name] = item_id
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {file_path}: {e}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Found {len(aegis_to_id_map)} items in equip DB.")
    return base_def_map, aegis_to_id_map

def parse_combo_db(file_path, aegis_to_id_map):
    """Parses the item_combos.yml file to extract defense bonuses from item combos."""
    print(f"Reading combo bonuses from {file_path}...")
    combo_bonuses = collections.defaultdict(int)
    def_bonus_regex = re.compile(r'bonus\s+bDef,(\d+);', re.IGNORECASE)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if not data or 'Body' not in data:
                print(f"Warning: Could not find 'Body' in {file_path}. Skipping.")
                return {}

            for combo_group in data['Body']:
                script = combo_group.get('Script')
                if not script:
                    continue

                # Find all def bonuses in the script and sum them up
                # This handles cases like `bonus bDef,5; ... bonus bDef,6;`
                total_bonus_in_script = sum(int(b) for b in def_bonus_regex.findall(script))

                if total_bonus_in_script == 0:
                    continue
                
                if 'Combos' not in combo_group or not isinstance(combo_group['Combos'], list):
                    continue
                
                # Collect all unique item AegisNames within this combo group
                unique_item_names = set()
                for combo_dict in combo_group['Combos']:
                    if 'Combo' in combo_dict and isinstance(combo_dict['Combo'], list):
                        for aegis_name in combo_dict['Combo']:
                            unique_item_names.add(aegis_name)

                # Apply the bonus to each unique item found in the group
                for aegis_name in unique_item_names:
                    item_id = aegis_to_id_map.get(aegis_name)
                    if item_id:
                        combo_bonuses[item_id] += total_bonus_in_script
                            
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {file_path}: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(combo_bonuses)} items with combo DEF bonuses.")
    return combo_bonuses

def update_lub_file(lub_path, total_def_map):
    """Updates the equipmentproperties.lub file with the calculated total defense values."""
    print(f"Updating DEF values in {lub_path}...")
    
    try:
        with open(lub_path, 'r', encoding='latin-1') as f: # .lub files often use extended ASCII
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: File not found at {lub_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file {lub_path}: {e}", file=sys.stderr)
        sys.exit(1)

    stat_regex = re.compile(r'^(\s*\[(\d+)\]\s*=\s*\{\s*Type\s*=\s*"armor",\s*Stat\s*=\s*\{\s*)(\d+)(.*)')
    
    new_lines = []
    changes = []
    
    for line in lines:
        match = stat_regex.match(line)
        if match:
            prefix = match.group(1)
            item_id = int(match.group(2))
            old_def_str = match.group(3)
            old_def = int(old_def_str)
            suffix = match.group(4)
            
            # Check if this item should have its DEF updated
            if item_id in total_def_map:
                new_def = total_def_map[item_id]
                if new_def != old_def:
                    new_line = f"{prefix}{new_def}{suffix.rstrip()}"
                    new_lines.append(new_line + '\n')
                    changes.append({'id': item_id, 'old': old_def, 'new': new_def})
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    if changes:
        print("Applying changes...")
        try:
            with open(lub_path, 'w', encoding='latin-1') as f:
                f.writelines(new_lines)
            
            print("\n--- Resumo das Alterações ---")
            for change in sorted(changes, key=lambda x: x['id']):
                print(f"ID {change['id']}: DEF alterado de {change['old']} para {change['new']}.")
            print(f"\nTotal de {len(changes)} itens atualizados em {lub_path}.")
        except IOError as e:
            print(f"Error writing to file {lub_path}: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Nenhuma alteração necessária. O arquivo já está sincronizado.")

def main():
    if len(sys.argv) != 4:
        print("Uso: python update_def.py <item_db_equip.yml> <item_combos.yml> <equipmentproperties.lub>")
        sys.exit(1)
        
    equip_db_path = sys.argv[1]
    combo_db_path = sys.argv[2]
    lub_file_path = sys.argv[3]
    
    # 1. Parse equip DB for base def and name-to-id mapping
    base_def_map, aegis_to_id_map = parse_equip_db(equip_db_path)
    
    # 2. Parse combo DB for bonuses
    combo_bonuses = parse_combo_db(combo_db_path, aegis_to_id_map)
    
    # 3. Calculate total DEF by adding base and combo bonuses
    total_def_map = base_def_map.copy()
    for item_id, bonus in combo_bonuses.items():
        total_def_map[item_id] = total_def_map.get(item_id, 0) + bonus
        
    # 4. Update the .lub file
    update_lub_file(lub_file_path, total_def_map)

if __name__ == "__main__":
    main()
