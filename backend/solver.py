import yaml
from sympy import Max, Min, Piecewise
from sympy.parsing.sympy_parser import parse_expr

def solve(methode, input_val, config_path='ressource/config.yaml', template_path='ressource/Templates.yaml'):
    
    with open(config_path, "r") as file:
        config = yaml.safe_load(file)
    with open(template_path, "r") as file:
        template = yaml.safe_load(file)
    
    try:
        outputs = template["resultsTemplate"][methode]
        formulas = template["formules"][methode]
    except KeyError:
        raise Exception(f"Template non trouvée pour la méthode: {methode}")
    
    context = config.copy()
    context.update(input_val)
    
    # on crée une liste des dépendances
    dependencies = {
        var: {str(s) for s in parse_expr(formula, local_dict={"Max": Max, "Min": Min, "Piecewise": Piecewise}, evaluate=False).free_symbols 
              if str(s) in formulas or str(s) in context}
        for var, formula in formulas.items()
    }
    
    toSetFormulas = set(formulas)
    toSetContext = set(context)
    order_stack = []    

    # on trie selon l'ordre optimale de la liste des dépendances 
    while toSetFormulas:
        for var in list(toSetFormulas):
            if dependencies[var].issubset(toSetContext):
                order_stack.append(var)
                toSetContext.add(var)
                toSetFormulas.remove(var)
      
    # on solve directement avec des valeurs numeriques en subs 
    for var in order_stack:
        try:
            expr = parse_expr(formulas[var], local_dict={"Max": Max, "Min": Min, "Piecewise": Piecewise})
            value = expr.subs(context).evalf()
            context[var] = float(value)
        except Exception as e:
            raise Exception(f"Erreur lors de l'évaluation de '{var}': {e}")
    

    return context

