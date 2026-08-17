import { isAuthed, type Env } from '../../_auth';
import type { PostRecord } from '../posts';

const headers = { 'Content-Type': 'application/json' };

/** Admin-only: DELETE /api/posts/[id]?app=instagram|facebook|gallery */
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAuthed(request, env))) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  const url = new URL(request.url);
  const app = url.searchParams.get('app') || '';
  const id = String(params.id || '');

  if (!app || !id) return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers });

  const raw = await env.MEDIA_KV.get(`posts:${app}`);
  if (!raw) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });

  const posts: PostRecord[] = JSON.parse(raw);
  const target = posts.find((p) => p.id === id);
  if (!target) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });

  await env.MEDIA_BUCKET.delete(target.imageKey);
  await env.MEDIA_KV.put(`posts:${app}`, JSON.stringify(posts.filter((p) => p.id !== id)));

  return new Response(JSON.stringify({ ok: true }), { headers });
};
