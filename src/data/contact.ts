export type SocialId = 'github' | 'instagram' | 'telegram' | 'facebook';

export type Social = {
  id: SocialId;
  label: string;
  emoji: string;
  href: string;
};

export const socials: Social[] = [
  { id: 'github', label: 'GitHub', emoji: '🐙', href: 'https://github.com/zvsvev' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', href: 'https://instagram.com/ulinnuha.eth' },
  { id: 'telegram', label: 'Telegram', emoji: '✈️', href: 'https://t.me/ulinnuhaeth' },
  { id: 'facebook', label: 'Facebook', emoji: '📘', href: 'https://fb.me/ulinnuha.eth' },
];

export const contact = {
  email: 'hi@ulinnuha.id',
  location: 'Yogyakarta, Indonesia',
};
