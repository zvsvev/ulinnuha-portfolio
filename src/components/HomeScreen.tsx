import AppIcon from './AppIcon';
import { useI18n, type StringKey } from '../i18n/strings';
import { contact, socialHref } from '../data/contact';
import './HomeScreen.css';

export type AppId =
  | 'about' | 'projects' | 'notes' | 'contacts'
  | 'instagram' | 'facebook' | 'calculator' | 'settings'
  | 'padel' | 'tts';

type AppDef = { id: AppId; emoji: string; icon?: string; labelKey: StringKey; bg: string };

const APPS: AppDef[] = [
  { id: 'about', emoji: '👤', labelKey: 'about', bg: 'linear-gradient(180deg,#6ea5ff,#2f7be8)' },
  { id: 'projects', emoji: '📁', labelKey: 'projects', bg: 'linear-gradient(180deg,#f2b86a,#d97a2b)' },
  { id: 'notes', emoji: '📝', labelKey: 'notes', bg: 'linear-gradient(180deg,#fffdf2,#f5e9b8)' },
  { id: 'contacts', emoji: '📇', labelKey: 'contacts', bg: 'linear-gradient(180deg,#d8d8d8,#a8a8a8)' },
  { id: 'instagram', emoji: '📷', icon: '/logo/instagram.png', labelKey: 'instagram', bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)' },
  { id: 'facebook', emoji: '📘', icon: '/logo/facebook.svg', labelKey: 'facebook', bg: 'linear-gradient(180deg,#5b7bd6,#3b5998)' },
  { id: 'calculator', emoji: '🧮', labelKey: 'calculator', bg: 'linear-gradient(180deg,#4a4a4a,#1a1a1a)' },
  { id: 'settings', emoji: '⚙️', labelKey: 'settings', bg: 'linear-gradient(180deg,#9e9e9e,#6e6e6e)' },
];

type DockDef = { id: string; emoji: string; labelKey: StringKey; bg: string; href: string };

const DOCK: DockDef[] = [
  { id: 'mail', emoji: '✉️', labelKey: 'mail', bg: 'linear-gradient(180deg,#7aa7f5,#2f6fd0)', href: `mailto:${contact.email}` },
  { id: 'github', emoji: '🐙', labelKey: 'github', bg: 'linear-gradient(180deg,#4a4a4a,#1a1a1a)', href: socialHref('github') },
  { id: 'telegram', emoji: '✈️', labelKey: 'telegram', bg: 'linear-gradient(180deg,#8fd3f4,#2a9dc4)', href: socialHref('telegram') },
  { id: 'instagram', emoji: '📸', labelKey: 'instagram', bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)', href: socialHref('instagram') },
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
          <AppIcon key={app.id} emoji={app.emoji} icon={app.icon} label={t(app.labelKey)} bg={app.bg} onClick={() => onOpen(app.id)} />
        ))}
      </div>
      <div className="dock">
        {DOCK.map((app) => (
          <AppIcon key={app.id} emoji={app.emoji} label={t(app.labelKey)} bg={app.bg} size="dock" href={app.href} />
        ))}
      </div>
    </div>
  );
}
