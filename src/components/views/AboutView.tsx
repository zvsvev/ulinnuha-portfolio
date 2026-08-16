import AppNav from '../AppNav';
import { socials } from '../../data/contact';
import { projects } from '../../data/projects';
import type { AppId } from '../HomeScreen';
import './views.css';

type Props = { onBack: () => void; onOpen: (id: AppId) => void };

export default function AboutView({ onBack, onOpen }: Props) {
  return (
    <div className="app-view">
      <AppNav title="About" onBack={onBack} />

      <div className="profile">
        <img src="/img/avatar.jpg" alt="Muhammad Ulinnuha" className="avatar" width="80" height="80" />
        <div>
          <h1 className="name">Muhammad<br />Ulinnuha</h1>
          <p className="role">Just a Vibecoder</p>
        </div>
      </div>

      <div className="list-group">
        <div className="bio-row">
          <p>
            Software engineer &amp; fullstack developer. I build web apps, smart-contract
            experiments, and the occasional mobile game — currently available for freelance,
            full-time roles, and collaborations.
          </p>
        </div>
        <div className="list-row">
          <span className="row-emoji">📍</span>
          <span className="row-label">Based in</span>
          <span className="row-value">Indonesia</span>
        </div>
        <div className="list-row">
          <span className="row-emoji">📧</span>
          <span className="row-label">Email</span>
          <span className="row-value">hi@ulinnuha.id</span>
        </div>
      </div>

      <h2 className="section-label">Stack</h2>
      <div className="skill-grid">
        {['Go', 'Vue', 'React', 'Node.js', 'PostgreSQL', 'Solidity', 'C / C++', 'JavaScript', 'Redis', 'Tailwind'].map((s) => (
          <span key={s} className="skill-chip">{s}</span>
        ))}
      </div>

      <h2 className="section-label">Featured</h2>
      <div className="list-group">
        {projects.filter((p) => p.featured).map((p) => (
          <button key={p.slug} className="list-row list-row-btn" onClick={() => p.appId ? onOpen(p.appId) : window.open(p.href, '_blank')}>
            <span className="row-emoji">{p.emoji}</span>
            <span className="row-label">{p.title}</span>
            <span className="chevron">›</span>
          </button>
        ))}
      </div>

      <h2 className="section-label">Find me</h2>
      <div className="list-group">
        {socials.map((s) => (
          <a key={s.label} className="list-row" href={s.href} target="_blank" rel="noopener">
            <span className="row-emoji">{s.emoji}</span>
            <span className="row-label">{s.label}</span>
            <span className="chevron">›</span>
          </a>
        ))}
      </div>
    </div>
  );
}
