import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { socials, contact } from '../../data/contact';
import { projects } from '../../data/projects';
import { stack } from '../../data/stack';
import type { AppId } from '../HomeScreen';
import './views.css';

type Props = { onBack: () => void; onOpen: (id: AppId) => void };

const BIO =
  'Software engineer and fullstack developer. I build web apps, smart-contract experiments, and the occasional mobile game — open to freelance, full-time roles, and collaborations.';

export default function AboutView({ onBack, onOpen }: Props) {
  const { t } = useI18n();
  const featured = projects.filter((p) => p.featured);

  return (
    <div className="app-view">
      <AppNav title={t('about')} onBack={onBack} />

      <div className="profile">
        <img src="/img/avatar.jpg" alt="Muhammad Ulinnuha" className="avatar" width="80" height="80" />
        <div>
          <h1 className="name">Muhammad Ulinnuha</h1>
          <p className="role">Software engineer &amp; vibecoder</p>
        </div>
      </div>

      <div className="list-group">
        <div className="bio-row">
          <p>{BIO}</p>
        </div>
        <div className="list-row list-row-static">
          <span className="row-emoji" aria-hidden="true">📍</span>
          <span className="row-label">{t('based_in')}</span>
          <span className="row-value">{contact.location}</span>
        </div>
        <a className="list-row" href={`mailto:${contact.email}`}>
          <span className="row-emoji" aria-hidden="true">📧</span>
          <span className="row-label">{t('email')}</span>
          <span className="row-value">{contact.email}</span>
        </a>
      </div>

      <h2 className="section-label">{t('stack')}</h2>
      <div className="skill-grid">
        {stack.map((s) => (
          <span key={s} className="skill-chip">{s}</span>
        ))}
      </div>

      <h2 className="section-label">{t('featured')}</h2>
      <div className="list-group">
        {featured.map((p) => {
          const inner = (
            <>
              <span className="row-emoji" aria-hidden="true">{p.emoji}</span>
              <span className="row-label">{p.title}</span>
              <span className="chevron" aria-hidden="true">›</span>
            </>
          );
          const { appId, href } = p;
          if (appId) {
            return (
              <button key={p.slug} className="list-row list-row-btn" onClick={() => onOpen(appId)}>
                {inner}
              </button>
            );
          }
          if (href) {
            return (
              <a key={p.slug} className="list-row" href={href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <div key={p.slug} className="list-row list-row-static">
              {inner}
            </div>
          );
        })}
      </div>

      <h2 className="section-label">{t('find_me')}</h2>
      <div className="list-group">
        {socials.map((s) => (
          <a key={s.id} className="list-row" href={s.href} target="_blank" rel="noopener noreferrer">
            <span className="row-emoji" aria-hidden="true">{s.emoji}</span>
            <span className="row-label">{s.label}</span>
            <span className="chevron" aria-hidden="true">›</span>
          </a>
        ))}
      </div>
    </div>
  );
}
