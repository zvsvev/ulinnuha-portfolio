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

      <h2 className="section-label" id="settings-language">{t('language')}</h2>
      <div className="list-group settings-group" role="radiogroup" aria-labelledby="settings-language">
        <button
          className="list-row settings-row"
          role="radio"
          aria-checked={lang === 'en'}
          onClick={() => setLang('en')}
        >
          <span className="row-label">English</span>
          {lang === 'en' && <span className="row-check" aria-hidden="true">✓</span>}
        </button>
        <button
          className="list-row settings-row"
          role="radio"
          aria-checked={lang === 'id'}
          onClick={() => setLang('id')}
        >
          <span className="row-label">Bahasa Indonesia</span>
          {lang === 'id' && <span className="row-check" aria-hidden="true">✓</span>}
        </button>
      </div>

      <h2 className="section-label" id="settings-appearance">{t('appearance')}</h2>
      <div className="list-group settings-group" role="radiogroup" aria-labelledby="settings-appearance">
        <button
          className="list-row settings-row"
          role="radio"
          aria-checked={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          <span className="row-label"><span aria-hidden="true">☀️ </span>{t('light')}</span>
          {theme === 'light' && <span className="row-check" aria-hidden="true">✓</span>}
        </button>
        <button
          className="list-row settings-row"
          role="radio"
          aria-checked={theme === 'dark'}
          onClick={() => setTheme('dark')}
        >
          <span className="row-label"><span aria-hidden="true">🌙 </span>{t('dark')}</span>
          {theme === 'dark' && <span className="row-check" aria-hidden="true">✓</span>}
        </button>
      </div>
    </div>
  );
}
