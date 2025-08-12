import pytest
import os
from solver import solve
from filtrage import filter_sections

# test sur le solve 
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

def test_solve_formule_inconnue():
    inputs = {"l": 1, "lt": 1, "cv": 1, "cm": 1, "x": 1}
    with pytest.raises(Exception) as excinfo:
        solve("Methode inconnue", inputs)
    assert "Template non trouvée pour la méthode" in str(excinfo.value)

def test_solve_2():
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

# Test sur le DSL 
def test_dsl_cycle():
    with pytest.raises(Exception) as excinfo:
        solve("Méthode avec cycle", {"x": 1}, template_path="ressource/test_dsl.yaml")
    assert "Cycle détecté" in str(excinfo.value)

def test_dsl_invalid_expression():
    with pytest.raises(Exception) as excinfo:
        solve("Méthode avec formule invalide", {"x": 2}, template_path="ressource/test_dsl.yaml")
    assert "Erreur lors de l'analyse" in str(excinfo.value)

def test_dsl_valid():
    result = solve("Méthode de test", {"a": 2, "b": 3}, template_path="ressource/test_dsl.yaml")
    assert result["c"] == 5

def test_piecewise_negative():
    result = solve("Méthode conditionnelle", {"x": -3}, template_path="ressource/test_dsl.yaml")
    assert abs(result["f"] - 9) < 0.001

def test_piecewise_positive():
    result = solve("Méthode conditionnelle", {"x": 4}, template_path="ressource/test_dsl.yaml")
    assert abs(result["f"] - 4) < 0.001

def test_filtrage_basique():
    values = {
        "mf": 100,   # Moment fléchissant relativement bas
        "vf": 50,    # Effort tranchant relativement bas
        "i": 200     # Inertie relativement grande (donc filtrage large)
    }

    result = filter_sections(values)

    # Vérifie qu'au moins un profilé est retourné
    assert not result.empty, "Aucun profilé retourné alors que les contraintes sont faibles"

    # Vérifie les contraintes respectées
    assert all(result["Mr"] > 100), "Certains Mr sont inférieurs à mf"
    assert all(result["Vr"] > 50), "Certains Vr sont inférieurs à vf"
    assert all(result["Ix"] < 200), "Certains Ix sont supérieurs à i"

def test_filtrage_aucun_resultat():
    values = {"mf": 999999, "vf": 999999, "i": 1}
    result = filter_sections(values)
    assert result.empty, "Le filtrage devrait retourner aucun profilé"

def test_solver_filtrage():
    inputs = {"x": 1, "l": 10, "lt": 5, "cv": 1.5, "cm": 1.2}
    result = solve("Poutre simple - Charge Uniformement Distribuée", inputs)
    df = filter_sections(result)
    assert not df.empty

def test_csv_contraintes_ok():
    values = {"mf": 200, "vf": 300, "i": 100000}
    result = filter_sections(values, dataframe_path="ressource/test_sst12.csv")

    assert not result.empty, "Aucun profilé retourné malgré des contraintes réalistes"
    assert all(result["Mr"] > values["mf"]), "Certains profilés ont un Mr trop faible"
    assert all(result["Vr"] > values["vf"]), "Certains profilés ont un Vr trop faible"
    assert all(result["Ix"] < values["i"]), "Certains profilés ont un Ix trop élevé"


def test_hauteur_et_poids_extraits():
    values = {"mf": 100, "vf": 50, "i": 200}
    result = filter_sections(values, dataframe_path="ressource/test_sst12.csv")
    
    assert "Hauteur_nominale" in result.columns
    assert "Poid_lineique" in result.columns
    assert result["Hauteur_nominale"].notna().all(), "Certaines hauteurs nominales sont manquantes"
    assert result["Poid_lineique"].notna().all(), "Certains poids linéiques sont manquants"

def test_tri_par_hauteur_et_poids():
    values = {"mf": 100, "vf": 50, "i": 200}
    result = filter_sections(values, dataframe_path="ressource/test_sst12.csv")
    # Tri croissant attendu
    sorted_result = result.sort_values(by=["Hauteur_nominale", "Poid_lineique"])
    assert result["Ds_m"].tolist() == sorted_result["Ds_m"].tolist(), "Le tri par hauteur/poids n’est pas respecté"

def test_aucun_profil_si_contraintes_trop_strictes():
    values = {"mf": 99999, "vf": 99999, "i": 99999}  
    result = filter_sections(values, dataframe_path="ressource/test_sst12.csv")
    assert result.empty, "Des profilés ont été retournés alors qu’aucun ne devrait satisfaire les contraintes"
