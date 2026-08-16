import './AppNav.css';

type Props = {
  title: string;
  onBack: () => void;
  action?: string;
  onAction?: () => void;
};

/** In-app navigation bar with a Home back button. */
export default function AppNav({ title, onBack, action, onAction }: Props) {
  return (
    <header className="app-nav">
      <button className="nav-back" onClick={onBack}>◀ Home</button>
      <span className="nav-title">{title}</span>
      {action && onAction ? (
        <button className="nav-action" onClick={onAction}>{action}</button>
      ) : (
        <span className="nav-action" />
      )}
    </header>
  );
}
