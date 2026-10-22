import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const defaults = JSON.parse(readFileSync(new URL('../../src/assets/defaults.json', import.meta.url)));
const firstMethod = Object.keys(defaults.template.formules)[0];
const demoURL = 'http://127.0.0.1:4174/portfolio/civilium/';

async function calculate(page, method, inputs) {
  await page.getByLabel('Choisir une méthode', { exact: true }).click();
  await page.getByRole('option', { name: method, exact: true }).click();
  for (const field of defaults.template.calculationOptions[method]) {
    await page.getByLabel(field.label, { exact: true }).fill(String(inputs[field.name]));
  }
  await page.getByRole('button', { name: 'Calculer', exact: true }).click();
}

function fictionalWorkbook() {
  const XLSX = require('xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([
    { Ds_m: 'FICTIF100x10', D: 100, W: 5, Sx: 100, Zx: 120, Ix: 20 },
    { Ds_m: 'FICTIF200x20', D: 200, W: 10, Sx: 200, Zx: 240, Ix: 80 },
  ]), 'Fictif');
  return { name: 'fictif.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) };
}

async function importDataset(page) {
  await page.getByRole('button', { name: 'Dataset', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Importer le dataset CISC' });
  await dialog.locator('input[type=file]').setInputFiles(fictionalWorkbook());
  await dialog.getByLabel('Feuille', { exact: true }).click();
  await page.getByRole('option', { name: 'Fictif', exact: true }).click();
  await expect(dialog.getByText('2 lignes validées. Aperçu :')).toBeVisible();
  await dialog.getByRole('button', { name: 'Activer le dataset' }).click();
  await expect(dialog).not.toBeVisible();
}

test('local project, import, saved selection, export and reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Nouveau projet', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Créer un nouveau projet' });
  await create.getByLabel('Nom du projet', { exact: true }).fill('Validation locale');
  await create.getByRole('button', { name: 'Créer', exact: true }).click();
  await expect(page.getByLabel('Projet', { exact: true })).toHaveValue('Validation locale');
  await importDataset(page);
  await calculate(page, firstMethod, { l: 2, lt: 1, cv: 1, cm: 1, x: 1 });
  await page.getByRole('gridcell', { name: 'FICTIF100x10', exact: true }).click();
  await page.getByRole('button', { name: 'Valider la sélection' }).click();
  const selection = page.getByRole('dialog', { name: 'Valider la sélection' });
  await selection.getByLabel("Nom de l'axe").fill('A');
  await selection.getByLabel('De/A').fill('1-2');
  await selection.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByRole('grid').last().getByRole('gridcell', { name: 'FICTIF100x10', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Validation locale', exact: true }).click();
  await expect(page.getByRole('grid').last().getByRole('gridcell', { name: 'FICTIF100x10', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exporter', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('dialog', { name: 'Exporter les données du projet' }).getByRole('button', { name: 'Exporter', exact: true }).click();
  const download = await downloadPromise;
  const XLSX = require('xlsx');
  const workbook = XLSX.read(readFileSync(await download.path()), { type: 'buffer' });
  const exported = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
  expect(exported).toContain('FICTIF100x10');
  expect(exported).toContain('Validation locale');
});

test('demo works beneath a subpath without API requests', async ({ page }) => {
  const errors = [];
  const apiRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => { if (new URL(req.url()).pathname.includes('/api/')) apiRequests.push(req.url()); });
  await page.goto(demoURL);
  await calculate(page, firstMethod, { l: 10, lt: 5, cv: 1.9, cm: 1, x: 5 });
  await expect(page.getByRole('cell', { name: '256.25', exact: true }).first()).toBeVisible();
  await importDataset(page);
  await page.getByRole('button', { name: 'Dataset', exact: true }).click();
  await expect(page.getByText('2 profilés actifs.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Dataset', exact: true }).click();
  await expect(page.getByText('3 profilés actifs (données fictives).', { exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('editor saves rules, rejects unknown symbols and survives reload', async ({ page }) => {
  await page.goto(demoURL);
  await page.getByRole('button', { name: 'Méthodes', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Calculs et formules' });
  await dialog.getByLabel('Méthode existante').click();
  await page.getByRole('option', { name: 'Nouvelle méthode', exact: true }).click();
  await dialog.getByLabel('Nom de la méthode', { exact: true }).fill('Test automatique');
  await dialog.getByRole('button', { name: 'Ajouter — entrées' }).click();
  await dialog.getByLabel('Entrées 1 — variable').fill('x');
  await dialog.getByLabel('Libellé 1 (avec unités)', { exact: true }).fill('Valeur X');
  await dialog.getByRole('button', { name: 'Ajouter — formules' }).click();
  await dialog.getByLabel('Formules 1 — variable').fill('y');
  await dialog.getByLabel('Expression 1', { exact: true }).fill('x * 2');
  await dialog.getByRole('button', { name: 'Ajouter — résultats' }).click();
  await dialog.getByLabel('Résultats 1 — variable').fill('y');
  await dialog.getByLabel('Libellé 1 (avec unités)', { exact: true }).last().fill('Résultat Y');
  await dialog.getByLabel('Valeur X', { exact: true }).fill('3');
  await dialog.getByRole('button', { name: 'Tester', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Résultat Y = 6');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Méthodes', exact: true }).click();
  await dialog.getByLabel('Méthode existante').click();
  await page.getByRole('option', { name: 'Test automatique', exact: true }).click();
  await dialog.getByLabel('Expression 1', { exact: true }).fill('unknown + x');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Variables inconnues');
  await dialog.getByRole('button', { name: 'Annuler', exact: true }).click();
  await page.reload();
  await page.getByLabel('Choisir une méthode', { exact: true }).click();
  await page.getByRole('option', { name: 'Test automatique', exact: true }).click();
  await page.getByLabel('Valeur X', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Calculer', exact: true }).click();
  await expect(page.getByRole('cell', { name: '8', exact: true })).toBeVisible();
});

test('demo calculates inside a narrow portfolio iframe', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('http://127.0.0.1:4174/portfolio/');
  const frame = page.frameLocator('iframe[title=Civilium]');
  await calculate(frame, firstMethod, { l: 10, lt: 5, cv: 1.9, cm: 1, x: 5 });
  await expect(frame.getByRole('cell', { name: '256.25', exact: true }).first()).toBeVisible();
});
