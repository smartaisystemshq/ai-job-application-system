import React, { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Interaction state — unchanged
    let mouseX = -1, mouseY = -1;
    let scrollY = 0;
    const ripples = [];

    // Focused band — starts top-left, curves down toward right, fades out at right-centre
    const BAND_CENTER = 0.42;  // slightly above centre
    const BAND_HALF   = 0.20;  // narrower band (40% of screen height)

    // 9° diagonal tilt: each x pixel shifts y by this slope, centred at W/2
    const TILT = Math.tan(9 * Math.PI / 180); // ≈ 0.1584

    // Downward curve that kicks in from CURVE_START toward the right
    const CURVE_START = 0.42;
    const CURVE_STRENGTH = 0.25;

    // 3 depth layers — more lines, higher amplitude → interweaving / crossing
    // ps = per-line phase spread (higher → more phase diversity → more crossings)
    const layers = [
      { rgb: '5,46,28',    n: 28, amp: 36, freq: 0.0026, speed: 0.003, op: 0.10, lw: 0.6,  ps: 1.4 },
      { rgb: '10,102,64',  n: 25, amp: 50, freq: 0.0036, speed: 0.008, op: 0.17, lw: 1.2,  ps: 2.0 },
      { rgb: '29,158,117', n: 20, amp: 66, freq: 0.0048, speed: 0.015, op: 0.30, lw: 2.0,  ps: 2.8 },
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

      // Band centre shifts slightly with scroll (max ±8% of H)
      const scrollShift = (scrollY / (document.body.scrollHeight || H)) * H * 0.08;
      const bandCenterY = H * BAND_CENTER + scrollShift;
      const bandHalfPx  = H * BAND_HALF;

      // Mouse influence radius² (3σ = 480px → skip distant points early)
      const MOUSE_R2 = 480 * 480;
      const MOUSE_SIG2 = 2 * 160 * 160;

      // Age ripples
      for (let r = ripples.length - 1; r >= 0; r--) {
        ripples[r].age++;
        if (ripples[r].age > ripples[r].maxAge) ripples.splice(r, 1);
      }

      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        const depthFactor = (li + 1) / layers.length;

        ctx.lineWidth = layer.lw;

        // Gradient: full opacity until ~88% width, short fade to transparent at right edge
        const grad = ctx.createLinearGradient(W * 0.88, 0, W, 0);
        grad.addColorStop(0, `rgba(${layer.rgb},${layer.op})`);
        grad.addColorStop(1, `rgba(${layer.rgb},0)`);
        ctx.strokeStyle = grad;

        for (let i = 0; i < layer.n; i++) {
          const frac  = layer.n === 1 ? 0.5 : i / (layer.n - 1);
          // Flat band centre for this line (diagonal added per-x below)
          const yFlat = bandCenterY - bandHalfPx + frac * bandHalfPx * 2;
          const phase = i * layer.ps;

          ctx.beginPath();
          for (let x = 0; x <= W; x += 4) {
            // Diagonal tilt centred at mid-screen
            const diag = (x - W * 0.5) * TILT;

            // Downward curve: quadratic ramp starting at CURVE_START, peaks at right edge
            const curveNorm = Math.max(0, x / W - CURVE_START) / (1 - CURVE_START);
            const curveDrop = curveNorm * curveNorm * CURVE_STRENGTH * H;

            // Primary wave + secondary harmonic for organic feel
            let y = yFlat + diag + curveDrop
              + Math.sin(x * layer.freq + t * layer.speed + phase) * layer.amp
              + Math.sin(x * layer.freq * 2.1 + t * layer.speed * 1.6 + phase * 0.8) * layer.amp * 0.22;

            // Mouse distortion — skip points clearly outside influence radius
            if (mouseX >= 0) {
              const dx = x - mouseX;
              if (dx * dx < MOUSE_R2) {
                const dy = y - mouseY;
                const dist2 = dx * dx + dy * dy;
                if (dist2 < MOUSE_R2) {
                  const influence = Math.exp(-dist2 / MOUSE_SIG2);
                  y += influence * 18 * depthFactor * Math.sin(t * 0.04 + x * 0.01);
                }
              }
            }

            // Ripple distortion
            for (const rpl of ripples) {
              const dx = x - rpl.x;
              const dy = y - rpl.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const progress  = rpl.age / rpl.maxAge;
              const wavefront = progress * 220;
              const spread    = 35;
              const envelope  = Math.exp(-((dist - wavefront) ** 2) / (2 * spread * spread));
              y += envelope * (1 - progress) * 14 * depthFactor;
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
