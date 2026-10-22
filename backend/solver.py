"""Petit DSL numérique : aucune expression utilisateur n'est exécutée comme du Python."""
import ast
import math
import operator
import re
from pathlib import Path

FUNCTIONS = {'Max', 'Min', 'Piecewise'}
RESERVED = FUNCTIONS | {'True', 'False', '__proto__', 'constructor', 'prototype'}
IDENTIFIER = re.compile(r'^[A-Za-z][A-Za-z0-9_]{0,63}$')
OPS = {ast.Add: '+', ast.Sub: '-', ast.Mult: '*', ast.Div: '/', ast.Pow: '**',
       ast.Lt: '<', ast.LtE: '<=', ast.Gt: '>', ast.GtE: '>=', ast.Eq: '==',
       ast.NotEq: '!=', ast.BitAnd: '&', ast.BitOr: '|'}
BINARY = {'+': operator.add, '-': operator.sub, '*': operator.mul, '/': operator.truediv,
          '**': operator.pow, '<': operator.lt, '<=': operator.le, '>': operator.gt,
          '>=': operator.ge, '==': operator.eq, '!=': operator.ne}


def number(value):
    if isinstance(value, bool) or value is None or value == '':
        raise ValueError('Un nombre fini est requis')
    if isinstance(value, str) and not re.fullmatch(r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?', value.strip()):
        raise ValueError('Un nombre fini est requis')
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        raise ValueError('Un nombre fini est requis') from None
    if not math.isfinite(result) or abs(result) > 1e100:
        raise ValueError('Nombre non fini ou trop grand')
    return result


def identifier(name):
    if not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or name in RESERVED:
        raise ValueError(f'Nom de variable invalide : {name}')


def parse_formula(formula):
    if not isinstance(formula, str) or not formula.strip() or len(formula) > 2048:
        raise ValueError('Formule vide ou trop longue (2048 caractères maximum)')
    try:
        root = ast.parse(formula.strip(), mode='eval').body
    except (SyntaxError, RecursionError):
        raise ValueError("Erreur lors de l'analyse de la formule") from None
    if sum(1 for _ in ast.walk(root)) > 512:
        raise ValueError('Formule trop complexe')

    def convert(node, depth=0):
        if depth > 32:
            raise ValueError('Formule trop imbriquée')
        child = lambda n: convert(n, depth + 1)
        if isinstance(node, ast.Constant) and type(node.value) in (int, float, bool):
            return ['bool', node.value] if type(node.value) is bool else ['num', number(node.value)]
        if isinstance(node, ast.Name):
            identifier(node.id)
            return ['var', node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            return ['neg' if isinstance(node.op, ast.USub) else 'pos', child(node.operand)]
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return [OPS[type(node.op)], child(node.left), child(node.right)]
        if isinstance(node, ast.Compare) and len(node.ops) == 1 and type(node.ops[0]) in OPS:
            return [OPS[type(node.ops[0])], child(node.left), child(node.comparators[0])]
        if isinstance(node, ast.Tuple) and len(node.elts) == 2:
            return ['tuple', *map(child, node.elts)]
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in FUNCTIONS and not node.keywords:
            if not 1 <= len(node.args) <= 32:
                raise ValueError('Nombre d’arguments invalide')
            return [node.func.id, *map(child, node.args)]
        raise ValueError('Expression non autorisée')

    tree = convert(root)
    check_tree(tree)
    return tree


def check_tree(tree):
    """Les booléens et les couples sont réservés aux conditions de Piecewise."""
    op, *args = tree
    if op in ('num', 'var'):
        return 'number'
    if op == 'bool':
        return 'bool'
    if op == 'tuple':
        raise ValueError('Couple hors de Piecewise')
    if op == 'Piecewise':
        for pair in args:
            if pair[0] != 'tuple' or check_tree(pair[1]) != 'number' or check_tree(pair[2]) != 'bool':
                raise ValueError('Piecewise attend (valeur, condition)')
        return 'number'
    kinds = [check_tree(a) for a in args]
    expected = 'bool' if op in ('&', '|') else 'number'
    if any(k != expected for k in kinds):
        raise ValueError('Type incompatible dans la formule')
    return 'bool' if op in ('<', '<=', '>', '>=', '==', '!=', '&', '|') else 'number'


def symbols(tree):
    if tree[0] == 'var':
        return {tree[1]}
    return set().union(*(symbols(a) for a in tree[1:] if isinstance(a, list)))


def evaluate(tree, context):
    op, *args = tree
    if op in ('num', 'bool'):
        return args[0]
    if op == 'var':
        return context[args[0]]
    run = lambda n: evaluate(n, context)
    if op == 'Piecewise':
        for pair in args:
            if run(pair[2]):
                return run(pair[1])
        raise ValueError('Aucune condition Piecewise satisfaite')
    if op in ('&', '|'):
        return (run(args[0]) and run(args[1])) if op == '&' else (run(args[0]) or run(args[1]))
    values = [run(a) for a in args]
    if op == '**' and abs(values[1]) > 100:
        raise ValueError('Exposant trop grand (100 maximum)')
    result = max(values) if op == 'Max' else min(values) if op == 'Min' else (
        -values[0] if op == 'neg' else values[0] if op == 'pos' else BINARY[op](*values))
    return result if isinstance(result, bool) else number(result)


def fields(items):
    if not isinstance(items, list) or not 1 <= len(items) <= 100:
        raise ValueError('Une liste de 1 à 100 champs est requise')
    names = []
    for item in items:
        if not isinstance(item, dict) or set(item) != {'name', 'label'}:
            raise ValueError('Chaque champ attend name et label')
        identifier(item['name'])
        if not isinstance(item['label'], str) or not 1 <= len(item['label'].strip()) <= 200:
            raise ValueError('Libellé requis (200 caractères maximum)')
        names.append(item['name'])
    if len(set(names)) != len(names):
        raise ValueError('Noms de champs dupliqués')
    return set(names)


def validate_template(doc, config):
    keys = ('calculationOptions', 'resultsTemplate', 'formules')
    if not isinstance(doc, dict) or set(doc) != set(keys) or any(not isinstance(doc[k], dict) for k in keys):
        raise ValueError('Structure du template invalide')
    methods = set(doc[keys[0]])
    if len(methods) > 100 or any(set(doc[k]) != methods for k in keys):
        raise ValueError('Méthodes incohérentes (100 maximum)')
    compiled = {}
    for method in doc['formules']:
        if not isinstance(method, str) or not 1 <= len(method.strip()) <= 200 or method in {'__proto__', 'constructor', 'prototype'}:
            raise ValueError('Nom de méthode requis (200 caractères maximum)')
        inputs = fields(doc[keys[0]][method])
        outputs = fields(doc[keys[1]][method])
        formulas = doc['formules'][method]
        if not isinstance(formulas, dict) or not 1 <= len(formulas) <= 100:
            raise ValueError('Une méthode attend 1 à 100 formules')
        for name in formulas:
            identifier(name)
        if inputs & (set(config) | set(formulas)) or set(formulas) & set(config):
            raise ValueError('Collision entre entrées, constantes et formules')
        if not outputs <= set(formulas):
            raise ValueError('Chaque résultat doit correspondre à une formule')
        trees = {}
        for name, formula in formulas.items():
            try:
                trees[name] = parse_formula(formula)
                if check_tree(trees[name]) != 'number':
                    raise ValueError('Un résultat numérique est requis')
                unknown = symbols(trees[name]) - inputs - set(config) - set(formulas)
                if unknown:
                    raise ValueError('Variables inconnues : ' + ', '.join(sorted(unknown)))
            except ValueError as error:
                raise ValueError(f'{method} / {name} : {error}') from None
        known, order = inputs | set(config), []
        while len(order) < len(trees):
            ready = [n for n in trees if n not in known and symbols(trees[n]) <= known]
            if not ready:
                raise ValueError(f'Cycle détecté : {method}')
            order.extend(ready)
            known.update(ready)
        compiled[method] = [(name, trees[name]) for name in order]
    return compiled


def calculate(doc, config, methode, inputs):
    compiled = validate_template(doc, config)
    if methode not in compiled:
        raise ValueError(f'Template non trouvée pour la méthode : {methode}')
    expected = {f['name'] for f in doc['calculationOptions'][methode]}
    if not isinstance(inputs, dict) or set(inputs) != expected:
        raise ValueError('Les entrées doivent correspondre aux champs de la méthode')
    context = {key: number(value) for key, value in config.items()}
    context.update({key: number(value) for key, value in inputs.items()})
    for name, tree in compiled[methode]:
        try:
            context[name] = number(evaluate(tree, context))
        except (ValueError, ArithmeticError, TypeError) as error:
            raise ValueError(f'{name} : {error}') from None
    return context


def solve(methode, input_val, config_path=None, template_path=None):
    import yaml
    resources = Path(__file__).resolve().parent / 'ressource'
    config = yaml.safe_load(Path(config_path or resources / 'config.yaml').read_text())
    doc = yaml.safe_load(Path(template_path or resources / 'Templates.yaml').read_text())
    return calculate(doc, config, methode, input_val)
