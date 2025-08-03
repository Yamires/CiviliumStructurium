export const API_BASE = 'https://civiliumstructurium.onrender.com';

export async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');

  if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
            console.warn('Token expired, clearing localStorage');
            localStorage.removeItem('access_token');
            throw new Error('Token expired');
        }
    } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('access_token');
    }
} 



  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  console.log("Authorization header:", headers.Authorization);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'include', 
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }

  return res.json();
}
