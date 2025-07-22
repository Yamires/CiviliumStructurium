import * as React from 'react';
import { useState, useEffect, useContext, useCallback} from 'react';
import { DataGrid, Toolbar } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { Typography, Button, Box } from '@mui/material';
import { AuthContext, ProfilUpdateContext, ProjectContext, ProjectUpdateContext } from '../App';
import { deleteProfil, updateProfil, getProfils } from '../api/profilsApi';
import {defaultColumns, flattenProfil, autoColumns} from '../helpers/profilsTableHelpers'
import ExportComponent from './ExportComponent';
import IosShareIcon from '@mui/icons-material/IosShare';

export default function DataTableComponent() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState(defaultColumns);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const {selectedProjectId, setSelectedProjectId, projectData} = useContext(ProjectContext);
  const {updateProfils, setUpdateProfils} = useContext(ProfilUpdateContext)

  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const updates = {
        axe: newRow.axe,
        de_a: newRow.de_a,
        verif_mf: newRow.verif_mf,
        verif_vf: newRow.verif_vf,
        verif_i: newRow.verif_i
      };
      await handleUpdate(newRow.id, updates);
      return { ...oldRow, ...updates };
    }, []
  );

  const deleteColumn = {
    field:'actions',
    headerName: '',
    width: 50,
    sortable: false,
    renderCell: (params) => (
      <IconButton
        color="error"
        onClick={async (e) => {
          e.stopPropagation();
          await handleDelete(params.row.id);
          setRows(rows => rows.filter(r => r.id !== params.row.id));
        }}
        size="small"
        >
          <DeleteIcon />
        </IconButton>
    )
  };

  const handleDelete = async (id) => {
    try {
      await deleteProfil(id);
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdate = async (id, updates) => {
    try {
      await updateProfil(id, updates)
    } catch (err) {
      alert(err.message)
    }
  };

  function CustomToolbar({columns, rows, defaultFileName}) {
    const [openExport, SetOpenExport] = useState(false);
    return (
     <Box sx={{p: 1, display: 'flex', alignItems:'center'}}>
      <Button variant="outlined" size = "small" startIcon={<IosShareIcon/>} onClick={() => SetOpenExport(true)}>
        Exporter
      </Button>
      <ExportComponent columns={columns} rows={rows} defaultFileName={defaultFileName} open={openExport} onClose={() => SetOpenExport(false)}/>
     </Box>
    )
  }

  console.log("update", updateProfils)

  useEffect(() => { 
    async function fetchProfils() { 
      try {
        const data = await getProfils(selectedProjectId);
        const flatRows = data.map(flattenProfil);
        setRows(flatRows);

        const allColumns = autoColumns(flatRows);
        setColumns([...allColumns, deleteColumn]);
        const model = {};
        allColumns.forEach(col => {
          model[col.field] = defaultColumns.some(def => def.field === col.field);
        });
        setColumnVisibilityModel(model);
      } catch (err) {
        alert("Erreur de chargement:" + err.message);
      }
    }
    fetchProfils(); 
  }, [selectedProjectId, updateProfils]); 


  return (
    <>
      <DataGrid
        rows={rows}
        columns={columns}
        slots={{toolbar: () => <CustomToolbar columns={columns} rows={rows} 
        defaultFileName={projectData.nom_projet 
          ? `{projectData.nom_projet}_profils.xlsx` 
          : "export.xlsx"}/> }}
        getRowId={row => Number(row.id)}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
        disableSelectionOnClick
        processRowUpdate={processRowUpdate}
        elevation={3}
        sx={{ height: 400,  width: { xs: '65%', sm: '75%', md: '85%', lg: '98%' },
        mx: 'auto',
        my: 6,
        borderRadius: 4,
        boxShadow: 6,
        backgroundColor: 'background.custom',
        p: 3,}}
      />
    </>
  );
}
