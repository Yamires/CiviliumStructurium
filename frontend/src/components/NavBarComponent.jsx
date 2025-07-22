import React, { useContext } from 'react';
import { AppBar, Toolbar, Box, Button } from '@mui/material';
import ProjectBrowser from './ProjectComponent'; 
import { AuthContext,ProjectContext } from '../App';
import ConfigMenu from './ConfigMenu';

export default function Navbar({ onConfigClick }) {
  const { user, setUser } = useContext(AuthContext);
  const {selectedProjectId, setSelectedProjectId} = useContext(ProjectContext)

  const handleLogout = () => {
    setUser(null);
    setSelectedProjectId(null);   
  };

  return (
    <Box sx={{ flexGrow:1, background: 'transparent'}}>
        <AppBar position="fixed" color="default" sx={{mb: 2, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)', boxShadow: 3,}} elevation={3}>
            <Toolbar>
                <Box sx={{flexGrow:1,}}>
                    {user && selectedProjectId && <ProjectBrowser />}
                </Box>
                <Box>
                    {user && (
                        <>
                            <Button variant="contained" color="error" onClick={handleLogout} sx={{ ml: 1 }}>
                                Déconnexion
                            </Button>
                            <ConfigMenu onClick={onConfigClick} />
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    </Box>
   
  );
}
