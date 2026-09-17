import { contact } from './contact';
import { stack } from './stack';

export type Note = {
  id: string;
  title: string;
  body: string;
  time: string;
  datetime: string;
};

export const notes: Note[] = [
  {
    id: 'note-1',
    title: 'Currently',
    body: 'Open to freelance and full-time roles. Building on Solana, tinkering with C, and shipping web apps the rest of the time.',
    time: 'This week',
    datetime: '2026-08-30',
  },
  {
    id: 'note-2',
    title: 'Stack',
    body: `Tools I reach for most: ${stack.join(', ')}.`,
    time: 'This month',
    datetime: '2026-08-01',
  },
  {
    id: 'note-3',
    title: 'Get in touch',
    body: `Email ${contact.email} — based in ${contact.location}, available for freelance and full-time work.`,
    time: 'This year',
    datetime: '2026-01-01',
  },
];
