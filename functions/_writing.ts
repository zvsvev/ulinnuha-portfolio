// Shared types + KV helpers for the handwriting blog (write.ulinnuha.id).
// Scans live in R2 (MEDIA_BUCKET) and are served/optimized through the zone's
// free /cdn-cgi/image/ transformations. Data lives in MEDIA_KV under `writing:`.
import type { Env } from './_auth';

export type PageImage = { key: string; alt?: string }; // R2 object key
export type ArticleStatus = 'published' | 'draft';

export type Article = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  status: ArticleStatus;
  pages: PageImage[]; // ordered R2 keys
  coverKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleSummary = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  coverKey?: string;
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

/**
 * Build a delivery URL for an R2 scan through Cloudflare's free image
 * transformations. `format` and `quality` do not count toward the monthly
 * uniqueness budget, and `onerror=redirect` falls back to the original image
 * if the free tier is ever exceeded.
 */
export function imageUrl(env: Env, key: string, variant = 'article'): string {
  const host = env.WRITE_HOST || 'write.ulinnuha.id';
  const opts =
    variant === 'thumb'
      ? 'width=640,fit=scale-down,quality=80'
      : variant === 'og'
        ? 'width=1200,height=630,fit=cover,quality=82'
        : 'width=1600,fit=scale-down,quality=82';
  const src = `https://${host}/api/media/${key}`;
  return `https://${host}/cdn-cgi/image/${opts},format=auto,onerror=redirect/${src}`;
}

/** Direct (unoptimized) R2 delivery URL, used as a graceful fallback. */
export function rawMediaUrl(env: Env, key: string): string {
  const host = env.WRITE_HOST || 'write.ulinnuha.id';
  return `https://${host}/api/media/${key}`;
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
    coverKey: a.coverKey ?? a.pages[0]?.key,
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

/** Deletes page scans from R2 (used when a page is removed or an article goes). */
export async function deleteObjects(env: Env, keys: string[]): Promise<void> {
  await Promise.all(
    keys.filter(Boolean).map((key) => env.MEDIA_BUCKET.delete(key).catch(() => undefined)),
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
    const key = typeof page?.key === 'string' ? page.key.trim() : '';
    if (!key) return { ok: false, error: 'page missing image key' };
    pages.push({ key, alt: typeof page.alt === 'string' ? page.alt.slice(0, 300) : undefined });
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
    coverKey: typeof body.coverKey === 'string' && body.coverKey ? body.coverKey : pages[0].key,
    createdAt: opts.prev?.createdAt || now,
    updatedAt: now,
  };
  return { ok: true, article };
}

/* ---------- Client-facing shapes (add transform delivery URLs) ---------- */

export type ClientArticle = Article & {
  cover: string | null;
  pages: (PageImage & { thumb: string; full: string })[];
};

export function clientArticle(env: Env, a: Article): ClientArticle {
  return {
    ...a,
    cover: a.coverKey ? imageUrl(env, a.coverKey, 'thumb') : a.pages[0] ? imageUrl(env, a.pages[0].key, 'thumb') : null,
    pages: a.pages.map((p) => ({
      ...p,
      thumb: imageUrl(env, p.key, 'thumb'),
      full: imageUrl(env, p.key, 'article'),
    })),
  };
}

export function clientSummary(
  env: Env,
  s: ArticleSummary,
): ArticleSummary & { coverThumb: string | null } {
  return { ...s, coverThumb: s.coverKey ? imageUrl(env, s.coverKey, 'thumb') : null };
}
