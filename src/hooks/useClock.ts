import { useEffect, useState } from 'react';
import { LANG_EVENT } from '../context/AppContext';
import { localeFor } from '../i18n/locale';

export type Clock = {
  /** e.g. "9:41" or "11:07 PM" per locale */
  time: string;
  /** e.g. "Friday, August 15" */
  date: string;
};

function readLocale(): string {
  if (typeof window === 'undefined') return localeFor('en');
  try {
    return localeFor(localStorage.getItem('ulinnuha.lang') ?? 'en');
  } catch {
    return localeFor('en');
  }
}

export function useClock(): Clock {
  const [now, setNow] = useState(() => new Date());
  const [locale, setLocale] = useState(() => localeFor('en'));

  useEffect(() => {
    setLocale(readLocale());
    const id = setInterval(() => setNow(new Date()), 30_000);
    const onLangChange = () => setLocale(readLocale());
    window.addEventListener(LANG_EVENT, onLangChange);
    return () => {
      clearInterval(id);
      window.removeEventListener(LANG_EVENT, onLangChange);
    };
  }, []);

  return {
    time: now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }),
    date: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
  };
}
