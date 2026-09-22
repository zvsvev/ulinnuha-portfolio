import { isAuthed, type Env } from '../_auth';

export type PostRecord = {
  id: string;
  imageKey: string;
  /** Smaller rendition for grid/feed tiles. Absent on posts stored before thumbnails. */
  thumbKey?: string;
  caption: string;
  date: string;
  app: string;
};

const APPS = ['instagram', 'facebook'];

const headers = { 'Content-Type': 'application/json' };

function kvKey(app: string): string {
  return `posts:${app}`;
}

async function readPosts(env: Env, app: string): Promise<PostRecord[]> {
  const raw = await env.MEDIA_KV.get(kvKey(app));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PostRecord[];
  } catch {
    return [];
  }
}

/**
 * Milliseconds for a post's date (set in the admin panel as YYYY-MM-DD).
 * Anything unparseable sorts last rather than jumping to the top.
 */
function publishedAt(date: string): number {
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}

/** Public: GET /api/posts?app=instagram|facebook */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const app = url.searchParams.get('app') || '';
  if (!APPS.includes(app)) {
    return new Response(JSON.stringify({ error: 'invalid app' }), { status: 400, headers });
  }
  const posts = await readPosts(env, app);
  // Newest first by the date chosen in the admin panel — not upload order.
  // The sort is stable, so posts sharing a date keep their stored order.
  const out = [...posts]
    .sort((a, b) => publishedAt(b.date) - publishedAt(a.date))
    .map((p) => ({
      id: p.id,
      caption: p.caption,
      date: p.date,
      imageUrl: `/api/media/${p.imageKey}`,
      // Older posts have no thumbnail, so tiles fall back to the full image.
      thumbUrl: `/api/media/${p.thumbKey ?? p.imageKey}`,
    }));
  return new Response(JSON.stringify(out), { headers });
};

/** Admin-only: POST /api/posts — multipart form (image, thumb, caption, date, app) */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return new Response(JSON.stringify({ error: 'bad form' }), { status: 400, headers });

  const app = String(form.get('app') || '');
  // Caption is optional — a photo can be posted without one.
  const caption = String(form.get('caption') ?? '').slice(0, 500);
  const date = String(form.get('date') || '').slice(0, 50);
  const file = form.get('image');
  const thumb = form.get('thumb');

  if (!APPS.includes(app) || !date || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers });
  }
  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'image too large' }), { status: 413, headers });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const imageKey = `posts/${app}/${id}.${ext}`;

  await env.MEDIA_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  // The thumbnail is optional: if the client didn't send one, tiles use the full image.
  let thumbKey: string | undefined;
  if (thumb instanceof File && thumb.size <= 10 * 1024 * 1024) {
    const thumbExt = (thumb.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    thumbKey = `posts/${app}/${id}-thumb.${thumbExt}`;
    await env.MEDIA_BUCKET.put(thumbKey, thumb.stream(), {
      httpMetadata: { contentType: thumb.type || 'image/jpeg' },
    });
  }

  const posts = await readPosts(env, app);
  posts.unshift({ id, imageKey, thumbKey, caption, date, app });
  await env.MEDIA_KV.put(kvKey(app), JSON.stringify(posts));

  return new Response(
    JSON.stringify({
      ok: true,
      id,
      imageUrl: `/api/media/${imageKey}`,
      thumbUrl: `/api/media/${thumbKey ?? imageKey}`,
    }),
    { status: 201, headers },
  );
};
