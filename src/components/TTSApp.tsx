import { useEffect, useRef, useState } from 'react';
import AppNav from './AppNav';
import './TTSApp.css';

type Props = { onBack: () => void };

export default function TTSApp({ onBack }: Props) {
  const [text, setText] = useState('Hello! I am built with Astro and React.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const speak = () => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      const v = voices.find((v) => v.voiceURI === voice);
      if (v) u.voice = v;
    }
    u.rate = rate;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div className="tts">
      <AppNav title="Text to Speech" onBack={onBack} />
      <textarea
        className="tts-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something to hear it spoken…"
        rows={6}
      />

      <div className="tts-controls">
        <label className="tts-label">
          Voice
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            ))}
          </select>
        </label>

        <label className="tts-label">
          Speed: {rate.toFixed(1)}x
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
          {speaking ? 'Speaking…' : '🔊 Speak'}
        </button>
        {speaking && (
          <button className="ios-btn plain" onClick={stop}>Stop</button>
        )}
      </div>

      {!supported && (
        <p className="tts-warn">Your browser does not support speech synthesis.</p>
      )}
    </div>
  );
}
