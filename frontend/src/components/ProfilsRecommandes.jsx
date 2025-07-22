import { useEffect, useState, useContext, useMemo} from 'react';
import { Typography, Button, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AuthContext, ProfilUpdateContext, ProjectContext, ProjectUpdateContext } from '../App';
import { saveProfilSelection } from '../api/profilsApi';

export default function ProfilsRecommandes({ outputs, inputs, calculationType}) {
    const { selectedProjectId, setSelectedProjectId } = useContext(ProjectContext);
    const {triggerUpdateProfils} = useContext(ProfilUpdateContext);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: 'include',
        ids: new Set(),
    });

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
                id_project:selectedProjectId
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
            <Button variant="contained" color="primary" disabled={!selectedProfil || profilsAvecId.length === 0} onClick={handleValider} sx={{mt:2}}>
                Valider Sélection 
            </Button>
        </Grid>
    );
}
