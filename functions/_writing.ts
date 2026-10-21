// Shared types + KV helpers for the handwriting blog (write.ulinnuha.id).
// Data lives in the existing MEDIA_KV namespace under a `writing:` prefix.
import type { Env } from './_auth';

export type PageImage = { id: string; alt?: string };
export type ArticleStatus = 'published' | 'draft';

export type Article = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  status: ArticleStatus;
  pages: PageImage[]; // ordered Cloudflare Images ids
  coverId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleSummary = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  coverId?: string;
  pageCount: number;
  status: ArticleStatus;
};

export const INDEX_KEY = 'writing:index';
export const articleKey = (slug: string): string => `writing:article:${slug}`;

const jsonHeaders = { 'Content-Type': 'application/json' };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function imageUrl(env: Env, id: string, variant = 'article'): string {
  const hash = env.CF_IMAGES_DELIVERY_HASH || '';
  return `https://imagedelivery.net/${hash}/${id}/${variant}`;
}

export async function readIndex(env: Env): Promise<ArticleSummary[]> {
  const raw = await env.MEDIA_KV.get(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ArticleSummary[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(env: Env, list: ArticleSummary[]): Promise<void> {
  await env.MEDIA_KV.put(INDEX_KEY, JSON.stringify(list));
}

export function summarize(a: Article): ArticleSummary {
  return {
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    date: a.date,
    tags: a.tags,
    coverId: a.coverId ?? a.pages[0]?.id,
    pageCount: a.pages.length,
    status: a.status,
  };
}

export function sortByDateDesc<T extends { date: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

export async function getArticle(env: Env, slug: string): Promise<Article | null> {
  const raw = await env.MEDIA_KV.get(articleKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Article;
  } catch {
    return null;
  }
}

/** Writes the article record and refreshes its entry in the index. */
export async function putArticle(env: Env, article: Article): Promise<void> {
  await env.MEDIA_KV.put(articleKey(article.slug), JSON.stringify(article));
  const index = await readIndex(env);
  const next = [summarize(article), ...index.filter((s) => s.slug !== article.slug)];
  await writeIndex(env, next);
}

/** Removes the article record + its index entry. Returns the removed article. */
export async function deleteArticle(env: Env, slug: string): Promise<Article | null> {
  const existing = await getArticle(env, slug);
  await env.MEDIA_KV.delete(articleKey(slug));
  const index = await readIndex(env);
  await writeIndex(env, index.filter((s) => s.slug !== slug));
  return existing;
}

/** Deletes every page image for an article from Cloudflare Images. */
export async function deleteImages(env: Env, ids: string[]): Promise<void> {
  const acct = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_IMAGES_TOKEN;
  if (!acct || !token) return;
  await Promise.all(
    ids
      .filter(Boolean)
      .map((id) =>
        fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/images/v1/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined),
      ),
  );
}

export type ParsedArticle = { ok: true; article: Article } | { ok: false; error: string };

/**
 * Validates untrusted input into an Article. `prev` supplies createdAt on update
 * and `forcedSlug` pins the slug (used by the [slug] route).
 */
export function parseArticleInput(
  input: unknown,
  opts: { forcedSlug?: string; prev?: Article | null } = {},
): ParsedArticle {
  const body = input as Partial<Article> | null;
  if (!body || typeof body !== 'object') return { ok: false, error: 'bad request' };

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return { ok: false, error: 'missing title' };
  if (title.length > 200) return { ok: false, error: 'title too long' };

  const slug = opts.forcedSlug || slugify(typeof body.slug === 'string' && body.slug ? body.slug : title);
  if (!slug) return { ok: false, error: 'missing slug' };

  const rawPages = Array.isArray(body.pages) ? body.pages : [];
  const pages: PageImage[] = [];
  for (const p of rawPages) {
    const page = p as Partial<PageImage>;
    const id = typeof page?.id === 'string' ? page.id.trim() : '';
    if (!id) return { ok: false, error: 'page missing image id' };
    pages.push({ id, alt: typeof page.alt === 'string' ? page.alt.slice(0, 300) : undefined });
  }
  if (pages.length === 0) return { ok: false, error: 'need at least one page' };
  if (pages.length > 80) return { ok: false, error: 'too many pages' };

  const date = typeof body.date === 'string' && body.date ? body.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const status: ArticleStatus = body.status === 'draft' ? 'draft' : 'published';

  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const subtitle = typeof body.subtitle === 'string' ? body.subtitle.slice(0, 300) : undefined;

  const now = new Date().toISOString();
  const article: Article = {
    slug,
    title,
    subtitle: subtitle || undefined,
    date,
    tags,
    status,
    pages,
    coverId: typeof body.coverId === 'string' && body.coverId ? body.coverId : pages[0].id,
    createdAt: opts.prev?.createdAt || now,
    updatedAt: now,
  };
  return { ok: true, article };
}

/* ---------- Client-facing shapes (add Cloudflare Images delivery URLs) ---------- */

export type ClientArticle = Article & {
  cover: string | null;
  pages: (PageImage & { thumb: string; full: string })[];
};

export function clientArticle(env: Env, a: Article): ClientArticle {
  return {
    ...a,
    cover: a.coverId ? imageUrl(env, a.coverId, 'thumb') : a.pages[0] ? imageUrl(env, a.pages[0].id, 'thumb') : null,
    pages: a.pages.map((p) => ({
      ...p,
      thumb: imageUrl(env, p.id, 'thumb'),
      full: imageUrl(env, p.id, 'article'),
    })),
  };
}

export function clientSummary(
  env: Env,
  s: ArticleSummary,
): ArticleSummary & { coverThumb: string | null } {
  return { ...s, coverThumb: s.coverId ? imageUrl(env, s.coverId, 'thumb') : null };
}
