import { useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { notes } from '../../data/notes';
import './views.css';

type Props = { onBack: () => void };

const PREVIEW_LENGTH = 90;

export default function NotesView({ onBack }: Props) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notes.find((n) => n.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="app-view notes-app">
        <AppNav title={t('note')} onBack={() => setSelectedId(null)} />
        <div className="notes-paper">
          <article className="note-detail">
            <h2 className="note-detail-title">{selected.title}</h2>
            <time className="note-detail-date" dateTime={selected.datetime}>{selected.time}</time>
            <p className="note-detail-body">{selected.body}</p>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="app-view notes-app">
      <AppNav title={t('notes')} onBack={onBack} />

      <div className="notes-paper">
        <ul className="notes-list">
          {notes.map((n) => (
            <li key={n.id}>
              <button className="note-row" onClick={() => setSelectedId(n.id)}>
                <span className="note-row-head">
                  <span className="note-title">{n.title}</span>
                  <time className="note-date" dateTime={n.datetime}>{n.time}</time>
                </span>
                <span className="note-preview">
                  {n.body.length > PREVIEW_LENGTH ? `${n.body.slice(0, PREVIEW_LENGTH)}…` : n.body}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
