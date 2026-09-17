import type { Lang } from '../context/AppContext';

const LOCALES: Record<Lang, string> = { en: 'en-US', id: 'id-ID' };

/** BCP-47 locale for the active app language (falls back to English). */
export function localeFor(lang: string): string {
  return LOCALES[lang as Lang] ?? LOCALES.en;
}
