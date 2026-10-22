import { useState, useEffect, useRef } from 'react';
import { Alert, Box, Button, MenuItem, TextField, Typography, Paper, Table, TableBody, TableCell, TableRow, CircularProgress } from '@mui/material';
import ProfilsRecommandes from './ProfilsRecommandes';
import { getTemplate, solve } from '../api/solverApi';
import { number } from '../helpers/rules';

export default function CalculatorComponent() {
  const [template, setTemplate] = useState(null);
  const [method, setMethod] = useState('');
  const [inputs, setInputs] = useState({});
  const [outputs, setOutputs] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const controller = useRef(null);

  useEffect(() => {
    let active = true;
    getTemplate().then(data => { if (active) setTemplate(data); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; controller.current?.abort(); };
  }, []);

  const reset = () => {
    controller.current?.abort(); controller.current = null;
    setLoading(false); setOutputs({}); setError('');
  };
  const handleMethod = event => {
    reset(); setMethod(event.target.value);
    setInputs(Object.fromEntries((template.calculationOptions[event.target.value] || []).map(f => [f.name, ''])));
  };
  const handleCalculate = async event => {
    event.preventDefault(); reset(); setLoading(true);
    const run = new AbortController(); controller.current = run;
    try {
      const values = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, number(value)]));
      const data = await solve({ methode: method, inputs: values }, run.signal);
      if (!run.signal.aborted) setOutputs(data);
    } catch (err) { if (!run.signal.aborted) setError(err.message); }
    finally { if (!run.signal.aborted) setLoading(false); }
  };

  return <Paper elevation={3} sx={{ mx: 'auto', my: 4, borderRadius: 4, backgroundColor: 'background.custom', p: { xs: 2, md: 3 } }}>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {outputs.message && <Alert severity="info" sx={{ mb: 2 }}>{outputs.message}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1.5fr' }, gap: 4 }}>
      <Box component="form" onSubmit={handleCalculate}>
        <Typography component="h2" variant="h6" gutterBottom>Entrées</Typography>
        <TextField select fullWidth label="Choisir une méthode" value={method} onChange={handleMethod} sx={{ mb: 2 }}>
          <MenuItem value="">Aucune</MenuItem>
          {Object.keys(template?.calculationOptions || {}).map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </TextField>
        {!template && !error && <Typography role="status">Chargement des méthodes…</Typography>}
        {template && !Object.keys(template.formules).length && <Typography>Ajoutez une méthode dans le menu Méthodes.</Typography>}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2 }}>
          {(template?.calculationOptions[method] || []).map(field => <TextField key={field.name} label={field.label} name={field.name} value={inputs[field.name] ?? ''}
            onChange={e => { reset(); setInputs(current => ({ ...current, [field.name]: e.target.value })); }} />)}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <Button type="submit" variant="contained" disabled={!method || loading}>Calculer</Button>
          {loading && <><CircularProgress size={24} aria-label="Calcul en cours" /><Button onClick={reset}>Annuler le calcul</Button></>}
        </Box>
      </Box>
      <Box>
        <Typography component="h2" variant="h6" gutterBottom>Résultats</Typography>
        <Table><TableBody>{(template?.resultsTemplate[method] || []).map(field => <TableRow key={field.name}>
          <TableCell>{field.label}</TableCell><TableCell>{outputs.results?.[field.name] ?? ''}</TableCell>
        </TableRow>)}</TableBody></Table>
      </Box>
      <ProfilsRecommandes outputs={outputs} inputs={inputs} calculationType={method} />
    </Box>
  </Paper>;
}
