import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Particle wave layers — back to front
    // Same yRatio/amp/freq/speed as original; dots replace lines
    const layers = [
      // Layer 4 — deepest, barely visible
      { yRatio: 0.10, amp: 10, freq: 0.0028, speed: 0.004, color: '2,20,9',    opacity: 0.35, radius: 0.7, spacing: 32, pulseSpd: 0.007, pulseAmt: 0.12 },
      { yRatio: 0.30, amp: 12, freq: 0.0022, speed: 0.003, color: '2,20,9',    opacity: 0.35, radius: 0.7, spacing: 32, pulseSpd: 0.006, pulseAmt: 0.12 },
      { yRatio: 0.52, amp: 14, freq: 0.0030, speed: 0.004, color: '2,20,9',    opacity: 0.35, radius: 0.7, spacing: 32, pulseSpd: 0.008, pulseAmt: 0.12 },
      { yRatio: 0.72, amp: 10, freq: 0.0025, speed: 0.003, color: '2,20,9',    opacity: 0.35, radius: 0.7, spacing: 32, pulseSpd: 0.007, pulseAmt: 0.12 },
      { yRatio: 0.90, amp: 12, freq: 0.0032, speed: 0.004, color: '2,20,9',    opacity: 0.35, radius: 0.7, spacing: 32, pulseSpd: 0.009, pulseAmt: 0.12 },

      // Layer 3 — back, dark green
      { yRatio: 0.08, amp: 16, freq: 0.0038, speed: 0.008, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.011, pulseAmt: 0.18 },
      { yRatio: 0.22, amp: 22, freq: 0.0052, speed: 0.009, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.010, pulseAmt: 0.18 },
      { yRatio: 0.38, amp: 18, freq: 0.0034, speed: 0.007, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.013, pulseAmt: 0.18 },
      { yRatio: 0.55, amp: 26, freq: 0.0044, speed: 0.009, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.011, pulseAmt: 0.18 },
      { yRatio: 0.72, amp: 20, freq: 0.0060, speed: 0.008, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.014, pulseAmt: 0.18 },
      { yRatio: 0.88, amp: 24, freq: 0.0042, speed: 0.010, color: '5,46,28',   opacity: 0.50, radius: 1.1, spacing: 24, pulseSpd: 0.012, pulseAmt: 0.18 },

      // Layer 2 — mid green
      { yRatio: 0.14, amp: 32, freq: 0.0058, speed: 0.020, color: '10,102,64', opacity: 0.65, radius: 1.6, spacing: 18, pulseSpd: 0.018, pulseAmt: 0.22 },
      { yRatio: 0.30, amp: 24, freq: 0.0040, speed: 0.024, color: '10,102,64', opacity: 0.65, radius: 1.6, spacing: 18, pulseSpd: 0.020, pulseAmt: 0.22 },
      { yRatio: 0.47, amp: 38, freq: 0.0048, speed: 0.018, color: '10,102,64', opacity: 0.65, radius: 1.6, spacing: 18, pulseSpd: 0.016, pulseAmt: 0.22 },
      { yRatio: 0.63, amp: 28, freq: 0.0066, speed: 0.022, color: '10,102,64', opacity: 0.65, radius: 1.6, spacing: 18, pulseSpd: 0.022, pulseAmt: 0.22 },
      { yRatio: 0.79, amp: 34, freq: 0.0044, speed: 0.020, color: '10,102,64', opacity: 0.65, radius: 1.6, spacing: 18, pulseSpd: 0.019, pulseAmt: 0.22 },

      // Layer 1 — front, brightest, fastest
      { yRatio: 0.06, amp: 42, freq: 0.0062, speed: 0.034, color: '29,158,117', opacity: 0.88, radius: 2.2, spacing: 14, pulseSpd: 0.028, pulseAmt: 0.28 },
      { yRatio: 0.26, amp: 30, freq: 0.0046, speed: 0.038, color: '29,158,117', opacity: 0.88, radius: 2.2, spacing: 14, pulseSpd: 0.032, pulseAmt: 0.28 },
      { yRatio: 0.44, amp: 48, freq: 0.0054, speed: 0.032, color: '29,158,117', opacity: 0.88, radius: 2.2, spacing: 14, pulseSpd: 0.026, pulseAmt: 0.28 },
      { yRatio: 0.62, amp: 36, freq: 0.0040, speed: 0.036, color: '29,158,117', opacity: 0.88, radius: 2.2, spacing: 14, pulseSpd: 0.030, pulseAmt: 0.28 },
      { yRatio: 0.82, amp: 44, freq: 0.0050, speed: 0.030, color: '29,158,117', opacity: 0.88, radius: 2.2, spacing: 14, pulseSpd: 0.025, pulseAmt: 0.28 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const layer of layers) {
        const count = Math.ceil(canvas.width / layer.spacing) + 1;
        for (let i = 0; i < count; i++) {
          const x = i * layer.spacing;
          const y = canvas.height * layer.yRatio +
            Math.sin(x * layer.freq + t * layer.speed) * layer.amp;

          // Per-particle phase offset makes pulsing feel organic
          const pulse = 1 + layer.pulseAmt * Math.sin(t * layer.pulseSpd + i * 0.7);
          const r = layer.radius * pulse;
          const op = layer.opacity * (0.75 + 0.25 * pulse);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${layer.color},${op})`;
          ctx.fill();
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
