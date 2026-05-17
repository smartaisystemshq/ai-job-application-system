import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const waves = [
      { yRatio: 0.10, amp: 28, freq: 0.0040, speed: 0.018, opacity: 0.040, lw: 1.0 },
      { yRatio: 0.27, amp: 18, freq: 0.0055, speed: 0.012, opacity: 0.050, lw: 1.2 },
      { yRatio: 0.44, amp: 38, freq: 0.0032, speed: 0.022, opacity: 0.030, lw: 0.8 },
      { yRatio: 0.60, amp: 22, freq: 0.0048, speed: 0.015, opacity: 0.055, lw: 1.0 },
      { yRatio: 0.76, amp: 32, freq: 0.0038, speed: 0.020, opacity: 0.035, lw: 1.1 },
      { yRatio: 0.91, amp: 15, freq: 0.0062, speed: 0.010, opacity: 0.045, lw: 0.9 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const w of waves) {
        const y0 = canvas.height * w.yRatio;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${w.opacity})`;
        ctx.lineWidth = w.lw;
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = y0 + Math.sin(x * w.freq + t * w.speed) * w.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
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
