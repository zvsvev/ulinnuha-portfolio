import './AppIcon.css';

type Props = {
  emoji: string;
  icon?: string;
  label: string;
  bg: string;
  size?: 'grid' | 'dock';
  onClick?: () => void;
  href?: string;
};

/** Skeuomorphic iOS app icon with glass highlight. */
export default function AppIcon({ emoji, icon, label, bg, size = 'grid', onClick, href }: Props) {
  const face = (
    <>
      <span className="appicon-face" style={{ background: bg }}>
        {icon ? (
          <img className="appicon-img" src={icon} alt="" draggable={false} />
        ) : (
          <span className="appicon-emoji">{emoji}</span>
        )}
        <span className="appicon-glass" />
      </span>
      {size === 'grid' && <span className="appicon-label">{label}</span>}
    </>
  );

  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        className={`appicon ${size}`}
        href={href}
        aria-label={label}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {face}
      </a>
    );
  }

  return (
    <button type="button" className={`appicon ${size}`} onClick={onClick} aria-label={label}>
      {face}
    </button>
  );
}
