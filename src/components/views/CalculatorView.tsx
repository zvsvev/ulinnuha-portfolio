import { useState } from 'react';
import AppNav from '../AppNav';
import './CalculatorView.css';

type Op = '+' | '-' | '×' | '÷' | null;

const KEYS: { label: string; kind: 'num' | 'op' | 'fn' | 'eq'; op?: Op }[] = [
  { label: 'C', kind: 'fn' },
  { label: '±', kind: 'fn' },
  { label: '÷', kind: 'op', op: '÷' },
  { label: '×', kind: 'op', op: '×' },
  { label: '7', kind: 'num' },
  { label: '8', kind: 'num' },
  { label: '9', kind: 'num' },
  { label: '−', kind: 'op', op: '-' },
  { label: '4', kind: 'num' },
  { label: '5', kind: 'num' },
  { label: '6', kind: 'num' },
  { label: '+', kind: 'op', op: '+' },
  { label: '1', kind: 'num' },
  { label: '2', kind: 'num' },
  { label: '3', kind: 'num' },
  { label: '=', kind: 'eq' },
  { label: '0', kind: 'num' },
  { label: '.', kind: 'num' },
];

type Props = { onBack: () => void };

function calc(a: number, b: number, op: Op): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

export default function CalculatorView({ onBack }: Props) {
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const inputNum = (n: string) => {
    if (fresh) {
      setDisplay(n === '.' ? '0.' : n);
      setFresh(false);
    } else {
      if (n === '.' && display.includes('.')) return;
      if (display.replace(/[-.]/g, '').length >= 9) return;
      setDisplay(display === '0' && n !== '.' ? n : display + n);
    }
  };

  const inputOp = (next: Op) => {
    const cur = parseFloat(display);
    if (acc === null) {
      setAcc(cur);
    } else if (!fresh && op) {
      setAcc(calc(acc, cur, op));
    }
    setOp(next);
    setFresh(true);
  };

  const equals = () => {
    const cur = parseFloat(display);
    const result = op && acc !== null ? calc(acc, cur, op) : cur;
    setDisplay(Number.isNaN(result) ? 'Error' : String(Math.round(result * 1e9) / 1e9));
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay('0');
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const negate = () => setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d));

  const press = (k: (typeof KEYS)[number]) => {
    if (k.kind === 'num') inputNum(k.label);
    else if (k.kind === 'op') inputOp(k.op ?? '+');
    else if (k.kind === 'eq') equals();
    else if (k.label === 'C') clear();
    else if (k.label === '±') negate();
  };

  return (
    <div className="app-view calc-view">
      <AppNav title="Calculator" onBack={onBack} />
      <div className="calc">
        <div className="calc-display">{display}</div>
        <div className="calc-pad">
          {KEYS.map((k) => (
            <button
              key={k.label}
              className={`calc-key ${k.kind}${k.label === '0' ? ' zero' : ''}`}
              onClick={() => press(k)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
