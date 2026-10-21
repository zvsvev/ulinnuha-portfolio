import { isAuthed, type Env, type PagesFunction } from '../../_auth';
import { json } from '../../_writing';

/**
 * Admin-only: POST /api/writing/upload-url
 * Hands out a one-time Cloudflare Images direct-upload URL so the browser can
 * send scans straight to Cloudflare (no token exposed, no bytes through us).
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) return json({ error: 'unauthorized' }, 401);

  const acct = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_IMAGES_TOKEN;
  if (!acct || !token) return json({ error: 'image storage not configured' }, 500);

  const form = new FormData();
  form.append('requireSignedURLs', 'false');
  form.append('metadata', JSON.stringify({ source: 'write' }));

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acct}/images/v2/direct_upload`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  const data = (await res.json().catch(() => null)) as
    | { success?: boolean; result?: { id: string; uploadURL: string }; errors?: unknown }
    | null;

  if (!res.ok || !data?.success || !data.result) {
    return json({ error: 'could not create upload url', detail: data?.errors ?? null }, 502);
  }
  return json({ id: data.result.id, uploadURL: data.result.uploadURL });
};
