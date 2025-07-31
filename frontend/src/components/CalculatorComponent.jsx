import { useState, useEffect } from 'react';
import { Box, Button, Grid, InputLabel, MenuItem, FormControl, Select, TextField, Typography, Paper, Container, Table, TableBody, TableCell, TableRow, CircularProgress } from '@mui/material';
import ProfilsRecommandes from './ProfilsRecommandes';
import {getTemplate, solve} from '../api/solverApi';

export default function CalculatorComponent({ onCalculate }) {

  const [template, setTemplate] = useState(null);
  const [calculationOptions, setCalculationOptions] = useState({});
  const [resultsTemplate, setResultsTemplate] = useState({});
  const [calculationType, setCalculationType] = useState('');
  const [inputs, setInputs] = useState({});
  const [outputs, setOutputs] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState (false);

  useEffect(() => {
    setLoading(true);
    getTemplate()
      .then(data => {
        setTemplate(data);
        setCalculationOptions(data.calculationOptions);
        setResultsTemplate(data.resultsTemplate);
      })
      .catch(err => {
        setError('Erreur lors du chargement du template');
        console.error(err);
      })
      .finally(() => { 
        setLoading(false);
      });    
  }, []);

  const handleUpdateEq = (event) => {
    const eq = event.target.value;
    setCalculationType(eq);

    if (calculationOptions[eq]) {
      const emptyInputs = {};
      calculationOptions[eq].forEach(field => { emptyInputs[field.name] = '';});
      setInputs(emptyInputs);
      setOutputs({})
    } else {
      setInputs({});
      setOutputs({})
    }
  };
    
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInputs({ ...inputs, [name]: value });
  };
  
  const handleClickCalculer = async () => {
    setLoading(true);
    setError(null);
    try {
      const inputsFields = calculationOptions[calculationType];
      const inputsValues = {};
      let hasNaN = false; 

      inputsFields.forEach(field => {
        const val = inputs[field.name];
        const numVal = parseFloat(val);

        if (val === "" || Number.isNaN(numVal)) {
          hasNaN = true;
          console.error(`Doit être un nombre: ${field.name} = ${val}`);
        }
        inputsValues[field.name] = numVal; 
      });

      if(hasNaN) {
        throw new Error("Tous les champs doivent être des nombres");
      }

      const data = await solve({ methode: calculationType, inputs: inputs });
      setOutputs(data);
  
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors du calcul.' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Paper elevation={3} 
      sx={{  width: { xs: '65%', sm: '75%', md: '85%', lg: '95%' },
      mx: 'auto',
      my: 6,
      borderRadius: 4,
      boxShadow: 6,
      backgroundColor: 'background.custom',
      backdropFilter: 'blur(8px)',
      boxShadow: 3,
      p: 3,}}>
      <Container maxWidth={false} sx={{p: 3}}>
        <Grid container sx={{display: 'grid',gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' },gap: 4,}}>
          
          {/* Section droite */}
          <Grid>
            <Typography variant="h6" gutterBottom> Inputs </Typography>
            <Box component="form" noValidate autoComplete="off" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <FormControl fullWidth sx={{ gridColumn: { xs: 'span 1', md: 'span 2', lg: 'span 2' } }}>
                <InputLabel>Choisir une méthode </InputLabel>
                <Select labelId="select-calcul-label" value={calculationType} label="Choisir un calcul" onChange={handleUpdateEq}>
                  <MenuItem value=""><em>Aucun</em></MenuItem>
                  {Object.keys(calculationOptions).map((key) => (<MenuItem key={key} value={key}>{key}</MenuItem>))}
                </Select>
              </FormControl>
              
              {calculationType && calculationOptions[calculationType].map((field) => (
                  <TextField 
                  key={field.name} 
                  fullWidth label={field.label} 
                  name={field.name} 
                  value={inputs[field.name] || ''}
                  onChange={handleInputChange} 
                  variant="outlined" />
                ))}

              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2', lg: 'span 2' }, textAlign: 'right', mt: 1 }}>
                <Button variant="contained" color="primary" disabled={!calculationType || loading} onClick={handleClickCalculer} >
                  Calculer
                </Button>
                {loading && <CircularProgress size={26}/>}
              </Box>
            </Box>
          </Grid>


          {/* Section milieu */}
          <Grid>
            <Typography variant="h6" gutterBottom>Résultats</Typography>
            <Table sx={{mb:3}}>
              <TableBody>
                {resultsTemplate[calculationType]?.map((field)=>
                <TableRow key={field.name}>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                      {outputs.results?.[field.name] !== undefined && outputs.results?.[field.name] !== null? outputs.results[field.name]: ''}
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          </Grid> 

          <ProfilsRecommandes outputs={outputs} inputs={inputs} calculationType={calculationType}/> 
        </Grid>
      </Container>
    </Paper>
  );
}
