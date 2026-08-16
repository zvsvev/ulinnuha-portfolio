import { useRef, useState } from 'react';
import { useClock } from '../hooks/useClock';
import './LockScreen.css';

const MAX_DRAG = 240;
const THRESHOLD = 130;

type Props = {
  onUnlock: () => void;
};

/** Lock screen with a drag-to-unlock slider that works on touch and mouse. */
export default function LockScreen({ onUnlock }: Props) {
  const { time, date } = useClock();
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleDown = (e: React.PointerEvent) => {
    setDragging(true);
    startXRef.current = e.clientX;
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startXRef.current;
    setDragX(Math.max(0, Math.min(dx, MAX_DRAG)));
  };

  const handleUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX >= THRESHOLD) {
      onUnlock();
    }
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
