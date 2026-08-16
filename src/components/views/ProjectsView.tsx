import AppNav from '../AppNav';
import { projects } from '../../data/projects';
import type { AppId } from '../HomeScreen';
import './views.css';

type Props = { onBack: () => void; onOpen: (id: AppId) => void };

export default function ProjectsView({ onBack, onOpen }: Props) {
  return (
    <div className="app-view">
      <AppNav title="Projects" onBack={onBack} />

      <div className="projects-list">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            className="project-row"
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => p.appId ? onOpen(p.appId) : p.href && window.open(p.href, '_blank')}
          >
            <span className="project-face" aria-hidden="true">
              <span className="project-emoji">{p.emoji}</span>
              <span className="appicon-glass" />
            </span>
            <span className="project-body">
              <span className="project-title">{p.title}</span>
              <span className="project-desc">{p.description}</span>
              <span className="project-tags">
                {p.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
              </span>
            </span>
            <span className="chevron">›</span>
          </button>
        ))}
      </div>

      <p className="more-note">More projects on <a href="https://github.com/zvsvev" target="_blank" rel="noopener">GitHub</a>.</p>
    </div>
  );
}
