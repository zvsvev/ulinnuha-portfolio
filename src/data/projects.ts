export type Project = {
  slug: string;
  title: string;
  /** Short one-liner for the list row — keep to 5 words or fewer. */
  short: string;
  /** Long description shown on the project page. */
  description: string;
  /** Month created, ISO year-month (YYYY-MM). */
  created: string;
  href?: string;
  appId?: 'padel' | 'tts';
};

export const projects: Project[] = [
  {
    slug: 'baksosapi',
    title: 'Baksosapi.com',
    short: 'Endless random facts',
    description:
      'Short random facts, endless to browse, each linked to the journal or book it came from.',
    created: '2025-03',
    href: 'https://baksosapi.com',
  },
  {
    slug: 'padel',
    title: 'Mobile Padel',
    short: 'Padel pong for phones',
    description:
      'A padel-style pong game you can play on your phone. Pick difficulty, set the win condition, and go head-to-head with the CPU.',
    created: '2025-05',
    appId: 'padel',
  },
  {
    slug: 'tts',
    title: 'Text to Speech',
    short: 'Type text, hear it spoken',
    description:
      'Type text, hear it spoken aloud — a tiny text-to-speech tool built on the browser SpeechSynthesis API.',
    created: '2025-08',
    appId: 'tts',
  },
];
