import { useContext, useEffect, useState } from 'react';
import { Alert, Box, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectContext, ProfilUpdateContext } from '../contexts';
import { getProfils, deleteProfil, updateProfil } from '../api/profilsApi';
import { autoColumns, defaultColumns, flattenProfil } from '../helpers/profilsTableHelpers';

export default function DataTableComponent({ columns, setColumns, rows, setRows, columnVisibilityModel, setColumnVisibilityModel }) {
  const { selectedProjectId } = useContext(ProjectContext);
  const { updateProfils, triggerUpdateProfils } = useContext(ProfilUpdateContext);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getProfils(selectedProjectId).then(data => {
      if (!active) return;
      const flat = data.map(flattenProfil);
      const available = autoColumns(flat);
      setRows(flat); setColumns(available);
      setColumnVisibilityModel(Object.fromEntries(available.map(c => [c.field, defaultColumns.some(d => d.field === c.field)])));
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [selectedProjectId, updateProfils, setRows, setColumns, setColumnVisibilityModel]);

  const remove = async id => {
    try { await deleteProfil(id); triggerUpdateProfils(); }
    catch (err) { setError(err.message); }
  };
  const update = async row => {
    await updateProfil(row.id, row);
    return row;
  };
  const actions = { field: 'actions', headerName: '', width: 60, sortable: false,
    renderCell: ({ row }) => <IconButton aria-label="Supprimer le profilé" color="error" onClick={() => remove(row.id)}><DeleteIcon /></IconButton> };
  return <Box sx={{ my: 4 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <DataGrid rows={rows} columns={[...columns, actions]} columnVisibilityModel={columnVisibilityModel}
      onColumnVisibilityModelChange={setColumnVisibilityModel} showToolbar processRowUpdate={update}
      onProcessRowUpdateError={err => setError(err.message)}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10]}
      sx={{ height: 400, backgroundColor: 'background.custom', borderRadius: 4 }} />
  </Box>;
}
