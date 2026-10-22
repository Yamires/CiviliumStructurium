"""Import métrique et présélection élastique, sans classification automatique CSA."""
import re
from solver import number

REQUIRED = ('Ds_m', 'D', 'W', 'Sx', 'Zx', 'Ix')
NUMERIC = REQUIRED[1:]


def normalize_sections(rows):
    if not isinstance(rows, list) or not 1 <= len(rows) <= 100000:
        raise ValueError('Le dataset doit contenir 1 à 100000 lignes')
    result, seen = [], set()
    for index, row in enumerate(rows, 2):
        if not isinstance(row, dict) or not set(REQUIRED) <= set(row):
            raise ValueError('Colonnes requises : ' + ', '.join(REQUIRED))
        if len(row) > 100 or any(not isinstance(k, str) or len(k) > 100 or k in ('__proto__', 'constructor', 'prototype') for k in row):
            raise ValueError('Colonnes invalides (100 maximum)')
        clean = {}
        for key, value in row.items():
            if not isinstance(value, (str, int, float, type(None))) or isinstance(value, bool):
                raise ValueError(f'Valeur invalide, ligne {index} : {key}')
            if isinstance(value, str) and len(value) > 500:
                raise ValueError(f'Cellule trop longue, ligne {index} : {key}')
            clean[key] = '' if value is None else value
        designation = str(clean['Ds_m']).strip()
        if not re.fullmatch(r'[A-Za-z]+\d+(?:\.\d+)?[xX]\d+(?:\.\d+)?', designation):
            raise ValueError(f'Ds_m invalide, ligne {index}')
        if designation in seen:
            raise ValueError(f'Ds_m dupliqué, ligne {index}')
        seen.add(designation)
        clean['Ds_m'] = designation
        for key in NUMERIC:
            value = clean[key]
            try:
                clean[key] = number(value.replace(' ', '').replace('\u00a0', '').replace(',', '.') if isinstance(value, str) else value)
                if clean[key] <= 0:
                    raise ValueError('Valeur positive requise')
            except ValueError:
                raise ValueError(f'Valeur positive requise, ligne {index} : {key}') from None
        result.append(clean)
    return result


def filter_sections(values, dataframe_path=None, config_path=None, *, rows=None, config=None):
    if config is None:
        import yaml
        from storage import RESOURCES
        from pathlib import Path
        config = yaml.safe_load(Path(config_path or RESOURCES / 'config.yaml').read_text())
    if rows is None:
        if dataframe_path:
            import csv
            with open(dataframe_path, encoding='utf-8-sig') as file:
                rows = list(csv.DictReader(file, delimiter=';'))
        else:
            from storage import read_sections
            rows = read_sections()
    if not rows or not {'mf', 'vf', 'i'} <= set(values):
        return []
    result = []
    for row in normalize_sections(rows):
        # Sx en E3 mm³, Ix en E6 mm⁴ ; résistance élastique seulement.
        row['Mr'] = number(config['phi']) * number(config['fy']) * row['Sx'] / 1000
        row['Vr'] = number(config['phi']) * .66 * number(config['fy']) * row['D'] * row['W'] / 1000
        height, mass = re.search(r'(\d+(?:\.\d+)?)[xX](\d+(?:\.\d+)?)$', row['Ds_m']).groups()
        row['Hauteur_nominale'], row['Poid_lineique'] = float(height), float(mass)
        if row['Mr'] >= abs(values['mf']) and row['Vr'] >= abs(values['vf']) and row['Ix'] >= values['i']:
            result.append(row)
    return sorted(result, key=lambda r: (r['Hauteur_nominale'], r['Poid_lineique']))
