// Live Instagram profile counts for the mock IG app.
// Instagram puts a login wall in front of its raw HTML for datacenter IPs, so
// this proxy scrapes when it can, caches the last good result in KV, and
// falls back to cached data otherwise. Never throws on Instagram being grumpy.
import type { Env } from '../../_auth';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const USERNAME = 'ulinnuha.eth';
  const KV_KEY = 'instagram:profile';
  const TTL = 60 * 60; // 1 hour

  const cacheHit = await env.MEDIA_KV.get(KV_KEY);
  const cached = cacheHit ? safeParse(cacheHit) : null;

  const profile = await scrapeProfile(USERNAME);

  if (profile) {
    const record = { ...profile, fetchedAt: new Date().toISOString() };
    try {
      await env.MEDIA_KV.put(KV_KEY, JSON.stringify(record), { expirationTtl: TTL * 24 });
    } catch {
      /* cache write failure is non-fatal */
    }
    return json(record);
  }

  // Scrape failed (login wall / rate limit / markup change) — serve cache.
  if (cached) return json({ ...cached, stale: true });
  return json({ error: 'unavailable' }, 503);
};

async function scrapeProfile(username: string) {
  const url = `https://www.instagram.com/${encodeURIComponent(username)}/`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return null;
  const html = await res.text();

  return {
    username,
    followers: extractInt(html, ['edge_followed_by', 'followers']),
    following: extractInt(html, ['edge_follow', 'following']),
    posts: extractInt(html, ['edge_owner_to_timeline_media', 'media_count']),
  };
}

// Pulls the first integer next to any of the given markers, e.g.:
//   "edge_followed_by":{"count":305}  → 305
//   <meta content="305 Followers ..."> → 305
function extractInt(html: string, markers: string[]): number | null {
  for (const m of markers) {
    const re = new RegExp(m + '[^0-9]{0,30}([0-9][0-9,.]{0,12})');
    const hit = html.match(re);
    if (hit) return parseCount(hit[1]);
  }
  return null;
}

function parseCount(s: string): number | null {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function safeParse(raw: string) {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
