import { request } from './client';

export function solve({ methode, inputs }, signal) {
  return request('/api/solver', { method: 'POST', body: JSON.stringify({ methode, inputs }), signal });
}

export function getTemplate() { return request('/api/getTemplate'); }
export function saveTemplate(template) {
  return request('/api/templates', { method: 'PUT', body: JSON.stringify(template) });
}
export function validateRules(template, methode, inputs) {
  return request('/api/templates/validate', { method: 'POST', body: JSON.stringify({ template, methode, inputs }) });
}
