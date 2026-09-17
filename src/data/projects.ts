export type Project = {
  slug: string;
  title: string;
  emoji: string;
  /** Short one-liner for the list row — keep to 5 words or fewer. */
  short: string;
  /** Long description shown on the project page. */
  description: string;
  /** Month created, ISO year-month (YYYY-MM). */
  created: string;
  href?: string;
  appId?: 'padel' | 'tts';
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: 'pastebags',
    title: 'Pastebags',
    emoji: '👜',
    short: 'Token-gated paste service',
    description:
      'Solana-powered paste service with token-gated pastes, on-chain leaderboards, and win-together events. Built with Next.js, Supabase, and Solana.',
    created: '2025-03',
    href: 'https://github.com/zvsvev/pastebags',
    featured: true,
  },
  {
    slug: 'padel',
    title: 'Mobile Padel',
    emoji: '🏓',
    short: 'Padel pong for phones',
    description:
      'A padel-style pong game you can play on your phone. Pick difficulty, set the win condition, and go head-to-head with the CPU.',
    created: '2025-05',
    appId: 'padel',
    featured: true,
  },
  {
    slug: 'tts',
    title: 'Text to Speech',
    emoji: '🗣️',
    short: 'Type text, hear it spoken',
    description:
      'Type text, hear it spoken aloud — a tiny text-to-speech tool built on the browser SpeechSynthesis API.',
    created: '2025-08',
    appId: 'tts',
  },
];
