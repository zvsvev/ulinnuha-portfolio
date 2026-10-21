// Host-based routing for the single Pages project that serves both
// ulinnuha.id (portfolio) and write.ulinnuha.id (handwriting blog).
//
// On the write host, non-asset paths render the blog directly (root = archive,
// /<slug> = article). On the main host, /write* links redirect to the write host.
import type { Env, PagesFunction } from './_auth';
import { archiveResponse, articleResponse, notFoundResponse } from './write/serve';

// Paths that already exist as real routes/assets and must not be intercepted.
const PASSTHROUGH_PREFIXES = ['/write', '/api', '/admin'];
const PASSTHROUGH_EXACT = ['/sitemap.xml', '/rss.xml', '/robots.txt'];

function isPassthrough(pathname: string): boolean {
  if (PASSTHROUGH_EXACT.includes(pathname)) return true;
  if (PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/_image')) return true;
  if (pathname.startsWith('/favicon')) return true;
  // Static files (write.css, images, etc.).
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const host = url.hostname;
  const writeHost = env.WRITE_HOST || 'write.ulinnuha.id';
  const siteHost = env.SITE_HOST || 'ulinnuha.id';
  const path = url.pathname;

  // Write host: render the blog.
  if (host === writeHost) {
    if (isPassthrough(path)) return context.next();
    if (path === '/') return archiveResponse(env);
    const slug = path.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!slug || slug.includes('/')) return notFoundResponse();
    return articleResponse(env, request, slug);
  }

  // Main host: send blog links to the subdomain.
  if (host === siteHost && (path === '/write' || path.startsWith('/write/'))) {
    const rest = path.slice('/write'.length) || '/';
    return Response.redirect(`https://${writeHost}${rest}`, 301);
  }

  return context.next();
};
