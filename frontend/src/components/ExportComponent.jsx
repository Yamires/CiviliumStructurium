import React, { useState, useContext, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, TextField, Typography, Divider, Box } from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload'; 
import { ProjectContext } from '../App';

export default function ExportComponent({ columns = [], rows = [], defaultFileName = "export.xlsx" , columnVisibilityModel}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(defaultFileName);
  const [selectedCols, setSelectedCols] = useState(columns.filter(col => col.field !== 'actions').map(col => col.field));
  const { projectData } = useContext(ProjectContext);
  const [editableProjectData, setEditableProjectData] = useState({
    nom_projet:  "",
    description:  "",
    date:  "",
    prepare_par:  ""
  });

  useEffect(() => {
    if (open) {
      const _fileName = projectData.nom_projet 
        ? `${projectData.nom_projet}.xlsx`
        : defaultFileName; 
      setFileName(_fileName);

      setEditableProjectData({
        nom_projet: projectData.nom_projet || "",
        description: projectData.description || "",
        date: projectData.date || "",
        prepare_par: projectData.prepare_par || ""
      });
    }
      setSelectedCols(
        columns.filter(col => 
            col.field !== 'actions' && 
            (columnVisibilityModel[col.field] === undefined || columnVisibilityModel[col.field]))
            .map(col => col.field));
   }, [open, defaultFileName, columns, columnVisibilityModel, projectData]);

  const handleColChange = (field) => {
    setSelectedCols(cols =>
      cols.includes(field)
        ? cols.filter(f => f !== field)
        : [...cols, field]
    );
  };

  const handleProjectFieldChange = (field, value) => {
    setEditableProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleExport = () => {
    const exportCols = columns.filter(
      col => selectedCols.includes(col.field) && col.field !== "actions"
    );
    const colHeaders = exportCols.map(col => col.headerName || col.field);
    const exportRows = rows.map(row => exportCols.map(col => row[col.field]));

    const projectHeaderRows = [
      [`Projet : ${editableProjectData.nom_projet ?? ""}`],
      [`Description : ${editableProjectData.description ?? ""}`],
      [`Date : ${editableProjectData.date ?? ""}`],
      [`Préparé par : ${editableProjectData.prepare_par ?? ""}`],
      [],
    ];

    const sheetData = [
      ...projectHeaderRows,
      colHeaders,
      ...exportRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    const safeFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, safeFileName);
    setOpen(false);
  }


  return (
    <>
      <Button startIcon={<FileDownloadIcon />} onClick={() => setOpen(true)}/>
    
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Exporter les données du projet</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ mb:2 }}>
            <Typography variant="subtitle1" component="label" sx={{fontWeight:"bold", display:"block", mb: 0.5}}>Projet</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editableProjectData.nom_projet}
              onChange={(e) => handleProjectFieldChange('nom_projet', e.target.value)}
              placeholder='Nom du projet'
              sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ mb:2 }}>
            <Typography variant="subtitle1" component="label" sx={{fontWeight:"bold", display:"block", mb: 0.5}}>Description : </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editableProjectData.description}
              onChange={(e) => handleProjectFieldChange('description', e.target.value)}
              placeholder='Decription'
              sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ mb:2 }}>
            <Typography variant="subtitle1" component="label" sx={{fontWeight:"bold", display:"block", mb: 0.5}}>Date : </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editableProjectData.date}
              onChange={(e) => handleProjectFieldChange('date', e.target.value)}
              placeholder='Date'
              sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ mb:2 }}>
            <Typography variant="subtitle1" component="label" sx={{fontWeight:"bold", display:"block", mb: 0.5}}>Préparé par : </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editableProjectData.prepare_par}
              onChange={(e) => handleProjectFieldChange('prepare_par', e.target.value)}
              placeholder='Prepare par'
              sx={{ mb: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <TextField 
              label="Nom du fichier Excel" 
              value={fileName} 
              onChange={e => setFileName(e.target.value)} 
              fullWidth sx={{ my: 1 }} 
              helperText="Le fichier sera exporté en format Excel (.xlsx)"/>
          </Box>
          <FormGroup>
            {columns.filter(col => col.field !== 'actions').map(col => (
              <FormControlLabel
                key={col.field}
                control={
                  <Checkbox checked={selectedCols.includes(col.field)} onChange={() => handleColChange(col.field)}/>
                }
                label={col.headerName || col.field}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleExport} variant="contained" disabled={selectedCols.length === 0 || !fileName}>
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

