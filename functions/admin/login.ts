import { createSession, setSessionCookie, verifyTurnstile, type Env } from '../_auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return new Response('Bad request', { status: 400 });
  }
  const { username, password, turnstileToken } = body as Record<string, string>;

  if (!env.ADMIN_USER || !env.ADMIN_PASS) {
    return new Response('Admin not configured', { status: 500 });
  }

  const tsOk = await verifyTurnstile(turnstileToken, env);
  if (!tsOk) {
    return new Response('Captcha failed', { status: 403 });
  }

  const ok =
    typeof username === 'string' &&
    typeof password === 'string' &&
    username === env.ADMIN_USER &&
    password === env.ADMIN_PASS;

  if (!ok) {
    return new Response('Invalid credentials', { status: 401 });
  }

  const token = await createSession(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setSessionCookie(token),
    },
  });
};
