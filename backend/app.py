import csv
import io
import sqlite3
from datetime import date
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from db import (create_table, add_project, get_projects_route, update_project, delete_project,
                add_profil, get_all_profils, update_profil, delete_profil_db)
from filtrage import normalize_sections, filter_sections
from solver import calculate, validate_template, number
from storage import read_yaml, write_yaml, write_text, read_sections

DIST = Path(__file__).resolve().parent.parent / 'frontend' / 'dist'
app = Flask(__name__, static_folder=str(DIST), static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024


@app.before_request
def local_request():
    # API locale : ni accès depuis un autre site, ni exposition sur le réseau.
    if request.host.split(':')[0] not in ('localhost', '127.0.0.1'):
        return jsonify(error='Hôte local requis'), 403
    origin = request.headers.get('Origin')
    if origin and origin not in ('http://127.0.0.1:5050', 'http://localhost:5050',
                                  'http://127.0.0.1:4173', 'http://localhost:4173'):
        return jsonify(error='Origine non autorisée'), 403
    if request.path.startswith('/api/'):
        create_table()


@app.after_request
def response_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; worker-src 'self' blob:; frame-ancestors 'self'"
    if request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


def payload():
    data = request.get_json()
    if not isinstance(data, dict):
        raise ValueError('Un objet JSON est requis')
    return data


def text(data, key, required=False):
    value = data.get(key, '')
    if value is None and not required:
        return ''
    if not isinstance(value, str) or len(value) > 2000 or (required and not value.strip()):
        raise ValueError(f'Champ invalide : {key}')
    return value


def project_fields(data):
    day = data.get('date') or None
    if day is not None:
        if not isinstance(day, str):
            raise ValueError('Date invalide')
        date.fromisoformat(day)
    return text(data, 'nom_projet', True), text(data, 'description'), day, text(data, 'prepare_par')


def positive_id(value):
    if isinstance(value, bool) or str(value).strip() != str(int(value)) or int(value) < 1:
        raise ValueError('Identifiant positif requis')
    return int(value)


@app.get('/')
def index():
    return send_from_directory(DIST, 'index.html')


@app.get('/health')
def health():
    return jsonify(status='ok')


@app.get('/api/getTemplate')
def get_template():
    return jsonify(read_yaml('Templates.yaml'))


@app.route('/api/templates', methods=['PUT'])
def save_template():
    doc = payload()
    validate_template(doc, read_yaml('config.yaml'))
    write_yaml('Templates.yaml', doc)
    return jsonify(doc)


@app.post('/api/templates/validate')
def validate_rules():
    data = payload()
    doc = data.get('template')
    config = read_yaml('config.yaml')
    validate_template(doc, config)
    results = calculate(doc, config, data.get('methode'), data['inputs']) if 'inputs' in data else None
    return jsonify(status='ok', results=results)


@app.route('/api/config', methods=['GET', 'POST'])
def config_route():
    config = read_yaml('config.yaml')
    if request.method == 'POST':
        data = payload()
        if not set(data) <= set(config):
            raise ValueError('Constante inconnue')
        config.update({key: number(value) for key, value in data.items()})
        if any(value <= 0 for value in config.values()) or not 0 < config['phi'] <= 1:
            raise ValueError('Constantes positives requises ; phi doit être dans ]0, 1]')
        count = config['default_nb_profils']
        if not 1 <= count <= 100 or int(count) != count:
            raise ValueError('Nombre de profilés : entier entre 1 et 100')
        validate_template(read_yaml('Templates.yaml'), config)
        write_yaml('config.yaml', config)
    return jsonify(config)


@app.route('/api/dataset', methods=['GET', 'PUT'])
def dataset_route():
    if request.method == 'PUT':
        rows = normalize_sections(payload().get('rows'))
        output = io.StringIO(newline='')
        columns = list(dict.fromkeys(key for row in rows for key in row))
        if len(columns) > 100:
            raise ValueError('100 colonnes maximum')
        writer = csv.DictWriter(output, fieldnames=columns, delimiter=';')
        writer.writeheader()
        writer.writerows(rows)
        write_text('sections.csv', output.getvalue())
    return jsonify(count=len(read_sections()))


@app.post('/api/solver')
def solver_route():
    data = payload()
    config = read_yaml('config.yaml')
    results = calculate(read_yaml('Templates.yaml'), config, data.get('methode'), data.get('inputs'))
    count = number(data.get('nb_profils', config['default_nb_profils']))
    if not 1 <= count <= 100 or int(count) != count:
        raise ValueError('Nombre de profilés : entier entre 1 et 100')
    rows = read_sections()
    available = {'mf', 'vf', 'i'} <= set(results)
    message = 'Importez votre dataset CISC pour obtenir une présélection.' if not rows else (
        'Cette méthode ne fournit pas mf, vf et i ; présélection indisponible.' if not available else
        'Présélection élastique préliminaire ; vérifiez la classe, la stabilité et les unités séparément.')
    return jsonify(results=results, profils=filter_sections(results, rows=rows, config=config)[:int(count)], message=message)


@app.get('/api/get_projects')
def projects():
    return jsonify(get_projects_route())


@app.post('/api/add_project')
def create_project():
    return jsonify(status='ok', id_project=add_project(*project_fields(payload())))


@app.post('/api/update_project')
def edit_project():
    data = payload()
    update_project(positive_id(data.get('id_project')), *project_fields(data))
    return jsonify(status='ok')


@app.delete('/api/delete_project/<int:project_id>')
def remove_project(project_id):
    delete_project(project_id)
    return jsonify(status='ok')


@app.get('/api/get_profils')
def profiles():
    return jsonify(get_all_profils(positive_id(request.args.get('id_project'))))


@app.post('/api/save-selection')
def save_selection():
    data = payload()
    for key in ('inputs', 'outputs', 'selectedProfil'):
        if not isinstance(data.get(key), dict) or not data[key]:
            raise ValueError(f'Objet requis : {key}')
    add_profil(text(data, 'calculationType', True), data['inputs'], data['outputs'], data['selectedProfil'],
               positive_id(data.get('id_project')), text(data, 'axe'), text(data, 'de_a'))
    return jsonify(status='ok')


@app.post('/api/update_profils/<int:profile_id>')
def edit_profile(profile_id):
    data = payload()
    checks = [data.get(key) for key in ('verif_mf', 'verif_vf', 'verif_i')]
    if any(value is not None and not isinstance(value, bool) for value in checks):
        raise ValueError('Vérification booléenne requise')
    update_profil(text(data, 'axe'), text(data, 'de_a'), *checks, profile_id)
    return jsonify(status='ok')


@app.delete('/api/delete_profil/<int:profile_id>')
def remove_profile(profile_id):
    delete_profil_db(profile_id)
    return jsonify(status='ok')


@app.errorhandler(ValueError)
@app.errorhandler(TypeError)
def validation_error(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(sqlite3.IntegrityError)
def database_error(error):
    return jsonify(error='Projet introuvable ou données incompatibles'), 409


@app.errorhandler(HTTPException)
def http_error(error):
    return jsonify(error=error.description), error.code


@app.errorhandler(500)
def internal_error(error):
    return jsonify(error='Erreur interne'), 500


if __name__ == '__main__':
    create_table()
    app.run(host='127.0.0.1', port=5050, debug=False)
