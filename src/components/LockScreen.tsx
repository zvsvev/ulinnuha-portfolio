import { useRef, useState } from 'react';
import { useClock } from '../hooks/useClock';
import './LockScreen.css';

const MAX_DRAG = 300;
const THRESHOLD = 160;

type Props = {
  onUnlock: () => void;
};

/**
 * Lock screen with a drag-to-unlock slider.
 * Uses refs for drag state so fast touch sequences (down→move→up in one frame)
 * don't hit stale React state closures.
 */
export default function LockScreen({ onUnlock }: Props) {
  const { time, date } = useClock();
  const [dragX, setDragX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragXRef = useRef(0);
  const startXRef = useRef(0);

  const handleDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(dx, MAX_DRAG));
    dragXRef.current = clamped;
    setDragX(clamped);
  };

  const handleUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragXRef.current >= THRESHOLD) {
      onUnlock();
    }
    dragXRef.current = 0;
    setDragX(0);
  };

  return (
    <div className="lockscreen" role="button" tabIndex={0} aria-label="Slide to unlock"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUnlock(); }}
    >
      <div className="lock-time">{time}</div>
      <div className="lock-date">{date}</div>

      <div
        ref={trackRef}
        className="slide-to-unlock"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ '--slide-x': `${dragX}px` } as React.CSSProperties}
      >
        <span className="slide-text">slide to unlock</span>
        <span className="slide-arrow" aria-hidden="true">»</span>
      </div>
    </div>
  );
}
