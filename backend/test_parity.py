"""Les deux moteurs doivent accepter la même grammaire et produire les mêmes valeurs."""
import json
import subprocess
from pathlib import Path
import pytest
from solver import calculate, validate_template
from test_rules import template

ROOT = Path(__file__).resolve().parent.parent


@pytest.mark.parametrize('formula,x', [
    ('-x**2 + 2**-2', 3), ('2**3**2', 1), ('Min(x, 2, 3) + Max(1, x)', -2),
    ('Piecewise((1/x, x != 0), (0, True))', 0),
    ('Piecewise((x, (x > 0) & (x <= 2)), (0, True))', 2),
    ('Piecewise((x, (x > 0) | (x < -2)), (1, True))', -1),
])
def test_python_javascript_parity(formula, x):
    doc = template({'y': formula})
    script = '''import {calculate} from './frontend/src/helpers/rules.js';
    const d=JSON.parse(process.argv[1]);
    console.log(JSON.stringify(calculate(d.doc, {}, 'Test', {x:d.x})));'''
    result = subprocess.run(['node', '--input-type=module', '-e', script, json.dumps({'doc': doc, 'x': x})],
                            cwd=ROOT, capture_output=True, text=True, check=True)
    assert json.loads(result.stdout)['y'] == pytest.approx(calculate(doc, {}, 'Test', {'x': x})['y'])


@pytest.mark.parametrize('formula', ['x > 0 & x < 2', 'Max()', 'True + 2', 'x.__class__', 'Piecewise((1, 1))'])
def test_both_reject_invalid_grammar(formula):
    doc = template({'y': formula})
    with pytest.raises(ValueError):
        validate_template(doc, {})
    script = '''import {validateTemplate} from './frontend/src/helpers/rules.js';
    try { validateTemplate(JSON.parse(process.argv[1]), {}); process.exitCode=1; }
    catch { process.exitCode=0; }'''
    result = subprocess.run(['node', '--input-type=module', '-e', script, json.dumps(doc)], cwd=ROOT)
    assert result.returncode == 0
