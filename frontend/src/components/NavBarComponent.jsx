import React, { useState, useContext } from 'react';
import { AppBar, Toolbar, Box, Button } from '@mui/material';
import ProjectBrowser from './ProjectComponent'; 
import { AuthContext,ProjectContext } from '../App';
import ConfigMenu from './ConfigMenu';
import { useAuth0 } from '@auth0/auth0-react';
import ExportComponent from './ExportComponent';

export default function Navbar({ onConfigClick, columns, rows, columnVisibilityModel}) {
  const {user, idUser} = useContext(AuthContext);
  const {selectedProjectId, setSelectedProjectId} = useContext(ProjectContext)
  const {logout} = useAuth0();

  const handleLogout = () => {
    setSelectedProjectId(null);   
    logout({logoutParams: { returnTo: window.location.origin }});
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
                            <ConfigMenu onClick={onConfigClick} />
                            <ExportComponent columns={columns} rows={rows} defaultFileName="export.xlsx" columnVisibilityModel={columnVisibilityModel} />
                            <Button variant="contained" color="error" onClick={handleLogout} sx={{ ml: 1 }}>
                                Déconnexion
                            </Button>
                            
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    </Box>
   
  );
}
