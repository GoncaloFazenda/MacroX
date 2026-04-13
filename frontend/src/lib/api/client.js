const API_BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: {},
    credentials: 'include',
  };

  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.details?.[0];
    const message = detail
      ? `${data.error}: ${detail.field} — ${detail.message}`
      : data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
