import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material';
import { getTemplate, saveTemplate, validateRules } from '../api/solverApi';
import RuleFields from './RuleFields';

const empty = () => ({ name: '', inputs: [], outputs: [], formulas: [] });

export default function RuleEditor({ onChanged }) {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState(null);
  const [original, setOriginal] = useState('');
  const [draft, setDraft] = useState(empty);
  const [samples, setSamples] = useState({});
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = values => { setDraft(d => ({ ...d, ...values })); setPreview(null); setError(''); };
  const choose = (name, source = doc) => {
    setOriginal(name);
    setDraft(name ? {
      name, inputs: structuredClone(source.calculationOptions[name]), outputs: structuredClone(source.resultsTemplate[name]),
      formulas: Object.entries(source.formules[name]).map(([name, expression]) => ({ name, expression })),
    } : empty());
    setSamples({}); setPreview(null); setError('');
  };
  const handleOpen = async () => {
    setOpen(true); setBusy(true); setError('');
    try { const data = await getTemplate(); setDoc(data); choose(Object.keys(data.formules)[0] || '', data); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const candidate = () => {
    const name = draft.name.trim();
    if (!name) throw new Error('Nom de méthode requis');
    if (name !== original && Object.hasOwn(doc.formules, name)) throw new Error('Ce nom de méthode existe déjà');
    if (new Set(draft.formulas.map(f => f.name)).size !== draft.formulas.length) throw new Error('Variables de formule dupliquées');
    const next = structuredClone(doc);
    for (const section of Object.values(next)) delete section[original];
    // defineProperty conserve les noms saisis comme données, même pour une clé réservée.
    const assign = (section, value) => Object.defineProperty(section, name, { value, enumerable: true, configurable: true, writable: true });
    assign(next.calculationOptions, draft.inputs);
    assign(next.resultsTemplate, draft.outputs);
    assign(next.formules, Object.fromEntries(draft.formulas.map(f => [f.name, f.expression])));
    return next;
  };
  const handleTest = async () => {
    setBusy(true); setError(''); setPreview(null);
    try {
      const result = await validateRules(candidate(), draft.name.trim(), Object.fromEntries(draft.inputs.map(f => [f.name, samples[f.name] ?? ''])));
      setPreview(result.results);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const handleSave = async () => {
    setBusy(true); setError('');
    try { await saveTemplate(candidate()); onChanged(); setOpen(false); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette méthode ? Les calculs déjà enregistrés seront conservés.')) return;
    setBusy(true); setError('');
    try {
      const next = structuredClone(doc);
      for (const section of Object.values(next)) delete section[original];
      await saveTemplate(next); setDoc(next); choose(''); onChanged();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <>
    <Button onClick={handleOpen}>Méthodes</Button>
    <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Calculs et formules</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {doc && <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
            <TextField select label="Méthode existante" value={original} onChange={e => choose(e.target.value)} sx={{ minWidth: 200, flex: 1 }} disabled={busy}>
              <MenuItem value="">Nouvelle méthode</MenuItem>
              {Object.keys(doc.formules).map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
            <Button disabled={!original || busy} onClick={() => { setOriginal(''); change({ name: draft.name + ' (copie)' }); }}>Dupliquer</Button>
            <Button disabled={!original || busy} color="error" onClick={handleDelete}>Supprimer</Button>
          </Box>
          <TextField fullWidth label="Nom de la méthode" value={draft.name} onChange={e => change({ name: e.target.value })} />
          <RuleFields title="Entrées" rows={draft.inputs} onChange={inputs => change({ inputs })} />
          <RuleFields title="Formules" rows={draft.formulas} onChange={formulas => change({ formulas })} formula />
          <Typography variant="body2">Opérations : +, -, *, /, **, Max, Min et Piecewise. Exemple : Piecewise((x**2, x &lt; 0), (x, True)). Les variables sont sensibles aux majuscules.</Typography>
          <RuleFields title="Résultats" rows={draft.outputs} onChange={outputs => change({ outputs })} />
          <Typography variant="subtitle1">Tester avec des valeurs</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
            {draft.inputs.map((field, i) => <TextField key={i} label={field.label || field.name || `Entrée ${i + 1}`} size="small" value={samples[field.name] ?? ''} onChange={e => { setSamples(s => ({ ...s, [field.name]: e.target.value })); setPreview(null); }} />)}
          </Box>
          <Button onClick={handleTest} disabled={busy}>Tester</Button>
          {preview && <Alert severity="success" sx={{ mt: 1 }}>Test réussi : {draft.outputs.map(f => `${f.label} = ${preview[f.name]}`).join(' ; ')}</Alert>}
        </>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={busy || !doc}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  </>;
}
