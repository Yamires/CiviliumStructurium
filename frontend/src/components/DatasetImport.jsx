import { useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import { request } from '../api/client';
import { workerTask } from '../helpers/worker';
import { requiredColumns } from '../helpers/dataset';

export default function DatasetImport({ onChanged }) {
  const [open, setOpen] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [sheet, setSheet] = useState('');
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const buffer = useRef(null);
  const handleOpen = async () => {
    setOpen(true); setError(''); setRows([]); setSheets([]); setSheet(''); buffer.current = null;
    try { setStatus(await request('/api/dataset')); }
    catch (err) { setError(err.message); }
  };
  const handleFile = async event => {
    const file = event.target.files[0];
    if (!file) return;
    setError(''); setRows([]); setSheets([]); setSheet(''); setBusy(true);
    try {
      if (!/\.xlsx$/i.test(file.name) || file.size > 25 * 1024 * 1024) throw new Error('Fichier .xlsx requis (25 Mo maximum)');
      buffer.current = await file.arrayBuffer();
      setSheets(await workerTask({ action: 'workbook', buffer: buffer.current }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); event.target.value = ''; }
  };
  const handleSheet = async event => {
    const name = event.target.value;
    setSheet(name); setRows([]); setError(''); setBusy(true);
    try { setRows(await workerTask({ action: 'sheet', buffer: buffer.current, sheet: name })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const handleSave = async () => {
    setBusy(true); setError('');
    try { await request('/api/dataset', { method: 'PUT', body: JSON.stringify({ rows }) }); onChanged(); setOpen(false); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <>
    <Button onClick={handleOpen}>Dataset</Button>
    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Importer le dataset CISC</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status?.message && <Alert severity="warning">{status.message}</Alert>}
        <Typography sx={{ mb: 2 }}>{status ? `${status.count} profilés actifs${status.fictional ? ' (données fictives)' : ''}.` : ''}</Typography>
        <Typography sx={{ mb: 2 }}>Choisissez un classeur avec les colonnes CISC. D et W : mm ; Sx et Zx : E3 mm³ ; Ix : E6 mm⁴. Les fichiers AISC ne sont pas convertis automatiquement.</Typography>
        <Button component="label" variant="outlined" disabled={busy}>Choisir un fichier Excel<input hidden type="file" accept=".xlsx" onChange={handleFile} /></Button>
        {sheets.length > 0 && <TextField select label="Feuille" fullWidth value={sheet} onChange={handleSheet} disabled={busy} sx={{ my: 2 }}>
          {sheets.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </TextField>}
        {busy && <Typography role="status">Traitement en cours…</Typography>}
        {rows.length > 0 && <>
          <Typography>{rows.length} lignes validées. Aperçu :</Typography>
          <TableContainer><Table size="small">
            <TableHead><TableRow>{requiredColumns.map(key => <TableCell key={key}>{key}</TableCell>)}</TableRow></TableHead>
            <TableBody>{rows.slice(0, 5).map(row => <TableRow key={row.Ds_m}>{requiredColumns.map(key => <TableCell key={key}>{row[key]}</TableCell>)}</TableRow>)}</TableBody>
          </Table></TableContainer>
        </>}
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Annuler</Button><Button variant="contained" onClick={handleSave} disabled={busy || !rows.length}>Activer le dataset</Button></DialogActions>
    </Dialog>
  </>;
}
