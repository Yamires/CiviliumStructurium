
import { request } from './client';

export async function fetchConfig() {
  return request('/api/config');
}

export async function saveConfig(config) {
  return request('/api/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}
