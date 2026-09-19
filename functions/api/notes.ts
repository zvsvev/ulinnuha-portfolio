import { isAuthed, type Env } from '../_auth';

export type NoteRecord = {
  id: string;
  title: string;
  body: string;
};

const KV_KEY = 'notes';
const MAX_NOTES = 50;
const MAX_TITLE = 120;
const MAX_BODY = 5000;

const headers = { 'Content-Type': 'application/json' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Public: GET /api/notes
 *
 * Returns `null` when the key has never been written, which the app reads as
 * "use the built-in defaults". An empty array means the owner deliberately
 * cleared the notes, so the pad should render empty.
 */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = await env.MEDIA_KV.get(KV_KEY);
  if (!raw) return json({ notes: null });

  try {
    const notes = JSON.parse(raw);
    return json({ notes: Array.isArray(notes) ? notes : null });
  } catch {
    return json({ notes: null });
  }
};

/** Admin-only: PUT /api/notes — replaces the whole list. */
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) {
    return json({ error: 'unauthorized' }, 401);
  }

  const payload = await request.json().catch(() => null) as { notes?: unknown } | null;
  const incoming = payload?.notes;

  if (!Array.isArray(incoming)) return json({ error: 'bad request' }, 400);
  if (incoming.length > MAX_NOTES) return json({ error: 'too many notes' }, 400);

  const notes: NoteRecord[] = [];
  for (const item of incoming) {
    const n = item as Partial<NoteRecord>;
    const title = typeof n?.title === 'string' ? n.title.trim() : '';
    const body = typeof n?.body === 'string' ? n.body : '';
    if (!title) return json({ error: 'missing title' }, 400);
    if (title.length > MAX_TITLE || body.length > MAX_BODY) {
      return json({ error: 'note too long' }, 400);
    }
    notes.push({
      id: typeof n.id === 'string' && n.id ? n.id : `note-${Date.now()}-${notes.length}`,
      title,
      body,
    });
  }

  await env.MEDIA_KV.put(KV_KEY, JSON.stringify(notes));
  return json({ ok: true, notes });
};
