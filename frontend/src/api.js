const API = import.meta.env.VITE_API_URL; // Vercel sets this

export async function checkHealth() {
  const res = await fetch(`${API}/api/health`);
  return res.json();
}

export function api(path, options = {}) {
  return fetch(`${API}${path}`, options);
}
