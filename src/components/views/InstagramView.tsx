import { useEffect, useRef, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { useAvatar } from '../../hooks/useAvatar';
import './InstagramView.css';

export type IGPost = {
  id: string;
  imageUrl: string;
  /** Small rendition for grid tiles; falls back to imageUrl on older posts. */
  thumbUrl?: string;
  caption: string;
  date: string;
};

type Props = { onBack: () => void };

const PROFILE_URL = 'https://instagram.com/ulinnuha.eth';
const COPY_FEEDBACK_MS = 2000;

// Last-known real values (from the live fetch when it succeeds). Shown as
// fallback so the mock app never looks broken if the proxy is unreachable.
const KNOWN = { followers: 305, following: 364 };

type LiveStats = { followers: number | null; following: number | null; posts: number | null; stale?: boolean };

export default function InstagramView({ onBack }: Props) {
  const { t } = useI18n();
  const avatar = useAvatar();
  const [posts, setPosts] = useState<IGPost[] | null>(null);
  const [selected, setSelected] = useState<IGPost | null>(null);
  const [live, setLive] = useState<LiveStats>({ followers: null, following: null, posts: null });
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* clipboard unavailable — nothing to show */
    }
  };

  // Close the lightbox on Escape and move focus into the dialog.
  useEffect(() => {
    if (!selected) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=instagram')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: IGPost[]) => { if (alive) setPosts(data); })
      .catch(() => { if (alive) setPosts([]); });
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

  const shown = posts ?? [];
  // Live values when available; otherwise fall back to last-known numbers so
  // the mock app always shows something sensible (login wall → null → known).
  const followers = live.followers ?? KNOWN.followers;
  const following = live.following ?? KNOWN.following;
  const liveFresh = live.followers != null && !live.stale;

  return (
    <div className="app-view">
      <AppNav title={t('instagram')} onBack={onBack} />

      <div className="ig">
        {/* Header — classic brown camera + username */}
        <div className="ig-header">
          <img className="ig-logo" src="/logo/instagram.png" alt="" />
          <span className="ig-user">ulinnuha.eth</span>
          <button className="ig-actions" onClick={copyProfileLink} aria-label={t('copy_link')}>
            ⋯
          </button>
        </div>

        {copied && <p className="ig-toast" role="status">{t('link_copied')}</p>}

        {/* Profile */}
        <div className="ig-profile">
          <div className="ig-avatar-wrap">
            <img className="ig-avatar" src={avatar} alt="ulinnuha.eth" />
          </div>
          <div className="ig-stats">
            <div><b>{shown.length}</b><span>{t('posts')}</span></div>
            <div><b>{followers}</b><span>{t('followers')}</span></div>
            <div><b>{following}</b><span>{t('following')}</span></div>
          </div>
        </div>

        <div className="ig-bio">
          <b>Muhammad Ulin Nuha</b>
        </div>

        <button
          className={`ig-follow-btn${isFollowing ? ' following' : ''}`}
          onClick={() => setIsFollowing((v) => !v)}
          aria-pressed={isFollowing}
        >
          {isFollowing ? t('following_active') : t('follow')}
          {liveFresh && <span className="ig-live">live</span>}
        </button>

        {/* Photo grid */}
        {shown.length === 0 ? (
          <p className="empty-feed">{t('no_posts_yet')}</p>
        ) : (
          <div className="ig-grid">
            {shown.map((p) => (
              <button
                key={p.id}
                className="ig-tile"
                onClick={() => setSelected(p)}
                aria-label={p.caption || p.date}
              >
                <img src={p.thumbUrl ?? p.imageUrl} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div className="ig-lightbox" role="dialog" aria-modal="true" aria-label={t('photo')} onClick={() => setSelected(null)}>
          <div className="ig-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button ref={closeButtonRef} className="ig-lightbox-close" onClick={() => setSelected(null)} aria-label={t('close')}>
              ✕
            </button>
            <img src={selected.imageUrl} alt={selected.caption} decoding="async" />
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
