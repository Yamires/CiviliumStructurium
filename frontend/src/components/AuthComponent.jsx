import { Box, Paper, Alert, Button, Typography, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

export default function AuthComponent() {
  const { loginWithRedirect, isLoading, error } = useAuth0();

  if (isLoading) {
    return <CircularProgress />;
  }

 return (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
    <Paper elevation={3} sx={{p: 4, minWidth: 350, textAlign: 'center', backgroundColor: 'background.custom', maxHeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
      <Typography variant="h5" sx={{ mb: 2 }}>Connexion à l’application</Typography>
      <Button variant="contained" color="primary" sx={{ mt: 2, minWidth: 180 }} onClick={() => loginWithRedirect()}>
        Se connecter avec Auth0
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>}
    </Paper>
  </Box>
);
}