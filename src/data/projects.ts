export type Project = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  tags: string[];
  href?: string;
  featured?: boolean;
  builtWith?: string;
  year: string;
};

export const projects: Project[] = [
  {
    slug: 'pastebags',
    title: 'Pastebags',
    emoji: '👜',
    description:
      'Solana-powered paste service with token-gated pastes, on-chain leaderboards, and win-together events. Built with Next.js, Supabase, and Solana.',
    tags: ['Next.js', 'Solana', 'Supabase', 'TypeScript'],
    href: 'https://github.com/zvsvev/pastebags',
    featured: true,
    year: '2025',
  },
  {
    slug: 'padel',
    title: 'Mobile Padel',
    emoji: '🏓',
    description:
      'A padel-style pong game you can play on your phone. Pick difficulty, set the win condition, and go head-to-head with the CPU.',
    tags: ['Canvas', 'JavaScript', 'Mobile'],
    href: '/projects/padel',
    featured: true,
    year: '2025',
  },
  {
    slug: 'tts',
    title: 'Text to Speech',
    emoji: '🗣️',
    description:
      'Type text, hear it spoken aloud — a tiny text-to-speech tool built on the browser SpeechSynthesis API.',
    tags: ['SpeechSynthesis', 'JavaScript'],
    href: '/projects/tts',
    year: '2025',
  },
];
