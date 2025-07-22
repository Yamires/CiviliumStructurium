import React, { useState, useContext} from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { ProjectContext } from '../App';

export default function ExportComponent({columns = [], rows = [], defaultFileName = "export.xlsx", open, onClose}) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [selectedCols, setSelectedCols] = useState(columns.filter(col => col.field !== 'actions').map(col => col.field));
  const {selectedProjectId, setSelectedProjectId, projectData} = useContext(ProjectContext);

  useEffect(() => {
    if(open) setFileName(defaultFileName);
  }, [open, defaultFileName]);

  const handleColChange = (field) => {
    setSelectedCols(cols =>
      cols.includes(field)
        ? cols.filter(f => f !== field)
        : [...cols, field]
    );
  };

  const handleExport = () => {
    const exportCols = columns.filter(
      col => selectedCols.includes(col.field) && col.field !== "actions"
    );
    const exportRows = rows.map(row =>
      Object.fromEntries(
        exportCols.map(col => [
          col.headerName || col.field,
          row[col.field]
        ])
      )
    );

    const projectHeaderRows = [
      { [exportCols[0]?.headerName || exportCols[0]?.field || ""]: `Projet : ${projectData.nom_projet ?? ""}` },
      { [exportCols[0]?.headerName || exportCols[0]?.field || ""]: `Description : ${projectData.description ?? ""}` },
      { [exportCols[0]?.headerName || exportCols[0]?.field || ""]: `Date : ${projectData.date ?? ""}` },
      { [exportCols[0]?.headerName || exportCols[0]?.field || ""]: `Préparé par : ${projectData.prepare_par ?? ""}` },
      {}, 
    ];

    const worksheet = XLSX.utils.json_to_sheet(
      [...projectHeaderRows, ...exportRows],
      { skipHeader: false }
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

    const safeFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, safeFileName);
    setOpen(false);
  };

  return (    
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Exporter les données du projet</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1"><strong>Projet :</strong> {projectData.nom_projet || ""}</Typography>
            <Typography variant="body2"><strong>Description :</strong> {projectData.description || ""}</Typography>
            <Typography variant="body2"><strong>Date :</strong> {projectData.date || ""}</Typography>
            <Typography variant="body2"><strong>Préparé par :</strong> {projectData.prepare_par || ""}</Typography>
            <Divider sx={{ my: 1 }} />
            <TextField
              label="Nom du fichier Excel"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              fullWidth
              sx={{ my: 1 }}
              helperText="Le fichier sera exporté en format Excel (.xlsx)"
            />
          </Box>
          <FormGroup>
            {columns.filter(col => col.field !== 'actions').map(col => (
              <FormControlLabel
                key={col.field}
                control={
                  <Checkbox
                    checked={selectedCols.includes(col.field)}
                    onChange={() => handleColChange(col.field)}
                  />
                }
                label={col.headerName || col.field}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={selectedCols.length === 0 || !fileName}
          >
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
  );
}
