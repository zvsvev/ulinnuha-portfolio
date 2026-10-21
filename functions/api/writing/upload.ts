import { isAuthed, type Env, type PagesFunction } from '../../_auth';
import { json } from '../../_writing';

/**
 * Admin-only: POST /api/writing/upload — multipart form with an `image` field.
 * Stores the scan in R2 and returns its object key. Scans are downscaled in the
 * browser first, so this stays small.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) return json({ error: 'unauthorized' }, 401);

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: 'bad form' }, 400);

  const file = form.get('image');
  if (!(file instanceof File)) return json({ error: 'missing image' }, 400);
  if (file.size > 15 * 1024 * 1024) return json({ error: 'image too large' }, 413);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const key = `writing/${id}.${ext}`;

  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  return json({ key }, 201);
};
