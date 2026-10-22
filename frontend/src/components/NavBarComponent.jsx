import { useContext } from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';
import ProjectBrowser from './ProjectComponent';
import { ProjectContext } from '../contexts';
import ConfigMenu from './ConfigMenu';
import ExportComponent from './ExportComponent';
import RuleEditor from './RuleEditor';
import DatasetImport from './DatasetImport';
import { DEMO } from '../api/client';

export default function Navbar({ columns, rows, columnVisibilityModel, onChanged }) {
  const { selectedProjectId } = useContext(ProjectContext);
  return <AppBar position="fixed" color="default" sx={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
    <Toolbar sx={{ flexWrap: 'wrap', py: 1, gap: 1 }}>
      <Box sx={{ flexGrow: 1 }}>{!DEMO && selectedProjectId ? <ProjectBrowser /> : <Typography component="h1" variant="h6">Civilium Structurium</Typography>}</Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <DatasetImport onChanged={onChanged} />
        <RuleEditor onChanged={onChanged} />
        <ConfigMenu onChanged={onChanged} />
        {!DEMO && selectedProjectId && <ExportComponent columns={columns} rows={rows} columnVisibilityModel={columnVisibilityModel} />}
      </Box>
    </Toolbar>
  </AppBar>;
}
