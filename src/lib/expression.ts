/**
 * Tiny expression evaluator for the Calculator app.
 *
 * Tokenizer → shunting-yard → RPN evaluation. Hand-rolled so the app stays
 * dependency-free. Tokens use the same glyphs the keypad emits ("×", "÷", "π")
 * plus ASCII fallbacks so `×`/`*` and `÷`/`/` both parse.
 */

export type AngleMode = 'deg' | 'rad';

type Op = '+' | '-' | '*' | '/' | '^';
type FuncName = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'log' | 'ln' | 'sqrt' | 'cbrt' | 'inv';

type Node =
  | { t: 'num'; v: number }
  | { t: 'func'; name: FuncName }
  | { t: 'op'; op: Op }
  | { t: 'unary' }
  | { t: 'post'; op: '!' | '%' }
  | { t: 'lp' }
  | { t: 'rp' };

const FUNCS = new Set<string>(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt', 'inv']);

const PREC: Record<Op, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };
const RIGHT: Record<Op, boolean> = { '+': false, '-': false, '*': false, '/': false, '^': true };
const UNARY_PREC = 3;

function tokenize(src: string, ans: number | null): Node[] | null {
  const out: Node[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === ' ') { i += 1; continue; }

    if (c >= '0' && c <= '9' || c === '.') {
      let j = i;
      while (j < src.length && (src[j] >= '0' && src[j] <= '9' || src[j] === '.')) j += 1;
      const value = Number(src.slice(i, j));
      if (!Number.isFinite(value)) return null;
      out.push({ t: 'num', v: value });
      i = j;
      continue;
    }

    if (/[A-Za-z]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z]/.test(src[j])) j += 1;
      const name = src.slice(i, j);
      i = j;
      if (name === 'Ans') { out.push({ t: 'num', v: ans ?? NaN }); continue; }
      if (name === 'pi') { out.push({ t: 'num', v: Math.PI }); continue; }
      if (name === 'e') { out.push({ t: 'num', v: Math.E }); continue; }
      if (FUNCS.has(name)) { out.push({ t: 'func', name: name as FuncName }); continue; }
      return null;
    }

    switch (c) {
      case 'π': out.push({ t: 'num', v: Math.PI }); break;
      case '+': out.push({ t: 'op', op: '+' }); break;
      case '-':
      case '−': out.push({ t: 'op', op: '-' }); break;
      case '*':
      case '×': out.push({ t: 'op', op: '*' }); break;
      case '/':
      case '÷': out.push({ t: 'op', op: '/' }); break;
      case '^': out.push({ t: 'op', op: '^' }); break;
      case '!': out.push({ t: 'post', op: '!' }); break;
      case '%': out.push({ t: 'post', op: '%' }); break;
      case '(': out.push({ t: 'lp' }); break;
      case ')': out.push({ t: 'rp' }); break;
      default: return null;
    }
    i += 1;
  }

  return out;
}

function toRPN(tokens: Node[]): Node[] | null {
  const out: Node[] = [];
  const stack: Node[] = [];
  let prev: 'value' | 'op' = 'op';

  const isOperator = (n: Node) => n.t === 'op' || n.t === 'unary';
  const precOf = (n: Node) => (n.t === 'unary' ? UNARY_PREC : PREC[(n as { op: Op }).op]);
  const isRight = (n: Node) => (n.t === 'unary' ? true : RIGHT[(n as { op: Op }).op]);

  const pushOp = (n: Node) => {
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (!isOperator(top)) break;
      const lower = precOf(top) > precOf(n) || (precOf(top) === precOf(n) && !isRight(n));
      if (lower) out.push(stack.pop()!);
      else break;
    }
    stack.push(n);
  };

  for (const tok of tokens) {
    switch (tok.t) {
      case 'num':
        if (prev === 'value') pushOp({ t: 'op', op: '*' }); // implicit multiplication
        out.push(tok);
        prev = 'value';
        break;

      case 'func':
        if (prev === 'value') pushOp({ t: 'op', op: '*' });
        stack.push(tok);
        prev = 'op';
        break;

      case 'lp':
        if (prev === 'value') pushOp({ t: 'op', op: '*' });
        stack.push(tok);
        prev = 'op';
        break;

      case 'rp': {
        let matched = false;
        while (stack.length) {
          const top = stack.pop()!;
          if (top.t === 'lp') { matched = true; break; }
          out.push(top);
        }
        if (!matched) return null;
        const top = stack[stack.length - 1];
        if (top && top.t === 'func') out.push(stack.pop()!);
        prev = 'value';
        break;
      }

      case 'post':
        out.push(tok);
        prev = 'value';
        break;

      case 'op':
        if ((tok.op === '-' || tok.op === '+') && prev !== 'value') {
          // Prefix unary: push without popping. It has no left operand, so
          // nothing already on the stack belongs to it — "2^-1" must stay
          // 2^(-1), while "-2^2" still evaluates as -(2^2).
          if (tok.op === '-') stack.push({ t: 'unary' }); // unary plus is a no-op
        } else {
          pushOp(tok);
        }
        prev = 'op';
        break;
    }
  }

  while (stack.length) {
    const top = stack.pop()!;
    if (top.t === 'lp') return null;
    out.push(top);
  }

  return out;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let out = 1;
  for (let i = 2; i <= n; i += 1) out *= i;
  return out;
}

function applyOp(op: Op, a: number, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    case '^': return a ** b;
  }
}

function applyFunc(name: FuncName, x: number, mode: AngleMode): number {
  const toRad = (v: number) => (mode === 'deg' ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (mode === 'deg' ? (v * 180) / Math.PI : v);

  switch (name) {
    case 'sin': return Math.sin(toRad(x));
    case 'cos': return Math.cos(toRad(x));
    case 'tan': return Math.tan(toRad(x));
    case 'asin': return fromRad(Math.asin(x));
    case 'acos': return fromRad(Math.acos(x));
    case 'atan': return fromRad(Math.atan(x));
    case 'log': return Math.log10(x);
    case 'ln': return Math.log(x);
    case 'sqrt': return Math.sqrt(x);
    case 'cbrt': return Math.cbrt(x);
    case 'inv': return 1 / x;
  }
}

function evalRPN(rpn: Node[], mode: AngleMode): number {
  const st: number[] = [];
  const pop = () => (st.length ? st.pop()! : NaN);

  for (const node of rpn) {
    switch (node.t) {
      case 'num': st.push(node.v); break;
      case 'unary': st.push(-pop()); break;
      case 'post': {
        const a = pop();
        st.push(node.op === '!' ? factorial(a) : a / 100); // "%" is a plain ÷100
        break;
      }
      case 'func': st.push(applyFunc(node.name, pop(), mode)); break;
      case 'op': {
        const b = pop();
        const a = pop();
        st.push(applyOp(node.op, a, b));
        break;
      }
    }
  }

  return st.length === 1 ? st[0] : NaN;
}

/** Evaluate an expression. Returns NaN for anything invalid or incomplete. */
export function evaluate(expr: string, opts: { angleMode: AngleMode; ans: number | null }): number {
  if (!expr.trim()) return NaN;
  const tokens = tokenize(expr, opts.ans);
  if (!tokens || tokens.length === 0) return NaN;
  const rpn = toRPN(tokens);
  if (!rpn) return NaN;
  return evalRPN(rpn, opts.angleMode);
}

/** Format a result for the display: rounded, scientific when huge/tiny, "Error" otherwise. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  if (Object.is(n, -0)) return '0';

  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
    return n.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return String(Math.round(n * 1e9) / 1e9);
}
