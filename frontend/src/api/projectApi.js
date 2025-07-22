

export async function fetchProjects(userId) {
  const res = await fetch(`http://localhost:5050/api/get_projects?id_user=${userId}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des projets');
  return res.json();
}

export async function createProject(user) {
  const body = {
    nom_projet: "",
    description: "",
    date: null,
    prepare_par: user.username,
    id_user: user.id_user,
  };
  const res = await fetch('http://localhost:5050/api/add_project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Erreur lors de la création du projet');
  return res.json();
}

export async function updateProject(fields, id_project) {
  const res = await fetch('http://localhost:5050/api/update_project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_project: id_project,
      nom_projet: fields.nom_projet,
      description: fields.description,
      date: fields.date,
      prepare_par: fields.prepare_par,
    }),
  });
  if (!res.ok) throw new Error('Erreur lors de la mise à jour du projet');
  return res.json();
}
