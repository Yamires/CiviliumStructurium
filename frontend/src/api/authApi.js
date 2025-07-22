

export async function login(username) {
  const res = await fetch('http://localhost:5050/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Identifiant invalide");
  return res.json(); 
}

export async function signup(username, email) {
  const res = await fetch('http://localhost:5050/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email }),
  });
  if (!res.ok) throw new Error("Utilisateur invalide");
  return res.json(); 
}
