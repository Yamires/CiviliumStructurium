import pytest
from app import app
from test_rules import template


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('CIVILIUM_DATA_DIR', str(tmp_path))
    app.config['TESTING'] = True
    return app.test_client()


def test_template_save_is_atomic(client):
    assert client.put('/api/templates', json=template()).status_code == 200
    invalid = template({'y': 'unknown + x'})
    assert client.put('/api/templates', json=invalid).status_code == 400
    assert client.get('/api/getTemplate').json == template()
    assert client.post('/api/solver', json={'methode': 'Test', 'inputs': {'x': -4}}).json['results']['y'] == 16


def test_projects_and_selection(client):
    project = client.post('/api/add_project', json={'nom_projet': 'Essai'}).json['id_project']
    response = client.post('/api/save-selection', json={
        'id_project': project, 'calculationType': 'Historique', 'inputs': {'x': 1},
        'outputs': {'y': 2}, 'selectedProfil': {'Ds_m': 'FICTIF100x10'}})
    assert response.status_code == 200
    rows = client.get(f'/api/get_profils?id_project={project}').json
    assert rows[0]['outputs']['y'] == 2
    assert client.delete(f'/api/delete_project/{project}').status_code == 200
    assert client.get(f'/api/get_profils?id_project={project}').json == []


def test_dataset_failure_preserves_active(client):
    rows = [{'Ds_m': 'FICTIF100x10', 'D': 100, 'W': 5, 'Ix': 30, 'Sx': 100, 'Zx': 120}]
    assert client.put('/api/dataset', json={'rows': rows}).status_code == 200
    assert client.put('/api/dataset', json={'rows': [{'wrong': 1}]}).status_code == 400
    assert client.get('/api/dataset').json['count'] == 1


def test_invalid_requests(client):
    assert client.post('/api/add_project', json={'nom_projet': ''}).status_code == 400
    assert client.post('/api/solver', json=[]).status_code == 400
    assert client.put('/api/templates', json=template(), headers={'Origin': 'https://example.org'}).status_code == 403
    assert client.post('/api/config', json={'fy': -1}).status_code == 400
    assert client.get('/api/unknown').status_code == 404
