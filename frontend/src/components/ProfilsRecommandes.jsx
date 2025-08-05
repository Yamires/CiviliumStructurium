import { useEffect, useState, useContext, useMemo} from 'react';
import { Typography, Button, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AuthContext, ProfilUpdateContext, ProjectContext, ProjectUpdateContext } from '../App';
import { saveProfilSelection } from '../api/profilsApi';
import {Dialog, DialogTitle, DialogContent, DialogActions, TextField} from '@mui/material';

export default function ProfilsRecommandes({ outputs, inputs, calculationType}) {
    const { selectedProjectId, setSelectedProjectId } = useContext(ProjectContext);
    const {triggerUpdateProfils} = useContext(ProfilUpdateContext);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: 'include',
        ids: new Set(),
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [axeNom, setAxeNom] = useState('');
    const [deA, setDeA] = useState('');

    const handleOpenDialog = () => {
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    }   

    const handleConfirm = () => {
        setOpenDialog(false);
        handleValider();
        setAxeNom('');
        setDeA('');
    }

    const profilsAvecId = (outputs.profils ?? []).map((profil, idx) => ({
        ...profil,
        id: idx,
    }));

    const selectedProfilId = rowSelectionModel.ids.size > 0 ? Array.from(rowSelectionModel.ids)[0]: null ; 

    const selectedProfil = profilsAvecId.find(
        row => row.id === selectedProfilId
    );

    const handleValider = async () => { 
        try {
            await saveProfilSelection({
                calculationType,
                inputs, 
                outputs: outputs.results, 
                selectedProfil, 
                id_project:selectedProjectId,
                axe: axeNom,
                de_a: deA
            });
            triggerUpdateProfils();
            alert('Profil sauvegardé');
        } catch (err) {
            alert('Erreur de sauvegarde');
        }
    };

    const allColumns = Object.keys(outputs.profils?.[0] || {})

    const columns = allColumns.map(key => ({
        field: key,
        headerName:key === 'Ds_m' ? 'Dimension' : key.replace(/_/g,'').replace(/^\w/, c => c.toUpperCase()),
        width: 120,
    }))

    const defaultColumns = ['Ds_m', 'Mr','Vr','Ix'];

    const columnVisibilityModel = allColumns.reduce((acc, column) => {
        acc[column] = defaultColumns.includes(column);
        return acc 
    }, {})

    return (
        <>
        <Grid>
            <Typography variant="h6" gutterBottom>Profils recommandés</Typography>
            <DataGrid
                key={JSON.stringify(defaultColumns)}
                columns={columns}
                rows={profilsAvecId}
                getRowId={row => row.id}
                initialState={{pagination:{paginationModel: {pageSize: 10}}}}
                pageSizeOptions={[10]}
                columnVisibilityModel={columnVisibilityModel}
                sx={{ height: 400, backgroundColor:'background.custom'}}
                checkboxSelection = {false}
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(newRowSelectionModel) => {
                  if (Array.isArray(newRowSelectionModel)) {
                    setRowSelectionModel({
                        type: 'include',
                        ids: new Set(newRowSelectionModel),
                    })
                  } else {
                    setRowSelectionModel(newRowSelectionModel);
                  }
                }}
                
            />
            <Button variant="contained" color="primary" disabled={!selectedProfil || profilsAvecId.length === 0} onClick={handleOpenDialog} sx={{mt:2}}>
                Valider Sélection 
            </Button>
        </Grid>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Valider la sélection</DialogTitle>
            <DialogContent>
                <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Nom de l'axe"
                value={axeNom}
                onChange={(e) => setAxeNom(e.target.value)}
                sx={{ mb: 1 }}
                />
                <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="De A"
                value={deA}
                onChange={(e) => setDeA(e.target.value)}
                sx={{ mb: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Annuler</Button>
                <Button onClick={handleConfirm} variant="contained" color="primary">Confirmer</Button>
            </DialogActions>
        </Dialog>

        </>                
    );
}
