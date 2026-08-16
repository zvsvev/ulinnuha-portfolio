import AppNav from '../AppNav';
import { socials, contact } from '../../data/contact';
import './views.css';

type Props = { onBack: () => void };

export default function ContactView({ onBack }: Props) {
  return (
    <div className="app-view">
      <AppNav title="Contacts" onBack={onBack} />

      <div className="contact-hero">
        <div className="contact-avatar">🧑‍💻</div>
        <h1>Muhammad Ulinnuha</h1>
        <p className="contact-status">Available for work</p>
      </div>

      <div className="list-group">
        <a className="list-row" href={`mailto:${contact.email}`}>
          <span className="row-emoji">📧</span>
          <span className="row-label">Email</span>
          <span className="row-value">{contact.email}</span>
        </a>
        {socials.map((s) => (
          <a key={s.label} className="list-row" href={s.href} target="_blank" rel="noopener">
            <span className="row-emoji">{s.emoji}</span>
            <span className="row-label">{s.label}</span>
            <span className="chevron">›</span>
          </a>
        ))}
      </div>

      <div style={{ padding: '14px', textAlign: 'center' }}>
        <a className="ios-btn green" href={`mailto:${contact.email}`}>✉️ Send an email</a>
      </div>
    </div>
  );
}
