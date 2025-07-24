import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ProjectContext, ProjectUpdateContext } from '../App';
import { Box, Button, Typography, List, ListItem, ListItemButton, ListItemText, Paper } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { createProject, fetchProjects } from '../api/projectApi';

export default function ProjectSelector() {
  const { user, idUser } = useContext(AuthContext);
  const { setSelectedProjectId } = useContext(ProjectContext);
  const { updateCounter, triggerUpdate } = useContext(ProjectUpdateContext);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
 

  useEffect(() => {
    if (!idUser) return;
    fetchProjects(idUser)
      .then(data => setProjects(data))
      .catch(err => setError(err.message));
  }, [idUser, updateCounter]);

  const handleSelect = (id) => setSelectedProjectId(id);

  const handleCreate = async () => {
    try {
        const data = await createProject(idUser);
        if (data.id_project) {
            setSelectedProjectId(data.id_project)
            triggerUpdate();
        }
    } catch(err) {
        setError(err.message)
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Paper elevation={3} 
            sx={{ 
                p: 4,
                minWidth: 350,
                textAlign: 'center',
                backgroundColor: 'background.custom',
                maxHeight: 500,       
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Typography variant="h5" sx={{ mb: 2 }}>Sélectionnez un projet</Typography>
                <List sx={{width: '100%', maxHeight: 320, overflowY: 'auto',   mb: 2,}}>
                {projects.length === 0 && (
                    <ListItem>
                    <ListItemText primary="Aucun projet, créez-en un !" />
                    </ListItem>
                )}

                {projects.map(proj => (
                    <ListItem key={proj.id_project} disablePadding>
                    <ListItemButton onClick={() => handleSelect(proj.id_project)}>
                        <FolderIcon sx={{ mr: 1 }} color='primary' />
                        <ListItemText primary={proj.nom_projet || <em>(Sans titre)</em>} secondary={proj.description}/>
                    </ListItemButton>
                    </ListItem>
                ))}
                </List>
            
            <Button onClick={handleCreate} variant="contained" color="primary" sx={{ mt: 3 }}>
                + Nouveau projet
            </Button>
        </Paper>
    </Box>
  );
}
