// Shared blog responses, used by the write-host middleware and the /write routes.
import { isAuthed, type Env } from '../_auth';
import { getArticle, readIndex, sortByDateDesc } from '../_writing';
import { renderArchive, renderArticle, notFoundHtml } from './_render';

const HTML = { 'Content-Type': 'text/html; charset=utf-8' };
const CACHE = { ...HTML, 'Cache-Control': 'public, max-age=60' };

export async function archiveResponse(env: Env): Promise<Response> {
  const index = await readIndex(env);
  const published = sortByDateDesc(index.filter((a) => a.status === 'published'));
  return new Response(renderArchive(env, published), { headers: CACHE });
}

export async function articleResponse(env: Env, request: Request, slug: string): Promise<Response> {
  const article = await getArticle(env, slug);
  const visible = !!article && (article.status === 'published' || (await isAuthed(request, env)));
  if (!article || !visible) {
    return new Response(notFoundHtml(), { status: 404, headers: HTML });
  }
  return new Response(renderArticle(env, article), { headers: CACHE });
}

export function notFoundResponse(): Response {
  return new Response(notFoundHtml(), { status: 404, headers: HTML });
}
