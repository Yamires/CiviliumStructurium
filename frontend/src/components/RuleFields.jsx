import { Box, Button, TextField, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function RuleFields({ title, rows, onChange, formula = false }) {
  const update = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle1">{title}</Typography>
      {rows.map((row, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <TextField label={`${title} ${index + 1} — variable`} size="small" value={row.name} onChange={e => update(index, 'name', e.target.value)} sx={{ width: { xs: '100%', sm: 160 } }} />
          <TextField label={formula ? `Expression ${index + 1}` : `Libellé ${index + 1} (avec unités)`} size="small" fullWidth multiline={formula} value={formula ? row.expression : row.label} onChange={e => update(index, formula ? 'expression' : 'label', e.target.value)} />
          <IconButton aria-label={`Supprimer ${title.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
        </Box>
      ))}
      <Button onClick={() => onChange([...rows, formula ? { name: '', expression: '' } : { name: '', label: '' }])}>Ajouter — {title.toLowerCase()}</Button>
    </Box>
  );
}
