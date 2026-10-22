import { useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, TextField } from '@mui/material';
import { ProjectContext, ProjectUpdateContext } from '../contexts';
import { fetchProjects, updateProject } from '../api/projectApi';

export default function ProjectBarComponent() {
  const { selectedProjectId, projectData, setProjectData } = useContext(ProjectContext);
  const { triggerUpdate } = useContext(ProjectUpdateContext);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchProjects().then(projects => {
      const project = projects.find(p => p.id_project === selectedProjectId);
      if (active && project) setProjectData(project);
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [selectedProjectId, setProjectData]);
  const save = async event => {
    event.preventDefault(); setError(''); setMessage('');
    try { await updateProject(projectData, selectedProjectId); triggerUpdate(); setMessage('Projet enregistré !'); }
    catch (err) { setError(err.message); }
  };
  return <Paper sx={{ p: 3, my: 3, backgroundColor: 'background.custom' }}>
    {error && <Alert severity="error">{error}</Alert>}
    {message && <Alert severity="success">{message}</Alert>}
    <Box component="form" onSubmit={save} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {[['nom_projet', 'Projet'], ['description', 'Description'], ['date', 'Date'], ['prepare_par', 'Préparé par']].map(([key, label]) =>
        <TextField key={key} label={label} type={key === 'date' ? 'date' : 'text'} slotProps={key === 'date' ? { inputLabel: { shrink: true } } : {}}
          value={projectData[key] || ''} onChange={e => setProjectData(p => ({ ...p, [key]: e.target.value }))} sx={{ flex: '1 1 180px' }} />)}
      <Button type="submit" variant="contained">Enregistrer</Button>
    </Box>
  </Paper>;
}
