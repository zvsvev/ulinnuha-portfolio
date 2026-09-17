import { useEffect, useState } from 'react';
import AppNav from './AppNav';
import { useI18n } from '../i18n/strings';
import './TTSApp.css';

type Props = { onBack: () => void };

export default function TTSApp({ onBack }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState(() => t('tts_default_text'));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      // Closing the app should not leave audio playing.
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = () => {
    if (!supported || !text.trim()) return;
    setError('');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      const v = voices.find((v) => v.voiceURI === voice);
      if (v) u.voice = v;
    }
    u.rate = rate;
    u.onstart = () => { setSpeaking(true); setError(''); };
    u.onend = () => setSpeaking(false);
    u.onerror = () => { setSpeaking(false); setError(t('tts_error')); };
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div className="tts">
      <AppNav title={t('tts')} onBack={onBack} />
      <textarea
        className="tts-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('tts_placeholder')}
        aria-label={t('tts_placeholder')}
        rows={6}
      />

      <div className="tts-controls">
        <label className="tts-label">
          {t('tts_voice')}
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">{t('tts_default_voice')}</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            ))}
          </select>
        </label>

        <label className="tts-label">
          {t('tts_speed')}: {rate.toFixed(1)}x
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="tts-btns">
        <button className="ios-btn green" onClick={speak} disabled={!supported}>
          <span aria-hidden="true">🔊 </span>{speaking ? t('tts_speaking') : t('tts_speak')}
        </button>
        <button className="ios-btn plain" onClick={stop} disabled={!speaking}>
          {t('tts_stop')}
        </button>
      </div>

      {!supported && <p className="tts-warn">{t('tts_unsupported')}</p>}
      {error && <p className="tts-warn" role="alert">{error}</p>}
    </div>
  );
}
