import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import './PhoneView.css';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '＊', '0', '#'] as const;
const MAX_DIGITS = 15;
const CALL_MS = 2200;

type Props = { onBack: () => void };

/** Cosmetic iOS 1-3 dialer — nothing actually dials. */
export default function PhoneView({ onBack }: Props) {
  const { t } = useI18n();
  const [number, setNumber] = useState('');
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!calling) return;
    const id = window.setTimeout(() => setCalling(false), CALL_MS);
    return () => window.clearTimeout(id);
  }, [calling]);

  const press = (key: string) => {
    if (calling) return;
    setNumber((n) => (n.length >= MAX_DIGITS ? n : n + key));
  };

  return (
    <div className="app-view">
      <AppNav title={t('phone')} onBack={onBack} />

      <div className="phone">
        <div className={`phone-display${calling ? ' calling' : ''}`} role="status" aria-live="polite">
          {calling ? t('calling') : number}
        </div>

        <button
          className="phone-delete"
          onClick={() => setNumber((n) => n.slice(0, -1))}
          disabled={!number || calling}
          aria-label={t('delete')}
        >
          ⌫
        </button>

        <div className="phone-pad">
          {KEYS.map((key) => (
            <button key={key} className="phone-key" onClick={() => press(key)}>
              {key}
            </button>
          ))}
        </div>

        <button className="ios-btn green phone-call" onClick={() => setCalling(true)} disabled={!number || calling}>
          {t('call')}
        </button>
      </div>
    </div>
  );
}
