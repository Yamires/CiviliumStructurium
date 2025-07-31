
export const API_BASE = 'https://civiliumstructurium.onrender.com'


export async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
