import { request } from './client';

export function login(username) {
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export function signup(username, email) {
  return request('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  });
}

export function syncUserApi(user) {
  return request('/api/users/sync', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, name: user.name }),
  });
}


