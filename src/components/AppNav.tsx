import './AppNav.css';

type Props = {
  title: string;
  onBack: () => void;
  action?: string;
  onAction?: () => void;
};

/** In-app navigation bar with a Home back button (iOS 2009 chevron). */
export default function AppNav({ title, onBack, action, onAction }: Props) {
  return (
    <header className="app-nav">
      <button className="nav-back" onClick={onBack}>
        <svg width="13" height="20" viewBox="0 0 13 20" aria-hidden="true" className="nav-back-chevron">
          <path d="M11 1 L2 10 L11 19" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Home
      </button>
      <span className="nav-title">{title}</span>
      {action && onAction ? (
        <button className="nav-action" onClick={onAction}>{action}</button>
      ) : (
        <span className="nav-action" />
      )}
    </header>
  );
}
