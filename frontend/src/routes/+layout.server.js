import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api.js';

const publicRoutes = new Set(['/login', '/register']);

export async function load(event) {
  let user = null;

  try {
    const data = await serverApi.get(event, '/auth/me');
    user = data.user;
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }
  }

  const pathname = event.url.pathname;

  if (pathname === '/') {
    throw redirect(303, user ? '/overview' : '/login');
  }

  if (!user && !publicRoutes.has(pathname)) {
    throw redirect(303, '/login');
  }

  if (user && publicRoutes.has(pathname)) {
    throw redirect(303, '/overview');
  }

  return { user };
}
