import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import './InstagramView.css';

export type IGPost = {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
};

const FALLBACK: IGPost[] = [
  { id: 'fb-1', imageUrl: '/img/nature/image1.jpg', caption: 'sunrise ☀️', date: '2025-01-01' },
  { id: 'fb-2', imageUrl: '/img/nature/image2.jpg', caption: 'trees', date: '2025-01-02' },
  { id: 'fb-3', imageUrl: '/img/nature/image3.jpg', caption: 'hiking', date: '2025-01-03' },
  { id: 'fb-4', imageUrl: '/img/nature/image4.jpg', caption: 'view', date: '2025-01-04' },
  { id: 'fb-5', imageUrl: '/img/nature/image5.jpg', caption: 'nature', date: '2025-01-05' },
  { id: 'fb-6', imageUrl: '/img/nature/image6.jpg', caption: 'golden hour', date: '2025-01-06' },
];

type Props = { onBack: () => void };

// Last-known real values (from the live fetch when it succeeds). Shown as
// fallback so the mock app never looks broken if the proxy is unreachable.
const KNOWN = { followers: 305, following: 364 };

type LiveStats = { followers: number | null; following: number | null; posts: number | null; stale?: boolean };

export default function InstagramView({ onBack }: Props) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<IGPost[] | null>(null);
  const [selected, setSelected] = useState<IGPost | null>(null);
  const [live, setLive] = useState<LiveStats>({ followers: null, following: null, posts: null });

  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=instagram')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: IGPost[]) => { if (alive) setPosts(data.length ? data : FALLBACK); })
      .catch(() => { if (alive) setPosts(FALLBACK); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/instagram/profile')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: LiveStats) => { if (alive) setLive(d); })
      .catch(() => { /* proxy unreachable — fall back to KNOWN values */ });
    return () => { alive = false; };
  }, []);

  const shown = posts ?? FALLBACK;
  // Live values when available; otherwise fall back to last-known numbers so
  // the mock app always shows something sensible (login wall → null → known).
  const followers = live.followers ?? KNOWN.followers;
  const following = live.following ?? KNOWN.following;
  const liveFresh = live.followers != null && !live.stale;

  return (
    <div className="app-view">
      <AppNav title="Instagram" onBack={onBack} />

      <div className="ig">
        {/* Header — classic brown camera + username */}
        <div className="ig-header">
          <img className="ig-logo" src="/logo/instagram.svg" alt="" />
          <span className="ig-user">ulinnuha.eth</span>
          <span className="ig-actions">⋯</span>
        </div>

        {/* Profile */}
        <div className="ig-profile">
          <div className="ig-avatar-wrap">
            <img className="ig-avatar" src="/img/avatar.jpg" alt="ulinnuha.eth" />
          </div>
          <div className="ig-stats">
            <div><b>{shown.length}</b><span>{t('posts')}</span></div>
            <div><b>{followers}</b><span>{t('followers')}</span></div>
            <div><b>{following}</b><span>{t('following')}</span></div>
          </div>
        </div>

        <div className="ig-bio">
          <b>Muhammad Ulinnuha</b>
          <span>vibecoder 🌱</span>
        </div>

        <button className="ig-follow-btn">
          {t('follow')}
          {liveFresh && <span className="ig-live">live</span>}
        </button>

        {/* Photo grid */}
        <div className="ig-grid">
          {shown.map((p) => (
            <button key={p.id} className="ig-tile" onClick={() => setSelected(p)}>
              <img src={p.imageUrl} alt={p.caption} loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div className="ig-lightbox" onClick={() => setSelected(null)}>
          <div className="ig-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <img src={selected.imageUrl} alt={selected.caption} />
            <div className="ig-lightbox-caption">
              <b>ulinnuha.eth</b> {selected.caption}
            </div>
            <div className="ig-lightbox-date">{selected.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}
