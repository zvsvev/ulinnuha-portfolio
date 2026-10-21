import type { Env, PagesFunction } from './_auth';
import { readIndex, sortByDateDesc, getArticle } from './_writing';

function xml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** GET /rss.xml — RSS feed of published articles (write host only). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const host = new URL(request.url).hostname;
  const writeHost = env.WRITE_HOST || 'write.ulinnuha.id';
  if (host !== writeHost) return new Response('Not found', { status: 404 });

  const base = `https://${writeHost}`;
  const list = sortByDateDesc((await readIndex(env)).filter((a) => a.status === 'published')).slice(0, 40);

  const items: string[] = [];
  for (const summary of list) {
    const article = await getArticle(env, summary.slug);
    if (!article) continue;
    const link = `${base}/${article.slug}`;
    const pub = new Date(Date.parse(article.date) || Date.now()).toUTCString();
    const desc =
      article.subtitle ||
      `Handwritten article, ${article.pages.length} page${article.pages.length === 1 ? '' : 's'}.`;
    items.push(`    <item>
      <title>${xml(article.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${xml(desc)}</description>
    </item>`);
  }

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ulinnuha — writing</title>
    <link>${base}/</link>
    <description>Handwritten notes and essays, scanned and published.</description>
    <language>en</language>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(feed, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
