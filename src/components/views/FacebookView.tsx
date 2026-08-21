import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import type { IGPost } from './InstagramView';
import './FacebookView.css';

const FALLBACK: IGPost[] = [
  { id: 'f1', imageUrl: '/img/nature/image1.jpg', caption: 'Morning hike. Life is good. 🌄', date: '2025-01-01' },
  { id: 'f2', imageUrl: '/img/nature/image4.jpg', caption: 'Weekend vibes', date: '2025-01-02' },
  { id: 'f3', imageUrl: '/img/nature/image5.jpg', caption: 'Golden hour', date: '2025-01-03' },
  { id: 'f4', imageUrl: '/img/nature/image6.jpg', caption: 'Almost there', date: '2025-01-04' },
];

type Props = { onBack: () => void };

export default function FacebookView({ onBack }: Props) {
  const [posts, setPosts] = useState<IGPost[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=facebook')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: IGPost[]) => { if (alive) setPosts(data.length ? data : FALLBACK); })
      .catch(() => { if (alive) setPosts(FALLBACK); });
    return () => { alive = false; };
  }, []);

  const shown = posts ?? FALLBACK;

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
          <span className="fb-status-item">✏️ <b>Status</b></span>
          <span className="fb-status-item">📷 <b>Photo</b></span>
          <span className="fb-status-item">📍 <b>Check In</b></span>
        </div>

        {/* Feed */}
        <div className="fb-feed">
          {shown.map((p) => (
            <article key={p.id} className="fb-post">
              <div className="fb-post-head">
                <img className="fb-post-avatar" src="/img/avatar.jpg" alt="" />
                <div>
                  <div className="fb-post-name">ulinnuha.eth</div>
                  <div className="fb-post-time">{p.date}</div>
                </div>
              </div>
              <p className="fb-post-caption">{p.caption}</p>
              <img className="fb-post-img" src={p.imageUrl} alt={p.caption} loading="lazy" />
              <div className="fb-post-actions">
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>↗ Share</span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom nav — 2015 dark blue bar */}
        <div className="fb-bottomnav">
          <span className="fb-nav-item active">📰 <b>News Feed</b></span>
          <span className="fb-nav-item">👥 Requests</span>
          <span className="fb-nav-item">💬 Messenger</span>
          <span className="fb-nav-item">🌐 Notifications</span>
          <span className="fb-nav-item">☰ More</span>
        </div>
      </div>
    </div>
  );
}
