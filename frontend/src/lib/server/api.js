import { env } from '$env/dynamic/private';

const DEFAULT_API_ORIGIN = 'http://127.0.0.1:4000';

function getApiOrigin(url) {
  return env.MACROX_API_ORIGIN || env.API_ORIGIN || DEFAULT_API_ORIGIN;
}

async function request(event, method, path, body = null) {
  const headers = {};
  const cookie = event.request.headers.get('cookie');

  if (cookie) {
    headers.cookie = cookie;
  }

  if (body) {
    headers['content-type'] = 'application/json';
  }

  const res = await event.fetch(`${getApiOrigin(event.url)}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.details?.[0];
    const message = detail
      ? `${data.error}: ${detail.field} - ${detail.message}`
      : data?.error || `Request failed (${res.status})`;

    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export const serverApi = {
  get: (event, path) => request(event, 'GET', path),
  post: (event, path, body) => request(event, 'POST', path, body),
  put: (event, path, body) => request(event, 'PUT', path, body),
  del: (event, path) => request(event, 'DELETE', path),
};
