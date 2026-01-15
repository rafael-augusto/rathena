import json
import yaml
import re
import ast

# Path to the input and output files
input_file = r'c:\Projetos\ProjectRevo\rathena\calculator\rocalc\monster_2025-08-10.js'
output_file = r'c:\Projetos\ProjectRevo\rathena\calculator\devarocalc\src\data\mobs.yml'

def parse_monster_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the array content. It starts after 'm_Monster = [' and ends before '];'
    start_index = content.find('m_Monster = [')
    end_index = content.find('];')
    
    if start_index == -1 or end_index == -1:
        print("Could not find m_Monster array in file.")
        return []

    # Get the raw array string, stripping the variable declaration
    # m_Monster = [ ... ] -> we want [ ... ]
    array_str = content[start_index + 12 : end_index + 1]
    
    # 1. Remove single line comments // ...
    array_str = re.sub(r'//.*', '', array_str)
    
    # 2. Remove multi line comments /* ... */
    array_str = re.sub(r'/\*.*?\*/', '', array_str, flags=re.DOTALL)
    
    # 3. Handle sparse arrays: JS allow [1,,2]. Python does not.
    # Replace ,, with ,None,
    # We might have ,,, so we need to loop until no change
    max_loops = 10
    for _ in range(max_loops):
        new_str = array_str.replace(',,', ',None,')
        new_str = new_str.replace(',,', ',None,') # Do twice to catch overlaps like ,,,
        new_str = new_str.replace('[,', '[None,') # Start of array
        new_str = new_str.replace(',]', ',None]') # End of array
        if new_str == array_str:
            break
        array_str = new_str

    try:
        monsters_data = ast.literal_eval(array_str)
        return monsters_data
    except Exception as e:
        print(f"Error parsing array: {e}")
        # Debug: print first 500 chars of fixed string
        print("First 500 chars of sanitised string:")
        print(array_str[:500])
        return []

def convert_to_yaml(data):
    mobs = []
    for m in data:
        if not m or len(m) < 20: continue
        
        # Schema mapping based on analysis
        # [0:ID, 1:Name, 2:Race, 3:Ele, 4:Size, 5:Lv, 6:HP, 7:Vit, 8:Agi, 9:Int, 10:Dex, 11:Luk, 
        # 12:MinAtk, 13:MaxAtk, 14:Def, 15:MDef, 16:BaseExp, 17:JobExp, 18:?, 19:Boss, 20:Range]
        
        mob = {
            'id': m[0],
            'name': m[1],
            'race': m[2],
            'element': m[3],
            'size': m[4],
            'lvl': m[5],
            'hp': m[6],
            'vit': m[7],
            'agi': m[8],
            'int': m[9],
            'dex': m[10],
            'luk': m[11],
            'atkMin': m[12],
            'atkMax': m[13],
            'def': m[14],
            'mdef': m[15],
            'baseExp': m[16],
            'jobExp': m[17],
            'boss': True if (len(m) > 19 and m[19] == 1) else False,
            'range': True if (len(m) > 20 and m[20] == 1) else False
        }
        mobs.append(mob)
    
    return mobs

if __name__ == "__main__":
    print("Reading monster file...")
    raw_data = parse_monster_file(input_file)
    print(f"Found {len(raw_data)} monsters.")
    
    if raw_data:
        mobs = convert_to_yaml(raw_data)
        print(f"Converted {len(mobs)} monsters.")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            yaml.dump(mobs, f, sort_keys=False, width=1000)
        print(f"Data written to {output_file}")
