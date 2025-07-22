

export async function deleteProfil(id) {
  const res = await fetch(`http://localhost:5050/api/delete_profil/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erreur à la suppression");
  return res.json();
}

export async function updateProfil(id, updates) {
  const res = await fetch(`http://localhost:5050/api/update_profils/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Erreur de mise à jour");
  return res.json();
}

export async function getProfils(selectedProjectId) {
  const res = await fetch(`http://localhost:5050/api/get_profils?id_project=${selectedProjectId}`);
  if (!res.ok) throw new Error("Erreur de chargement des profils");
  return res.json();
}

export async function saveProfilSelection({calculationType, inputs, outputs, selectedProfil, id_project}) {
  const bodyData = {
    calculationType,
    inputs,
    outputs,
    selectedProfil,
    id_project
  };
  const res = await fetch('http://localhost:5050/api/save-selection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData),
  });
  if (!res.ok) throw new Error('Erreur du serveur');
  return res.json();
}
