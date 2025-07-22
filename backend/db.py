import os
import psycopg
import json

def connect():
    return psycopg.connect(
        dbname= os.environ.get('PG_DB', 'mydb'),
        host= os.environ.get('PG_HOST', 'localhost'),
        port= os.environ.get('PG_PORT', 5432), 
    )

def create_table():
    try: 
        with connect() as conn, conn.cursor() as cur:
                cur.execute(""" 
                    CREATE TABLE IF NOT EXISTS users (
                        id_user SERIAL PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT
                    );

                    CREATE TABLE IF NOT EXISTS my_projects (
                        id_project  SERIAL PRIMARY KEY,
                        nom_projet TEXT,
                        description TEXT,
                        date DATE,
                        prepare_par TEXT,
                        id_user INTEGER REFERENCES users(id_user)
                    );

                    CREATE TABLE IF NOT EXISTS my_profils (
                        id SERIAL PRIMARY KEY,
                        calculationType TEXT,
                        inputs JSONB,
                        outputs JSONB,
                        selectedProfil JSONB,
                        added_at TIMESTAMPTZ DEFAULT now(),
                        axe TEXT,
                        de_a TEXT,
                        Verif_mf BOOLEAN,
                        Verif_vf BOOLEAN,
                        Verif_i BOOLEAN,
                        id_project INTEGER REFERENCES my_projects(id_project)
                    );
                    """)
                conn.commit()
    except Exception as e:
         print("Erreur de création de db:", e)
         raise  

def add_profil(calculationType, inputs, outputs, selectedProfil, id_project, axe=None, de_a=None, verif_mf=None, verif_vf=None, verif_i=None):
    try: 
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO my_profils(
                    calculationType, 
                    inputs, 
                    outputs, 
                    selectedProfil, 
                    axe, 
                    de_a, 
                    Verif_mf, 
                    Verif_vf, 
                    Verif_i,
                    id_project
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """, (
                calculationType,
                json.dumps(inputs),
                json.dumps(outputs),
                json.dumps(selectedProfil),
                axe,
                de_a,
                verif_mf,
                verif_vf,
                verif_i,
                id_project
                ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return new_id
    except Exception as e:
        print("erreur d'ajout à la db:", e)
        raise


def get_all_profils(id_project):
    with connect() as conn, conn.cursor() as cur: 
        cur.execute("SELECT * FROM my_profils WHERE id_project = %s", (id_project,))
        cols = [desc[0] for desc in cur.description]
        data = [dict(zip(cols, row)) for row in cur.fetchall()]
    return data

    
def update_profil(axe, de_a, verif_mf, verif_vf, verif_i, profil_id):
    print('Mise à jour:', profil_id, axe, de_a, verif_mf, verif_vf, verif_i)
    try:
        with connect() as conn, conn.cursor() as cur: 
            cur.execute("""
                        UPDATE my_profils
                        SET axe = %s,
                            de_a = %s,
                            verif_mf = %s,
                            verif_vf = %s,
                            verif_i = %s 
                        WHERE id = %s 
                        """,(axe, de_a, verif_mf, verif_vf, verif_i, profil_id))
            conn.commit()
    except Exception as e:
        print("erreur d'ajout à la db:",e)
        raise

def delete_profil_db(id):
    with connect() as conn, conn.cursor() as cur: 
        print("Suppression de l'id:", id)
        cur.execute("DELETE FROM my_profils WHERE id = %s", (id,))
        conn.commit()

def add_project(nom_projet, description, date, prepare_par, id_user):
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO my_projects(nom_projet, description, date, prepare_par, id_user)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id_project
            """, (nom_projet, description, date, prepare_par, id_user))
            new_id = cur.fetchone()[0]
            conn.commit()
            return new_id
    except Exception as e:
        print("Erreur d'ajout de projet :", e)
        raise

def get_projects_route(id_user):
    with connect() as conn, conn.cursor() as cur: 
        cur.execute("SELECT * FROM my_projects WHERE id_user = %s", (id_user,))
        cols = [desc[0] for desc in cur.description]
        data = [dict(zip(cols, row)) for row in cur.fetchall()]
    return data

def get_user(username):
    with connect() as conn, conn.cursor() as cur: 
        cur.execute("SELECT * FROM users WHERE username=%s", (username,))
        row = cur.fetchone()
        if row: 
            cols = [desc[0] for desc in cur.description]
            return dict(zip(cols, row))
        return None 


def add_user(username, email=None): 
    with connect() as conn, conn.cursor() as cur: 
        cur.execute("INSERT INTO users (username, email) VALUES (%s, %s) RETURNING id_user",
                    (username, email ))
        user_id = cur.fetchone()[0]
        conn.commit()
        return user_id
    

def update_project(id_project, nom_projet, description, date, prepare_par):
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE my_projects
                SET nom_projet = %s,
                    description = %s,
                    date = %s,
                    prepare_par = %s
                WHERE id_project = %s
            """, (nom_projet, description, date, prepare_par, id_project))
            conn.commit()
    except Exception as e:
        print("Erreur lors de la mise à jour du projet:", e)
        raise


def delete_project(id_project):
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM my_profils WHERE id_project = %s", (id_project,))
            cur.execute("DELETE FROM my_projects WHERE id_project = %s", (id_project,))
            conn.commit()
    except Exception as e:
        print("Erreur de suppression de projet :", e)
        raise


            
if __name__ == "__main__":  
    create_table()
    print("Table créée !")


