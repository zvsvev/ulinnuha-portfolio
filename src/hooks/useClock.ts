import { useEffect, useState } from 'react';

export type Clock = {
  /** e.g. "9:41" or "11:07 PM" per locale */
  time: string;
  /** e.g. "Friday, August 15" */
  date: string;
};

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function useClock(): Clock {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return {
    time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: dateFmt.format(now),
  };
}
