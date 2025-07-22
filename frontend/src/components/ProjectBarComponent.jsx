import React, { useState, useEffect, useContext } from 'react';
import { ProjectContext, AuthContext, ProjectUpdateContext } from '../App';
import { Box, Stack, TextField, Typography, Button, Paper } from '@mui/material';
import { fetchProjects, updateProject } from '../api/projectApi';


function makeFields(project, selectedProjectId, user) {
    return {
        nom_projet: project?.nom_projet || "",
        id_project: project?.id_project || selectedProjectId,
        description: project?.description || "",
        date: project?.date || "",
        prepare_par: project?.prepare_par || (user ? user.username : ""),
    };
}

export default function ProjectBarComponent() {
    const { selectedProjectId, projectData, setProjectData } = useContext(ProjectContext);
    const { user } = useContext(AuthContext);
    const {triggerUpdate} = useContext(ProjectUpdateContext)
    const [message, setMessage] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedProjectId || !user) return;
        fetchProjects(user.id_user)
            .then(data => {
                const project = data.find(p => Number(p.id_project) === Number(selectedProjectId) || null);
                setProjectData(makeFields(project, selectedProjectId, user))
            })
            .catch(err => setError(err.message))
    }, [selectedProjectId, user, setProjectData]);

    const handleFieldChange = e => {
        const { name, value } = e.target;
        setProjectData(f => ({ ...f, [name]: value }));
    };

    const handleSave = async () => {
        setMessage("");
        try {
            await updateProject(projectData, selectedProjectId)
            setMessage("Projet enregistré !");
            triggerUpdate();
        } catch (err) {
            setError(err.message || "Erreur d'enregistrement");
        }
    };

    return (
        <Box sx={{width: '100%', display: 'flex',justifyContent: 'center', alignItems: 'center', my: 4, }}>
            <Paper elevation={3} sx={{width: { xs: '100%', sm: '90%', md: '80%', lg: '60%' }, backgroundColor: 'background.custom',py: 3, px: 2, boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ width: '100%' }}>

                <TextField label="Projet" name="nom_projet" value={projectData.nom_projet} onChange={handleFieldChange} variant="outlined"sx={{ minWidth: 160 }}/>
                <TextField label="No. projet" name="id_project" value={projectData.id_project} disabled variant="outlined" sx={{ width: 100 }} />
                <TextField label="Description" name="description" value={projectData.description} onChange={handleFieldChange} variant="outlined" sx={{ minWidth: 220 }}/>
                <TextField label="Date" name="date" type="date" value={projectData.date || ""} onChange={handleFieldChange} sx={{ width: 160 }} />
                <TextField label="Préparé par" name="prepare_par" value={projectData.prepare_par} onChange={handleFieldChange} variant="outlined" sx={{ minWidth: 140 }}/>
                <Button onClick={handleSave} variant="contained" disabled={false} sx={{ minWidth: 120 }}> Enregistrer </Button>

            </Stack> {message && (
                <Typography variant="body2" color={message.includes("Erreur") ? "error" : "success.main"} sx={{ mt: 2 }}> {message} </Typography>
            )}
            </Paper>
        </Box>
        );
    }