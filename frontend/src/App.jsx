import { useState } from 'react';
import { Alert, Box, Container } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Navbar from './components/NavBarComponent';
import ProjectBarComponent from './components/ProjectBarComponent';
import CalculatorComponent from './components/CalculatorComponent';
import DataTableComponent from './components/DataTableComponent';
import ProjectSelector from './components/ProjectSelectorComponent';
import { ProjectContext, ProjectUpdateContext, ProfilUpdateContext } from './contexts';
import { DEMO } from './api/client';
import image from './assets/refargotohp-RFCFhhl3xfQ-unsplash.jpg';
import theme from './helpers/theme';

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState({ nom_projet: '', id_project: '', description: '', date: '', prepare_par: '' });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [updateCounter, setUpdateCounter] = useState(0);
  const [updateProfils, setUpdateProfils] = useState(0);
  const [revision, setRevision] = useState(0);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const triggerUpdate = () => setUpdateCounter(k => k + 1);
  const triggerUpdateProfils = () => setUpdateProfils(k => k + 1);
  return <ThemeProvider theme={theme}>
    <ProjectContext value={{ selectedProjectId, setSelectedProjectId, projectData, setProjectData }}>
      <ProjectUpdateContext value={{ updateCounter, triggerUpdate }}>
        <ProfilUpdateContext value={{ updateProfils, triggerUpdateProfils }}>
          <Box sx={{ position: 'fixed', inset: 0, zIndex: -1, backgroundImage: `url(${image})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
          <Navbar columns={columns} rows={rows} columnVisibilityModel={columnVisibilityModel} onChanged={() => setRevision(r => r + 1)} />
          <Container maxWidth={false} sx={{ pt: { xs: 18, sm: 12 }, pb: 4 }}>
            {DEMO && <Alert severity="info">Démo dans le navigateur. Les profilés initiaux sont fictifs. Votre dataset importé reste dans ce navigateur jusqu’à la fermeture de la page.</Alert>}
            {!DEMO && !selectedProjectId && <ProjectSelector />}
            {(DEMO || selectedProjectId) && <>
              {!DEMO && <ProjectBarComponent />}
              <CalculatorComponent key={`${revision}-${selectedProjectId}`} />
              {!DEMO && <DataTableComponent columns={columns} setColumns={setColumns} rows={rows} setRows={setRows}
                columnVisibilityModel={columnVisibilityModel} setColumnVisibilityModel={setColumnVisibilityModel} />}
            </>}
          </Container>
        </ProfilUpdateContext>
      </ProjectUpdateContext>
    </ProjectContext>
  </ThemeProvider>;
}
