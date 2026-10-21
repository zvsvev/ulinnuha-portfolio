// Server-rendered HTML for the handwriting blog. Kept dependency-free so it
// works from Pages Functions on the write host.
import type { Env } from '../_auth';
import { imageUrl, rawMediaUrl, type Article, type ArticleSummary } from '../_writing';

export function esc(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(date: string): string {
  const t = Date.parse(date);
  if (Number.isNaN(t)) return date;
  const d = new Date(t);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

type LayoutOptions = {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  head?: string;
  body: string;
};

function layout(o: LayoutOptions): string {
  const desc = o.description ? `<meta name="description" content="${esc(o.description)}" />` : '';
  const canonical = o.canonical ? `<link rel="canonical" href="${esc(o.canonical)}" />` : '';
  const og = [
    '<meta property="og:type" content="article" />',
    `<meta property="og:title" content="${esc(o.title)}" />`,
    o.description ? `<meta property="og:description" content="${esc(o.description)}" />` : '',
    o.canonical ? `<meta property="og:url" content="${esc(o.canonical)}" />` : '',
    o.ogImage ? `<meta property="og:image" content="${esc(o.ogImage)}" />` : '',
    '<meta name="twitter:card" content="summary_large_image" />',
  ]
    .filter(Boolean)
    .join('\n    ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(o.title)}</title>
    ${desc}
    ${canonical}
    ${og}
    <link rel="icon" href="/favicon.svg" />
    <link rel="stylesheet" href="/write.css" />
    ${o.head ?? ''}
  </head>
  <body>
    <div class="progress" id="progress" aria-hidden="true"></div>
    <header class="masthead">
      <a class="brand" href="/">ulinnuha <span>— writing</span></a>
      <nav><a href="/">Archive</a><a href="/rss.xml">RSS</a></nav>
    </header>
    <main class="column">
${o.body}
    </main>
    <footer class="foot">
      <span>© ${new Date().getUTCFullYear()} ulinnuha</span>
      <a href="https://ulinnuha.id">ulinnuha.id</a>
    </footer>
    <script>
      (function () {
        var bar = document.getElementById('progress');
        if (!bar) return;
        function onScroll() {
          var h = document.documentElement;
          var max = h.scrollHeight - h.clientHeight;
          bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
        }
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      })();
    </script>
  </body>
</html>`;
}

function pageFigures(env: Env, article: Article): string {
  return article.pages
    .map((p, i) => {
      const alt = p.alt || `${article.title} — page ${i + 1}`;
      const full = imageUrl(env, p.key, 'article');
      const raw = rawMediaUrl(env, p.key);
      return `      <figure class="page">
        <img src="${esc(full)}" alt="${esc(alt)}" loading="${i === 0 ? 'eager' : 'lazy'}" width="1600" decoding="async" onerror="this.onerror=null;this.src='${esc(raw)}'" />
      </figure>`;
    })
    .join('\n');
}

export function renderArchive(env: Env, articles: ArticleSummary[]): string {
  const cards = articles.length
    ? articles
        .map((a) => {
          const cover = a.coverKey ? imageUrl(env, a.coverKey, 'thumb') : '';
          const coverRaw = a.coverKey ? rawMediaUrl(env, a.coverKey) : '';
          const tags = a.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
          return `      <a class="card" href="/${esc(a.slug)}">
        ${cover ? `<div class="card-media"><img src="${esc(cover)}" alt="" loading="lazy" width="640" onerror="this.onerror=null;this.src='${esc(coverRaw)}'" /></div>` : ''}
        <div class="card-body">
          <time>${esc(formatDate(a.date))}</time>
          <h2>${esc(a.title)}</h2>
          ${a.subtitle ? `<p>${esc(a.subtitle)}</p>` : ''}
          <div class="tags">${tags}<span class="muted">${a.pageCount} page${a.pageCount === 1 ? '' : 's'}</span></div>
        </div>
      </a>`;
        })
        .join('\n')
    : '      <p class="empty">No articles yet.</p>';

  const body = `    <h1 class="page-title">Writing</h1>
    <p class="lede">Scanned pages straight from my notebook.</p>
    <div class="feed">
${cards}
    </div>`;

  return layout({
    title: 'Writing — ulinnuha',
    description: 'Handwritten notes and essays, scanned and published.',
    canonical: `https://${env.WRITE_HOST || 'write.ulinnuha.id'}/`,
    body,
  });
}

export function renderArticle(env: Env, article: Article): string {
  const tags = article.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const cover = article.coverKey ? imageUrl(env, article.coverKey, 'og') : undefined;
  const canonical = `https://${env.WRITE_HOST || 'write.ulinnuha.id'}/${article.slug}`;
  const description = article.subtitle || `${article.title} — handwritten, ${article.pages.length} page${article.pages.length === 1 ? '' : 's'}.`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    datePublished: article.date,
    image: cover ? [cover] : undefined,
    url: canonical,
    author: { '@type': 'Person', name: 'ulinnuha' },
  });

  const body = `    <article>
      <header class="article-head">
        <time>${esc(formatDate(article.date))}</time>
        <h1>${esc(article.title)}</h1>
        ${article.subtitle ? `<p class="subtitle">${esc(article.subtitle)}</p>` : ''}
        <div class="tags">${tags}</div>
      </header>
${pageFigures(env, article)}
    </article>
    <p class="back"><a href="/">← All writing</a></p>`;

  return layout({
    title: `${article.title} — ulinnuha`,
    description,
    canonical,
    ogImage: cover,
    head: `<script type="application/ld+json">${jsonLd}</script>`,
    body,
  });
}

export function notFoundHtml(): string {
  return layout({
    title: 'Not found — ulinnuha',
    body: `    <h1 class="page-title">Not found</h1>
    <p class="lede">That page does not exist. <a href="/">Back to writing</a>.</p>`,
  });
}
