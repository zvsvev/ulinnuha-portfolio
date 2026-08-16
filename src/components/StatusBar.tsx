import { useClock } from '../hooks/useClock';
import './StatusBar.css';

/** iOS 1-3 style status bar: .eth carrier, wifi + signal bars, 67% green battery, live clock. */
export default function StatusBar() {
  const { time } = useClock();

  return (
    <div className="statusbar" role="presentation">
      <span className="sb-carrier">.eth</span>
      <span className="sb-right">
        {/* Wi-Fi */}
        <span className="sb-wifi" aria-hidden="true">
          <span className="wifi-dot" />
          <span className="wifi-arc a1" />
          <span className="wifi-arc a2" />
          <span className="wifi-arc a3" />
        </span>
        {/* Signal bars */}
        <span className="sb-signal" aria-hidden="true">
          <span className="bar b1" />
          <span className="bar b2" />
          <span className="bar b3" />
          <span className="bar b4" />
        </span>
        {/* Battery 67% green */}
        <span className="sb-battery" aria-hidden="true">
          <span className="batt">
            <span className="batt-fill" style={{ width: '67%', background: '#4cd964' }} />
          </span>
        </span>
        <span className="sb-time">{time}</span>
      </span>
    </div>
  );
}
