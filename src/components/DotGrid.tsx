import { useEffect, useRef } from 'react';

const SPACING = 14;
const REST_RADIUS = 1.1;
const REST_OPACITY = 0.18;
const MAX_RADIUS = 3.4;
const MAX_OPACITY = 1;
const EFFECT_RADIUS = 140;
const TRAIL_LENGTH = 8;
const CURSOR_SIZE = 6;

const EFFECT_RADIUS_SQ = EFFECT_RADIUS * EFFECT_RADIUS;

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export const DotGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouseHistory = useRef<{ x: number; y: number }[]>([]);
  const rafId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursorEl = cursorRef.current;
    if (!canvas || !cursorEl) return;

    const ctx = canvas.getContext('2d')!;
    let dpr = window.devicePixelRatio || 1;
    let cols = 0;
    let rows = 0;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / SPACING) + 1;
      rows = Math.ceil(window.innerHeight / SPACING) + 1;
    }

    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e: MouseEvent) {
      const pos = { x: e.clientX, y: e.clientY };

      const history = mouseHistory.current;
      history.push(pos);
      if (history.length > TRAIL_LENGTH) {
        history.shift();
      }

      cursorEl!.style.transform = `translate(${pos.x - CURSOR_SIZE / 2}px, ${pos.y - CURSOR_SIZE / 2}px)`;
      cursorEl!.style.opacity = '1';
    }

    function onMouseLeave() {
      cursorEl!.style.opacity = '0';
    }

    function onMouseEnter(e: MouseEvent) {
      const pos = { x: e.clientX, y: e.clientY };
      cursorEl!.style.transform = `translate(${pos.x - CURSOR_SIZE / 2}px, ${pos.y - CURSOR_SIZE / 2}px)`;
      cursorEl!.style.opacity = '1';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    function getDotColor(): string {
      return getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    }

    let cachedColor = getDotColor();
    let frameCount = 0;

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (frameCount % 60 === 0) {
        cachedColor = getDotColor();
      }
      frameCount++;

      const history = mouseHistory.current;
      const weights: number[] = [];
      const totalPositions = history.length;

      if (totalPositions > 0) {
        let weightSum = 0;
        for (let i = 0; i < totalPositions; i++) {
          const wt = (i + 1) / totalPositions;
          weights.push(wt);
          weightSum += wt;
        }
        for (let i = 0; i < weights.length; i++) {
          weights[i] /= weightSum;
        }
      }

      for (let row = 0; row < rows; row++) {
        const dy = row * SPACING;
        for (let col = 0; col < cols; col++) {
          const dx = col * SPACING;

          let influence = 0;

          for (let i = 0; i < totalPositions; i++) {
            const p = history[i];
            const distX = dx - p.x;
            const distY = dy - p.y;
            const distSq = distX * distX + distY * distY;

            if (distSq < EFFECT_RADIUS_SQ) {
              const dist = Math.sqrt(distSq);
              const t = 1 - dist / EFFECT_RADIUS;
              influence += easeOut(t) * weights[i];
            }
          }

          if (influence > 1) influence = 1;

          const radius = REST_RADIUS + (MAX_RADIUS - REST_RADIUS) * influence;
          const opacity = REST_OPACITY + (MAX_OPACITY - REST_OPACITY) * influence;

          ctx.beginPath();
          ctx.arc(dx, dy, radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${cachedColor} / ${opacity})`;
          ctx.fill();
        }
      }

      rafId.current = requestAnimationFrame(draw);
    }

    rafId.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full opacity-0"
        style={{
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          backgroundColor: 'hsl(var(--foreground))',
          boxShadow: '0 0 8px 2px hsl(var(--foreground) / 0.4)',
        }}
        aria-hidden="true"
      />
    </>
  );
};
