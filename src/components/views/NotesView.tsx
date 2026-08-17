import { useState } from 'react';
import AppNav from '../AppNav';
import './views.css';

const NOTES = [
  {
    id: 'note-1',
    title: 'How this site works',
    body: 'The whole portfolio is an old iPhone. Unlock it, tap around. Built with Astro + React on Cloudflare Pages — no servers, just vibes.\n\nEvery app you see — Instagram, Facebook, Photos, Notes — is a React view inside one page. Content you upload in the admin panel appears here automatically.',
    time: 'Yesterday',
  },
  {
    id: 'note-2',
    title: 'Currently',
    body: 'Freelance + full-time opportunities open. Building on Solana, tinkering with C, vibecoding everything else.\n\nStack: Go, Vue, React, Node, PostgreSQL, Solidity, C/C++, Redis, Tailwind.',
    time: 'This week',
  },
  {
    id: 'note-3',
    title: 'Favorite tools',
    body: 'Go, Vue, React, Node, PostgreSQL, Solidity, C/C++, Redis, Tailwind.\n\nEditor: whatever vibes. Terminal: yes. Coffee: always.',
    time: 'Always',
  },
];

type Props = { onBack: () => void };

export default function NotesView({ onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = NOTES.find((n) => n.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="app-view">
        <AppNav title="Note" onBack={() => setSelectedId(null)} />
        <div className="note-detail">
          <h2>{selected.title}</h2>
          <time>{selected.time}</time>
          <p className="note-detail-body">{selected.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-view">
      <AppNav title="Notes" onBack={onBack} />

      <div className="notes-list">
        {NOTES.map((n) => (
          <button key={n.id} className="note-card note-row" onClick={() => setSelectedId(n.id)}>
            <h2>{n.title}</h2>
            <p>{n.body.slice(0, 80)}…</p>
            <time>{n.time}</time>
          </button>
        ))}
      </div>
    </div>
  );
}
