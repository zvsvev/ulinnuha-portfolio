import type { Env } from '../../_auth';

/** GET /api/media/[[key]] — serve image from R2 with long cache. */
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const segs = params.key;
  const key = Array.isArray(segs) ? segs.join('/') : String(segs || '');
  if (!key) return new Response('Not found', { status: 404 });

  const obj = await env.MEDIA_BUCKET.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');

  return new Response(obj.body, { headers });
};
