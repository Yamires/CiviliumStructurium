# test_performance.py
import time
import pytest
from solver import solve
from filtrage import filter_sections

N = 1000

def _stats(durations):
    durations = sorted(durations)
    n = len(durations)
    mean = sum(durations) / n
    
    return mean

def _measure(func, *args, runs=N, **kwargs):
    durs = []
    for _ in range(runs):
        t0 = time.perf_counter()
        func(*args, **kwargs)
        durs.append(time.perf_counter() - t0)
    return _stats(durs)

@pytest.mark.performance
def test_perf_solver():
    inputs = {"l": 4.2, "lt": 1.0, "cv": 15.3, "cm": 9.0, "x": 1.0}
    mean= _measure(
        solve,
        "Poutre simple - Charge Uniformement Distribuée",
        inputs
    )
    print(f" solver — mean: {mean:.6f}s")
   
    assert mean < 0.050, f"solve trop lent (mean={mean:.6f}s)"
   

@pytest.mark.performance
def test_perf_solver_piecewise():
    inputs = {"x": 5}
    mean = _measure(
        solve,
        "Méthode conditionnelle",
        inputs,
        template_path="ressource/test_dsl.yaml"
    )
    print(f" solver (piecewise) — mean: {mean:.6f}s")
    assert mean < 0.010


@pytest.mark.performance
def test_perf_filtrage_csv_basique():
    values = {"mf": 1000, "vf": 500, "i": 100000}
    mean = _measure(
        filter_sections,
        values,
        dataframe_path="ressource/test_sst12.csv"
    )
    print(f"filtrage(csv) — mean: {mean:.6f}s")
    assert mean < 0.030


@pytest.mark.performance
def test_perf_integration_solve_plus_filtrage():
    inputs = {"l": 10.0, "lt": 5.0, "cv": 1.9, "cm": 1.0, "x": 5.0}
    def end_to_end():
        res = solve("Poutre simple - Charge Uniformement Distribuée", inputs)
        filter_sections(res, dataframe_path="ressource/test_sst12.csv")

    mean = _measure(end_to_end)
    print(f" end-to-end — mean: {mean:.6f}s")
    assert mean < 0.050

