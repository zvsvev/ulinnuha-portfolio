import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import { notes as defaultNotes, type Note } from '../../data/notes';
import './views.css';

type Props = { onBack: () => void };

const PREVIEW_LENGTH = 90;

export default function NotesView({ onBack }: Props) {
  const { t } = useI18n();
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    let alive = true;
    fetch('/api/notes')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { notes: Note[] | null }) => {
        // `null` means never configured, so the built-in default note stands.
        // An empty array is deliberate and renders a blank pad.
        if (alive && data.notes) setNotes(data.notes);
      })
      .catch(() => { /* no API (e.g. astro dev) — keep the defaults */ });
    return () => { alive = false; };
  }, []);

  if (selected) {
    return (
      <div className="app-view notes-app">
        <AppNav title={t('note')} onBack={() => setSelectedId(null)} />
        <div className="notes-paper">
          <article className="note-detail">
            <h2 className="note-detail-title">{selected.title}</h2>
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
