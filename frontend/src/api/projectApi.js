// src/api/projects.js
import { request } from './client';

export async function fetchProjects(userId) {
  return request(`/api/get_projects?id_user=${encodeURIComponent(userId)}`);
}

export async function createProject(idUser) {
  const body = {
    nom_projet: '',
    description: '',
    date: null,        
    prepare_par: '',
    id_user: idUser,
  };
  return request('/api/add_project', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProject(fields, id_project) {
  return request('/api/update_project', {
    method: 'POST',
    body: JSON.stringify({
      id_project,
      nom_projet: fields.nom_projet,
      description: fields.description,
      date: fields.date,          
      prepare_par: fields.prepare_par,
    }),
  });
}

export async function deleteProject(id_project) {
  return request(`/api/delete_project/${encodeURIComponent(id_project)}`, {
    method: 'DELETE',
  });
}
