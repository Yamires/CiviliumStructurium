import { calculate, validateTemplate } from './rules.js';
import { normalizeSections, filterSections, requiredColumns } from './dataset.js';

self.onmessage = async ({ data }) => {
  try {
    let result;
    if (data.action === 'solve') {
      const results = calculate(data.template, data.config, data.methode, data.inputs);
      result = { results, profils: filterSections(results, data.rows || [], data.config).slice(0, data.config.default_nb_profils) };
    } else if (data.action === 'validate') {
      validateTemplate(data.template, data.config);
      result = data.inputs ? calculate(data.template, data.config, data.methode, data.inputs) : null;
    } else if (data.action === 'workbook' || data.action === 'sheet') {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data.buffer, { type: 'array', sheetRows: 100051, cellFormula: false, cellHTML: false });
      if (data.action === 'workbook') result = workbook.SheetNames;
      else {
        const sheet = workbook.Sheets[data.sheet];
        if (!sheet) throw new Error('Feuille introuvable');
        const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1');
        if (range.e.r > 100050 || range.e.c > 99) throw new Error('Feuille trop grande (100000 lignes, 100 colonnes maximum)');
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
        const start = matrix.slice(0, 50).findIndex(row => requiredColumns.every(k => row.map(String).map(v => v.trim()).includes(k)));
        if (start < 0) throw new Error(`En-tête CISC introuvable : ${requiredColumns.join(', ')}`);
        const headers = matrix[start].map(value => String(value).trim());
        if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error('En-têtes vides ou dupliqués');
        const rows = matrix.slice(start + 1).map(row => Object.fromEntries(headers.map((key, i) => [key, row[i] ?? ''])));
        result = normalizeSections(rows);
      }
    } else throw new Error('Opération inconnue');
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message }); }
};
