import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { useState } from "react";

export default function ProjetDialog({open, onClose, onConfirm}) {
    const [nom_projet, setNomProjet] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [prepare_par, setPreparePar] = useState('');

    const handleConfirm = () => {
        onConfirm({
            nom_projet,
            description,
            date,
            prepare_par
        });
        onClose();
    }   

    const handleClose = () => {
    
        setNomProjet('');
        setDescription('');
        setDate('');
        setPreparePar('');
        onClose();
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Nom du projet"
                    value={nom_projet}
                    onChange={(e) => setNomProjet(e.target.value)}
                    sx={{ mb: 1}}
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mb: 1}}
                /> 
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    sx={{ mb: 1}}
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Préparé par"
                    value={prepare_par}
                    onChange={(e) => setPreparePar(e.target.value)}
                    sx={{ mb: 1}}
                />  
                
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Annuler</Button>
                <Button onClick={handleConfirm} variant="contained" color="primary">Créer</Button>
            </DialogActions>
        </Dialog>
    );

}