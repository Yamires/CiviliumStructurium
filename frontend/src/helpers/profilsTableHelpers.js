import { verifier } from './verifier';

export const defaultColumns = [
  { field: 'axe', headerName: 'Axe', width: 90, editable: true },
  { field: 'de_a', headerName: 'De/A', width: 90, editable: true },
  { field: 'Ds_m', headerName: 'Profil (Ds_m)', width: 120 },
  { field: 'Mr', headerName: 'Mr', width: 90, type: 'number' },
  { field: 'Vr', headerName: 'Vr', width: 90, type: 'number' },
  { field: 'I', headerName: 'I', width: 90, type: 'number' },
  { field: 'Ix', headerName: 'Ix', width: 90, type: 'number' },
  { field: 'Vf', headerName: 'Vf', width: 90, type: 'number' },
  { field: 'Mf', headerName: 'Mf', width: 90, type: 'number' },
  { field: 'verif_mf', headerName: 'OK Mf', width: 80, type: 'boolean', editable: true },
  { field: 'verif_vf', headerName: 'OK Vf', width: 80, type: 'boolean', editable: true },
  { field: 'verif_i', headerName: 'OK I', width: 80, type: 'boolean', editable: true },
];

export function flattenProfil(row) {
  const outputs = row.outputs || {};
  const selectedprofil = row.selectedprofil || {};

  return {
    axe: row.axe,
    de_a: row.de_a,
    ...selectedprofil,
    ...outputs,
    Ds_m: selectedprofil.Ds_m,
    Mr: selectedprofil.Mr,
    Vr: selectedprofil.Vr,
    I: outputs.i,
    Ix: selectedprofil.Ix,
    Vf: outputs.vf,
    Mf: outputs.mf,
    ...verifier({
      mf: outputs.mf,
      mr: selectedprofil.Mr,
      ix: selectedprofil.Ix,
      i: outputs.i,
      vf: outputs.vf,
      vr: selectedprofil.Vr,
    }),
    __raw: row,
    id: row.id,  
  };
}


export function autoColumns(rows) {
  if (!rows || rows.length === 0) return defaultColumns;
  const seen = new Set(defaultColumns.map(c => c.field));
  const dynamicCols = Object.keys(rows[0])
    .filter(
      key => !seen.has(key) && key !== '__raw' && key !== 'id'
    )
    .map(key => ({
      field: key,
      headerName: key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      width: 100,
      type: typeof rows[0][key] === 'number' ? 'number' : 'string',
      editable: false,
    }));
  return [...defaultColumns, ...dynamicCols];
}