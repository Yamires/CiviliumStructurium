"""Régressions du calcul et du filtrage, uniquement avec des valeurs inventées."""
from pathlib import Path
import pytest
from solver import solve, calculate
from filtrage import filter_sections
from test_rules import template
from test_local import sections

FIRST = 'Poutre simple - Charge Uniformement Distribuée'
SECOND = 'Poutre simple - Charge Uniforme au Centre'


@pytest.mark.parametrize('inputs, expected', [
    ({'l': 4.2, 'lt': 1, 'cv': 15.3, 'cm': 9, 'x': 1},
     {'mf': 75.411, 'mx': 54.72, 'vf': 71.82, 'vd': 51.03, 'vx': 37.62, 'i': 35.423325}),
    ({'l': 10, 'lt': 5, 'cv': 1.9, 'cm': 1, 'x': 5},
     {'mf': 256.25, 'mx': 256.25, 'vf': 102.5, 'vd': 72.5, 'vx': 0, 'i': 296.875}),
])
def test_uniform_beam_reference(inputs, expected):
    result = solve(FIRST, inputs)
    for key, value in expected.items():
        assert result[key] == pytest.approx(value, abs=.001)


def test_total_load_deflection_also_checked():
    r = solve(FIRST, {'l': 10, 'lt': 1, 'cv': 0, 'cm': 10, 'x': 5})
    # 5*w*L^4/(384*E*I) <= L/240 ; résultat en E6 mm4.
    assert r['i'] == pytest.approx(156.25)


@pytest.mark.parametrize('x, expected', [(0, 0), (2, 6), (5, 10.5), (8, 6), (10, 0)])
def test_partial_load_boundaries(x, expected):
    # w=1, a=c=2, b=6, L=10 -> réactions de 3 et moment max 10.5.
    r = solve(SECOND, {'l': 10, 'lt': 1, 'cv': 0, 'cm': .8, 'a': 2, 'b': 6, 'c': 2, 'x': x})
    assert r['vf1'] == pytest.approx(3)
    assert r['vf2'] == pytest.approx(3)
    assert r['mx'] == pytest.approx(expected)
    assert r['mf'] == pytest.approx(10.5)


def test_unknown_method():
    with pytest.raises(ValueError, match='Template non trouvée'):
        solve('inconnue', {})


def test_cycle():
    with pytest.raises(ValueError, match='Cycle détecté'):
        calculate(template({'y': 'z+1', 'z': 'y+1'}), {}, 'Test', {'x': 1})


def test_conditional_boundary():
    assert calculate(template({'y': 'Piecewise((x**2, x < 0), (x, x >= 0))'}), {}, 'Test', {'x': 0})['y'] == 0


def test_filter_conditions():
    result = filter_sections({'mf': 1, 'vf': 1, 'i': 40}, rows=sections(), config={'phi': .9, 'fy': 350})
    assert result and all(r['Mr'] >= 1 and r['Vr'] >= 1 and r['Ix'] >= 40 for r in result)


def test_no_result():
    assert filter_sections({'mf': 999999, 'vf': 999999, 'i': 999999}, rows=sections(), config={'phi': .9, 'fy': 350}) == []


def test_general_calculator_does_not_select_sections():
    assert filter_sections({'y': 2}, rows=sections(), config={'phi': .9, 'fy': 350}) == []


def test_sort_and_elastic_resistance():
    result = filter_sections({'mf': 1, 'vf': 1, 'i': 1}, rows=list(reversed(sections())), config={'phi': .9, 'fy': 350})
    assert result[0]['Ds_m'] == 'FICTIF100x10'
    assert result[0]['Mr'] == pytest.approx(.9 * 350 * 100 / 1000)


def test_browser_defaults_match_yaml():
    import yaml, json
    root = Path(__file__).resolve().parent
    defaults = json.loads((root.parent / 'frontend/src/assets/defaults.json').read_text())
    assert defaults['template'] == yaml.safe_load((root / 'ressource/Templates.yaml').read_text())
    assert defaults['config'] == yaml.safe_load((root / 'ressource/config.yaml').read_text())
