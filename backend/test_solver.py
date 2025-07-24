import pytest
import os
from solver import solve


def test_solve_1():
    inputs = {
        "l": 4.2, "lt":1.0, "cv": 15.3, "cm": 9.0, "x": 1.0,
    }   

    results = solve("Poutre simple - Charge Uniformement Distribuée", inputs)

    ## On travaile une tolerance de 0.15 
    assert abs(results["mf"] - 75.41) < 0.15 
    assert abs(results["mx"] - 54.72) < 0.15 
    assert abs(results["vf"] - 71.82) < 0.15 
    assert abs(results["vd"] - 51.03) < 0.15 
    assert abs(results["vx"] - 37.62) < 0.15 
    assert abs(results["i"] - 35.42) < 0.15 



def test_solve_2():
    inputs = {"l": 1, "lt": 1, "cv": 1, "cm": 1, "x": 1}
    with pytest.raises(Exception) as excinfo:
        solve("Methode inconnue", inputs)
    assert "Template non trouvée pour la méthode" in str(excinfo.value)



def test_solve_3():
    inputs = {
        "l": 10.00, "lt":5.0, "cv": 1.9, "cm": 1.0, "x": 5.0,
    }   

    results = solve("Poutre simple - Charge Uniformement Distribuée", inputs)

    ## On travaile une tolerance de 0.15 
    assert abs(results["mf"] - 256.25) < 0.15 
    assert abs(results["mx"] - 256.25) < 0.15 
    assert abs(results["vf"] - 102.50) < 0.15 
    assert abs(results["vd"] - 72.5) < 0.15 
    assert abs(results["vx"] - 0.00) < 0.15 
    assert abs(results["i"] - 296.88) < 0.15 

