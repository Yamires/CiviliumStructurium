import React, {useState, useEffect, useContext} from 'react';
import {AuthContext, ProjectContext, ProjectUpdateContext} from '../App';
import {Box, Drawer, List, ListItem, ListItemButton, ListItemText, IconButton, Typography, Button, Divider,} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import { createProject, fetchProjects} from '../api/projectApi';
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteProject } from '../api/projectApi';

export default function ProjectBrowser() {
  const {user, idUser} = useContext(AuthContext);
  const {selectedProjectId, setSelectedProjectId} = useContext(ProjectContext);
  const {updateCounter, triggerUpdate} = useContext(ProjectUpdateContext);
  const [projects, setProjects] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(false)

  useEffect(() => {
      if (!idUser) return;
      fetchProjects(idUser)
        .then(data => setProjects(data))
        .catch(err => setError(err.message));
  }, [idUser, updateCounter]);

  const handleCreateProject = async () => {
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

  if (!user) return null;

  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleProjectSelect = (id) => {
    setSelectedProjectId(id);
    handleDrawerClose();
  };


  const handleDetete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return; 
    try {
        await deleteProject(id);
        triggerUpdate();
    } catch(err) {
        setError(err.message);
    }
  }



  const currentProject = projects.find(proj => proj.id_project === selectedProjectId);

  return (
    <Box sx={{display:'flex', alignItems:'center', gap:2,flexWrap:'wrap',height:'64px' }}>
        <IconButton size="large" color="primary" onClick={handleDrawerOpen} sx={{height: 40, width: 40,}}>
          <MenuIcon />
        </IconButton>
        <Typography sx={{ minWidth: 60 }} variant="body1" color="text.primary">
          {currentProject ? (currentProject.nom_projet || <em>(Sans titre)</em>) : null }
        </Typography>

        <Button variant="contained" color="primary" onClick={handleCreateProject} sx={{ml:1}}> + Nouveau projet </Button>
     
        <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerClose} slotProps={{paper: {sx: {width: 300, backgroundColor: 'background.custom', boxShadow: 3,} }}}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom> Mes projets </Typography>
            <Divider sx={{ mb: 1 }} />
            <List>
              {projects.length === 0 && (
                <ListItem>
                  <ListItemText primary="Aucun projet associé" />
                </ListItem>
              )}

              {projects.map(proj => (
                <ListItem key={proj.id_project} disablePadding selected={selectedProjectId === proj.id_project}
                secondaryAction={
                        <Button onClick= {() => handleDetete(proj.id_project)} color="error" size="small" sx={{minWidth:0, ml: 1 }}>
                            <DeleteIcon />
                        </Button>
                    }>
                  <ListItemButton onClick={() => handleProjectSelect(proj.id_project)}>
                    <FolderIcon sx={{ mr: 1 }} color={selectedProjectId === proj.id_project ? "primary" : "disabled"} />
                    <ListItemText primary={proj.nom_projet || <em>(Sans titre)</em>} secondary={proj.description}/>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
    </Box>
  );
}
