import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // 4 depth layers — back to front
    // Each layer generates many closely-spaced wave lines for dense coverage
    // n = line count, amp = wave amplitude (px), freq = spatial freq,
    // speed = animation speed, op = opacity, lw = line width,
    // ps = per-line phase spread (radians) for visual variety
    const groups = [
      // Layer 4 — deepest, barely visible, very slow
      { rgb: '2,20,9',      n: 50, amp: 20, freq: 0.0020, speed: 0.003, op: 0.055, lw: 0.35, ps: 0.9 },
      // Layer 3 — back, dark green, slow
      { rgb: '5,46,28',     n: 55, amp: 30, freq: 0.0030, speed: 0.008, op: 0.095, lw: 0.65, ps: 1.3 },
      // Layer 2 — mid green
      { rgb: '10,102,64',   n: 45, amp: 44, freq: 0.0042, speed: 0.019, op: 0.155, lw: 1.25, ps: 2.1 },
      // Layer 1 — front, bright green, fastest
      { rgb: '29,158,117',  n: 40, amp: 56, freq: 0.0055, speed: 0.032, op: 0.285, lw: 2.1,  ps: 3.2 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      for (const g of groups) {
        ctx.lineWidth = g.lw;
        ctx.strokeStyle = `rgba(${g.rgb},${g.op})`;

        for (let i = 0; i < g.n; i++) {
          // Distribute lines evenly across full screen height
          const yBase = H * (i / (g.n - 1));
          // Each line gets a distinct phase so they look like independent waves
          const phase = i * g.ps;

          ctx.beginPath();
          for (let x = 0; x <= W; x += 4) {
            const y = yBase + Math.sin(x * g.freq + t * g.speed + phase) * g.amp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      t += 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
