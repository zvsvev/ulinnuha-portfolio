import { useApp, type Lang } from '../context/AppContext';

const strings = {
  en: {
    'unlock': 'slide to unlock',
    'about': 'About',
    'projects': 'Projects',
    'photos': 'Photos',
    'notes': 'Notes',
    'contacts': 'Contacts',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'calculator': 'Calculator',
    'settings': 'Settings',
    'home': 'Home',
    'language': 'Language',
    'appearance': 'Appearance',
    'light': 'Light',
    'dark': 'Dark',
    'posts': 'posts',
    'followers': 'followers',
    'following': 'following',
    'edit_profile': 'Edit profile',
    'follow': 'Follow',
  },
  id: {
    'unlock': 'geser untuk membuka',
    'about': 'Tentang',
    'projects': 'Proyek',
    'photos': 'Foto',
    'notes': 'Catatan',
    'contacts': 'Kontak',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'calculator': 'Kalkulator',
    'settings': 'Pengaturan',
    'home': 'Beranda',
    'language': 'Bahasa',
    'appearance': 'Tampilan',
    'light': 'Terang',
    'dark': 'Gelap',
    'posts': 'postingan',
    'followers': 'pengikut',
    'following': 'mengikuti',
    'edit_profile': 'Edit profil',
    'follow': 'Ikuti',
  },
} as const;

export type StringKey = keyof typeof strings.en;

export function useI18n() {
  const { lang } = useApp();
  const dict = strings[lang as Lang];
  return {
    lang,
    t: (key: StringKey) => dict[key] ?? strings.en[key],
  };
}
