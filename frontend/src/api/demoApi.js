import defaults from '../assets/defaults.json';
import { validateTemplate, number } from '../helpers/rules.js';
import { normalizeSections, fictionalSections } from '../helpers/dataset.js';
import { workerTask } from '../helpers/worker.js';

let rows = fictionalSections;
let template = structuredClone(defaults.template);
let config = { ...defaults.config };
let initialError = '';
// Les valeurs enregistrées sont validées avant de devenir actives.
try {
  const saved = JSON.parse(localStorage.getItem('civilium-demo') || 'null');
  if (saved) {
    validateTemplate(saved.template, saved.config);
    checkConfig(saved.config);
    template = saved.template;
    config = saved.config;
  }
} catch { initialError = 'Configuration locale illisible ; les valeurs par défaut sont utilisées.'; }

function checkConfig(value) {
  if (!value || Object.keys(value).sort().join(',') !== Object.keys(defaults.config).sort().join(',')) throw new Error('Constantes incohérentes');
  Object.values(value).forEach(v => { if (number(v) <= 0) throw new Error('Constantes positives requises'); });
  if (value.phi > 1 || !Number.isInteger(value.default_nb_profils) || value.default_nb_profils > 100) throw new Error('phi ou nombre de profilés invalide');
}

function save(nextTemplate, nextConfig) {
  localStorage.setItem('civilium-demo', JSON.stringify({ template: nextTemplate, config: nextConfig }));
  template = nextTemplate;
  config = nextConfig;
}

export async function demoRequest(path, options) {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : {};
  if (path === '/api/getTemplate') return template;
  if (path === '/api/config' && method === 'GET') return config;
  if (path === '/api/config' && method === 'POST') {
    const next = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, number(v)]));
    checkConfig(next);
    validateTemplate(template, next);
    save(template, next);
    return config;
  }
  if (path === '/api/templates' && method === 'PUT') {
    validateTemplate(data, config);
    save(data, config);
    return template;
  }
  if (path === '/api/templates/validate') {
    const results = await workerTask({ ...data, config, action: 'validate' }, options.signal);
    return { status: 'ok', results };
  }
  if (path === '/api/dataset') {
    if (method === 'PUT') rows = normalizeSections(data.rows);
    const message = initialError;
    initialError = '';
    return { count: rows.length, fictional: rows === fictionalSections, message };
  }
  if (path === '/api/solver') {
    const result = await workerTask({ ...data, template, config, rows, action: 'solve' }, options.signal);
    const available = ['mf', 'vf', 'i'].every(k => Object.hasOwn(result.results, k));
    return { ...result, message: available ? 'Présélection élastique préliminaire ; vérifiez la classe, la stabilité et les unités séparément.' : 'Cette méthode ne fournit pas mf, vf et i ; présélection indisponible.' };
  }
  throw new Error('Fonction disponible uniquement dans la version locale');
}
