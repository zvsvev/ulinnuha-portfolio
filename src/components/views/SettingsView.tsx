import AppNav from '../AppNav';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../i18n/strings';
import './SettingsView.css';

type Props = { onBack: () => void };

export default function SettingsView({ onBack }: Props) {
  const { lang, setLang, theme, setTheme } = useApp();
  const { t } = useI18n();

  return (
    <div className="app-view">
      <AppNav title={t('settings')} onBack={onBack} />

      <h2 className="section-label">{t('language')}</h2>
      <div className="list-group settings-group">
        <button className="list-row settings-row" onClick={() => setLang('en')}>
          <span className="row-label">English</span>
          {lang === 'en' && <span className="row-check">✓</span>}
        </button>
        <button className="list-row settings-row" onClick={() => setLang('id')}>
          <span className="row-label">Bahasa Indonesia</span>
          {lang === 'id' && <span className="row-check">✓</span>}
        </button>
      </div>

      <h2 className="section-label">{t('appearance')}</h2>
      <div className="list-group settings-group">
        <button className="list-row settings-row" onClick={() => setTheme('light')}>
          <span className="row-label">☀️ {t('light')}</span>
          {theme === 'light' && <span className="row-check">✓</span>}
        </button>
        <button className="list-row settings-row" onClick={() => setTheme('dark')}>
          <span className="row-label">🌙 {t('dark')}</span>
          {theme === 'dark' && <span className="row-check">✓</span>}
        </button>
      </div>

      <p className="settings-hint">
        {lang === 'id'
          ? 'Preferensi disimpan di perangkat ini.'
          : 'Preferences are saved on this device.'}
      </p>
    </div>
  );
}
