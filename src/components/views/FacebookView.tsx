import { useEffect, useRef, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { contact } from '../../data/contact';
import { useAvatar } from '../../hooks/useAvatar';
import type { IGPost } from './InstagramView';
import './FacebookView.css';

type FBComment = { id: string; author: string; text: string; time: string };

type FBPost = {
  id: string;
  author: string;
  caption?: string;
  imageUrl?: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: FBComment[];
};

type ComposerKind = 'status' | 'photo' | 'checkin';

type Props = { onBack: () => void };

function seedId(id: string) {
  // Deterministic "random-looking" like count per fetched post id.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 5 + (h % 120);
}

function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 45% 45%)`;
}

export default function FacebookView({ onBack }: Props) {
  const { t } = useI18n();
  const avatar = useAvatar();
  const [posts, setPosts] = useState<FBPost[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null);

  // Composer (Status / Photo / Check In)
  const [composer, setComposer] = useState<ComposerKind | null>(null);
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<string | null>(null);
  const composerImageRef = useRef<string | null>(null);
  composerImageRef.current = composerImage;

  // Load real photo posts from the CMS feed.
  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=facebook')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: IGPost[]) => {
        if (!alive) return;
        const fetched: FBPost[] = data.map((p) => ({
          id: p.id,
          author: 'ulinnuha.eth',
          caption: p.caption || undefined,
          // The feed never shows a full-size image, so the small rendition is always right.
          imageUrl: p.thumbUrl ?? p.imageUrl,
          time: p.date,
          likes: seedId(p.id),
          liked: false,
          comments: [],
        }));
        setPosts(fetched);
      })
      .catch(() => { if (alive) setPosts([]); });
    return () => { alive = false; };
  }, []);

  // Release an unattached composer image when leaving the app.
  useEffect(() => () => {
    if (composerImageRef.current) URL.revokeObjectURL(composerImageRef.current);
  }, []);

  const toggleLike = (id: string) =>
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)));

  const toggleComments = (id: string) =>
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitComment = (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c-${Date.now()}-${p.comments.length}`, author: t('fb_you'), text, time: t('fb_just_now') },
              ],
            }
          : p,
      ),
    );
    setDrafts((prev) => ({ ...prev, [id]: '' }));
  };

  const share = async (id: string) => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopiedId(id);
      window.setTimeout(() => setShareCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const openComposer = (kind: ComposerKind) => {
    setComposer(kind);
    setComposerText('');
    setComposerImage(null);
  };

  const resetComposer = (revokeImage: boolean) => {
    if (revokeImage && composerImage) URL.revokeObjectURL(composerImage);
    setComposer(null);
    setComposerText('');
    setComposerImage(null);
  };

  const pickImage = (file: File | null) => {
    if (composerImage) URL.revokeObjectURL(composerImage);
    setComposerImage(file ? URL.createObjectURL(file) : null);
  };

  const submitPost = () => {
    const text = composerText.trim();
    if (!text && !composerImage) return;
    const caption = composer === 'checkin'
      ? [text, `📍 ${contact.location}`].filter(Boolean).join(' ')
      : text;
    setPosts((prev) => [
      {
        id: `local-${Date.now()}`,
        author: 'ulinnuha.eth',
        caption: caption || undefined,
        imageUrl: composerImage ?? undefined,
        time: t('fb_just_now'),
        likes: 0,
        liked: false,
        comments: [],
      },
      ...prev,
    ]);
    // Hand the object URL over to the new post — do not revoke it.
    resetComposer(false);
  };

  const needle = query.trim().toLowerCase();
  const visiblePosts = needle
    ? posts.filter((p) => (p.caption ?? '').toLowerCase().includes(needle))
    : posts;

  return (
    <div className="app-view">
      <AppNav title={t('facebook')} onBack={onBack} />

      <div className="fb">
        {/* Top bar — dark blue, search + friends */}
        <div className="fb-topbar">
          <span className="fb-f-logo">
            <img src="/logo/facebook.svg" alt="" />
          </span>
          <label className="fb-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6b7a" strokeWidth="3" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" strokeLinecap="round" />
            </svg>
            <input
              className="fb-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('fb_search_placeholder')}
              aria-label={t('fb_search_placeholder')}
            />
          </label>
          <span className="fb-friends-icon" aria-hidden="true">👥</span>
        </div>

        {/* Status bar — Status / Photo / Check In */}
        <div className="fb-statusbar">
          <button className={`fb-status-item${composer === 'status' ? ' active' : ''}`} onClick={() => openComposer('status')}>
            <span aria-hidden="true">✏️</span> <b>{t('fb_status')}</b>
          </button>
          <button className={`fb-status-item${composer === 'photo' ? ' active' : ''}`} onClick={() => openComposer('photo')}>
            <span aria-hidden="true">📷</span> <b>{t('fb_photo')}</b>
          </button>
          <button className={`fb-status-item${composer === 'checkin' ? ' active' : ''}`} onClick={() => openComposer('checkin')}>
            <span aria-hidden="true">📍</span> <b>{t('fb_check_in')}</b>
          </button>
        </div>

        {/* Composer */}
        {composer && (
          <div className="fb-compose">
            <div className="fb-compose-head">
              <b>{t('fb_new_post')}</b>
              <button className="fb-compose-close" onClick={() => resetComposer(true)} aria-label={t('fb_cancel')}>✕</button>
            </div>
            <textarea
              className="fb-compose-text"
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={t('fb_whats_on_your_mind')}
              aria-label={t('fb_whats_on_your_mind')}
              rows={3}
            />
            {composer === 'photo' && (
              composerImage ? (
                <div className="fb-compose-preview">
                  <img src={composerImage} alt="" />
                  <button className="fb-compose-remove" onClick={() => pickImage(null)}>
                    {t('fb_remove_photo')}
                  </button>
                </div>
              ) : (
                <label className="fb-compose-file">
                  <input type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0] ?? null)} />
                  <span>📷 {t('fb_add_photo')}</span>
                </label>
              )
            )}
            <div className="fb-compose-actions">
              <button className="fb-compose-btn" onClick={submitPost} disabled={!composerText.trim() && !composerImage}>
                {t('fb_post')}
              </button>
              <button className="fb-compose-cancel" onClick={() => resetComposer(true)}>{t('fb_cancel')}</button>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="fb-feed">
            {posts.length === 0 && <p className="fb-empty">{t('no_posts_yet')}</p>}
            {posts.length > 0 && visiblePosts.length === 0 && <p className="fb-empty">{t('fb_no_results')}</p>}
            {visiblePosts.map((p) => (
              <article key={p.id} className="fb-post">
                <div className="fb-post-head">
                  <img className="fb-post-avatar" src={avatar} alt="" />
                  <div>
                    <div className="fb-post-name">{p.author}</div>
                    <div className="fb-post-time">{p.time}</div>
                  </div>
                </div>
                {p.caption && <p className="fb-post-caption">{p.caption}</p>}
                {p.imageUrl && <img className="fb-post-img" src={p.imageUrl} alt={p.caption ?? ''} loading="lazy" decoding="async" />}

                <div className="fb-post-engagement">
                  <span className="fb-eng-likes">👍 {p.likes}</span>
                  <span className="fb-eng-comments">
                    {p.comments.length} {p.comments.length === 1 ? t('fb_comment') : t('fb_comments')}
                  </span>
                </div>

                <div className="fb-post-actions">
                  <button className={`fb-action${p.liked ? ' active' : ''}`} onClick={() => toggleLike(p.id)} aria-pressed={p.liked}>
                    <span aria-hidden="true">👍</span> {p.liked ? t('fb_unlike') : t('fb_like')}
                  </button>
                  <button className={`fb-action${expandedComments.has(p.id) ? ' active' : ''}`} onClick={() => toggleComments(p.id)} aria-expanded={expandedComments.has(p.id)}>
                    <span aria-hidden="true">💬</span> {t('fb_comment')}
                  </button>
                  <button className="fb-action" onClick={() => share(p.id)}>
                    <span aria-hidden="true">↗</span> {shareCopiedId === p.id ? t('link_copied') : t('fb_share')}
                  </button>
                </div>

                {expandedComments.has(p.id) && (
                  <div className="fb-comments">
                    {p.comments.map((c) => (
                      <div key={c.id} className="fb-comment">
                        {c.author === t('fb_you') ? (
                          <img className="fb-comment-avatar" src={avatar} alt="" />
                        ) : (
                          <span className="fb-comment-avatar fb-comment-initial" style={{ background: hueFor(c.author) }} aria-hidden="true">
                            {c.author.charAt(0)}
                          </span>
                        )}
                        <div className="fb-comment-body">
                          <span className="fb-comment-author">{c.author}</span> {c.text}
                          <div className="fb-comment-time">{c.time}</div>
                        </div>
                      </div>
                    ))}
                    <form
                      className="fb-composer"
                      onSubmit={(e) => { e.preventDefault(); submitComment(p.id); }}
                    >
                      <input
                        className="fb-composer-input"
                        value={drafts[p.id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder={t('fb_comment_placeholder')}
                        aria-label={t('fb_comment_placeholder')}
                      />
                      <button className="fb-composer-btn" type="submit" disabled={!(drafts[p.id] ?? '').trim()}>
                        {t('fb_comment')}
                      </button>
                    </form>
                  </div>
                )}
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
