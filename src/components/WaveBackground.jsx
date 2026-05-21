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
    // Layer 4 (deepest):  #021409, opacity 0.03, 0.4px — nearly invisible, very slow
    // Layer 3 (back):     #052e1c, opacity 0.07, 0.8px — slow, dark
    // Layer 2 (mid):      #0a6640, opacity 0.18, 1.5px — medium speed
    // Layer 1 (front):    #1D9E75, opacity 0.35, 2.5px — fastest, brightest
    const waves = [
      // Layer 4 — deepest (very slow, barely visible)
      { yRatio: 0.10, amp: 10, freq: 0.0028, speed: 0.004, opacity: 0.03, lw: 0.4, layer: 4 },
      { yRatio: 0.30, amp: 12, freq: 0.0022, speed: 0.003, opacity: 0.03, lw: 0.4, layer: 4 },
      { yRatio: 0.52, amp: 14, freq: 0.0030, speed: 0.004, opacity: 0.03, lw: 0.4, layer: 4 },
      { yRatio: 0.72, amp: 10, freq: 0.0025, speed: 0.003, opacity: 0.03, lw: 0.4, layer: 4 },
      { yRatio: 0.90, amp: 12, freq: 0.0032, speed: 0.004, opacity: 0.03, lw: 0.4, layer: 4 },

      // Layer 3 — back (slow, dark green)
      { yRatio: 0.08, amp: 16, freq: 0.0038, speed: 0.008, opacity: 0.07, lw: 0.8, layer: 3 },
      { yRatio: 0.22, amp: 22, freq: 0.0052, speed: 0.009, opacity: 0.07, lw: 0.8, layer: 3 },
      { yRatio: 0.38, amp: 18, freq: 0.0034, speed: 0.007, opacity: 0.07, lw: 0.8, layer: 3 },
      { yRatio: 0.55, amp: 26, freq: 0.0044, speed: 0.009, opacity: 0.07, lw: 0.8, layer: 3 },
      { yRatio: 0.72, amp: 20, freq: 0.0060, speed: 0.008, opacity: 0.07, lw: 0.8, layer: 3 },
      { yRatio: 0.88, amp: 24, freq: 0.0042, speed: 0.010, opacity: 0.07, lw: 0.8, layer: 3 },

      // Layer 2 — mid (medium speed, mid green)
      { yRatio: 0.14, amp: 32, freq: 0.0058, speed: 0.020, opacity: 0.18, lw: 1.5, layer: 2 },
      { yRatio: 0.30, amp: 24, freq: 0.0040, speed: 0.024, opacity: 0.18, lw: 1.5, layer: 2 },
      { yRatio: 0.47, amp: 38, freq: 0.0048, speed: 0.018, opacity: 0.18, lw: 1.5, layer: 2 },
      { yRatio: 0.63, amp: 28, freq: 0.0066, speed: 0.022, opacity: 0.18, lw: 1.5, layer: 2 },
      { yRatio: 0.79, amp: 34, freq: 0.0044, speed: 0.020, opacity: 0.18, lw: 1.5, layer: 2 },

      // Layer 1 — front (fast, bright #1D9E75)
      { yRatio: 0.06, amp: 42, freq: 0.0062, speed: 0.034, opacity: 0.35, lw: 2.5, layer: 1 },
      { yRatio: 0.26, amp: 30, freq: 0.0046, speed: 0.038, opacity: 0.35, lw: 2.5, layer: 1 },
      { yRatio: 0.44, amp: 48, freq: 0.0054, speed: 0.032, opacity: 0.35, lw: 2.5, layer: 1 },
      { yRatio: 0.62, amp: 36, freq: 0.0040, speed: 0.036, opacity: 0.35, lw: 2.5, layer: 1 },
      { yRatio: 0.82, amp: 44, freq: 0.0050, speed: 0.030, opacity: 0.35, lw: 2.5, layer: 1 },
    ];

    const LAYER_COLOR = {
      1: '29,158,117',
      2: '10,102,64',
      3: '5,46,28',
      4: '2,20,9',
    };
    const LAYER_FILL = { 1: 0.06, 2: 0.020, 3: 0.008, 4: 0.003 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const sortedWaves = [...waves].sort((a, b) => a.layer - b.layer);

    // Pre-compute intersection candidates: pairs of waves from different layers
    // We sample ~8 x-positions per frame and find where two adjacent-layer waves cross
    const PARTICLE_X_SAMPLES = 12;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill between adjacent same-layer wave pairs
      for (let wi = 0; wi < sortedWaves.length - 1; wi++) {
        const w1 = sortedWaves[wi];
        const w2 = sortedWaves[wi + 1];
        if (w1.layer !== w2.layer) continue;

        const fillOpacity = LAYER_FILL[w1.layer] || 0.005;
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

      // Particle nodes at approximate intersections between layer 1 and layer 2 waves
      const frontWaves = sortedWaves.filter(w => w.layer === 1);
      const midWaves = sortedWaves.filter(w => w.layer === 2);
      const step = canvas.width / PARTICLE_X_SAMPLES;

      for (let xi = 0; xi <= PARTICLE_X_SAMPLES; xi++) {
        const x = xi * step;
        for (const wF of frontWaves) {
          const yF = canvas.height * wF.yRatio + Math.sin(x * wF.freq + t * wF.speed) * wF.amp;
          for (const wM of midWaves) {
            const yM = canvas.height * wM.yRatio + Math.sin(x * wM.freq + t * wM.speed) * wM.amp;
            const dist = Math.abs(yF - yM);
            if (dist < 18) {
              const closeness = 1 - dist / 18;
              const opacity = closeness * 0.55;
              const radius = 1.2 + closeness * 1.6;
              ctx.beginPath();
              ctx.arc(x, (yF + yM) / 2, radius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(29,158,117,${opacity})`;
              ctx.fill();
            }
          }
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
