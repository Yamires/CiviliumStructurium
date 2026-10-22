import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculate, validateTemplate, parseFormula } from '../src/helpers/rules.js';
import { filterSections, normalizeSections, fictionalSections } from '../src/helpers/dataset.js';
const defaults = JSON.parse(fs.readFileSync(new URL('../src/assets/defaults.json', import.meta.url)));
const doc = formula => ({ calculationOptions: { Test: [{ name: 'x', label: 'X' }] },
  resultsTemplate: { Test: [{ name: 'y', label: 'Y' }] }, formules: { Test: { y: formula } } });

test('conditional formulas, precedence and numeric inputs', () => {
  assert.equal(calculate(doc('Piecewise((x**2, x < 0), (Max(x, 2), True))'), {}, 'Test', { x: -3 }).y, 9);
  assert.equal(calculate(doc('-x**2 + 2**-2'), {}, 'Test', { x: 3 }).y, -8.75);
});
for (const formula of ['z + x', 'y + 1', '__import__("os")', 'x.real', '[x][0]', 'x **', 'True', 'x > 1 < 2']) {
  test(`reject invalid formula: ${formula}`, () => assert.throws(() => validateTemplate(doc(formula), {})));
}
for (const value of ['', '12junk', null, true, Infinity]) {
  test(`reject invalid input: ${value}`, () => assert.throws(() => calculate(doc('x+1'), {}, 'Test', { x: value })));
}
for (const formula of ['1/x', 'x**101', '(-1)**0.5', 'Piecewise((x, x>0))']) {
  test(`reject numeric failure: ${formula}`, () => assert.throws(() => calculate(doc(formula), {}, 'Test', { x: 0 })));
}
test('do not evaluate an inactive conditional branch', () => {
  assert.equal(calculate(doc('Piecewise((1/x, x != 0), (0, True))'), {}, 'Test', { x: 0 }).y, 0);
});
test('bounded parsing', () => assert.throws(() => parseFormula('('.repeat(50) + 'x' + ')'.repeat(50))));
test('uniform beam from independent arithmetic', () => {
  const method = Object.keys(defaults.template.formules)[0];
  const r = calculate(defaults.template, defaults.config, method, { l: 10, lt: 5, cv: 1.9, cm: 1, x: 5 });
  assert.equal(r.mf, 256.25);
  assert.equal(r.vf, 102.5);
  assert.equal(r.i, 296.875);
});
test('inertia is a minimum', () => {
  assert.deepEqual(filterSections({ mf: 1, vf: 1, i: 40 }, fictionalSections, defaults.config).map(r => r.Ds_m), ['FICTIF200x20', 'FICTIF300x30']);
});
test('imports validate decimal commas and duplicates', () => {
  const rows = structuredClone(fictionalSections);
  rows[0].W = '5,5';
  assert.equal(normalizeSections(rows)[0].W, 5.5);
  rows[1].Ds_m = rows[0].Ds_m;
  assert.throws(() => normalizeSections(rows));
});

test('saved checks survive reload and new method fields appear', async () => {
  const { flattenProfil, autoColumns } = await import('../src/helpers/profilsTableHelpers.js');
  const flat = flattenProfil({ id: 1, outputs: { mf: 1, vf: 1, i: 20 }, selectedprofil: { Mr: 10, Vr: 10, Ix: 30 }, verif_i: false });
  assert.equal(flat.verif_i, false);
  assert.equal(flat.verif_mf, true);
  assert.ok(autoColumns([flat, { id: 2, custom_result: 15 }]).some(c => c.field === 'custom_result'));
});
