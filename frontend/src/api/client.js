export const DEMO = import.meta.env.MODE === 'demo';

export async function request(path, options = {}) {
  if (DEMO) {
    const { demoRequest } = await import('./demoApi.js');
    return demoRequest(path, options);
  }
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
