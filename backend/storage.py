import json
import os
from pathlib import Path
import yaml

RESOURCES = Path(__file__).resolve().parent / 'ressource'


def data_dir():
    path = Path(os.getenv('CIVILIUM_DATA_DIR', Path(__file__).resolve().parent.parent / 'data'))
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_yaml(name):
    path = data_dir() / name
    return yaml.safe_load((path if path.exists() else RESOURCES / name).read_text(encoding='utf-8'))


def write_yaml(name, value):
    write_text(name, yaml.safe_dump(value, allow_unicode=True, sort_keys=False))


def write_text(name, text):
    path = data_dir() / name
    temporary = path.with_suffix('.tmp')
    temporary.write_text(text, encoding='utf-8')
    temporary.replace(path)


def read_sections():
    path = data_dir() / 'sections.csv'
    if not path.exists():
        return []
    import csv
    with path.open(encoding='utf-8', newline='') as file:
        return list(csv.DictReader(file, delimiter=';'))
