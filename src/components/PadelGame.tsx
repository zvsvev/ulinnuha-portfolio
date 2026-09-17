import { useEffect, useRef, useState } from 'react';
import AppNav from './AppNav';
import { useI18n, type StringKey } from '../i18n/strings';
import './PadelGame.css';

const W = 320;
const H = 500;
const paddleW = 80;
const paddleH = 12;

const DIFFICULTIES = {
  easy: { factor: 0.03, ballSpeed: 3 },
  medium: { factor: 0.1, ballSpeed: 6 },
  hard: { factor: 0.5, ballSpeed: 9 },
} as const;

const DIFF_LABEL: Record<keyof typeof DIFFICULTIES, StringKey> = {
  easy: 'padel_easy',
  medium: 'padel_medium',
  hard: 'padel_hard',
};

type Diff = keyof typeof DIFFICULTIES;

type Props = { onBack: () => void };

export default function PadelGame({ onBack }: Props) {
  const { t } = useI18n();
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
  const [diff, setDiff] = useState<Diff>('easy');
  const [winTo, setWinTo] = useState(21);
  const [paused, setPaused] = useState(false);

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

  const start = (nextDiff: Diff, nextWinTo: number) => {
    const s = stateRef.current;
    s.cpuFactor = DIFFICULTIES[nextDiff].factor;
    s.ballSpeed = DIFFICULTIES[nextDiff].ballSpeed;
    s.winTo = nextWinTo;
    s.playerScore = 0;
    s.cpuScore = 0;
    s.paused = false;
    setPaused(false);
    setDiff(nextDiff);
    setWinTo(nextWinTo);
    setScore({ p: 0, c: 0 });
    setWinner(null);
    setScreen('playing');
  };

  const pause = () => {
    const s = stateRef.current;
    s.paused = !s.paused;
    setPaused(s.paused);
  };

  const resume = () => {
    stateRef.current.paused = false;
    setPaused(false);
  };

  const backToMenu = () => {
    stateRef.current.paused = true;
    setPaused(false);
    setWinner(null);
    setScreen('menu');
  };

  return (
    <div className="padel">
      <AppNav title={t('padel')} onBack={onBack} />
      <div className="padel-hud">
        <span>{t('padel_you')} <b>{score.p}</b> : <b>{score.c}</b> {t('padel_cpu')}</span>
        {screen === 'playing' && (
          <button className="ios-btn plain" onClick={pause} aria-pressed={paused}>
            {paused ? t('padel_resume') : t('padel_pause')}
          </button>
        )}
      </div>

      <div className="padel-stage">
        <canvas ref={canvasRef} width={W} height={H} className="padel-canvas" aria-hidden="true" />

        {screen === 'menu' && (
          <div className="padel-overlay">
            <h3>{t('padel')}</h3>
            <p className="overlay-sub">{t('padel_pick_difficulty')}</p>
            <div className="overlay-btns">
              {(Object.keys(DIFFICULTIES) as Diff[]).map((d) => (
                <button key={d} className="ios-btn" onClick={() => { setDiff(d); setScreen('rules'); }}>
                  {t(DIFF_LABEL[d])}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'rules' && (
          <div className="padel-overlay">
            <h3>{t('padel_win_condition')}</h3>
            <div className="overlay-btns">
              <button className="ios-btn" onClick={() => start(diff, 7)}>{t('padel_first_to_7')}</button>
              <button className="ios-btn" onClick={() => start(diff, 21)}>{t('padel_first_to_21')}</button>
              <button className="ios-btn plain" onClick={() => start(diff, 0)}>{t('padel_free_mode')}</button>
              <button className="ios-btn plain" onClick={() => setScreen('menu')}>{t('padel_back')}</button>
            </div>
          </div>
        )}

        {screen === 'playing' && paused && (
          <div className="padel-overlay">
            <h3>{t('padel_paused')}</h3>
            <div className="overlay-btns">
              <button className="ios-btn" onClick={resume}>{t('padel_resume')}</button>
              <button className="ios-btn plain" onClick={backToMenu}>{t('padel_back_to_menu')}</button>
            </div>
          </div>
        )}

        {screen === 'end' && (
          <div className="padel-overlay">
            <h3 className={winner === 'player' ? 'win' : 'lose'}>
              {winner === 'player' ? t('padel_you_win') : t('padel_cpu_wins')}
            </h3>
            <p className="overlay-sub">{t('padel_final')}: {score.p} – {score.c}</p>
            <div className="overlay-btns">
              <button className="ios-btn" onClick={() => start(diff, winTo)}>
                {t('padel_play_again')}
              </button>
              <button className="ios-btn plain" onClick={backToMenu}>{t('padel_back_to_menu')}</button>
            </div>
          </div>
        )}
      </div>

      <p className="padel-hint">{t('padel_hint')}</p>
    </div>
  );
}
