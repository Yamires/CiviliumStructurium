
import { request } from './client';

export async function deleteProfil(id) {
  return request(`/api/delete_profil/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function updateProfil(id, updates) {
  const payload = {
    axe: updates.axe ?? null,
    de_a: updates.de_a ?? null,
    verif_mf: updates.verif_mf ?? null,
    verif_vf: updates.verif_vf ?? null,
    verif_i: updates.verif_i ?? null,
  };

  return request(`/api/update_profils/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfils(selectedProjectId) {
  return request(`/api/get_profils?id_project=${encodeURIComponent(selectedProjectId)}`);
}

export async function saveProfilSelection({ calculationType, inputs, outputs, selectedProfil, id_project, axe, de_a }) {
  const bodyData = {
    calculationType,
    inputs,
    outputs,
    selectedProfil,
    id_project,
    axe: axe || null,
    de_a: de_a || null,
  };

  return request('/api/save-selection', {
    method: 'POST',
    body: JSON.stringify(bodyData),
  });
}
