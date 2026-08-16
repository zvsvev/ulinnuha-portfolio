import AppNav from '../AppNav';
import './views.css';

const NOTES = [
  {
    title: 'How this site works',
    body: 'The whole portfolio is an old iPhone. Unlock it, tap around. Built with Astro + React on Cloudflare Pages — no servers, just vibes.',
    time: 'Yesterday',
  },
  {
    title: 'Currently',
    body: 'Freelance + full-time opportunities open. Building on Solana, tinkering with C, vibecoding everything else.',
    time: 'This week',
  },
  {
    title: 'Favorite tools',
    body: 'Go, Vue, React, Node, PostgreSQL, Solidity, C/C++, Redis, Tailwind.',
    time: 'Always',
  },
];

type Props = { onBack: () => void };

export default function NotesView({ onBack }: Props) {
  return (
    <div className="app-view">
      <AppNav title="Notes" onBack={onBack} />

      <div className="notes-list">
        {NOTES.map((n) => (
          <article key={n.title} className="note-card">
            <h2>{n.title}</h2>
            <p>{n.body}</p>
            <time>{n.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}
