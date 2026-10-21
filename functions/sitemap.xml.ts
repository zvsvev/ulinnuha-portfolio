import type { Env, PagesFunction } from './_auth';
import { readIndex, sortByDateDesc } from './_writing';

/** GET /sitemap.xml — blog sitemap on the write host only. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const host = new URL(request.url).hostname;
  const writeHost = env.WRITE_HOST || 'write.ulinnuha.id';
  if (host !== writeHost) return new Response('Not found', { status: 404 });

  const base = `https://${writeHost}`;
  const list = sortByDateDesc((await readIndex(env)).filter((a) => a.status === 'published'));
  const urls = [
    `  <url><loc>${base}/</loc></url>`,
    ...list.map((a) => `  <url><loc>${base}/${a.slug}</loc><lastmod>${a.date}</lastmod></url>`),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
