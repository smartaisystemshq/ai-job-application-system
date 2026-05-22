import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Interaction state
    let mouseX = -1, mouseY = -1;
    let scrollY = 0;
    const ripples = []; // { x, y, age, maxAge }

    // Wave band: center in lower-middle area, covering ~60% of screen height
    // Rendered from bandTop to bandBottom, with lines distributed inside
    const BAND_CENTER = 0.62; // fraction of screen height
    const BAND_HALF   = 0.30; // half-height of band as fraction

    // 3 depth layers — back to front
    // n = line count in layer, amp = wave amplitude, freq = spatial freq,
    // speed = base animation speed, op = opacity, lw = line width,
    // ps = per-line phase spread
    const layers = [
      { rgb: '5,46,28',    n: 20, amp: 28, freq: 0.0028, speed: 0.006, op: 0.10, lw: 0.6,  ps: 1.1 },
      { rgb: '10,102,64',  n: 18, amp: 40, freq: 0.0038, speed: 0.016, op: 0.17, lw: 1.2,  ps: 1.8 },
      { rgb: '29,158,117', n: 14, amp: 54, freq: 0.0050, speed: 0.030, op: 0.30, lw: 2.0,  ps: 2.6 },
    ];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = e => { mouseX = e.clientX; mouseY = e.clientY; };
    const onScroll    = ()  => { scrollY = window.scrollY; };
    const onClick     = e  => {
      ripples.push({ x: e.clientX, y: e.clientY, age: 0, maxAge: 60 });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll',    onScroll, { passive: true });
    window.addEventListener('click',     onClick);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      // Band center shifts slightly with scroll (max ±8% of H)
      const scrollShift = (scrollY / (document.body.scrollHeight || H)) * H * 0.08;
      const bandCenterY = H * BAND_CENTER + scrollShift;
      const bandHalfPx  = H * BAND_HALF;

      // Age ripples
      for (let r = ripples.length - 1; r >= 0; r--) {
        ripples[r].age++;
        if (ripples[r].age > ripples[r].maxAge) ripples.splice(r, 1);
      }

      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        // Depth factor: back layers slightly less responsive to mouse
        const depthFactor = (li + 1) / layers.length;

        ctx.lineWidth   = layer.lw;
        ctx.strokeStyle = `rgba(${layer.rgb},${layer.op})`;

        for (let i = 0; i < layer.n; i++) {
          // Distribute lines within band (top to bottom)
          const frac = layer.n === 1 ? 0.5 : i / (layer.n - 1);
          const yBase = bandCenterY - bandHalfPx + frac * bandHalfPx * 2;
          const phase = i * layer.ps;

          ctx.beginPath();
          for (let x = 0; x <= W; x += 4) {
            let y = yBase + Math.sin(x * layer.freq + t * layer.speed + phase) * layer.amp;

            // Mouse distortion: gaussian influence centered on mouse
            if (mouseX >= 0) {
              const dx = x - mouseX;
              const dy = y - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const influence = Math.exp(-dist * dist / (2 * 160 * 160));
              y += influence * 18 * depthFactor * Math.sin(t * 0.04 + x * 0.01);
            }

            // Ripple distortion
            for (const rpl of ripples) {
              const dx = x - rpl.x;
              const dy = y - rpl.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const progress = rpl.age / rpl.maxAge;
              const wavefront = progress * 220;
              const spread = 35;
              const envelope = Math.exp(-((dist - wavefront) ** 2) / (2 * spread * spread));
              const fade = 1 - progress;
              y += envelope * fade * 14 * depthFactor;
            }

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
      window.removeEventListener('resize',    resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('click',     onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
