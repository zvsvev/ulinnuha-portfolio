import { useEffect, useState } from 'react';
import { downscaleImage, formatBytes } from './downscaleImage';
import './WritingEditor.css';

type PageDraft = { key: string | null; thumb: string | null; name: string; size: number };

type Summary = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  status: 'published' | 'draft';
  pageCount: number;
  coverThumb: string | null;
};

type ArticleResp = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  status: 'published' | 'draft';
  coverKey?: string;
  pages: { key: string; alt?: string; thumb: string; full: string }[];
};

const MAX_SCAN_DIM = 2400;

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const today = () => new Date().toISOString().slice(0, 10);

export default function WritingEditor() {
  const [list, setList] = useState<Summary[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState(today());
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/writing');
      if (!r.ok) return;
      const d = await r.json();
      setList(Array.isArray(d.articles) ? d.articles : []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setEditing(null);
    setSlug('');
    setSlugTouched(false);
    setTitle('');
    setSubtitle('');
    setDate(today());
    setTags('');
    setStatus('published');
    setPages((prev) => {
      prev.forEach((p) => p.thumb && p.thumb.startsWith('blob:') && URL.revokeObjectURL(p.thumb));
      return [];
    });
    setCoverIndex(0);
    setMsg(null);
  }

  async function editArticle(s: string) {
    setMsg(null);
    const r = await fetch(`/api/writing/${s}`);
    if (!r.ok) {
      setMsg({ kind: 'err', text: 'Could not load article' });
      return;
    }
    const { article } = (await r.json()) as { article: ArticleResp };
    setEditing(article.slug);
    setSlug(article.slug);
    setSlugTouched(true);
    setTitle(article.title);
    setSubtitle(article.subtitle ?? '');
    setDate(article.date);
    setTags(article.tags.join(', '));
    setStatus(article.status);
    setPages(article.pages.map((p) => ({ key: p.key, thumb: p.thumb, name: '', size: 0 })));
    const ci = article.pages.findIndex((p) => p.key === article.coverKey);
    setCoverIndex(ci >= 0 ? ci : 0);
  }

  function onTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyClient(value));
  }

  async function addFiles(files: FileList) {
    setMsg(null);
    setUploading(true);
    try {
      for (const raw of Array.from(files)) {
        const file = await downscaleImage(raw, MAX_SCAN_DIM);

        const fd = new FormData();
        fd.append('image', file, file.name || 'scan.jpg');
        const res = await fetch('/api/writing/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setMsg({ kind: 'err', text: `Upload failed: ${j?.error ?? res.status}` });
          break;
        }
        const { key } = (await res.json()) as { key: string };

        const thumb = URL.createObjectURL(file);
        setPages((prev) => [...prev, { key, thumb, name: file.name, size: file.size }]);
      }
    } catch {
      setMsg({ kind: 'err', text: 'Upload error — try again' });
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    setPages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setCoverIndex((c) => {
      if (index === c) return index + dir;
      if (index + dir === c) return index;
      return c;
    });
  }

  function removePage(index: number) {
    setPages((prev) => {
      const p = prev[index];
      if (p?.thumb?.startsWith('blob:')) URL.revokeObjectURL(p.thumb);
      return prev.filter((_, i) => i !== index);
    });
    setCoverIndex((c) => (c >= index ? Math.max(0, c - 1) : c));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!title.trim()) {
      setMsg({ kind: 'err', text: 'Title is required' });
      return;
    }
    if (pages.length === 0 || pages.some((p) => !p.key)) {
      setMsg({ kind: 'err', text: 'Upload at least one finished page first' });
      return;
    }

    const payload = {
      slug: slug || title,
      title,
      subtitle,
      date,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status,
      coverKey: pages[coverIndex]?.key,
      pages: pages.map((p) => ({ key: p.key })),
    };

    setBusy(true);
    try {
      const url = editing ? `/api/writing/${editing}` : '/api/writing';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setMsg({ kind: 'err', text: `Save failed: ${j?.error ?? res.status}` });
        return;
      }
      setMsg({ kind: 'ok', text: editing ? 'Article updated ✓' : 'Article published ✓' });
      resetForm();
      await load();
    } catch {
      setMsg({ kind: 'err', text: 'Network error — try again' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: string) {
    if (!window.confirm('Delete this article and its scans?')) return;
    const res = await fetch(`/api/writing/${s}`, { method: 'DELETE' });
    if (res.ok) {
      setList((prev) => prev.filter((a) => a.slug !== s));
      if (editing === s) resetForm();
      setMsg({ kind: 'ok', text: 'Article deleted ✓' });
    } else {
      setMsg({ kind: 'err', text: `Delete failed: ${res.status}` });
    }
  }

  const message = msg ? (
    <p className={`admin-msg ${msg.kind === 'err' ? 'admin-err' : ''}`}>{msg.text}</p>
  ) : null;

  return (
    <div className="writing">
      <div className="admin-card">
        <h2>{editing ? `Edit: ${title || editing}` : 'New article'}</h2>
        <p className="admin-sub">
          Scans go to R2 and are served as optimized WebP via Cloudflare transformations.
        </p>

        <form onSubmit={save} className="admin-form">
          <label>
            Title
            <input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Title" maxLength={200} />
          </label>

          <label>
            Subtitle <span className="admin-muted">(optional)</span>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="One-line summary" maxLength={300} />
          </label>

          <div className="writing-row">
            <label>
              Slug
              <input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugifyClient(e.target.value)); }}
                placeholder="url-slug"
              />
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label>
            Tags <span className="admin-muted">(comma separated)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="journal, ideas" />
          </label>

          <label className="admin-drop">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length) void addFiles(files);
                e.target.value = '';
              }}
            />
            <span className="admin-drop-hint">
              {uploading ? 'Uploading…' : '+ Add scanned pages'}
            </span>
          </label>

          {pages.length > 0 && (
            <div className="writing-pages">
              {pages.map((p, i) => (
                <div className={`writing-page${i === coverIndex ? ' is-cover' : ''}`} key={`${p.key}-${i}`}>
                  {p.thumb ? <img src={p.thumb} alt={p.name || `page ${i + 1}`} /> : <div className="writing-page-pending" />}
                  <div className="writing-page-bar">
                    <span className="writing-page-num">{i + 1}</span>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label="Move down">↓</button>
                    <button type="button" onClick={() => setCoverIndex(i)} aria-label="Set as cover">cover</button>
                    <button type="button" className="admin-del" onClick={() => removePage(i)} aria-label="Remove page">✕</button>
                  </div>
                  {p.size > 0 && <span className="writing-page-size">{formatBytes(p.size)}</span>}
                </div>
              ))}
            </div>
          )}

          <div className="admin-actions">
            <button type="submit" disabled={busy || uploading}>
              {busy ? 'Saving…' : editing ? 'Update article' : 'Publish article'}
            </button>
            {editing && (
              <button type="button" className="admin-btn-ghost" onClick={resetForm} disabled={busy}>
                Cancel edit
              </button>
            )}
          </div>
          {message}
        </form>
      </div>

      <div className="admin-card">
        <h2>
          Articles <span className="admin-count">{list.length}</span>
        </h2>
        {list.length === 0 && <p className="admin-muted">No articles yet.</p>}
        {list.map((a) => (
          <div className="writing-row-item" key={a.slug}>
            {a.coverThumb ? <img src={a.coverThumb} alt="" /> : <div className="writing-thumb-empty" />}
            <div className="writing-row-info">
              <b>{a.title}</b>
              <span>
                {a.date} · {a.pageCount} page{a.pageCount === 1 ? '' : 's'}
                {a.status === 'draft' ? ' · draft' : ''}
              </span>
            </div>
            <button className="admin-link-btn" onClick={() => void editArticle(a.slug)}>Edit</button>
            <button className="admin-del" onClick={() => void remove(a.slug)} aria-label="Delete article">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
