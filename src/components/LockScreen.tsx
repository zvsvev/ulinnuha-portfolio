import { useEffect, useRef, useState } from 'react';
import { useClock } from '../hooks/useClock';
import { useI18n } from '../i18n/strings';
import './LockScreen.css';

const MAX_DRAG = 300;
const THRESHOLD = 160;

type Props = {
  onUnlock: () => void;
};

/**
 * Lock screen with a drag-to-unlock slider.
 *
 * Uses NATIVE non-passive touch listeners so `preventDefault()` actually
 * stops iOS Safari from hijacking the gesture for scrolling (React's
 * synthetic touch handlers are passive and can't do this). Pointer events
 * are used for mouse/pen only.
 */
export default function LockScreen({ onUnlock }: Props) {
  const { time, date } = useClock();
  const { t } = useI18n();
  const [dragX, setDragX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  const draggingRef = useRef(false);
  const dragXRef = useRef(0);
  const startXRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const isTouch = (e: Event) => window.PointerEvent
      ? (e as PointerEvent).pointerType === 'touch'
      : true;

    /* ---------- Touch (mobile) ---------- */
    const touchStart = (e: TouchEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
    };

    const touchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - startXRef.current;
      const clamped = Math.max(0, Math.min(dx, MAX_DRAG));
      dragXRef.current = clamped;
      setDragX(clamped);
    };

    const touchEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (dragXRef.current >= THRESHOLD) {
        onUnlockRef.current();
      }
      dragXRef.current = 0;
      setDragX(0);
    };

    /* ---------- Mouse / pen ---------- */
    const pointerDown = (e: PointerEvent) => {
      if (isTouch(e)) return;
      draggingRef.current = true;
      startXRef.current = e.clientX;
      track.setPointerCapture(e.pointerId);
    };

    const pointerMove = (e: PointerEvent) => {
      if (!draggingRef.current || isTouch(e)) return;
      const dx = e.clientX - startXRef.current;
      const clamped = Math.max(0, Math.min(dx, MAX_DRAG));
      dragXRef.current = clamped;
      setDragX(clamped);
    };

    const pointerUp = (e: PointerEvent) => {
      if (!draggingRef.current || isTouch(e)) return;
      draggingRef.current = false;
      if (dragXRef.current >= THRESHOLD) {
        onUnlockRef.current();
      }
      dragXRef.current = 0;
      setDragX(0);
      try { track.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    const pointerCancel = (e: PointerEvent) => {
      if (isTouch(e)) return;
      draggingRef.current = false;
      dragXRef.current = 0;
      setDragX(0);
      try { track.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    /* Non-passive = we can preventDefault and stop iOS scroll hijack */
    track.addEventListener('touchstart', touchStart, { passive: false });
    track.addEventListener('touchmove', touchMove, { passive: false });
    track.addEventListener('touchend', touchEnd);
    track.addEventListener('touchcancel', touchEnd);

    track.addEventListener('pointerdown', pointerDown);
    track.addEventListener('pointermove', pointerMove);
    track.addEventListener('pointerup', pointerUp);
    track.addEventListener('pointercancel', pointerCancel);

    return () => {
      track.removeEventListener('touchstart', touchStart);
      track.removeEventListener('touchmove', touchMove);
      track.removeEventListener('touchend', touchEnd);
      track.removeEventListener('touchcancel', touchEnd);
      track.removeEventListener('pointerdown', pointerDown);
      track.removeEventListener('pointermove', pointerMove);
      track.removeEventListener('pointerup', pointerUp);
      track.removeEventListener('pointercancel', pointerCancel);
    };
  }, []);

  return (
    <div className="lockscreen" role="button" tabIndex={0} aria-label={t('unlock')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUnlock(); }}
    >
      <div className="lock-time">{time}</div>
      <div className="lock-date">{date}</div>

      <div
        ref={trackRef}
        className="slide-to-unlock"
        style={{ '--slide-x': `${dragX}px` } as React.CSSProperties}
      >
        <span className="slide-text">{t('unlock')}</span>
        <span className="slide-arrow" aria-hidden="true">»</span>
      </div>
    </div>
  );
}
