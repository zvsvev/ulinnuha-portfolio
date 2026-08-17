import { isAuthed, type Env } from '../_auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authed = await isAuthed(request, env);
  if (!authed) return new Response(JSON.stringify({ authed: false }), { status: 401 });
  return new Response(JSON.stringify({ authed: true }), { status: 200 });
};
