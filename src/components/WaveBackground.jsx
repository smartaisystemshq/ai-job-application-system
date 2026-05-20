import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Three depth layers — back to front, increasing color brightness and opacity
    // Back  (#0a3028): opacity 0.05, fill 0.008, stroke 0.6px — slowest, darkest
    // Mid   (#155f47): opacity 0.12, fill 0.025, stroke 1.2px — medium
    // Front (#1D9E75): opacity 0.25, fill 0.06,  stroke 2px   — fastest, brightest
    const waves = [
      // Layer 1 — back (slow, very subtle)
      { yRatio: 0.08,  amp: 16, freq: 0.0038, speed: 0.008, opacity: 0.05, lw: 0.6, layer: 1 },
      { yRatio: 0.22,  amp: 22, freq: 0.0052, speed: 0.009, opacity: 0.05, lw: 0.6, layer: 1 },
      { yRatio: 0.38,  amp: 18, freq: 0.0034, speed: 0.007, opacity: 0.05, lw: 0.6, layer: 1 },
      { yRatio: 0.55,  amp: 26, freq: 0.0044, speed: 0.009, opacity: 0.05, lw: 0.6, layer: 1 },
      { yRatio: 0.72,  amp: 20, freq: 0.0060, speed: 0.008, opacity: 0.05, lw: 0.6, layer: 1 },
      { yRatio: 0.88,  amp: 24, freq: 0.0042, speed: 0.010, opacity: 0.05, lw: 0.6, layer: 1 },

      // Layer 2 — mid (medium speed)
      { yRatio: 0.14,  amp: 32, freq: 0.0058, speed: 0.020, opacity: 0.12, lw: 1.2, layer: 2 },
      { yRatio: 0.30,  amp: 24, freq: 0.0040, speed: 0.024, opacity: 0.12, lw: 1.2, layer: 2 },
      { yRatio: 0.47,  amp: 38, freq: 0.0048, speed: 0.018, opacity: 0.12, lw: 1.2, layer: 2 },
      { yRatio: 0.63,  amp: 28, freq: 0.0066, speed: 0.022, opacity: 0.12, lw: 1.2, layer: 2 },
      { yRatio: 0.79,  amp: 34, freq: 0.0044, speed: 0.020, opacity: 0.12, lw: 1.2, layer: 2 },

      // Layer 3 — front (fast, most visible, brightest)
      { yRatio: 0.06,  amp: 42, freq: 0.0062, speed: 0.034, opacity: 0.25, lw: 2.0, layer: 3 },
      { yRatio: 0.26,  amp: 30, freq: 0.0046, speed: 0.038, opacity: 0.25, lw: 2.0, layer: 3 },
      { yRatio: 0.44,  amp: 48, freq: 0.0054, speed: 0.032, opacity: 0.25, lw: 2.0, layer: 3 },
      { yRatio: 0.62,  amp: 36, freq: 0.0040, speed: 0.036, opacity: 0.25, lw: 2.0, layer: 3 },
      { yRatio: 0.82,  amp: 44, freq: 0.0050, speed: 0.030, opacity: 0.25, lw: 2.0, layer: 3 },
    ];

    const LAYER_COLOR = { 1: '10,48,40', 2: '21,95,71', 3: '29,158,117' };
    const LAYER_FILL  = { 1: 0.008, 2: 0.025, 3: 0.06 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const sortedWaves = [...waves].sort((a, b) => a.layer - b.layer);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill between adjacent same-layer wave pairs
      for (let wi = 0; wi < sortedWaves.length - 1; wi++) {
        const w1 = sortedWaves[wi];
        const w2 = sortedWaves[wi + 1];
        if (w1.layer !== w2.layer) continue;

        const fillOpacity = LAYER_FILL[w1.layer] || 0.008;
        const rgb = LAYER_COLOR[w1.layer];

        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * w1.yRatio + Math.sin(x * w1.freq + t * w1.speed) * w1.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let x = canvas.width; x >= 0; x -= 4) {
          const y = canvas.height * w2.yRatio + Math.sin(x * w2.freq + t * w2.speed) * w2.amp;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb},${fillOpacity})`;
        ctx.fill();
      }

      // Draw wave strokes
      for (const w of sortedWaves) {
        const y0 = canvas.height * w.yRatio;
        const rgb = LAYER_COLOR[w.layer];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${rgb},${w.opacity})`;
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
