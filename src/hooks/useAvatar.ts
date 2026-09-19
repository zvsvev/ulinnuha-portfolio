import { useEffect, useState } from 'react';

export const DEFAULT_AVATAR = '/img/default-avatar.svg';

/**
 * Resolved once per page load and shared across apps, so opening Instagram,
 * Facebook and Contacts doesn't refetch the same profile three times.
 * Falls back to the built-in default when the API isn't available (which is
 * the case under `astro dev`, where Pages Functions aren't served).
 */
let resolved: string | null = null;
let inflight: Promise<string> | null = null;

function loadAvatar(): Promise<string> {
  if (resolved) return Promise.resolve(resolved);
  if (!inflight) {
    inflight = fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { avatarUrl?: string | null }) => data.avatarUrl || DEFAULT_AVATAR)
      .catch(() => DEFAULT_AVATAR)
      .then((url) => {
        resolved = url;
        return url;
      });
  }
  return inflight;
}

export function useAvatar(): string {
  const [url, setUrl] = useState(resolved ?? DEFAULT_AVATAR);

  useEffect(() => {
    let alive = true;
    loadAvatar().then((next) => { if (alive) setUrl(next); });
    return () => { alive = false; };
  }, []);

  return url;
}
