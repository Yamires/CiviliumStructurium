
import { request } from './client';

export async function solve({ methode, inputs }) {
  return request('/api/solver', {
    method: 'POST',
    body: JSON.stringify({ methode, inputs }),
  });
}

export async function getTemplate() {
  return request('/api/getTemplate');
}

