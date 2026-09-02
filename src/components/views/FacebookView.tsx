import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import type { IGPost } from './InstagramView';
import './FacebookView.css';

type FBComment = { id: string; author: string; text: string; time: string };

type FBPost = {
  id: string;
  author: string;
  avatar: string;
  caption?: string;
  imageUrl?: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: FBComment[];
};

type FBTab = 'feed' | 'notifications' | 'requests' | 'messenger' | 'more';

const FALLBACK: FBPost[] = [
  {
    id: 'f1',
    author: 'ulinnuha.eth',
    avatar: '/img/avatar.jpg',
    caption: 'Morning hike. Life is good. 🌄',
    imageUrl: '/img/nature/image1.jpg',
    time: 'Yesterday',
    likes: 128,
    liked: false,
    comments: [
      { id: 'c1', author: 'Ahmad', text: 'Beautiful view! 🔥', time: '2h' },
      { id: 'c2', author: 'Sari', text: 'Where is this?', time: '1h' },
      { id: 'c3', author: 'Bagas', text: 'Take me next time 🙌', time: '45m' },
    ],
  },
  {
    id: 'f2',
    author: 'ulinnuha.eth',
    avatar: '/img/avatar.jpg',
    caption: 'Weekend vibes',
    imageUrl: '/img/nature/image4.jpg',
    time: 'Yesterday',
    likes: 47,
    liked: false,
    comments: [
      { id: 'c4', author: 'Dewi', text: 'Chill 🧘', time: '3h' },
    ],
  },
  {
    id: 'f3',
    author: 'ulinnuha.eth',
    avatar: '/img/avatar.jpg',
    caption: 'Golden hour',
    imageUrl: '/img/nature/image5.jpg',
    time: '2 days ago',
    likes: 3,
    liked: false,
    comments: [],
  },
  {
    id: 'f4',
    author: 'ulinnuha.eth',
    avatar: '/img/avatar.jpg',
    caption: 'Shipping something new soon…',
    time: '3 days ago',
    likes: 12,
    liked: false,
    comments: [
      { id: 'c5', author: 'Rizky', text: '👀👀', time: '2d' },
      { id: 'c6', author: 'Nadia', text: 'Excited!', time: '2d' },
    ],
  },
];

const NOTIFS: { id: string; icon: string; text: string; time: string }[] = [
  { id: 'n1', icon: '👍', text: 'Ahmad liked your photo.', time: '12m' },
  { id: 'n2', icon: '💬', text: 'Sari commented: "Where is this?"', time: '1h' },
  { id: 'n3', icon: '👥', text: 'Bagas accepted your friend request.', time: '3h' },
  { id: 'n4', icon: '👍', text: 'Dewi and 3 others liked your post.', time: '5h' },
];

type Props = { onBack: () => void };

function seedId(id: string) {
  // Deterministic "random-looking" like count per fetched post id.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 5 + (h % 120);
}

export default function FacebookView({ onBack }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<FBTab>('feed');
  const [posts, setPosts] = useState<FBPost[]>(FALLBACK);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Merge real photo posts from the CMS on top of the seeded feed.
  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=facebook')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: IGPost[]) => {
        if (!alive) return;
        const fetched: FBPost[] = data
          .filter((p) => !FALLBACK.some((f) => f.id === p.id))
          .map((p) => ({
            id: p.id,
            author: 'ulinnuha.eth',
            avatar: '/img/avatar.jpg',
            caption: p.caption || undefined,
            imageUrl: p.imageUrl,
            time: p.date,
            likes: seedId(p.id),
            liked: false,
            comments: [],
          }));
        setPosts([...fetched, ...FALLBACK]);
      })
      .catch(() => { if (alive) setPosts(FALLBACK); });
    return () => { alive = false; };
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

  return (
    <div className="app-view">
      <AppNav title="Facebook" onBack={onBack} />

      <div className="fb">
        {/* Top bar — dark blue, search + friends */}
        <div className="fb-topbar">
          <span className="fb-f-logo">
            <img src="/logo/facebook.svg" alt="" />
          </span>
          <span className="fb-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6b7a" strokeWidth="3" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" strokeLinecap="round" />
            </svg>
          </span>
          <span className="fb-friends-icon">👥</span>
        </div>

        {/* Status bar — Status / Photo / Check In */}
        <div className="fb-statusbar">
          <span className="fb-status-item">✏️ <b>{t('fb_status')}</b></span>
          <span className="fb-status-item">📷 <b>{t('fb_photo')}</b></span>
          <span className="fb-status-item">📍 <b>{t('fb_check_in')}</b></span>
        </div>

        {/* Feed */}
        {tab === 'feed' && (
          <div className="fb-feed">
            {posts.map((p) => (
              <article key={p.id} className="fb-post">
                <div className="fb-post-head">
                  <img className="fb-post-avatar" src={p.avatar} alt="" />
                  <div>
                    <div className="fb-post-name">{p.author}</div>
                    <div className="fb-post-time">{p.time}</div>
                  </div>
                </div>
                {p.caption && <p className="fb-post-caption">{p.caption}</p>}
                {p.imageUrl && <img className="fb-post-img" src={p.imageUrl} alt={p.caption ?? ''} loading="lazy" />}

                <div className="fb-post-engagement">
                  <span className="fb-eng-likes">👍 {p.likes}</span>
                  <span className="fb-eng-comments">{p.comments.length} {t('fb_comment')}</span>
                </div>

                <div className="fb-post-actions">
                  <button className={`fb-action${p.liked ? ' active' : ''}`} onClick={() => toggleLike(p.id)} aria-pressed={p.liked}>
                    <span>👍</span> {p.liked ? t('fb_unlike') : t('fb_like')}
                  </button>
                  <button className={`fb-action${expandedComments.has(p.id) ? ' active' : ''}`} onClick={() => toggleComments(p.id)} aria-expanded={expandedComments.has(p.id)}>
                    <span>💬</span> {t('fb_comment')}
                  </button>
                  <button className="fb-action">
                    <span>↗</span> {t('fb_share')}
                  </button>
                </div>

                {expandedComments.has(p.id) && (
                  <div className="fb-comments">
                    {p.comments.map((c) => (
                      <div key={c.id} className="fb-comment">
                        <img className="fb-comment-avatar" src="/img/avatar.jpg" alt="" />
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
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="fb-panel">
            {NOTIFS.length ? (
              NOTIFS.map((n) => (
                <div key={n.id} className="fb-notif">
                  <span className="fb-notif-icon">{n.icon}</span>
                  <div className="fb-notif-body">
                    <span>{n.text}</span>
                    <div className="fb-notif-time">{n.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="fb-empty">{t('fb_no_notifications')}</p>
            )}
          </div>
        )}

        {/* Placeholder tabs */}
        {tab === 'requests' && <p className="fb-empty fb-panel">{t('fb_no_requests')}</p>}
        {tab === 'messenger' && <p className="fb-empty fb-panel">{t('fb_messenger_empty')}</p>}
        {tab === 'more' && <p className="fb-empty fb-panel">{t('fb_more_placeholder')}</p>}

        {/* Bottom nav — 2015 dark blue bar */}
        <div className="fb-bottomnav">
          <button className={`fb-nav-item${tab === 'feed' ? ' active' : ''}`} onClick={() => setTab('feed')}>📰 <b>{t('fb_news_feed')}</b></button>
          <button className={`fb-nav-item${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>👥 <b>{t('fb_requests')}</b></button>
          <button className={`fb-nav-item${tab === 'messenger' ? ' active' : ''}`} onClick={() => setTab('messenger')}>💬 <b>{t('fb_messenger')}</b></button>
          <button className={`fb-nav-item${tab === 'notifications' ? ' active' : ''}`} onClick={() => setTab('notifications')}>🌐 <b>{t('fb_notifications')}</b></button>
          <button className={`fb-nav-item${tab === 'more' ? ' active' : ''}`} onClick={() => setTab('more')}>☰ <b>{t('fb_more')}</b></button>
        </div>
      </div>
    </div>
  );
}
