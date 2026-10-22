"""Génère les mêmes valeurs par défaut pour le build statique."""
import json
from pathlib import Path
import yaml

root = Path(__file__).resolve().parent
resources = root / 'ressource'
value = {key: yaml.safe_load((resources / name).read_text(encoding='utf-8'))
         for key, name in [('template', 'Templates.yaml'), ('config', 'config.yaml')]}
(root.parent / 'frontend/src/assets/defaults.json').write_text(
    json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
