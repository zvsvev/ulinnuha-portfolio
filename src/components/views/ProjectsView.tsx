import { useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { localeFor } from '../../i18n/locale';
import { projects } from '../../data/projects';
import type { AppId } from '../HomeScreen';
import './views.css';

type Props = { onBack: () => void; onOpen: (id: AppId) => void };

/** "2025-03" → "March 2025" (localised). */
function formatMonth(created: string, locale: string): string {
  const [year, month] = created.split('-').map(Number);
  if (!year || !month) return created;
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export default function ProjectsView({ onBack, onOpen }: Props) {
  const { t, lang } = useI18n();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected = projects.find((p) => p.slug === selectedSlug) ?? null;

  if (selected) {
    const { appId, href } = selected;
    return (
      <div className="app-view">
        <AppNav title={selected.title} onBack={() => setSelectedSlug(null)} />

        <div className="project-detail">
          <h2 className="project-detail-title">{selected.title}</h2>
          <time className="project-detail-month" dateTime={selected.created}>
            {formatMonth(selected.created, localeFor(lang))}
          </time>
          <p className="project-detail-desc">{selected.description}</p>

          {href ? (
            <a className="ios-btn" href={href} target="_blank" rel="noopener noreferrer">
              {t('open_project')}
            </a>
          ) : appId ? (
            <button className="ios-btn green" onClick={() => onOpen(appId)}>
              {t('open_app')}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-view">
      <AppNav title={t('projects')} onBack={onBack} />

      <div className="projects-list">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            className="project-item"
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => setSelectedSlug(p.slug)}
          >
            <span className="project-item-title">{p.title}</span>
            <span className="project-item-short">{p.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
