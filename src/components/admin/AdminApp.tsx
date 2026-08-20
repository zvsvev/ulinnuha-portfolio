import { useEffect, useState } from 'react';
import './AdminApp.css';

type Post = { id: string; caption: string; date: string; imageUrl: string };

const APPS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c' },
  { id: 'facebook', label: 'Facebook', color: '#3b5998' },
  { id: 'gallery', label: 'Gallery', color: '#d97a2b' },
];

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Active tab + upload form state
  const [tab, setTab] = useState('instagram');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posts, setPosts] = useState<Record<string, Post[]>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/admin/session')
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    APPS.forEach((a) => {
      fetch(`/api/posts?app=${a.id}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Post[]) => setPosts((prev) => ({ ...prev, [a.id]: data })))
        .catch(() => {});
    });
  }, [authed]);

  // Clean up object URL when file changes / unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  const onPickFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
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
      onPickFile(null);
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

  if (authed === null) return <div className="admin-card">Checking…</div>;

  if (!authed) {
    return (
      <div className="admin-card admin-login">
        <h1>Admin Login</h1>
        <p className="admin-sub">Sign in to manage your posts.</p>
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
        {APPS.map((a) => (
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

      {/* Upload form */}
      <div className="admin-card">
        <h2>Upload to {APPS.find((a) => a.id === tab)?.label}</h2>
        <form onSubmit={upload} className="admin-form">
          <div className="admin-upload-row">
            <label className="admin-drop">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="admin-preview" />
              ) : (
                <span className="admin-drop-hint">+ Choose image</span>
              )}
            </label>

            <div className="admin-upload-fields">
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

          <button type="submit" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          {msg && <p className={`admin-msg ${msg.kind === 'err' ? 'admin-err' : ''}`}>{msg.text}</p>}
        </form>
      </div>

      {/* Post list for active tab */}
      <div className="admin-card">
        <h2>
          {APPS.find((a) => a.id === tab)?.label} posts
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
    </div>
  );
}
