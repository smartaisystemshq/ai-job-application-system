import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Three depth layers at different speeds for 3D parallax feel
    const waves = [
      // Layer 1 — far (slow, subtle)
      { yRatio: 0.08,  amp: 16, freq: 0.0038, speed: 0.012, opacity: 0.05,  lw: 0.7, green: false, layer: 1 },
      { yRatio: 0.22,  amp: 22, freq: 0.0052, speed: 0.014, opacity: 0.07,  lw: 0.8, green: true,  layer: 1 },
      { yRatio: 0.38,  amp: 18, freq: 0.0034, speed: 0.011, opacity: 0.055, lw: 0.7, green: false, layer: 1 },
      { yRatio: 0.55,  amp: 26, freq: 0.0044, speed: 0.013, opacity: 0.065, lw: 0.8, green: true,  layer: 1 },
      { yRatio: 0.72,  amp: 20, freq: 0.0060, speed: 0.012, opacity: 0.05,  lw: 0.7, green: false, layer: 1 },
      { yRatio: 0.88,  amp: 24, freq: 0.0042, speed: 0.015, opacity: 0.07,  lw: 0.8, green: true,  layer: 1 },

      // Layer 2 — mid (medium speed)
      { yRatio: 0.14,  amp: 32, freq: 0.0058, speed: 0.022, opacity: 0.08,  lw: 1.0, green: true,  layer: 2 },
      { yRatio: 0.30,  amp: 24, freq: 0.0040, speed: 0.026, opacity: 0.065, lw: 0.9, green: false, layer: 2 },
      { yRatio: 0.47,  amp: 38, freq: 0.0048, speed: 0.020, opacity: 0.075, lw: 1.0, green: true,  layer: 2 },
      { yRatio: 0.63,  amp: 28, freq: 0.0066, speed: 0.024, opacity: 0.06,  lw: 0.9, green: false, layer: 2 },
      { yRatio: 0.79,  amp: 34, freq: 0.0044, speed: 0.022, opacity: 0.08,  lw: 1.0, green: true,  layer: 2 },

      // Layer 3 — near (fast, most visible)
      { yRatio: 0.06,  amp: 42, freq: 0.0062, speed: 0.034, opacity: 0.09,  lw: 1.2, green: true,  layer: 3 },
      { yRatio: 0.26,  amp: 30, freq: 0.0046, speed: 0.038, opacity: 0.07,  lw: 1.1, green: false, layer: 3 },
      { yRatio: 0.44,  amp: 48, freq: 0.0054, speed: 0.032, opacity: 0.095, lw: 1.3, green: true,  layer: 3 },
      { yRatio: 0.62,  amp: 36, freq: 0.0040, speed: 0.036, opacity: 0.075, lw: 1.1, green: false, layer: 3 },
      { yRatio: 0.82,  amp: 44, freq: 0.0050, speed: 0.030, opacity: 0.09,  lw: 1.2, green: true,  layer: 3 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Sort waves by layer for correct paint order (far to near)
    const sortedWaves = [...waves].sort((a, b) => a.layer - b.layer);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw fill between adjacent same-layer wave pairs
      for (let wi = 0; wi < sortedWaves.length - 1; wi++) {
        const w1 = sortedWaves[wi];
        const w2 = sortedWaves[wi + 1];
        if (w1.layer !== w2.layer) continue;

        // Stronger fill for nearer layers — 3D depth illusion
        const layerBoost = w1.layer === 3 ? 1.6 : w1.layer === 2 ? 1.2 : 0.8;
        const fillOpacity = ((w1.green || w2.green) ? 0.030 : 0.014) * layerBoost;

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
        ctx.fillStyle = `rgba(29,158,117,${fillOpacity})`;
        ctx.fill();
      }

      // Draw wave strokes (near layers on top)
      for (const w of sortedWaves) {
        const y0 = canvas.height * w.yRatio;
        ctx.beginPath();
        const color = w.green
          ? `rgba(29,158,117,${w.opacity})`
          : `rgba(255,255,255,${w.opacity * 0.6})`;
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
