import { useContext, useState } from 'react';
import { Alert, Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ProjectContext, ProfilUpdateContext } from '../contexts';
import { saveProfilSelection } from '../api/profilsApi';
import { DEMO } from '../api/client';

export default function ProfilsRecommandes({ outputs, inputs, calculationType }) {
  const { selectedProjectId } = useContext(ProjectContext);
  const { triggerUpdateProfils } = useContext(ProfilUpdateContext);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [axe, setAxe] = useState('');
  const [deA, setDeA] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = (outputs.profils || []).map((p, id) => ({ ...p, id }));
  const current = rows.find(p => p.Ds_m === selected);
  const fields = [...new Set(rows.flatMap(row => Object.keys(row)))].filter(k => k !== 'id');
  const visible = ['Ds_m', 'Mr', 'Vr', 'Ix'];
  const handleSave = async () => {
    setBusy(true); setError('');
    try {
      const { id: _id, ...profil } = current;
      await saveProfilSelection({ calculationType, inputs, outputs: outputs.results, selectedProfil: profil, id_project: selectedProjectId, axe, de_a: deA });
      triggerUpdateProfils(); setOpen(false); setAxe(''); setDeA('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <Box sx={{ minWidth: 0 }}>
    <Typography component="h2" variant="h6" gutterBottom>Profils présélectionnés</Typography>
    <DataGrid rows={rows} columns={fields.map(field => ({ field, headerName: field === 'Ds_m' ? 'Dimension' : field, width: 120 }))}
      columnVisibilityModel={Object.fromEntries(fields.map(field => [field, visible.includes(field)]))}
      onRowClick={({ row }) => setSelected(row.Ds_m)}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10]} sx={{ height: 360 }} />
    {outputs.results && !rows.length && <Typography sx={{ mt: 1 }}>Aucun profilé présélectionné.</Typography>}
    {!DEMO && <Button variant="contained" disabled={!current || busy} onClick={() => { setOpen(true); setError(''); }} sx={{ mt: 2 }}>Valider la sélection</Button>}
    <Dialog open={open} onClose={() => !busy && setOpen(false)}>
      <DialogTitle>Valider la sélection</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField fullWidth label="Nom de l'axe" value={axe} onChange={e => setAxe(e.target.value)} margin="dense" />
        <TextField fullWidth label="De/A" value={deA} onChange={e => setDeA(e.target.value)} margin="dense" />
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setOpen(false)}>Annuler</Button><Button disabled={busy || !current} onClick={handleSave}>Confirmer</Button></DialogActions>
    </Dialog>
  </Box>;
}
