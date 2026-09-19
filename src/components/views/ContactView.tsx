import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { useAvatar } from '../../hooks/useAvatar';
import { socials, contact } from '../../data/contact';
import './views.css';

type Props = { onBack: () => void };

export default function ContactView({ onBack }: Props) {
  const { t } = useI18n();
  const avatar = useAvatar();

  return (
    <div className="app-view">
      <AppNav title={t('contacts')} onBack={onBack} />

      <div className="contact-hero">
        <img className="contact-avatar" src={avatar} alt="Muhammad Ulinnuha" width="84" height="84" />
        <h1>Muhammad Ulinnuha</h1>
      </div>

      <div className="list-group">
        <a className="list-row" href={`mailto:${contact.email}`}>
          <span className="row-emoji" aria-hidden="true">📧</span>
          <span className="row-label">{t('email')}</span>
          <span className="row-value">{contact.email}</span>
        </a>
        <div className="list-row list-row-static">
          <span className="row-emoji" aria-hidden="true">📍</span>
          <span className="row-label">{t('location')}</span>
          <span className="row-value">{contact.location}</span>
        </div>
        {socials.map((s) => (
          <a key={s.id} className="list-row" href={s.href} target="_blank" rel="noopener noreferrer">
            <span className="row-emoji" aria-hidden="true">{s.emoji}</span>
            <span className="row-label">{s.label}</span>
            <span className="chevron" aria-hidden="true">›</span>
          </a>
        ))}
      </div>

      <div className="contact-cta">
        <a className="ios-btn green" href={`mailto:${contact.email}`}>
          <span aria-hidden="true">✉️ </span>{t('send_email')}
        </a>
      </div>
    </div>
  );
}
