import { useState } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, CircularProgress} from '@mui/material';
import SettingsIcon from "@mui/icons-material/Settings";
import { fetchConfig, saveConfig } from '../api/configApi';

export default function ConfigMenu() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState ({});
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleOpen = () => {
        setOpen(true);
        fetchConfig()
            .then(data => {
                setConfig(data);
                setForm(data);
            })
            .catch(err => alert("Erreur de chargement:" + err.message));
    };

    const handleChange = (event) => {
        setForm(f => ({...f, [event.target.name]: event.target.value}))
    };

    const handleClose = () => {
      setOpen(false)
    };

    const handleSave =  async () => {
        setLoading(true)
        try {
            const updatedConfig = await saveConfig(form)
            setConfig(updatedConfig);
            setOpen(false);
        } catch (err) {
            alert("Erreur de sauvegarde:" + err.message);
        } finally {
            setLoading(false)
        }
    };
    
    return (
        <> 
            <Button startIcon={<SettingsIcon />} onClick={handleOpen}></Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Configuration</DialogTitle>
                <DialogContent sx={{minWidth: 300}}>
                    {config && Object.entries(config).map(([key]) => (
                        <TextField key={key} label={key} name={key} value={form[key]} onChange={handleChange} margin="dense" fullWidth /> 
                    ))} 
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>Annuler</Button>
                    <Button onClick={handleSave} disabled={loading}>Enregistrer</Button>
                    {loading && <CircularProgress size={26}/>}
                </DialogActions>
            </Dialog>
        </>
    )
}