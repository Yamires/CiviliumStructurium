import yaml
from sympy import Max, Min, Piecewise
from sympy.parsing.sympy_parser import parse_expr

def solve(methode, input_val, config_path='ressource/config.yaml', template_path='ressource/Templates.yaml'):
    # Chargement des configurations globales
    with open(config_path, "r") as file:
        config = yaml.safe_load(file)
    # Chargement du template de formules et résultats
    with open(template_path, "r") as file:
        template = yaml.safe_load(file)
    
    try:
        # Récupère les outputs et formules pour la méthode demandée
        outputs = template["resultsTemplate"][methode]
        formulas = template["formules"][methode]
    except KeyError:
        # Si la méthode n'existe pas dans le template, on lève une exception
        raise Exception(f"Template non trouvée pour la méthode: {methode}")
    
    # Prépare le contexte de calcul (variables connues)
    context = config.copy()
    print("context 1:", context)
    context.update(input_val)
    print("context 2:", context)
    
    # Création de la liste des dépendances pour chaque formule
    dependencies = {}
    for var, formula in formulas.items():
        try:
            # Analyse la formule pour extraire ses variables dépendantes
            expr = parse_expr(formula, local_dict={"Max": Max, "Min": Min, "Piecewise": Piecewise}, evaluate=False)
            dependencies[var] = {str(s) for s in expr.free_symbols
                               if str(s) in formulas or str(s) in context}
        except Exception as e:
            # Erreur de parsing de la formule
            raise Exception(f"Erreur lors de l'analyse de la formule '{var}': {e}")
    print("dependencies:", dependencies)
    print("ccontext 3:", context)

    # Initialisation des ensembles pour le tri topologique
    toSetFormulas = set(formulas)
    print("toSetFormulas:", toSetFormulas)
    toSetContext = set(context)
    print("toSetContext:", toSetContext)
    order_stack = []
    print("order_stack debut:", order_stack)
    
    # Tri des formules selon l'ordre de résolution des dépendances
    while toSetFormulas:
        progress = False
        for var in list(toSetFormulas):
            # Si toutes les dépendances de la formule sont connues, on peut la résoudre
            if dependencies[var].issubset(toSetContext):
                order_stack.append(var)
                toSetContext.add(var)
                toSetFormulas.remove(var)
                progress = True
        if not progress:
            # Si aucune formule n'a pu être résolue, il y a un cycle dans les dépendances
            raise Exception(f"Cycle détecté dans les dépendances des formules: {toSetFormulas}")
    
    print("toSetFormulas fin:", toSetFormulas)
    print("toSetContext fin:", toSetContext)
    print("order_stack fin:",order_stack)

    # Résolution des formules dans l'ordre déterminé
    for var in order_stack:
        try:
            try:
                # Parse la formule à nouveau pour l'évaluer
                expr = parse_expr(formulas[var], local_dict={"Max": Max, "Min": Min, "Piecewise": Piecewise})
            except Exception as e:
                # Erreur de parsing
                raise Exception(f"Erreur lors de l'analyse de la formule '{var}': {e}")
            # Substitue les valeurs connues et évalue la formule
            value = expr.subs(context).evalf()
            context[var] = float(value)
        except Exception as e:
            # Erreur lors de l'évaluation numérique
            raise Exception(f"Erreur lors de l'évaluation de '{var}': {e}")
    
    print("context final:", context)
    return context 