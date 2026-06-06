import React, { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 180;
const MOUSE_RADIUS   = 120;
const MAX_FORCE      = 0.4;
const BURST_COUNT    = 3;
const BURST_DURATION = 300; // ms

const COLORS = [
  { rgb: { r: 29,  g: 158, b: 117 }, threshold: 0.70 }, // #1D9E75  70%
  { rgb: { r: 168, g: 240, b: 216 }, threshold: 0.90 }, // #a8f0d8  20%
  { rgb: { r: 226, g: 237, b: 232 }, threshold: 1.00 }, // #e2ede8  10%
];

function rnd(min, max) { return min + Math.random() * (max - min); }

function pickColor() {
  const r = Math.random();
  return r < 0.70 ? COLORS[0] : r < 0.90 ? COLORS[1] : COLORS[2];
}

function mkParticle(W, H) {
  const radius = rnd(0.3, 2.2);
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    radius,
    opacity:    rnd(0.08, 0.65),
    speedX:     rnd(-0.08, 0.08),
    speedY:     rnd(-0.12, -0.02),
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: rnd(0.004, 0.018),
    rgb:        pickColor().rgb,
    glowRadius: radius * rnd(2.5, 5),
  };
}

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let particles = [];
    let bursts    = [];
    const mouse   = { x: -9999, y: -9999 };
    let scrollBoost = 0;
    let lastScrollY = window.scrollY;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        mkParticle(canvas.width, canvas.height)
      );
    };

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollBoost += delta * 0.002;
      // Clamp to prevent extreme effects
      scrollBoost = Math.max(-0.25, Math.min(0.25, scrollBoost));
    };

    const onClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < BURST_COUNT; i++) {
        const angle = (i / BURST_COUNT) * Math.PI * 2 + rnd(-0.3, 0.3);
        const speed = rnd(0.6, 1.6);
        const c = pickColor();
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: rnd(0.4, 1.0),
          rgb: c.rgb,
          startTime: now,
        });
      }
    };

    resize();
    window.addEventListener('resize',    resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    window.addEventListener('click',     onClick);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Gradually return scroll boost to zero (~500ms at 60fps)
      scrollBoost *= 0.92;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const { r, g, b } = p.rgb;

        // Breathing pulse
        p.pulsePhase += p.pulseSpeed;
        const op = p.opacity * (0.55 + 0.45 * Math.sin(p.pulsePhase));

        // Glow halo (larger particles only)
        if (p.radius > 1.0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${op * 0.08})`;
          ctx.fill();
        }

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`;
        ctx.fill();

        // Mouse repulsion
        const dx   = p.x - mouse.x;
        const dy   = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < MOUSE_RADIUS * MOUSE_RADIUS && dist2 > 0) {
          const dist  = Math.sqrt(dist2);
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MAX_FORCE;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Drift + scroll parallax
        p.x += p.speedX;
        p.y += p.speedY + scrollBoost;

        // Wrap edges
        if (p.x < -5)    p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5)    p.y = H + 5;
        if (p.y > H + 5) p.y = -5;
      }

      // Burst particles
      const now = performance.now();
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b        = bursts[i];
        const elapsed  = now - b.startTime;
        if (elapsed >= BURST_DURATION) { bursts.splice(i, 1); continue; }

        const progress = elapsed / BURST_DURATION;
        const op       = (1 - progress) * 0.85;
        const { r, g, b: blue } = b.rgb;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${blue},${op})`;
        ctx.fill();

        // Slow down as they expand
        b.x += b.vx * (1 - progress * 0.7);
        b.y += b.vy * (1 - progress * 0.7);
      }

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
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        width:         '100%',
        height:        '100%',
        zIndex:        0,
        pointerEvents: 'none',
        willChange:    'transform',
      }}
    />
  );
}
