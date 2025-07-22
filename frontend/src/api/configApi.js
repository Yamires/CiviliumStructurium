

export async function fetchConfig() {
  const res = await fetch('http://localhost:5050/api/config');
  if (!res.ok) throw new Error('Erreur lors du chargement de la configuration');
  return res.json();
}

export async function saveConfig(config) {
  const res = await fetch('http://localhost:5050/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Erreur de sauvegarde');
  return res.json();
}
