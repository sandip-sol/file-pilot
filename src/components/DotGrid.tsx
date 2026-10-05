import { useEffect, useRef } from 'react';

const SPACING = 14;
const EFFECT_RADIUS = 140;
const TRAIL_LENGTH = 8;
const CURSOR_SIZE = 8;

const EFFECT_RADIUS_SQ = EFFECT_RADIUS * EFFECT_RADIUS;

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function getCssFloat(prop: string, fallback: number): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function getCssHsl(prop: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return v || fallback;
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

    // Assigned once the drawing functions below exist.
    let scheduleTrail = () => {};
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onMouseMove(e: MouseEvent) {
      const pos = { x: e.clientX, y: e.clientY };

      if (!reduceMotion) {
        const history = mouseHistory.current;
        history.push(pos);
        if (history.length > TRAIL_LENGTH) {
          history.shift();
        }
        scheduleTrail();
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

    let dotColor = '';
    let opIdle = 0;
    let opHover = 0;
    let rIdle = 0;
    let rHover = 0;

    function readTheme() {
      dotColor = getCssHsl('--dot-color', '0 0% 48%');
      opIdle = getCssFloat('--dot-opacity-idle', 0.10);
      opHover = getCssFloat('--dot-opacity-hover', 0.22);
      rIdle = getCssFloat('--dot-radius-idle', 1);
      rHover = getCssFloat('--dot-radius-hover', 2.2);
    }

    /**
     * Redraw only the dots inside [x0, x1] × [y0, y1].
     *
     * This used to repaint the whole grid on every animation frame, forever —
     * ~5,000 arcs per frame on a laptop and 30,000+ on a 4K screen, with the
     * mouse still or on a phone that has no mouse at all. Measured with the
     * page untouched, that kept the main thread busy ~80% of the time, which
     * is what made scrolling and clicks feel sluggish. Now the full grid is
     * painted once, and pointer movement repaints only the area around the
     * old and new trail.
     */
    function drawRegion(x0: number, y0: number, x1: number, y1: number) {
      const history = mouseHistory.current;
      const totalPositions = history.length;
      const weights: number[] = [];
      if (totalPositions > 0) {
        let weightSum = 0;
        for (let i = 0; i < totalPositions; i++) {
          weights.push(i + 1);
          weightSum += i + 1;
        }
        for (let i = 0; i < totalPositions; i++) weights[i] /= weightSum;
      }

      const colStart = Math.max(0, Math.floor(x0 / SPACING));
      const colEnd = Math.min(cols - 1, Math.ceil(x1 / SPACING));
      const rowStart = Math.max(0, Math.floor(y0 / SPACING));
      const rowEnd = Math.min(rows - 1, Math.ceil(y1 / SPACING));

      // Clear to the midpoints between dots so neighbours outside the region
      // are never clipped.
      const half = SPACING / 2;
      ctx.clearRect(colStart * SPACING - half, rowStart * SPACING - half, (colEnd - colStart + 1) * SPACING, (rowEnd - rowStart + 1) * SPACING);
      ctx.fillStyle = `hsl(${dotColor})`;

      // Unaffected dots share one style, so they go out as a single path.
      ctx.globalAlpha = opIdle;
      ctx.beginPath();
      const highlighted: [number, number, number][] = [];
      for (let row = rowStart; row <= rowEnd; row++) {
        const dy = row * SPACING;
        for (let col = colStart; col <= colEnd; col++) {
          const dx = col * SPACING;

          let influence = 0;
          for (let i = 0; i < totalPositions; i++) {
            const p = history[i];
            const distX = dx - p.x;
            const distY = dy - p.y;
            const distSq = distX * distX + distY * distY;
            if (distSq < EFFECT_RADIUS_SQ) {
              influence += easeOut(1 - Math.sqrt(distSq) / EFFECT_RADIUS) * weights[i];
            }
          }

          if (influence > 0) {
            highlighted.push([dx, dy, influence > 1 ? 1 : influence]);
          } else {
            ctx.moveTo(dx + rIdle, dy);
            ctx.arc(dx, dy, rIdle, 0, Math.PI * 2);
          }
        }
      }
      ctx.fill();

      for (const [dx, dy, influence] of highlighted) {
        ctx.globalAlpha = opIdle + (opHover - opIdle) * influence;
        ctx.beginPath();
        ctx.arc(dx, dy, rIdle + (rHover - rIdle) * influence, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawAll() {
      drawRegion(0, 0, window.innerWidth, window.innerHeight);
    }

    // Bounding box of the trail as last painted, so the next frame can erase it.
    let paintedBox: [number, number, number, number] | null = null;

    function trailBox(): [number, number, number, number] | null {
      const history = mouseHistory.current;
      if (history.length === 0) return null;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of history) {
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
        x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
      return [x0 - EFFECT_RADIUS, y0 - EFFECT_RADIUS, x1 + EFFECT_RADIUS, y1 + EFFECT_RADIUS];
    }

    function drawTrail() {
      rafId.current = 0;
      const box = trailBox();
      const parts = [paintedBox, box].filter((b): b is [number, number, number, number] => b !== null);
      if (parts.length === 0) return;
      drawRegion(
        Math.min(...parts.map((b) => b[0])),
        Math.min(...parts.map((b) => b[1])),
        Math.max(...parts.map((b) => b[2])),
        Math.max(...parts.map((b) => b[3])),
      );
      paintedBox = box;
    }

    // At most one repaint per frame, and only after the pointer moved.
    scheduleTrail = () => {
      if (!rafId.current) rafId.current = requestAnimationFrame(drawTrail);
    };

    function redrawEverything() {
      readTheme();
      drawAll();
      paintedBox = trailBox();
    }

    redrawEverything();
    window.addEventListener('resize', redrawEverything);

    // Theme variables change with the `dark` class on <html>.
    const themeObserver = new MutationObserver(redrawEverything);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });

    return () => {
      cancelAnimationFrame(rafId.current);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', redrawEverything);
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
          backgroundColor: 'hsl(var(--dot-color, var(--foreground)))',
          boxShadow: '0 0 8px 2px hsl(var(--dot-color, var(--foreground)) / 0.3)',
        }}
        aria-hidden="true"
      />
    </>
  );
};
