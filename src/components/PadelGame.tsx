import { useEffect, useRef, useState } from 'react';
import AppNav from './AppNav';
import './PadelGame.css';

const W = 320;
const H = 500;
const paddleW = 80;
const paddleH = 12;

const DIFFICULTIES = {
  easy: { factor: 0.03, ballSpeed: 3, label: 'Easy' },
  medium: { factor: 0.1, ballSpeed: 6, label: 'Medium' },
  hard: { factor: 0.5, ballSpeed: 9, label: 'Hard' },
} as const;

type Diff = keyof typeof DIFFICULTIES;

type Props = { onBack: () => void };

export default function PadelGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: W / 2 - paddleW / 2, y: H - 30, w: paddleW, h: paddleH, speed: 0.2, targetX: W / 2 - paddleW / 2 },
    cpu: { x: W / 2 - paddleW / 2, y: 20, w: paddleW, h: paddleH, speed: 5 },
    ball: { x: W / 2, y: H / 2, r: 8, vx: 0, vy: 0 },
    playerScore: 0,
    cpuScore: 0,
    cpuFactor: 0,
    ballSpeed: 4,
    winTo: 21,
    paused: true,
  });

  const [screen, setScreen] = useState<'menu' | 'rules' | 'playing' | 'end'>('menu');
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);
  const [score, setScore] = useState({ p: 0, c: 0 });

  const draw = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resetBall = () => {
      const s = stateRef.current;
      s.ball.x = W / 2;
      s.ball.y = H / 2;
      const speed = s.ballSpeed;
      s.ball.vx = speed * (Math.random() > 0.5 ? 1 : -1);
      s.ball.vy = speed * (Math.random() > 0.5 ? 1 : -1);
    };

    const syncScore = () => {
      const s = stateRef.current;
      setScore({ p: s.playerScore, c: s.cpuScore });
    };

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const x = (clientX - rect.left) * scaleX;
      stateRef.current.player.targetX = clamp(x - paddleW / 2, 0, W - paddleW);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons) handleMove(e.clientX);
    };
    const onMouseDown = (e: MouseEvent) => handleMove(e.clientX);

    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);

    const update = () => {
      const s = stateRef.current;
      if (s.paused) return;

      s.player.x += (s.player.targetX - s.player.x) * s.player.speed;
      s.cpu.x += (s.ball.x - (s.cpu.x + s.cpu.w / 2)) * s.cpuFactor;
      s.cpu.x = clamp(s.cpu.x, 0, W - s.cpu.w);

      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;
      if (s.ball.x - s.ball.r < 0 || s.ball.x + s.ball.r > W) s.ball.vx *= -1;

      if (s.ball.y - s.ball.r < 0) { s.playerScore++; syncScore(); resetBall(); }
      if (s.ball.y + s.ball.r > H) { s.cpuScore++; syncScore(); resetBall(); }

      if (s.ball.y + s.ball.r > s.player.y && s.ball.x > s.player.x && s.ball.x < s.player.x + s.player.w && s.ball.vy > 0) {
        s.ball.vy *= -1;
        const diff = s.ball.x - (s.player.x + s.player.w / 2);
        s.ball.vx = diff * 0.15;
        s.ball.vy *= 1.05;
      }
      if (s.ball.y - s.ball.r < s.cpu.y + s.cpu.h && s.ball.x > s.cpu.x && s.ball.x < s.cpu.x + s.cpu.w && s.ball.vy < 0) {
        s.ball.vy *= -1;
        const diff = s.ball.x - (s.cpu.x + s.cpu.w / 2);
        s.ball.vx = diff * 0.15;
        s.ball.vy *= 1.05;
      }

      if (s.winTo > 0 && (s.playerScore >= s.winTo || s.cpuScore >= s.winTo)) {
        s.paused = true;
        setWinner(s.playerScore > s.cpuScore ? 'player' : 'cpu');
        setScreen('end');
      }
    };

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // Retro court
      ctx.fillStyle = '#2a3a2a';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // CPU paddle (top, teal)
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(s.cpu.x, s.cpu.y, s.cpu.w, s.cpu.h);
      // Player paddle (bottom, aqua blue)
      ctx.fillStyle = '#6ea5ff';
      ctx.fillRect(s.player.x, s.player.y, s.player.w, s.player.h);

      // Ball
      ctx.fillStyle = '#f8f8f8';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
      ctx.fill();

      // Scores
      ctx.font = '600 18px "Helvetica Neue", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(String(s.cpuScore), W / 2, 42);
      ctx.fillText(String(s.playerScore), W / 2, H - 18);
    };

    const loop = () => {
      update();
      render();
      draw.current = requestAnimationFrame(loop) as unknown as () => void;
    };

    resetBall();
    loop();

    return () => {
      cancelAnimationFrame(draw.current as unknown as number);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const start = (diff: Diff, winTo: number) => {
    const s = stateRef.current;
    s.cpuFactor = DIFFICULTIES[diff].factor;
    s.ballSpeed = DIFFICULTIES[diff].ballSpeed;
    s.winTo = winTo;
    s.playerScore = 0;
    s.cpuScore = 0;
    s.paused = false;
    setScore({ p: 0, c: 0 });
    setWinner(null);
    setScreen('playing');
  };

  const pause = () => {
    const s = stateRef.current;
    s.paused = !s.paused;
  };

  return (
    <div className="padel">
      <AppNav title="Padel Pong" onBack={onBack} />
      <div className="padel-hud">
        <span>You <b>{score.p}</b> : <b>{score.c}</b> CPU</span>
        <button className="ios-btn plain" onClick={pause}>Pause</button>
      </div>

      <div className="padel-stage">
        <canvas ref={canvasRef} width={W} height={H} className="padel-canvas" />

        {screen === 'menu' && (
          <div className="padel-overlay">
            <h3>Padel Pong</h3>
            <p className="overlay-sub">Pick a difficulty</p>
            <div className="overlay-btns">
              {(Object.keys(DIFFICULTIES) as Diff[]).map((d) => (
                <button key={d} className="ios-btn" onClick={() => { setScreen('rules'); start(d, 21); }}>
                  {DIFFICULTIES[d].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'rules' && (
          <div className="padel-overlay">
            <h3>Win condition</h3>
            <div className="overlay-btns">
              <button className="ios-btn" onClick={() => start('easy' as Diff, 7)}>First to 7</button>
              <button className="ios-btn" onClick={() => start('easy' as Diff, 21)}>First to 21</button>
              <button className="ios-btn plain" onClick={() => start('easy' as Diff, 0)}>Free mode</button>
            </div>
          </div>
        )}

        {screen === 'end' && (
          <div className="padel-overlay">
            <h3 className={winner === 'player' ? 'win' : 'lose'}>
              {winner === 'player' ? 'You win!' : 'CPU wins'}
            </h3>
            <p className="overlay-sub">Final: {score.p} – {score.c}</p>
            <button className="ios-btn" onClick={() => setScreen('menu')}>Play again</button>
          </div>
        )}
      </div>

      <p className="padel-hint">Drag on the field to move your paddle</p>
    </div>
  );
}
