import { isAuthed, type Env } from '../_auth';

export type PostRecord = {
  id: string;
  imageKey: string;
  caption: string;
  date: string;
  app: string;
};

const APPS = ['instagram', 'facebook', 'gallery'];

const headers = { 'Content-Type': 'application/json' };

function kvKey(app: string): string {
  return `posts:${app}`;
}

async function readPosts(env: Env, app: string): Promise<PostRecord[]> {
  const raw = await env.MEDIA_KV.get(kvKey(app));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PostRecord[];
  } catch {
    return [];
  }
}

/** Public: GET /api/posts?app=instagram|facebook|gallery */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const app = url.searchParams.get('app') || '';
  if (!APPS.includes(app)) {
    return new Response(JSON.stringify({ error: 'invalid app' }), { status: 400, headers });
  }
  const posts = await readPosts(env, app);
  const out = posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    date: p.date,
    imageUrl: `/api/media/${p.imageKey}`,
  }));
  return new Response(JSON.stringify(out), { headers });
};

/** Admin-only: POST /api/posts — multipart form (image, caption, date, app) */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return new Response(JSON.stringify({ error: 'bad form' }), { status: 400, headers });

  const app = String(form.get('app') || '');
  const caption = String(form.get('caption') || '').slice(0, 500);
  const date = String(form.get('date') || '').slice(0, 50);
  const file = form.get('image');

  if (!APPS.includes(app) || !caption || !date || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers });
  }
  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'image too large' }), { status: 413, headers });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const imageKey = `posts/${app}/${id}.${ext}`;

  await env.MEDIA_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  const posts = await readPosts(env, app);
  posts.unshift({ id, imageKey, caption, date, app });
  await env.MEDIA_KV.put(kvKey(app), JSON.stringify(posts));

  return new Response(JSON.stringify({ ok: true, id, imageUrl: `/api/media/${imageKey}` }), {
    status: 201,
    headers,
  });
};
