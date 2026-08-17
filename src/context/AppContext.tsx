import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'id';
export type Theme = 'light' | 'dark';

type AppCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<AppCtx | null>(null);

function read<T extends string>(key: string, fallback: T, valid: T[]): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && valid.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read('ulinnuha.lang', 'en', ['en', 'id']));
  const [theme, setThemeState] = useState<Theme>(() => read('ulinnuha.theme', 'light', ['light', 'dark']));

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('ulinnuha.lang', l); } catch { /* noop */ }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem('ulinnuha.theme', t); } catch { /* noop */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [theme]);

  return (
    <Ctx.Provider value={{ lang, setLang, theme, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
