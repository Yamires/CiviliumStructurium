import { number } from './rules.js';
export const requiredColumns = ['Ds_m', 'D', 'W', 'Sx', 'Zx', 'Ix'];
const numeric = requiredColumns.slice(1);

export function normalizeSections(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100000) throw new Error('Le dataset doit contenir 1 à 100000 lignes');
  const seen = new Set();
  return rows.map((row, index) => {
    if (!row || requiredColumns.some(key => !Object.hasOwn(row, key))) throw new Error(`Colonnes requises : ${requiredColumns.join(', ')}`);
    if (Object.keys(row).length > 100 || Object.keys(row).some(k => k.length > 100 || ['__proto__', 'constructor', 'prototype'].includes(k))) throw new Error('Colonnes invalides');
    const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => {
      if (v !== null && !['string', 'number'].includes(typeof v) || String(v ?? '').length > 500) throw new Error(`Cellule invalide, ligne ${index + 2} : ${k}`);
      return [k, v ?? ''];
    }));
    const designation = String(clean.Ds_m).trim();
    if (!/^[A-Za-z]+\d+(?:\.\d+)?[xX]\d+(?:\.\d+)?$/.test(designation)) throw new Error(`Ds_m invalide, ligne ${index + 2}`);
    if (seen.has(designation)) throw new Error(`Ds_m dupliqué, ligne ${index + 2}`);
    seen.add(designation);
    clean.Ds_m = designation;
    numeric.forEach(key => {
      try {
        clean[key] = number(typeof clean[key] === 'string' ? clean[key].replace(/[ \u00a0]/g, '').replace(',', '.') : clean[key]);
        if (clean[key] <= 0) throw new Error();
      } catch { throw new Error(`Valeur positive requise, ligne ${index + 2} : ${key}`); }
    });
    return clean;
  });
}

export function filterSections(values, rows, config) {
  if (!rows.length || ['mf', 'vf', 'i'].some(key => !Object.hasOwn(values, key))) return [];
  return normalizeSections(rows).map(row => {
    const [, height, mass] = row.Ds_m.match(/(\d+(?:\.\d+)?)[xX](\d+(?:\.\d+)?)$/);
    return { ...row, Mr: config.phi * config.fy * row.Sx / 1000,
      Vr: config.phi * .66 * config.fy * row.D * row.W / 1000,
      Hauteur_nominale: Number(height), Poid_lineique: Number(mass) };
  }).filter(r => r.Mr >= Math.abs(values.mf) && r.Vr >= Math.abs(values.vf) && r.Ix >= values.i)
    .sort((a, b) => a.Hauteur_nominale - b.Hauteur_nominale || a.Poid_lineique - b.Poid_lineique);
}

// Données entièrement inventées, sans correspondance avec un catalogue.
export const fictionalSections = [
  { Ds_m: 'FICTIF100x10', D: 100, W: 5, Sx: 100, Zx: 120, Ix: 20 },
  { Ds_m: 'FICTIF200x20', D: 200, W: 10, Sx: 200, Zx: 240, Ix: 80 },
  { Ds_m: 'FICTIF300x30', D: 300, W: 15, Sx: 500, Zx: 600, Ix: 300 },
];
