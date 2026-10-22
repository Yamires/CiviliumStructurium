import json
import sqlite3
from contextlib import contextmanager
from storage import data_dir


@contextmanager
def connect():
    conn = sqlite3.connect(data_dir() / 'civilium.sqlite3')
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def create_table():
    with connect() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS my_projects (
                id_project INTEGER PRIMARY KEY,
                nom_projet TEXT NOT NULL,
                description TEXT,
                date TEXT,
                prepare_par TEXT,
                id_user INTEGER DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS my_profils (
                id INTEGER PRIMARY KEY,
                calculationtype TEXT,
                inputs TEXT,
                outputs TEXT,
                selectedprofil TEXT,
                added_at TEXT DEFAULT CURRENT_TIMESTAMP,
                axe TEXT,
                de_a TEXT,
                verif_mf INTEGER,
                verif_vf INTEGER,
                verif_i INTEGER,
                id_project INTEGER NOT NULL REFERENCES my_projects(id_project) ON DELETE CASCADE
            );
        ''')


def add_project(nom_projet, description, date, prepare_par, id_user=1):
    with connect() as conn:
        return conn.execute('INSERT INTO my_projects (nom_projet, description, date, prepare_par) VALUES (?, ?, ?, ?)',
                            (nom_projet, description, date, prepare_par)).lastrowid


def get_projects_route(id_user=1):
    with connect() as conn:
        return [dict(row) for row in conn.execute('SELECT * FROM my_projects ORDER BY id_project')]


def update_project(id_project, nom_projet, description, date, prepare_par):
    with connect() as conn:
        conn.execute('UPDATE my_projects SET nom_projet=?, description=?, date=?, prepare_par=? WHERE id_project=?',
                     (nom_projet, description, date, prepare_par, id_project))


def delete_project(id_project):
    with connect() as conn:
        conn.execute('DELETE FROM my_projects WHERE id_project=?', (id_project,))


def add_profil(calculationType, inputs, outputs, selectedProfil, id_project, axe=None, de_a=None, **checks):
    with connect() as conn:
        return conn.execute('''INSERT INTO my_profils
            (calculationtype, inputs, outputs, selectedprofil, id_project, axe, de_a)
            VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (calculationType, json.dumps(inputs), json.dumps(outputs), json.dumps(selectedProfil), id_project, axe, de_a)).lastrowid


def get_all_profils(id_project):
    with connect() as conn:
        rows = [dict(row) for row in conn.execute('SELECT * FROM my_profils WHERE id_project=? ORDER BY id', (id_project,))]
    for row in rows:
        for key in ('inputs', 'outputs', 'selectedprofil'):
            row[key] = json.loads(row[key])
        for key in ('verif_mf', 'verif_vf', 'verif_i'):
            row[key] = None if row[key] is None else bool(row[key])
    return rows


def update_profil(axe, de_a, verif_mf, verif_vf, verif_i, profil_id):
    with connect() as conn:
        conn.execute('UPDATE my_profils SET axe=?, de_a=?, verif_mf=?, verif_vf=?, verif_i=? WHERE id=?',
                     (axe, de_a, verif_mf, verif_vf, verif_i, profil_id))


def delete_profil_db(id):
    with connect() as conn:
        conn.execute('DELETE FROM my_profils WHERE id=?', (id,))


if __name__ == '__main__':
    create_table()
    print('Base locale initialisée.')
