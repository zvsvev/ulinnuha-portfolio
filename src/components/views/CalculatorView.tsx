import { useEffect, useRef, useState } from 'react';
import AppNav from '../AppNav';
import { useI18n, type StringKey } from '../../i18n/strings';
import { evaluate, formatNumber, type AngleMode } from '../../lib/expression';
import './CalculatorView.css';

type KeyType =
  | 'digit' | 'dot' | 'op' | 'fn' | 'const' | 'paren' | 'post' | 'ans'
  | 'equals' | 'clear' | 'back' | 'sign' | 'second' | 'angle';

type Key = {
  id: string;
  label: string;
  kind: 'num' | 'op' | 'fn' | 'eq' | 'sci';
  type: KeyType;
  token?: string;
  ariaKey?: StringKey;
  second?: { label: string; token: string; ariaKey: StringKey };
  wide?: boolean;
};

// Scientific rows (5 columns), always visible above the basic pad.
const SCI_KEYS: Key[] = [
  { id: 'second', label: '2nd', kind: 'sci', type: 'second', ariaKey: 'calc_second' },
  { id: 'sq', label: 'x²', kind: 'sci', type: 'op', token: '^2', ariaKey: 'calc_square' },
  { id: 'pow', label: 'xʸ', kind: 'sci', type: 'op', token: '^', ariaKey: 'calc_power' },
  { id: 'sqrt', label: '√', kind: 'sci', type: 'fn', token: 'sqrt(', ariaKey: 'calc_sqrt' },
  { id: 'cbrt', label: '∛', kind: 'sci', type: 'fn', token: 'cbrt(', ariaKey: 'calc_cbrt' },

  { id: 'inv', label: '1/x', kind: 'sci', type: 'fn', token: 'inv(', ariaKey: 'calc_reciprocal' },
  { id: 'log', label: 'log', kind: 'sci', type: 'fn', token: 'log(', ariaKey: 'calc_log', second: { label: '10ˣ', token: '10^(', ariaKey: 'calc_pow10' } },
  { id: 'ln', label: 'ln', kind: 'sci', type: 'fn', token: 'ln(', ariaKey: 'calc_ln', second: { label: 'eˣ', token: 'e^(', ariaKey: 'calc_exp' } },
  { id: 'lp', label: '(', kind: 'sci', type: 'paren', token: '(', ariaKey: 'calc_open_paren' },
  { id: 'rp', label: ')', kind: 'sci', type: 'paren', token: ')', ariaKey: 'calc_close_paren' },

  { id: 'sin', label: 'sin', kind: 'sci', type: 'fn', token: 'sin(', ariaKey: 'calc_sin', second: { label: 'sin⁻¹', token: 'asin(', ariaKey: 'calc_asin' } },
  { id: 'cos', label: 'cos', kind: 'sci', type: 'fn', token: 'cos(', ariaKey: 'calc_cos', second: { label: 'cos⁻¹', token: 'acos(', ariaKey: 'calc_acos' } },
  { id: 'tan', label: 'tan', kind: 'sci', type: 'fn', token: 'tan(', ariaKey: 'calc_tan', second: { label: 'tan⁻¹', token: 'atan(', ariaKey: 'calc_atan' } },
  { id: 'pi', label: 'π', kind: 'sci', type: 'const', token: 'π', ariaKey: 'calc_pi' },
  { id: 'e', label: 'e', kind: 'sci', type: 'const', token: 'e', ariaKey: 'calc_e' },

  { id: 'fact', label: 'n!', kind: 'sci', type: 'post', token: '!', ariaKey: 'calc_factorial' },
  { id: 'pct', label: '%', kind: 'sci', type: 'post', token: '%', ariaKey: 'calc_percent' },
  { id: 'angle', label: 'DEG', kind: 'sci', type: 'angle', ariaKey: 'calc_deg' },
  { id: 'back', label: '⌫', kind: 'sci', type: 'back', ariaKey: 'calc_backspace' },
  { id: 'ans', label: 'Ans', kind: 'sci', type: 'ans', token: 'Ans', ariaKey: 'calc_ans' },
];

const BASIC_KEYS: Key[] = [
  { id: 'clear', label: 'C', kind: 'fn', type: 'clear', ariaKey: 'calc_clear' },
  { id: 'sign', label: '±', kind: 'fn', type: 'sign', ariaKey: 'calc_toggle_sign' },
  { id: 'div', label: '÷', kind: 'op', type: 'op', token: '÷', ariaKey: 'calc_divide' },
  { id: 'mul', label: '×', kind: 'op', type: 'op', token: '×', ariaKey: 'calc_multiply' },

  { id: '7', label: '7', kind: 'num', type: 'digit' },
  { id: '8', label: '8', kind: 'num', type: 'digit' },
  { id: '9', label: '9', kind: 'num', type: 'digit' },
  { id: 'sub', label: '−', kind: 'op', type: 'op', token: '−', ariaKey: 'calc_subtract' },

  { id: '4', label: '4', kind: 'num', type: 'digit' },
  { id: '5', label: '5', kind: 'num', type: 'digit' },
  { id: '6', label: '6', kind: 'num', type: 'digit' },
  { id: 'add', label: '+', kind: 'op', type: 'op', token: '+', ariaKey: 'calc_add' },

  { id: '1', label: '1', kind: 'num', type: 'digit' },
  { id: '2', label: '2', kind: 'num', type: 'digit' },
  { id: '3', label: '3', kind: 'num', type: 'digit' },
  { id: 'eq', label: '=', kind: 'eq', type: 'equals', ariaKey: 'calc_equals' },

  { id: '0', label: '0', kind: 'num', type: 'digit', wide: true },
  { id: 'dot', label: '.', kind: 'num', type: 'dot', ariaKey: 'calc_decimal' },
];

/** Drop trailing binary operators so the live preview shows the last complete value. */
function stripTrailingOperators(expr: string): string {
  return expr.replace(/[+\-−×÷^]+$/, '');
}

type Props = { onBack: () => void };

export default function CalculatorView({ onBack }: Props) {
  const { t } = useI18n();
  const [expr, setExpr] = useState('');
  const [ans, setAns] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [second, setSecond] = useState(false);

  // Handlers read these refs, not render state: two inputs landing in the same
  // tick (fast key repeat, scripts) must not see a stale `committed`/`expr`.
  const exprRef = useRef('');
  const ansRef = useRef<number | null>(null);
  const committedRef = useRef(false);

  const preview = evaluate(stripTrailingOperators(expr), { angleMode, ans });
  const resultText =
    committed && shown !== null
      ? formatNumber(shown)
      : expr === ''
        ? '0'
        : Number.isFinite(preview)
          ? formatNumber(preview)
          : '';

  const putExpr = (value: string) => {
    exprRef.current = value;
    setExpr(value);
  };

  const putAns = (value: number | null) => {
    ansRef.current = value;
    setAns(value);
  };

  const putCommitted = (value: boolean) => {
    committedRef.current = value;
    setCommitted(value);
  };

  const insert = (token: string, mode: 'value' | 'operator') => {
    const wasCommitted = committedRef.current;
    putExpr(wasCommitted ? (mode === 'operator' ? `Ans${token}` : token) : exprRef.current + token);
    putCommitted(false);
  };

  const insertDot = () => {
    if (committedRef.current) {
      putExpr('0.');
    } else {
      const tail = exprRef.current.match(/[0-9.]*$/)![0];
      if (!tail.includes('.')) putExpr(tail === '' ? `${exprRef.current}0.` : `${exprRef.current}.`);
    }
    putCommitted(false);
  };

  const backspace = () => {
    const prev = committedRef.current ? '' : exprRef.current;
    const named = prev.match(/(?:sqrt|cbrt|asin|acos|atan|sin|cos|tan|log|ln|inv)\($|Ans$|10\^\($|e\^\($/);
    putExpr(named ? prev.slice(0, prev.length - named[0].length) : prev.slice(0, -1));
    putCommitted(false);
  };

  const toggleSign = () => {
    const base = committedRef.current ? 'Ans' : exprRef.current;
    putExpr(!base ? '−' : base.startsWith('−') ? base.slice(1) : `−${base}`);
    putCommitted(false);
  };

  const commit = () => {
    if (!exprRef.current) return;
    const value = evaluate(exprRef.current, { angleMode, ans: ansRef.current });
    setShown(value);
    if (Number.isFinite(value)) putAns(value);
    putCommitted(true);
    setSecond(false);
  };

  const clear = () => {
    putExpr('');
    setShown(null);
    putCommitted(false);
    setSecond(false);
  };

  const press = (key: Key) => {
    const variant = second && key.second ? key.second : null;
    const token = variant ? variant.token : key.token;

    switch (key.type) {
      case 'digit': insert(key.label, 'value'); break;
      case 'dot': insertDot(); break;
      case 'const':
      case 'fn':
      case 'paren':
      case 'ans': insert(token ?? key.label, 'value'); break;
      case 'op':
      case 'post': insert(token ?? '', 'operator'); break;
      case 'equals': commit(); break;
      case 'clear': clear(); break;
      case 'back': backspace(); break;
      case 'sign': toggleSign(); break;
      case 'second': setSecond((s) => !s); break;
      case 'angle': setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg')); break;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          insert(e.key, 'value'); break;
        case '.': case ',': insertDot(); break;
        case '+': insert('+', 'operator'); break;
        case '-': insert('−', 'operator'); break;
        case '*': insert('×', 'operator'); break;
        case '/': insert('÷', 'operator'); break;
        case '^': insert('^', 'operator'); break;
        case '(': insert('(', 'value'); break;
        case ')': insert(')', 'value'); break;
        case 'Enter': case '=': commit(); break;
        case 'Backspace': backspace(); break;
        case 'Escape': clear(); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Handlers read live values from refs; only `commit`'s angleMode is closed over.
  }, [angleMode]);

  const renderKey = (key: Key) => {
    const variant = second && key.second ? key.second : null;
    const isAngle = key.type === 'angle';
    const label = isAngle ? (angleMode === 'deg' ? 'DEG' : 'RAD') : variant ? variant.label : key.label;
    const ariaKey = isAngle ? (angleMode === 'deg' ? 'calc_deg' : 'calc_rad') : variant ? variant.ariaKey : key.ariaKey;
    const active = (key.type === 'second' && second) || (isAngle && angleMode === 'rad');
    const pressed = key.type === 'second' ? second : isAngle ? angleMode === 'rad' : undefined;

    return (
      <button
        key={key.id}
        className={`calc-key ${key.kind}${key.wide ? ' zero' : ''}${active ? ' active' : ''}`}
        onClick={() => press(key)}
        aria-label={ariaKey ? t(ariaKey) : key.label}
        aria-pressed={pressed}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="app-view calc-view">
      <AppNav title={t('calculator')} onBack={onBack} />
      <div className="calc">
        <div className="calc-display">
          <div className="calc-expr">{committed && expr ? `${expr} =` : expr}</div>
          <div className="calc-result" role="status" aria-live="polite" aria-atomic="true">
            {resultText || '0'}
          </div>
        </div>

        <div className="calc-sci">{SCI_KEYS.map(renderKey)}</div>
        <div className="calc-pad">{BASIC_KEYS.map(renderKey)}</div>
      </div>
    </div>
  );
}
