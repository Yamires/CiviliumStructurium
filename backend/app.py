from flask import Flask, jsonify, request, g 
import yaml 
from flask_cors import CORS
import os
from solver import solve
from filtrage import filter_sections
from db import add_profil, get_all_profils, update_profil, delete_profil_db, get_projects_route, get_user, add_user, update_project, delete_project, get_user_by_email, add_user_by_email
from db import add_project, create_table
from pathlib import Path
import psycopg
from server import requires_auth, requires_scope, init_auth, AuthError
app = Flask(__name__)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:4173" )
ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_ORIGIN.split(',')]

CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=[],
    supports_credentials=True,
)

Base_Dir = Path(__file__).resolve().parent
Res_Dir= Path(os.getenv('Res_Dir', Base_Dir / 'ressource'))

Templates_Yaml = Res_Dir / 'Templates.yaml'
Config_Yaml = Res_Dir / 'config.yaml'

init_auth(app)

@app.get('/api/warmup')
def warmup():
    try:
        import time
        start_time = time.time()

        from db import get_user
        get_user('test_user')

        total_time = time.time() - start_time
        return jsonify({"status": "ok", "warmup_time": total_time}), 200
    
    except Exception as e:
        print("Warmup error:", e)
        return jsonify({"error": str(e)}), 500

@app.get('/health')
def health_check():
    return jsonify({"status": "ok"}), 200

## utiliser une fois pour initialiser la base de données
##@app.get("/init-db")
##def init_db():
##    try:
##        create_table()
##        return {"status": "ok"}
##    except Exception as e:
##        print("init-db error:", e)
##        return {"error": str(e)}, 500


# TEMPLATES
@app.route('/api/getTemplate', methods=['GET'])
def get_template():
    with open(Templates_Yaml, 'r') as file:
        data = yaml.safe_load(file)
    return jsonify(data)

@app.route('/api/config', methods=['GET'])
def get_config():
    with open(Config_Yaml, 'r') as file:
        config = yaml.safe_load(file)
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
@requires_auth
def update_config(): 
    data = request.json 
    with open(Config_Yaml, 'r') as file:
        config = yaml.safe_load(file)
    for key, value in data.items():
        if key in config:
            config[key] = value
    with open(Config_Yaml, 'w') as file:
        yaml.safe_dump(config,file, default_flow_style=False,allow_unicode=True)
    return jsonify(config)

# AUTH

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    user = get_user(username)
    if not user:
        return jsonify({"error":"Invalide"}), 401
    return jsonify({"id_user":user['id_user'], "username":user['username']})

@app.route('/api/signup', methods=['POST'])
def signup(): 
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    if not username:
        return jsonify({"error":"Username requis"}), 400
    if get_user(username):
        return jsonify({"error":"Déjà inscrit"}), 409
    user_id = add_user(username, email)
    return jsonify({"id_user":user_id, "username": username})


@app.route('/api/users/sync', methods=['POST'])
@requires_auth
def sync_user():
    try: 
        current_user = g.current_user
        email = current_user.get('email')
        username = current_user.get('name', email)

        if not email:
            return jsonify({"error": "Email requis"}), 400

        user = get_user_by_email(email)
        if not user:
            id_user = add_user_by_email(username, email)
            return jsonify({"id_user": id_user, "username": username, "email": email, "auth0_id": current_user.get('sub')})
        
        return jsonify({"id_user": user['id_user'], "username": user['username'], "email": user['email'], "auth0_id": current_user.get('sub')})
    
    except Exception as e:
        print("Erreur de synchronisation utilisateur:", e)
        return jsonify({"error": str(e)}), 500


# PROJETS

@app.route('/api/add_project', methods=['POST'])
@requires_auth
def route_add_project():
    data = request.get_json()
    try:
        nom = data.get('nom_projet')
        desc = data.get('description')
        date = data.get('date')
        prepare_par = data.get('prepare_par')
        id_user = data.get('id_user')  
        id_project = add_project(nom, desc, date, prepare_par, id_user)
        return jsonify({'status': 'ok', 'id_project': id_project})
    except Exception as e:
        print("Erreur d'ajout projet:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/get_projects', methods=['GET'])
@requires_auth
def get_projects():
    try:
        id_user = request.args.get('id_user', type=int)
        return jsonify(get_projects_route(id_user))
    except Exception as e:
        print("Erreur lecture projets:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/update_project', methods=['POST'])
@requires_auth
def route_update_project():
    data = request.get_json()
    try:
        id_project = data.get('id_project')
        nom_projet = data.get('nom_projet')
        description = data.get('description')
        date = data.get('date')
        prepare_par = data.get('prepare_par')
        update_project(id_project, nom_projet, description, date, prepare_par)
        return jsonify({'status': 'ok'})
    except Exception as e:
        print("Erreur lors de la mise à jour du projet:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete_project/<int:id_project>', methods=['DELETE'])
@requires_auth
def route_delete_project(id_project):
    try:
        delete_project(id_project)
        return jsonify({"status": "ok"})
    except Exception as e:
        print("Erreur de suppression de projet:", e)
        return jsonify({'error': str(e)}), 500

# PROFILS

@app.route('/api/get_profils', methods=['GET'])
@requires_auth
def get_profils():
    try: 
        id_project = request.args.get('id_project', type=int)
        if id_project is not None:
            return jsonify(get_all_profils(id_project))
    except Exception as e:
        print('Erreur de lecture de db', e)
        return jsonify({'error':str(e)}), 500

@app.route('/api/save-selection', methods=['POST'])
@requires_auth
def save_selection():
    data = request.get_json()
    calculationType = data.get('calculationType')
    inputs = data.get('inputs')
    outputs = data.get('outputs')
    selectedProfil = data.get('selectedProfil')
    id_project = data.get('id_project')  

    try:
        add_profil(
            calculationType, inputs, outputs, selectedProfil,
            id_project=id_project  
        )
        return jsonify({'status':'ok'})
    except Exception as e: 
        print("Erreur de mise à jour de la db:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/update_profils/<int:profil_id>', methods=['POST'])
@requires_auth
def update_profils(profil_id):
    data = request.json
    try: 
        update_profil(
            profil_id=profil_id,
            axe = data.get('axe'),
            de_a = data.get('de_a'),
            verif_mf = data.get('verif_mf'),
            verif_vf = data.get('verif_vf'),
            verif_i = data.get('verif_i')
        )
        print(profil_id)
        return jsonify({"status": "ok"})
    except Exception as e:
        print('Erreur de mise à jour:', e)
        return jsonify({"error": str(e)}), 500 

@app.route('/api/delete_profil/<int:profil_id>', methods=['DELETE'])
@requires_auth
def delete_profil(profil_id):
    try:
        delete_profil_db(profil_id)
        return jsonify({"status": "ok"})
    except Exception as err:
        print('Erreur de suppression:', err)
        return jsonify({"error": str(err)}), 500

#  SOLVER 

@app.route('/api/solver', methods=['POST'])
@requires_auth
def solver_route(): 
    data = request.get_json()
    methode = data.get('methode')
    inputs = data.get('inputs', {})
    nb_profils = data.get('nb_profils')

    if nb_profils is None:
        with open('/Users/yamira.poldosilva/Documents/doc/UDEM/E25/IFT3150/react_App/backend/ressource/config.yaml') as file:
            config = yaml.safe_load(file)
        nb_profils = int(config.get('default_nb_profils', 5))
    else: 
        nb_profils = int(nb_profils)

    results = solve(methode,inputs)
    profils = filter_sections(results)
    
    return jsonify({
        'results':results,
        'profils': profils.to_dict(orient='records')[:nb_profils]
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # app.run(debug=True, port=5050)
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)


