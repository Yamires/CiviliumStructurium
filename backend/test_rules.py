import copy
import pytest
from solver import validate_template, calculate


def template(formulas=None):
    return {
        'calculationOptions': {'Test': [{'name': 'x', 'label': 'X'}]},
        'resultsTemplate': {'Test': [{'name': 'y', 'label': 'Y'}]},
        'formules': {'Test': formulas or {'y': 'Piecewise((x**2, x < 0), (Max(x, 2), True))'}},
    }


def test_conditional_and_dependencies():
    doc = template({'y': 'z + 1', 'z': 'x * 2'})
    assert calculate(doc, {}, 'Test', {'x': 3})['y'] == 7
    assert calculate(template(), {}, 'Test', {'x': -3})['y'] == 9
    assert calculate(template(), {}, 'Test', {'x': 0})['y'] == 2


@pytest.mark.parametrize('formulas', [
    {'y': 'missing + x'}, {'y': 'z', 'z': 'y'}, {'y': 'y+1'},
    {'y': '__import__("os").system("true")'}, {'y': 'x.real'},
    {'y': '[x][0]'}, {'y': 'x **'}, {'y': 'True'},
])
def test_invalid_rules(formulas):
    with pytest.raises(ValueError):
        validate_template(template(formulas), {})


def test_duplicate_inputs_and_collisions():
    doc = template()
    doc['calculationOptions']['Test'] *= 2
    with pytest.raises(ValueError):
        validate_template(doc, {})
    with pytest.raises(ValueError):
        validate_template(template(), {'x': 1})


@pytest.mark.parametrize('value', ['', '12junk', None, True, float('inf')])
def test_invalid_inputs(value):
    with pytest.raises(ValueError):
        calculate(template(), {}, 'Test', {'x': value})


@pytest.mark.parametrize('formula', ['1 / x', 'x**101', '(-1)**0.5', 'Piecewise((x, x>0))'])
def test_numeric_errors(formula):
    with pytest.raises(ValueError):
        calculate(template({'y': formula}), {}, 'Test', {'x': 0})


def test_missing_output():
    doc = copy.deepcopy(template())
    doc['resultsTemplate']['Test'][0]['name'] = 'absent'
    with pytest.raises(ValueError):
        validate_template(doc, {})
