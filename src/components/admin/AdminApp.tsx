import { useEffect, useState } from 'react';
import './AdminApp.css';

type Post = { id: string; caption: string; date: string; imageUrl: string };

const APPS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'gallery', label: 'Gallery' },
];

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Upload form state
  const [app, setApp] = useState('instagram');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Record<string, Post[]>>({});
  const [msg, setMsg] = useState('');

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

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!file) { setMsg('Pick an image'); return; }
    const fd = new FormData();
    fd.append('app', app);
    fd.append('caption', caption);
    fd.append('date', date);
    fd.append('image', file);
    const res = await fetch('/api/posts', { method: 'POST', body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setMsg(`Upload failed: ${j?.error ?? res.status}`);
      return;
    }
    setMsg('Uploaded ✓');
    setCaption('');
    setFile(null);
    const list = await fetch(`/api/posts?app=${app}`).then((r) => r.json());
    setPosts((prev) => ({ ...prev, [app]: list }));
  };

  const remove = async (a: string, id: string) => {
    const res = await fetch(`/api/posts/${id}?app=${a}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => ({ ...prev, [a]: (prev[a] ?? []).filter((p) => p.id !== id) }));
    }
  };

  if (authed === null) return <div className="admin-card">Checking…</div>;

  if (!authed) {
    return (
      <div className="admin-card">
        <h1>Admin Login</h1>
        <form onSubmit={login}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-card">
        <h1>Upload content</h1>
        <form onSubmit={upload} className="admin-form">
          <label>
            App
            <select value={app} onChange={(e) => setApp(e.target.value)}>
              {APPS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>
          <label>
            Image
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label>
            Caption
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button type="submit">Upload</button>
          {msg && <p className="admin-msg">{msg}</p>}
        </form>
      </div>

      {APPS.map((a) => (
        <div className="admin-card" key={a.id}>
          <h2>{a.label} ({posts[a.id]?.length ?? 0})</h2>
          {(posts[a.id] ?? []).length === 0 && <p className="admin-muted">No posts yet.</p>}
          {posts[a.id]?.map((p) => (
            <div className="admin-post" key={p.id}>
              <img src={p.imageUrl} alt={p.caption} />
              <div className="admin-post-info">
                <b>{p.caption}</b>
                <span>{p.date}</span>
              </div>
              <button className="admin-del" onClick={() => remove(a.id, p.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}

      <button className="admin-logout" onClick={logout}>Logout</button>
    </div>
  );
}
