import React, { useState, createContext, useEffect } from "react";
import { Container, Box } from '@mui/material';
import { ThemeProvider } from "@mui/material/styles";
import Navbar from "./components/NavBarComponent";
import AuthComponent from "./components/AuthComponent";
import ProjectBarComponent from "./components/ProjectBarComponent";
import CalculatorComponent from './components/CalculatorComponent';
import DataTableComponent from './components/DataTableComponent';
import ProjectSelector from "./components/ProjectSelectorComponent";
import image from "./assets/refargotohp-RFCFhhl3xfQ-unsplash.jpg";
import theme from "./helpers/theme";
import { useAuth0 } from "@auth0/auth0-react";
import { syncUserApi } from "./api/authApi";

export const AuthContext = createContext();
export const ProjectContext = createContext();
export const ProjectUpdateContext = createContext();
export const ProfilUpdateContext = createContext();

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth0(); 
  const [idUser, setIdUser] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [projectData, setProjectData] = useState({
    nom_projet: "",
    id_project: "",
    description: "",
    date: "",
    prepare_par: "",
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [updateProfils, setUpdateProfils] = useState(0);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const triggerUpdate = () => setUpdateCounter(k => k + 1);
  const triggerUpdateProfils = () => setUpdateProfils(k => k + 1);

  useEffect(() => {
    async function syncUser() {
      if (isAuthenticated && user) {
        try {
          const data = await syncUserApi(user);
          setIdUser(data.id_user);
        }catch (error) {
          console.error(error);
        }
      }
    }
    syncUser();
  }, [isAuthenticated, user]);

  return (
    <ThemeProvider theme={theme}>
      <AuthContext value={{ user, idUser}}>
        <ProjectContext value={{ selectedProjectId, setSelectedProjectId, projectData, setProjectData }}>
          <ProjectUpdateContext value={{ updateCounter, triggerUpdate }}>
            <ProfilUpdateContext value={{ updateProfils, triggerUpdateProfils }}>

              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: -1,
                  backgroundImage: `url(${image})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                }}
              />

              <Navbar 
                onConfigClick={() => setConfigOpen(true)} 
                columns={columns} rows={rows} 
                columnVisibilityModel={columnVisibilityModel} 
              />

              <Container
                maxWidth={false}
                disableGutters
                sx={{
                  width: '100vw',
                  minHeight: '100vh',
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  overflowX: 'hidden',
                  paddingTop: { xs: '56px', sm: '64px' },
                }}
              >
                {!user && <AuthComponent />}
                {user && (
                  <>
                    {!selectedProjectId && <ProjectSelector />}
                    {selectedProjectId && (
                      <>
                        <ProjectBarComponent />
                        <CalculatorComponent />
                        <DataTableComponent 
                            columns={columns} 
                            setColumns={setColumns} 
                            rows={rows} setRows={setRows} 
                            columnVisibilityModel={columnVisibilityModel} 
                            setColumnVisibilityModel={setColumnVisibilityModel} 
                        />
                      </>
                    )}
                  </>
                )}
              </Container>

            </ProfilUpdateContext>
          </ProjectUpdateContext>
        </ProjectContext>
      </AuthContext>
    </ThemeProvider>
  );
}
