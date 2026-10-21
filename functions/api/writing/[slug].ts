import { isAuthed, type Env, type PagesFunction } from '../../_auth';
import {
  json,
  getArticle,
  putArticle,
  deleteArticle,
  deleteObjects,
  parseArticleInput,
  clientArticle,
} from '../../_writing';

/** GET /api/writing/[slug] — published article (drafts only when signed in). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || '');
  const article = await getArticle(env, slug);
  if (!article) return json({ error: 'not found' }, 404);
  if (article.status !== 'published' && !(await isAuthed(request, env))) {
    return json({ error: 'not found' }, 404);
  }
  return json({ article: clientArticle(env, article) });
};

/** Admin-only: PUT /api/writing/[slug] — update; prunes scans no longer used. */
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAuthed(request, env))) return json({ error: 'unauthorized' }, 401);
  const slug = String(params.slug || '');
  const prev = await getArticle(env, slug);
  if (!prev) return json({ error: 'not found' }, 404);

  const body = await request.json().catch(() => null);
  const parsed = parseArticleInput(body, { forcedSlug: slug, prev });
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const keep = new Set(parsed.article.pages.map((p) => p.key));
  const removed = prev.pages.map((p) => p.key).filter((k) => !keep.has(k));

  await putArticle(env, parsed.article);
  await deleteObjects(env, removed);
  return json({ ok: true, article: clientArticle(env, parsed.article) });
};

/** Admin-only: DELETE /api/writing/[slug] — removes the article and its scans. */
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAuthed(request, env))) return json({ error: 'unauthorized' }, 401);
  const slug = String(params.slug || '');
  const removed = await deleteArticle(env, slug);
  if (!removed) return json({ error: 'not found' }, 404);
  await deleteObjects(env, removed.pages.map((p) => p.key));
  return json({ ok: true });
};
