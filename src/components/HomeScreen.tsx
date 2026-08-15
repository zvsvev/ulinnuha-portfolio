import { useState } from 'react';
import './HomeScreen.css';

type App = {
  id: string;
  emoji: string;
  label: string;
  href: string;
  bg: string;
};

const APPS: App[] = [
  { id: 'about', emoji: '👤', label: 'About', href: '/about', bg: 'linear-gradient(180deg,#6ea5ff,#2f7be8)' },
  { id: 'projects', emoji: '📁', label: 'Projects', href: '/projects', bg: 'linear-gradient(180deg,#f2b86a,#d97a2b)' },
  { id: 'photos', emoji: '🌸', label: 'Photos', href: '/gallery', bg: 'linear-gradient(180deg,#fdf1c7,#e8b93c)' },
  { id: 'notes', emoji: '📝', label: 'Notes', href: '/notes', bg: 'linear-gradient(180deg,#fffdf2,#f5e9b8)' },
  { id: 'contacts', emoji: '📇', label: 'Contacts', href: '/contact', bg: 'linear-gradient(180deg,#d8d8d8,#a8a8a8)' },
];

const DOCK: App[] = [
  { id: 'call', emoji: '📞', label: 'Phone', href: 'mailto:hi@ulinnuha.id', bg: 'linear-gradient(180deg,#9bd45f,#4a9a28)' },
  { id: 'mail', emoji: '✉️', label: 'Mail', href: 'mailto:hi@ulinnuha.id', bg: 'linear-gradient(180deg,#7aa7f5,#2f6fd0)' },
  { id: 'safari', emoji: '🧭', label: 'Safari', href: '/', bg: 'linear-gradient(180deg,#aee4f5,#2a9dc4)' },
  { id: 'github', emoji: '🐙', label: 'GitHub', href: 'https://github.com/zvsvev', bg: 'linear-gradient(180deg,#4a4a4a,#1a1a1a)' },
];

export default function HomeScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [time, setTime] = useState('9:41');

  const THRESHOLD = 130;

  const onPointerDown = (e: React.PointerEvent) => {
    if (unlocked) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || unlocked) return;
    const dx = e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left;
    setDragX(Math.max(0, Math.min(dx, 240)));
  };

  const onPointerUp = () => {
    if (dragging) {
      if (dragX >= THRESHOLD) {
        setUnlocked(true);
        setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      }
      setDragging(false);
      setDragX(0);
    }
  };

  return (
    <div className="homescreen">
      {/* Lock screen overlay */}
      {!unlocked && (
        <div className="lockscreen" role="button" tabIndex={0}
          aria-label="Slide to unlock"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setUnlocked(true); }}
        >
          <div className="lock-time">{time}</div>
          <div className="lock-date">Friday, August 15</div>
          <div className="slide-to-unlock"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ '--slide-x': `${dragX}px` } as React.CSSProperties}
          >
            <span className="slide-text">slide to unlock</span>
            <span className="slide-arrow" aria-hidden="true">»</span>
          </div>
        </div>
      )}

      {/* Home screen */}
      {unlocked && (
        <div className="home">
          <div className="app-grid">
            {APPS.map((app) => (
              <a key={app.id} className="app-icon" href={app.href} aria-label={app.label}>
                <span className="app-face" style={{ background: app.bg }}>
                  <span className="app-emoji">{app.emoji}</span>
                  <span className="app-glass" />
                </span>
                <span className="app-label">{app.label}</span>
              </a>
            ))}
          </div>
          <div className="dock">
            {DOCK.map((app) => (
              <a key={app.id} className="dock-icon" href={app.href} aria-label={app.label}>
                <span className="app-face" style={{ background: app.bg }}>
                  <span className="app-emoji">{app.emoji}</span>
                  <span className="app-glass" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
