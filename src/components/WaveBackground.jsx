import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Mix of white and brand-green (#1D9E75) waves, more lines, higher opacity, faster
    const waves = [
      { yRatio: 0.06, amp: 22, freq: 0.0042, speed: 0.028, opacity: 0.07,  lw: 1.0, green: false },
      { yRatio: 0.15, amp: 32, freq: 0.0058, speed: 0.022, opacity: 0.09,  lw: 1.2, green: true  },
      { yRatio: 0.26, amp: 18, freq: 0.0036, speed: 0.032, opacity: 0.06,  lw: 0.8, green: false },
      { yRatio: 0.37, amp: 40, freq: 0.0048, speed: 0.018, opacity: 0.08,  lw: 1.1, green: true  },
      { yRatio: 0.48, amp: 25, freq: 0.0064, speed: 0.026, opacity: 0.055, lw: 0.9, green: false },
      { yRatio: 0.58, amp: 35, freq: 0.0040, speed: 0.034, opacity: 0.085, lw: 1.0, green: true  },
      { yRatio: 0.68, amp: 20, freq: 0.0052, speed: 0.020, opacity: 0.065, lw: 1.2, green: false },
      { yRatio: 0.78, amp: 30, freq: 0.0044, speed: 0.030, opacity: 0.075, lw: 1.0, green: true  },
      { yRatio: 0.87, amp: 15, freq: 0.0070, speed: 0.016, opacity: 0.06,  lw: 0.8, green: false },
      { yRatio: 0.95, amp: 28, freq: 0.0038, speed: 0.024, opacity: 0.09,  lw: 1.1, green: true  },
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
        const color = w.green
          ? `rgba(29,158,117,${w.opacity})`
          : `rgba(255,255,255,${w.opacity})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = w.lw;
        for (let x = 0; x <= canvas.width; x += 2) {
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
