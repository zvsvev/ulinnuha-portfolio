import { isAuthed, type Env, type PagesFunction } from '../../_auth';
import {
  json,
  readIndex,
  sortByDateDesc,
  parseArticleInput,
  putArticle,
  clientSummary,
  clientArticle,
} from '../../_writing';

/** Public: GET /api/writing — published articles (drafts too when signed in). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authed = await isAuthed(request, env);
  const index = await readIndex(env);
  const visible = index.filter((a) => a.status === 'published' || authed);
  return json({ articles: sortByDateDesc(visible).map((s) => clientSummary(env, s)) });
};

/** Admin-only: POST /api/writing — create or replace an article. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) return json({ error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => null);
  const parsed = parseArticleInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  await putArticle(env, parsed.article);
  return json({ ok: true, article: clientArticle(env, parsed.article) }, 201);
};
