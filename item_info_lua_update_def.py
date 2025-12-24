import sys
import re
import yaml

def parse_equip_db(file_path):
    """Parses the item_db_equip.yml file to extract base defense values."""
    print(f"Reading base DEF from {file_path}...")
    base_def_map = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if not data or 'Body' not in data:
                print(f"Warning: Could not find 'Body' in {file_path}. Skipping.", file=sys.stderr)
                return {}
            
            for item in data['Body']:
                if not isinstance(item, dict) or 'Id' not in item:
                    continue
                
                # Only consider items that have a Defense key
                if 'Defense' in item:
                    base_def_map[item['Id']] = item['Defense']

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {file_path}: {e}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Found {len(base_def_map)} items with a DEF value.")
    return base_def_map

def update_item_info_lua(lua_path, base_def_map):
    """Reads itemInfo.lua, updates defense values, and writes to a new file."""
    output_path = "itemInfo_updated.lua"
    print(f"Checking for DEF description updates in {lua_path} (binary mode)...")
    
    try:
        with open(lua_path, 'rb') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file {lua_path} in binary mode: {e}", file=sys.stderr)
        sys.exit(1)

    # All regex and strings must be bytes
    item_start_re = re.compile(b"^\s*\[(\d+)\]\s*=\s*{")
    def_line_re = re.compile(b'(\s*".*?Defense:\^000000\s*)(\d+)(.*)')
    id_desc_name_re = re.compile(b"identifiedDescriptionName")
    block_end_re = re.compile(b"^\s*},")

    new_lines = []
    changes = []
    current_item_id = None
    in_description_block = False

    for line in lines:
        original_line = line
        line_processed = False

        item_match = item_start_re.match(line)
        if item_match:
            current_item_id = int(item_match.group(1))
            in_description_block = False

        if id_desc_name_re.search(line):
            in_description_block = True
        
        if current_item_id is not None and in_description_block:
            def_match = def_line_re.search(line)
            if def_match and current_item_id in base_def_map:
                old_def = int(def_match.group(2))
                new_def = base_def_map[current_item_id]
                
                if old_def != new_def:
                    prefix = def_match.group(1)
                    suffix = def_match.group(3)
                    updated_line = prefix + str(new_def).encode('ascii') + suffix.rstrip() + b'\n'
                    new_lines.append(updated_line)
                    line_processed = True
                    changes.append({
                        'id': current_item_id,
                        'old': old_def,
                        'new': new_def,
                        'line': updated_line.strip().decode('utf-8', errors='replace') # Safe decode for printing
                    })
        
        if not line_processed:
            new_lines.append(original_line)

        if block_end_re.match(line):
            current_item_id = None
            in_description_block = False
    
    if changes:
        print(f"Applying changes and writing to {output_path}...")
        try:
            with open(output_path, 'wb') as f:
                f.writelines(new_lines)
            
            print("\n--- Resumo das Alterações ---")
            for change in sorted(changes, key=lambda x: x['id']):
                print(f"ID {change['id']}: DEF na descrição alterado de {change['old']} para {change['new']} -> {change['line']}")
            print(f"\nTotal de {len(changes)} descrições de itens atualizadas em {output_path}.")
        except IOError as e:
            print(f"Error writing to file {output_path}: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Nenhuma alteração necessária. As descrições de defesa no arquivo já estão sincronizadas.")


def main():
    if len(sys.argv) != 3:
        print("Uso: python item_info_lua_update_def.py <item_db_equip.yml> <itemInfo.lua>")
        sys.exit(1)
        
    equip_db_path = sys.argv[1]
    lua_file_path = sys.argv[2]
    
    base_def_map = parse_equip_db(equip_db_path)
    
    update_item_info_lua(lua_file_path, base_def_map)

if __name__ == "__main__":
    main()
