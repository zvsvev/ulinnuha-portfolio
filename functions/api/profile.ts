import { isAuthed, type Env } from '../_auth';

const KV_KEY = 'profile:avatar';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const headers = { 'Content-Type': 'application/json' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

/** Public: GET /api/profile — the uploaded avatar URL, or null for the default. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const avatarUrl = await env.MEDIA_KV.get(KV_KEY);
  return json({ avatarUrl: avatarUrl || null });
};

/**
 * Admin-only: POST /api/profile — multipart `image`.
 *
 * Each upload gets a fresh key so the media route's immutable 1-year cache
 * can never serve a stale avatar; the previous object is removed.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) {
    return json({ error: 'unauthorized' }, 401);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: 'bad form' }, 400);

  const file = form.get('image');
  if (!(file instanceof File)) return json({ error: 'missing image' }, 400);
  if (file.size > MAX_AVATAR_BYTES) return json({ error: 'image too large' }, 413);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const imageKey = `profile/avatar-${Date.now()}.${ext}`;

  await env.MEDIA_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  const previous = await env.MEDIA_KV.get(KV_KEY);
  if (previous?.startsWith('/api/media/')) {
    await env.MEDIA_BUCKET.delete(previous.replace('/api/media/', ''));
  }

  const avatarUrl = `/api/media/${imageKey}`;
  await env.MEDIA_KV.put(KV_KEY, avatarUrl);

  return json({ ok: true, avatarUrl });
};

/** Admin-only: DELETE /api/profile — revert to the built-in default avatar. */
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) {
    return json({ error: 'unauthorized' }, 401);
  }

  const current = await env.MEDIA_KV.get(KV_KEY);
  if (current?.startsWith('/api/media/')) {
    await env.MEDIA_BUCKET.delete(current.replace('/api/media/', ''));
  }
  await env.MEDIA_KV.delete(KV_KEY);

  return json({ ok: true });
};
