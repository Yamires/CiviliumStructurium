

export async function solve({ methode, inputs }) {
  const response = await fetch("http://localhost:5050/api/solver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ methode, inputs }),
  });

  if (!response.ok) throw new Error("Erreur API backend");

  try {
    return await response.json();
  } catch (e) {
    throw new Error("Le backend n’a pas renvoyé de JSON valide.");
  }
}

export async function getTemplate() {
  const res = await fetch('http://localhost:5050/api/getTemplate');
  if (!res.ok) {
    throw new Error('Erreur lors du chargement du template');
  }
  return await res.json();
}
