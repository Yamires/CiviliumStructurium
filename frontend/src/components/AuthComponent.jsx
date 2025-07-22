import { useState, useContext } from 'react';
import { Stack, Alert, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { AuthContext } from '../App';
import {login, signup} from '../api/authApi';

export default function AuthComponent() {
    const {user, setUser} = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try{ 
            const data = await login(username);
            setUser({id_user: data.id_user,username: data.username});
        } catch (e) {
            setError(e.message || "Erreur de connexion");
        } finally {
          setLoading(false);
        }
    };

    const handleSignup = async () => {
      setError('');
      setLoading(true);
      try {
          const data = await signup(username, email);
          setUser({id_user: data.id_user, username: data.username});
      } catch (e) {
          setError(e.message || "Erreur à l'inscription");
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (mode === 'login') {
          await handleLogin();
      } else {
          await handleSignup();
      }
    };


  return (
    <form onSubmit={handleSubmit}> 
      <Stack
        direction="column"
        spacing={2}
        sx={{ maxWidth: 350, mx: 'auto', my: 2, p: 2, border: 1, borderRadius: 2, borderColor: 'grey.300', backgroundColor:'background.custom', backdropFilter: 'blur(8px)', boxShadow: 3, }}
      >
        <Typography variant="h6"> {mode === 'login' ? 'Connexion' : 'Créer un compte'} </Typography>

        <TextField label="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} fullWidth/>
        {mode === 'signup' && (
          <TextField label="Email (optionnel)" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
        )}

        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="primary" onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}>
            {mode === 'login' ? 'Connexion' : 'Créer le compte'}
          </Button>
          <Button variant="text" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} disabled={loading} > 
              {mode === 'login' ? "Créer un compte" : "Déjà inscrit ?"}
          </Button>
          {loading && <CircularProgress size={26}/>}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </form>
  );
}

