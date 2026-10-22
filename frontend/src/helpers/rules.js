// Même grammaire numérique que solver.py, sans eval ni Function.
const functions = new Set(['Max', 'Min', 'Piecewise']);
const reserved = new Set([...functions, 'True', 'False', '__proto__', 'constructor', 'prototype']);
const operators = { '|': 2, '&': 3, '==': 1, '!=': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '+': 4, '-': 4, '*': 5, '/': 5, '**': 7 };

export function number(value) {
  if (!['string', 'number'].includes(typeof value) || value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '' ||
      (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))) {
    throw new Error('Un nombre fini est requis');
  }
  const result = Number(value);
  if (!Number.isFinite(result) || Math.abs(result) > 1e100) throw new Error('Nombre non fini ou trop grand');
  return result;
}

function identifier(name) {
  if (typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || reserved.has(name)) {
    throw new Error(`Nom de variable invalide : ${name}`);
  }
}

export function parseFormula(formula) {
  if (typeof formula !== 'string' || !formula.trim() || formula.length > 2048) throw new Error('Formule vide ou trop longue');
  const tokens = formula.trim().match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z][A-Za-z0-9_]*|\*\*|<=|>=|==|!=|[^\s]/g) || [];
  if (tokens.length > 512) throw new Error('Formule trop complexe');
  let index = 0;
  function expect(token) {
    if (tokens[index++] !== token) throw new Error(`Symbole attendu : ${token}`);
  }
  function expression(minimum = 0, depth = 0) {
    if (depth > 32) throw new Error('Formule trop imbriquée');
    const token = tokens[index++];
    let tree;
    if (token === '+' || token === '-') tree = [token === '-' ? 'neg' : 'pos', expression(6, depth + 1)];
    else if (token === '(') {
      tree = expression(0, depth + 1);
      if (tokens[index] === ',') {
        index++;
        tree = ['tuple', tree, expression(0, depth + 1)];
      }
      expect(')');
    } else if (token === 'True' || token === 'False') tree = ['bool', token === 'True'];
    else if (token && /^(?:\d|\.\d)/.test(token)) tree = ['num', number(token)];
    else if (functions.has(token) && tokens[index] === '(') {
      index++;
      const args = [expression(0, depth + 1)];
      while (tokens[index] === ',') { index++; args.push(expression(0, depth + 1)); }
      expect(')');
      if (args.length > 32) throw new Error('Trop d’arguments');
      tree = [token, ...args];
    } else {
      identifier(token);
      tree = ['var', token];
    }
    while (Object.hasOwn(operators, tokens[index]) && operators[tokens[index]] >= minimum) {
      const op = tokens[index++];
      tree = [op, tree, expression(operators[op] + (op === '**' ? 0 : 1), depth + 1)];
    }
    return tree;
  }
  const tree = expression();
  if (index !== tokens.length) throw new Error('Expression non autorisée');
  checkTree(tree);
  return tree;
}

function checkTree([op, ...args]) {
  if (op === 'num' || op === 'var') return 'number';
  if (op === 'bool') return 'bool';
  if (op === 'tuple') throw new Error('Couple hors de Piecewise');
  if (op === 'Piecewise') {
    for (const pair of args) {
      if (pair[0] !== 'tuple' || checkTree(pair[1]) !== 'number' || checkTree(pair[2]) !== 'bool') {
        throw new Error('Piecewise attend (valeur, condition)');
      }
    }
    return 'number';
  }
  const expected = ['&', '|'].includes(op) ? 'bool' : 'number';
  if (args.some(a => checkTree(a) !== expected)) throw new Error('Type incompatible dans la formule');
  return ['<', '<=', '>', '>=', '==', '!=', '&', '|'].includes(op) ? 'bool' : 'number';
}

function symbols(tree) {
  return tree[0] === 'var' ? [tree[1]] : tree.slice(1).filter(Array.isArray).flatMap(symbols);
}

function evaluate([op, ...args], context) {
  if (op === 'num' || op === 'bool') return args[0];
  if (op === 'var') return context[args[0]];
  const run = a => evaluate(a, context);
  if (op === 'Piecewise') {
    const pair = args.find(a => run(a[2]));
    if (!pair) throw new Error('Aucune condition Piecewise satisfaite');
    return run(pair[1]);
  }
  if (op === '&') return run(args[0]) && run(args[1]);
  if (op === '|') return run(args[0]) || run(args[1]);
  const values = args.map(run);
  const [a, b] = values;
  if (op === '**' && Math.abs(b) > 100) throw new Error('Exposant trop grand (100 maximum)');
  switch (op) {
    case 'Max': return Math.max(...values);
    case 'Min': return Math.min(...values);
    case 'neg': return number(-a);
    case 'pos': return number(a);
    case '+': return number(a + b);
    case '-': return number(a - b);
    case '*': return number(a * b);
    case '/': return number(a / b);
    case '**': return number(a ** b);
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
    case '==': return a === b;
    case '!=': return a !== b;
    default: throw new Error('Expression non autorisée');
  }
}

function fields(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) throw new Error('Liste de 1 à 100 champs requise');
  const names = items.map(item => {
    if (!item || Object.keys(item).sort().join(',') !== 'label,name') throw new Error('Chaque champ attend name et label');
    identifier(item.name);
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 200) throw new Error('Libellé requis');
    return item.name;
  });
  if (new Set(names).size !== names.length) throw new Error('Noms de champs dupliqués');
  return names;
}

export function validateTemplate(doc, config) {
  const keys = ['calculationOptions', 'resultsTemplate', 'formules'];
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  if (!object(doc) || Object.keys(doc).sort().join(',') !== [...keys].sort().join(',') || keys.some(k => !object(doc[k]))) {
    throw new Error('Structure du template invalide');
  }
  const methods = Object.keys(doc.formules);
  if (methods.length > 100 || keys.some(k => Object.keys(doc[k]).sort().join('\0') !== [...methods].sort().join('\0'))) {
    throw new Error('Méthodes incohérentes (100 maximum)');
  }
  const compiled = {};
  for (const method of methods) {
    if (!method.trim() || method.length > 200 || ['__proto__', 'constructor', 'prototype'].includes(method)) throw new Error('Nom de méthode invalide');
    const inputs = fields(doc.calculationOptions[method]);
    const outputs = fields(doc.resultsTemplate[method]);
    const formulas = doc.formules[method];
    if (!object(formulas) || Object.keys(formulas).length < 1 || Object.keys(formulas).length > 100) throw new Error('1 à 100 formules requises');
    const names = Object.keys(formulas);
    names.forEach(identifier);
    if (inputs.some(n => Object.hasOwn(config, n) || names.includes(n)) || names.some(n => Object.hasOwn(config, n))) throw new Error('Collision entre entrées, constantes et formules');
    if (outputs.some(n => !names.includes(n))) throw new Error('Chaque résultat doit correspondre à une formule');
    const known = new Set([...inputs, ...Object.keys(config)]);
    const trees = Object.fromEntries(names.map(name => {
      try {
        const tree = parseFormula(formulas[name]);
        if (checkTree(tree) !== 'number') throw new Error('Un résultat numérique est requis');
        const unknown = symbols(tree).filter(n => !known.has(n) && !names.includes(n));
        if (unknown.length) throw new Error(`Variables inconnues : ${unknown.join(', ')}`);
        return [name, tree];
      } catch (error) { throw new Error(`${method} / ${name} : ${error.message}`); }
    }));
    const order = [];
    while (order.length < names.length) {
      const ready = names.filter(n => !known.has(n) && symbols(trees[n]).every(s => known.has(s)));
      if (!ready.length) throw new Error(`Cycle détecté : ${method}`);
      ready.forEach(n => { order.push([n, trees[n]]); known.add(n); });
    }
    compiled[method] = order;
  }
  return compiled;
}

export function calculate(doc, config, method, inputs) {
  const compiled = validateTemplate(doc, config);
  if (!Object.hasOwn(compiled, method)) throw new Error('Méthode inconnue');
  const expected = doc.calculationOptions[method].map(f => f.name).sort();
  if (!inputs || Object.keys(inputs).sort().join(',') !== expected.join(',')) throw new Error('Entrées incohérentes');
  const context = Object.fromEntries(Object.entries({ ...config, ...inputs }).map(([k, v]) => [k, number(v)]));
  for (const [name, tree] of compiled[method]) {
    try { context[name] = number(evaluate(tree, context)); }
    catch (error) { throw new Error(`${name} : ${error.message}`); }
  }
  return context;
}
