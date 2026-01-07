import yaml
from flask import Flask, render_template, request

app = Flask(__name__)

def load_mob_database(filepath):
    """Loads a mob database from a YAML file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            # The actual mob data is under the 'Body' key
            mob_list = data.get('Body', [])
            # Convert list to dict with AegisName as key for easy lookup
            mob_dict = {mob['AegisName']: mob for mob in mob_list if 'AegisName' in mob}
            return mob_dict
    except FileNotFoundError:
        return {}
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return {}

def calculate_re_def_reduction(defense):
    """Calculates renewal defense reduction percentage."""
    if defense is None:
        return 0
    try:
        # Formula for multiplier: [(4000 + DEF) / (4000 + DEF * 10)]
        # Reduction is 1 - multiplier
        multiplier = (4000 + defense) / (4000 + defense * 10)
        reduction = (1 - multiplier) * 100
        return reduction
    except ZeroDivisionError:
        return 0

def calculate_re_mdef_reduction(mdef):
    """Calculates renewal magic defense reduction percentage."""
    if mdef is None:
        return 0
    try:
        # Formula for multiplier: [(1000 + MDEF) / (1000 + MDEF * 10)]
        # Reduction is 1 - multiplier
        multiplier = (1000 + mdef) / (1000 + mdef * 10)
        reduction = (1 - multiplier) * 100
        return reduction
    except ZeroDivisionError:
        return 0

# Load databases on startup
# Note: Adjust the path if the script is not run from the root of rAthena project
pre_re_mobs = load_mob_database('../db/pre-re/mob_db.yml')
pre_re_mobs_by_id = {mob['Id']: mob for mob in pre_re_mobs.values() if 'Id' in mob}
re_mobs = load_mob_database('../db/re/mob_db.yml')
mob_names = sorted(pre_re_mobs.keys())


@app.route('/mob/<int:mob_id>')
def mob_detail(mob_id):
    mob = pre_re_mobs_by_id.get(mob_id)
    if not mob:
        return "Mob not found", 404
    return render_template('detail.html', mob=mob)


@app.route('/charts')
def charts():
    # --- Pre-RE Data Processing ---
    pre_re_chart_data = []
    pre_re_details = {}
    for mob in pre_re_mobs.values():
        level = mob.get('Level', 1)
        avg_attack = (mob.get('Attack', 0) + mob.get('Attack2', 0)) / 2

        if 2 <= avg_attack <= 10000: # Apply filter for attack range
            pre_re_chart_data.append({'x': level, 'y': avg_attack})
            
            if level not in pre_re_details:
                pre_re_details[level] = []
            
            pre_re_details[level].append({
                'name': mob.get('AegisName', 'Unknown'),
                'atk': f"{mob.get('Attack', 0)}-{mob.get('Attack2', 0)}",
                'hp': mob.get('Hp', 1),
                'exp': mob.get('BaseExp', 0)
            })

    # --- RE Data Processing ---
    re_chart_data = []
    re_details = {}
    for mob in re_mobs.values():
        level = mob.get('Level', 1)
        attack = mob.get('Attack', 0)

        if 2 <= attack <= 10000: # Apply filter for attack range
            re_chart_data.append({'x': level, 'y': attack})

            if level not in re_details:
                re_details[level] = []

            re_details[level].append({
                'name': mob.get('AegisName', 'Unknown'),
                'atk': attack,
                'hp': mob.get('Hp', 1),
                'exp': mob.get('BaseExp', 0)
            })

    return render_template('charts.html',
                           pre_re_chart_data=pre_re_chart_data,
                           pre_re_details=pre_re_details,
                           re_chart_data=re_chart_data,
                           re_details=re_details)


@app.route('/', methods=['GET'])
def index():
    selected_mob_name = request.args.get('mob')
    pre_re_stats = None
    re_stats = None

    if selected_mob_name and selected_mob_name in pre_re_mobs:
        # --- Pre-RE Stats ---
        pre_re_mob = pre_re_mobs.get(selected_mob_name, {})
        pre_re_def = pre_re_mob.get('Defense', 0)
        pre_re_mdef = pre_re_mob.get('MagicDefense', 0)
        
        pre_re_stats = {
            'Id': pre_re_mob.get('Id'),
            'Level': pre_re_mob.get('Level', 1),
            'Hp': pre_re_mob.get('Hp', 1),
            'BaseExp': pre_re_mob.get('BaseExp', 0),
            'JobExp': pre_re_mob.get('JobExp', 0),
            'Attack': f"{pre_re_mob.get('Attack', 0)} - {pre_re_mob.get('Attack2', 0)}",
            'Defense': pre_re_def,
            'DefReduction': pre_re_def, # Direct percentage in pre-re
            'MagicDefense': pre_re_mdef,
            'MDefReduction': pre_re_mdef, # Direct percentage in pre-re
            'Str': pre_re_mob.get('Str', 1),
            'Agi': pre_re_mob.get('Agi', 1),
            'Vit': pre_re_mob.get('Vit', 1),
            'Int': pre_re_mob.get('Int', 1),
            'Dex': pre_re_mob.get('Dex', 1),
            'Luk': pre_re_mob.get('Luk', 1),
        }

        # --- RE Stats ---
        if selected_mob_name in re_mobs:
            re_mob = re_mobs.get(selected_mob_name, {})
            re_def = re_mob.get('Defense', 0)
            re_mdef = re_mob.get('MagicDefense', 0)

            re_stats = {
                'Level': re_mob.get('Level', 1),
                'Hp': re_mob.get('Hp', 1),
                'BaseExp': re_mob.get('BaseExp', 0),
                'JobExp': re_mob.get('JobExp', 0),
                # In renewal, Attack is base attack and Attack2 is magic attack.
                'Attack': re_mob.get('Attack', 0),
                'MagicAttack': re_mob.get('Attack2', 0),
                'Defense': re_def,
                'DefReduction': calculate_re_def_reduction(re_def),
                'MagicDefense': re_mdef,
                'MDefReduction': calculate_re_mdef_reduction(re_mdef),
                'Str': re_mob.get('Str', 1),
                'Agi': re_mob.get('Agi', 1),
                'Vit': re_mob.get('Vit', 1),
                'Int': re_mob.get('Int', 1),
                'Dex': re_mob.get('Dex', 1),
                'Luk': re_mob.get('Luk', 1),
            }

    return render_template('index.html', mob_names=mob_names, selected_mob=selected_mob_name, pre_re_stats=pre_re_stats, re_stats=re_stats)

if __name__ == '__main__':
    app.run(debug=True)
