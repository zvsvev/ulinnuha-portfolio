import './AppIcon.css';

type Props = {
  emoji: string;
  icon?: string;
  label: string;
  bg: string;
  size?: 'grid' | 'dock';
  onClick?: () => void;
};

/** Skeuomorphic iOS app icon with glass highlight. */
export default function AppIcon({ emoji, icon, label, bg, size = 'grid', onClick }: Props) {
  return (
    <button type="button" className={`appicon ${size}`} onClick={onClick} aria-label={label}>
      <span className="appicon-face" style={{ background: bg }}>
        {icon ? (
          <img className="appicon-img" src={icon} alt="" draggable={false} />
        ) : (
          <span className="appicon-emoji">{emoji}</span>
        )}
        <span className="appicon-glass" />
      </span>
      {size === 'grid' && <span className="appicon-label">{label}</span>}
    </button>
  );
}
