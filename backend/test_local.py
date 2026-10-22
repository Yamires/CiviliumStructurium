import json
import pytest
from db import create_table, add_project, get_projects_route, add_profil, get_all_profils, delete_project
from filtrage import normalize_sections, filter_sections


def test_sqlite_persistence(tmp_path, monkeypatch):
    monkeypatch.setenv('CIVILIUM_DATA_DIR', str(tmp_path))
    create_table()
    project = add_project('Projet', '', '2026-10-22', 'Moi', 1)
    add_profil('Test', {'x': 1}, {'y': 2}, {'Ds_m': 'FICTIF100x10'}, project)
    assert get_projects_route(1)[0]['id_project'] == project
    assert get_all_profils(project)[0]['outputs'] == {'y': 2}
    create_table()
    assert len(get_all_profils(project)) == 1
    delete_project(project)
    assert get_all_profils(project) == []


def sections():
    # Valeurs inventées, aucune propriété issue du CISC.
    return [{'Ds_m': 'FICTIF100x10', 'D': '100', 'W': '5', 'Sx': '100', 'Zx': '120', 'Ix': '20', 'Prp': ''},
            {'Ds_m': 'FICTIF200x20', 'D': '200', 'W': '10', 'Sx': '200', 'Zx': '240', 'Ix': '80', 'Prp': ''}]


def test_required_inertia_is_minimum():
    rows = normalize_sections(sections())
    result = filter_sections({'mf': 1, 'vf': 1, 'i': 40}, rows=rows, config={'phi': .9, 'fy': 350})
    assert [r['Ds_m'] for r in result] == ['FICTIF200x20']


def test_invalid_import_preserves_no_partial_rows():
    rows = sections()
    rows[1]['Ix'] = 'n/a'
    with pytest.raises(ValueError, match='ligne 3.*Ix'):
        normalize_sections(rows)
    rows = sections()
    rows[1]['Ds_m'] = rows[0]['Ds_m']
    with pytest.raises(ValueError, match='dupliqué'):
        normalize_sections(rows)
