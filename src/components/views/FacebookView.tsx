import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import type { IGPost } from './InstagramView';
import './FacebookView.css';

const FALLBACK: IGPost[] = [
  { id: 'f1', imageUrl: '/img/nature/image1.jpg', caption: 'Morning hike. Life is good. 🌄', date: '2025-01-01' },
  { id: 'f2', imageUrl: '/img/nature/image4.jpg', caption: 'Weekend vibes', date: '2025-01-02' },
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
        {/* Blue header */}
        <div className="fb-header">
          <span className="fb-logo">facebook</span>
          <span className="fb-icons">🔍 ✉️</span>
        </div>

        {/* Cover + profile */}
        <div className="fb-cover-wrap">
          <img className="fb-cover" src="/img/nature/image6.jpg" alt="cover" />
          <div className="fb-profile-row">
            <img className="fb-avatar" src="/img/avatar.jpg" alt="ulinnuha.eth" />
            <span className="fb-name">ulinnuha.eth</span>
          </div>
        </div>

        <div className="fb-tabs">
          <span className="fb-tab active">Timeline</span>
          <span className="fb-tab">About</span>
          <span className="fb-tab">Photos</span>
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
      </div>
    </div>
  );
}
