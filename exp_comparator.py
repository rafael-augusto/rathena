from flask import Flask, jsonify, render_template
import yaml
import os

app = Flask(__name__, template_folder='templates')

def load_exp_data(file_path):
    """Carrega e processa os dados de um arquivo YML de experiência com a estrutura Body > BaseExp."""
    print(f"Tentando carregar o arquivo: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            data = yaml.safe_load(f)
        
        if not isinstance(data, dict):
            raise TypeError(f"O conteúdo de {os.path.basename(file_path)} não foi lido como um dicionário.")

        print(f"Conteúdo de {os.path.basename(file_path)} carregado. Chaves encontradas: {list(data.keys())}")
        
        # Procura pela chave 'Body'
        if 'Body' not in data:
            raise KeyError("'Body'")
        
        body_data = data['Body']

        # Procura pela chave 'BaseExp' dentro de 'Body'
        if 'BaseExp' not in body_data:
            raise KeyError("'BaseExp' (dentro de 'Body')")

        base_exp_list = body_data['BaseExp']
        
        levels = [item['Level'] for item in base_exp_list]
        exps = [item['Exp'] for item in base_exp_list]
        return {'levels': levels, 'exps': exps}

    except KeyError as e:
        error_msg = f"A chave {e} não foi encontrada na estrutura do arquivo {os.path.basename(file_path)}."
        print(f"Erro Crítico: {error_msg}")
        raise KeyError(error_msg)
    except Exception as e:
        print(f"Erro ao processar {os.path.basename(file_path)}: {e}")
        raise

@app.route('/')
def index():
    """Serve a página principal."""
    return render_template('index.html')

@app.route('/data')
def get_data():
    """Fornece os dados de EXP em formato JSON."""
    try:
        base_dir = app.root_path
        devaro_yml_path = os.path.join(base_dir, 'devaro.yml')
        revo_yml_path = os.path.join(base_dir, 'revo.yml')

        devaro_data = load_exp_data(devaro_yml_path)
        revo_data = load_exp_data(revo_yml_path)
        
        return jsonify({
            'devaro': devaro_data,
            'revo': revo_data
        })
    except Exception as e:
        error_message = f"Um erro inesperado ocorreu: {str(e)}"
        print(error_message)
        return jsonify({'error': error_message}), 500

if __name__ == '__main__':
    print("Servidor iniciado. Abra http://127.0.0.1:5000 no seu navegador.")
    app.run(host='127.0.0.1', port=5000, debug=True)