import { useEffect, useState } from 'react';
import { downscaleImage, formatBytes } from './downscaleImage';
import { DEFAULT_AVATAR } from '../../hooks/useAvatar';
import { notes as defaultNotes } from '../../data/notes';
import './AdminApp.css';

type Post = { id: string; caption: string; date: string; imageUrl: string };
type NoteDraft = { id: string; title: string; body: string };

const POST_APPS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c' },
  { id: 'facebook', label: 'Facebook', color: '#3b5998' },
];

const TOOLS = [
  { id: 'notes', label: 'Notes', color: '#f5c400' },
  { id: 'profile', label: 'Profile', color: '#6fbf3f' },
];

const TABS = [...POST_APPS, ...TOOLS];
const isPostApp = (id: string) => POST_APPS.some((a) => a.id === id);

const AVATAR_MAX_DIM = 512;
/** Small rendition for grid/feed tiles — covers them at 2× DPR. */
const THUMB_MAX_DIM = 640;

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Active tab + shared feedback
  const [tab, setTab] = useState('instagram');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Photo feeds
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posts, setPosts] = useState<Record<string, Post[]>>({});
  const [preparing, setPreparing] = useState(false);

  // Notes tool
  const [notes, setNotes] = useState<NoteDraft[]>([]);
  const [savingNotes, setSavingNotes] = useState(false);

  // Profile tool
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPreparing, setAvatarPreparing] = useState(false);

  useEffect(() => {
    fetch('/admin/session')
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;

    POST_APPS.forEach((a) => {
      fetch(`/api/posts?app=${a.id}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Post[]) => setPosts((prev) => ({ ...prev, [a.id]: data })))
        .catch(() => {});
    });

    fetch('/api/notes')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { notes: NoteDraft[] | null }) => {
        // null = never configured, so load the built-in default note for editing.
        setNotes(data.notes ?? defaultNotes.map((n) => ({ ...n })));
      })
      .catch(() => setNotes(defaultNotes.map((n) => ({ ...n }))));

    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { avatarUrl: string | null }) => setAvatarUrl(data.avatarUrl))
      .catch(() => {});
  }, [authed]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) setAuthed(true);
    else setError('Invalid credentials');
  };

  const logout = async () => {
    await fetch('/admin/logout', { method: 'POST' });
    setAuthed(false);
  };

  const pickFile = async (raw: File | null) => {
    if (!raw) {
      setFile(null);
      setThumbFile(null);
      setPreparing(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    setPreparing(true);
    // A full-size copy for the lightbox, plus a small one for grid/feed tiles.
    const [processed, thumb] = await Promise.all([
      downscaleImage(raw),
      downscaleImage(raw, THUMB_MAX_DIM),
    ]);
    setPreparing(false);
    setFile(processed);
    setThumbFile(thumb);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(processed));
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!file) { setMsg({ kind: 'err', text: 'Pick an image first' }); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append('app', tab);
    fd.append('caption', caption);
    fd.append('date', date);
    fd.append('image', file);
    if (thumbFile) fd.append('thumb', thumbFile);
    try {
      const res = await fetch('/api/posts', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setMsg({ kind: 'err', text: `Upload failed: ${j?.error ?? res.status}` });
        return;
      }
      setMsg({ kind: 'ok', text: 'Uploaded ✓' });
      setCaption('');
      setDate(new Date().toISOString().slice(0, 10));
      void pickFile(null);
      const list = await fetch(`/api/posts?app=${tab}`).then((r) => r.json());
      setPosts((prev) => ({ ...prev, [tab]: list }));
    } catch {
      setMsg({ kind: 'err', text: 'Network error — try again' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: string, id: string) => {
    if (!window.confirm('Delete this post?')) return;
    const res = await fetch(`/api/posts/${id}?app=${a}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => ({ ...prev, [a]: (prev[a] ?? []).filter((p) => p.id !== id) }));
    }
  };

  /* ---------- Notes tool ---------- */

  const updateNote = (id: string, patch: Partial<NoteDraft>) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const addNote = () =>
    setNotes((prev) => [...prev, { id: `note-${Date.now()}`, title: '', body: '' }]);

  const removeNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const notesValid = notes.every((n) => n.title.trim().length > 0);

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSavingNotes(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setMsg({ kind: 'err', text: `Save failed: ${j?.error ?? res.status}` });
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.notes)) setNotes(data.notes);
      setMsg({ kind: 'ok', text: 'Notes saved ✓' });
    } catch {
      setMsg({ kind: 'err', text: 'Network error — try again' });
    } finally {
      setSavingNotes(false);
    }
  };

  /* ---------- Profile tool ---------- */

  const pickAvatar = async (raw: File | null) => {
    if (!raw) {
      setAvatarFile(null);
      setAvatarPreparing(false);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      return;
    }
    setAvatarPreparing(true);
    const processed = await downscaleImage(raw, AVATAR_MAX_DIM);
    setAvatarPreparing(false);
    setAvatarFile(processed);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(processed));
  };

  const uploadAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!avatarFile) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('image', avatarFile);
    try {
      const res = await fetch('/api/profile', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setMsg({ kind: 'err', text: `Upload failed: ${j?.error ?? res.status}` });
        return;
      }
      const data = await res.json();
      setAvatarUrl(data.avatarUrl ?? null);
      void pickAvatar(null);
      setMsg({ kind: 'ok', text: 'Profile picture updated ✓' });
    } catch {
      setMsg({ kind: 'err', text: 'Network error — try again' });
    } finally {
      setBusy(false);
    }
  };

  const resetAvatar = async () => {
    if (!window.confirm('Reset to the default profile picture?')) return;
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) {
        setMsg({ kind: 'err', text: `Reset failed: ${res.status}` });
        return;
      }
      setAvatarUrl(null);
      setMsg({ kind: 'ok', text: 'Reset to the default picture ✓' });
    } catch {
      setMsg({ kind: 'err', text: 'Network error — try again' });
    } finally {
      setBusy(false);
    }
  };

  const message = msg ? (
    <p className={`admin-msg ${msg.kind === 'err' ? 'admin-err' : ''}`}>{msg.text}</p>
  ) : null;

  if (authed === null) return <div className="admin-card">Checking…</div>;

  if (!authed) {
    return (
      <div className="admin-card admin-login">
        <h1>Admin Login</h1>
        <p className="admin-sub">Sign in to manage your content.</p>
        <form onSubmit={login} className="admin-form">
          <label>
            Username
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="admin-msg admin-err">{error}</p>}
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <header className="admin-head">
        <h1>Content</h1>
        <button className="admin-link-btn" onClick={logout}>Log out</button>
      </header>

      <nav className="admin-tabs" role="tablist">
        {TABS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={tab === a.id}
            className={`admin-tab${tab === a.id ? ' active' : ''}`}
            style={tab === a.id ? { color: a.color, borderBottomColor: a.color } : undefined}
            onClick={() => { setTab(a.id); setMsg(null); }}
          >
            {a.label}
          </button>
        ))}
      </nav>

      {/* ++++++ Photo feeds ++++++ */}
      {isPostApp(tab) && (
        <>
          <div className="admin-card">
            <h2>Upload to {TABS.find((a) => a.id === tab)?.label}</h2>
            <form onSubmit={upload} className="admin-form">
              <div className="admin-upload-row">
                <label className="admin-drop">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] ?? null;
                      e.target.value = ''; // allow re-picking the same file
                      void pickFile(picked);
                    }}
                  />
                  {preparing ? (
                    <span className="admin-drop-hint">Optimising…</span>
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="preview" className="admin-preview" />
                  ) : (
                    <span className="admin-drop-hint">+ Choose image</span>
                  )}
                </label>

                <div className="admin-upload-fields">
                  {file && !preparing && (
                    <p className="admin-muted">
                      Ready: {formatBytes(file.size + (thumbFile?.size ?? 0))}
                    </p>
                  )}
                  <label>
                    Caption
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={500} />
                  </label>
                  <label>
                    Date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={busy || preparing || !file}>
                {busy ? 'Uploading…' : 'Upload'}
              </button>
              {message}
            </form>
          </div>

          <div className="admin-card">
            <h2>
              {TABS.find((a) => a.id === tab)?.label} posts
              <span className="admin-count">{posts[tab]?.length ?? 0}</span>
            </h2>
            {(posts[tab] ?? []).length === 0 && <p className="admin-muted">No posts yet.</p>}
            {posts[tab]?.map((p) => (
              <div className="admin-post" key={p.id}>
                <img src={p.imageUrl} alt={p.caption} />
                <div className="admin-post-info">
                  <b>{p.caption || '(no caption)'}</b>
                  <span>{p.date}</span>
                </div>
                <button className="admin-del" onClick={() => remove(tab, p.id)} aria-label="Delete post">✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ++++++ Notes tool ++++++ */}
      {tab === 'notes' && (
        <div className="admin-card">
          <h2>
            Notes
            <span className="admin-count">{notes.length}</span>
          </h2>
          <p className="admin-sub">Shown inside the Notes app on the phone.</p>

          <form onSubmit={saveNotes} className="admin-form">
            {notes.length === 0 && <p className="admin-muted">No notes — add one below.</p>}

            {notes.map((n, i) => (
              <div className="admin-note" key={n.id}>
                <div className="admin-note-head">
                  <input
                    value={n.title}
                    onChange={(e) => updateNote(n.id, { title: e.target.value })}
                    placeholder="Title"
                    aria-label={`Note ${i + 1} title`}
                    maxLength={120}
                  />
                  <button
                    type="button"
                    className="admin-del"
                    onClick={() => removeNote(n.id)}
                    aria-label={`Remove note ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={n.body}
                  onChange={(e) => updateNote(n.id, { body: e.target.value })}
                  placeholder="Write something…"
                  aria-label={`Note ${i + 1} body`}
                  rows={4}
                  maxLength={5000}
                />
              </div>
            ))}

            <div className="admin-actions">
              <button type="button" className="admin-btn-ghost" onClick={addNote}>+ Add note</button>
              <button type="submit" disabled={savingNotes || !notesValid}>
                {savingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </div>
            {!notesValid && <p className="admin-muted">Every note needs a title.</p>}
            {message}
          </form>
        </div>
      )}

      {/* ++++++ Profile tool ++++++ */}
      {tab === 'profile' && (
        <div className="admin-card">
          <h2>Profile picture</h2>
          <p className="admin-sub">Used by the Instagram, Facebook and Contacts apps.</p>

          <form onSubmit={uploadAvatar} className="admin-form">
            <div className="admin-avatar-row">
              <div className="admin-avatar-block">
                <span className="admin-muted">Current</span>
                <img className="admin-avatar-current" src={avatarUrl ?? DEFAULT_AVATAR} alt="Current profile picture" />
              </div>

              <label className="admin-drop">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;
                    e.target.value = '';
                    void pickAvatar(picked);
                  }}
                />
                {avatarPreparing ? (
                  <span className="admin-drop-hint">Optimising…</span>
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="New profile picture preview" className="admin-preview" />
                ) : (
                  <span className="admin-drop-hint">+ Choose image</span>
                )}
              </label>
            </div>

            {avatarFile && !avatarPreparing && (
              <p className="admin-muted">Ready: {formatBytes(avatarFile.size)}</p>
            )}

            <div className="admin-actions">
              <button type="submit" disabled={!avatarFile || busy || avatarPreparing}>
                {busy ? 'Uploading…' : 'Upload picture'}
              </button>
              <button type="button" className="admin-btn-ghost" onClick={resetAvatar} disabled={!avatarUrl || busy}>
                Reset to default
              </button>
            </div>
            {message}
          </form>
        </div>
      )}
    </div>
  );
}
