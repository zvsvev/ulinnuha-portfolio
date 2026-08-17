import AppIcon from './AppIcon';
import { useI18n, type StringKey } from '../i18n/strings';
import './HomeScreen.css';

export type AppId =
  | 'about' | 'projects' | 'photos' | 'notes' | 'contacts'
  | 'instagram' | 'facebook' | 'calculator' | 'settings'
  | 'padel' | 'tts';

type AppDef = { id: AppId; emoji: string; labelKey: StringKey; bg: string };

const APPS: AppDef[] = [
  { id: 'about', emoji: '👤', labelKey: 'about', bg: 'linear-gradient(180deg,#6ea5ff,#2f7be8)' },
  { id: 'projects', emoji: '📁', labelKey: 'projects', bg: 'linear-gradient(180deg,#f2b86a,#d97a2b)' },
  { id: 'photos', emoji: '🌸', labelKey: 'photos', bg: 'linear-gradient(180deg,#fdf1c7,#e8b93c)' },
  { id: 'notes', emoji: '📝', labelKey: 'notes', bg: 'linear-gradient(180deg,#fffdf2,#f5e9b8)' },
  { id: 'contacts', emoji: '📇', labelKey: 'contacts', bg: 'linear-gradient(180deg,#d8d8d8,#a8a8a8)' },
  { id: 'instagram', emoji: '📷', labelKey: 'instagram', bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)' },
  { id: 'facebook', emoji: '📘', labelKey: 'facebook', bg: 'linear-gradient(180deg,#5b7bd6,#3b5998)' },
  { id: 'calculator', emoji: '🧮', labelKey: 'calculator', bg: 'linear-gradient(180deg,#4a4a4a,#1a1a1a)' },
  { id: 'settings', emoji: '⚙️', labelKey: 'settings', bg: 'linear-gradient(180deg,#9e9e9e,#6e6e6e)' },
];

type DockDef = { id: string; emoji: string; label: string; bg: string; href: string };

const DOCK: DockDef[] = [
  { id: 'call', emoji: '📞', label: 'Phone', bg: 'linear-gradient(180deg,#9bd45f,#4a9a28)', href: 'mailto:hi@ulinnuha.id' },
  { id: 'mail', emoji: '✉️', label: 'Mail', bg: 'linear-gradient(180deg,#7aa7f5,#2f6fd0)', href: 'mailto:hi@ulinnuha.id' },
  { id: 'safari', emoji: '🧭', label: 'Safari', bg: 'linear-gradient(180deg,#aee4f5,#2a9dc4)', href: 'https://github.com/zvsvev' },
  { id: 'github', emoji: '🐙', label: 'GitHub', bg: 'linear-gradient(180deg,#4a4a4a,#1a1a1a)', href: 'https://github.com/zvsvev' },
];

type Props = {
  onOpen: (id: AppId) => void;
};

export default function HomeScreen({ onOpen }: Props) {
  const { t } = useI18n();
  return (
    <div className="home">
      <div className="app-grid">
        {APPS.map((app) => (
          <AppIcon key={app.id} emoji={app.emoji} label={t(app.labelKey)} bg={app.bg} onClick={() => onOpen(app.id)} />
        ))}
      </div>
      <div className="dock">
        {DOCK.map((app) => (
          <a key={app.id} className="dock-link" href={app.href} aria-label={app.label} onClick={app.href.startsWith('http') || app.href.startsWith('mailto') ? undefined : (e) => { e.preventDefault(); onOpen(app.id as AppId); }}>
            <AppIcon emoji={app.emoji} label={app.label} bg={app.bg} size="dock" />
          </a>
        ))}
      </div>
    </div>
  );
}
