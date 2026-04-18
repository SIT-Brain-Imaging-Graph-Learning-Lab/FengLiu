// Hero: elegant ink-particle network with repel-ripple cursor interaction.
// Warm ivory + gold tones, slow & deliberate motion.
// Pure Canvas 2D, no deps.

export function mountNeuralCanvas(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0;
  let nodes = [];
  let ripples = [];
  let raf = 0;
  let mouse = { x: -1e6, y: -1e6, active: false, lastX: 0, lastY: 0 };
  let lastRippleTime = 0;

  const CONFIG = {
    density: 0.00007,
    nodeMin: 40,
    nodeMax: 90,
    linkDist: 150,
    driftSpeed: 0.08,
    repelRadius: 140,
    repelStrength: 0.32,
    rippleMinGapMs: 220,
    rippleMinDist: 16,
    color: {
      ink:  'rgba(245, 245, 247, ',   // Apple white
      gold: 'rgba(245, 245, 247, ',   // unified white, no gold
      node: '#F5F5F7'
    }
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    const count = Math.max(
      CONFIG.nodeMin,
      Math.min(CONFIG.nodeMax, Math.round(w * h * CONFIG.density))
    );
    nodes = new Array(count).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      ox: 0, oy: 0,         // origin offset for return-to-home spring
      vx: (Math.random() - 0.5) * CONFIG.driftSpeed,
      vy: (Math.random() - 0.5) * CONFIG.driftSpeed,
      r: 0.8 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.006 + Math.random() * 0.008
    }));
    for (const n of nodes) { n.ox = n.x; n.oy = n.y; }
  }

  function step(now) {
    ctx.clearRect(0, 0, w, h);

    // Mouse repel + drift
    for (const n of nodes) {
      // slow drift
      n.x += n.vx;
      n.y += n.vy;
      n.phase += n.twinkleSpeed;

      // soft return-to-origin spring (keeps composition stable)
      n.vx += (n.ox - n.x) * 0.00015;
      n.vy += (n.oy - n.y) * 0.00015;

      // mouse repulsion
      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = CONFIG.repelRadius;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / R;
          const force = falloff * falloff * CONFIG.repelStrength;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }
      }

      // damping
      n.vx *= 0.94;
      n.vy *= 0.94;

      // soft bounds
      if (n.x < 0 || n.x > w) n.vx *= -0.6;
      if (n.y < 0 || n.y > h) n.vy *= -0.6;
      n.x = Math.max(0, Math.min(w, n.x));
      n.y = Math.max(0, Math.min(h, n.y));
    }

    // Edges — faint ink lines
    const linkDistSq = CONFIG.linkDist * CONFIG.linkDist;
    ctx.lineWidth = 0.55;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= linkDistSq) continue;
        const alpha = (1 - d2 / linkDistSq) * 0.18;
        ctx.strokeStyle = CONFIG.color.ink + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Ripples — elegant gold expanding rings
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age++;
      if (r.age > r.life) { ripples.splice(i, 1); continue; }
      const t = r.age / r.life;
      const eased = 1 - Math.pow(1 - t, 3);
      const radius = eased * r.maxRadius;
      const alpha = (1 - t) * 0.55;
      ctx.strokeStyle = CONFIG.color.gold + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1 + (1 - t) * 0.6;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // second inner ring for richness
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = CONFIG.color.gold + (alpha * 0.5).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Nodes — small ivory dots with gentle twinkle
    for (const n of nodes) {
      const tw = 0.55 + Math.sin(n.phase) * 0.45;
      ctx.fillStyle = CONFIG.color.ink + (0.55 * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cursor aura — subtle gold glow at cursor
    if (mouse.active) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
      g.addColorStop(0, CONFIG.color.gold + '0.16)');
      g.addColorStop(0.6, CONFIG.color.gold + '0.04)');
      g.addColorStop(1, CONFIG.color.gold + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  function spawnRipple(x, y) {
    ripples.push({
      x, y,
      age: 0,
      life: 90,
      maxRadius: 160 + Math.random() * 60
    });
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const ny = e.clientY - r.top;
    mouse.x = nx; mouse.y = ny;
    mouse.active = true;
    const now = performance.now();
    const moved = Math.hypot(nx - mouse.lastX, ny - mouse.lastY);
    if (moved > CONFIG.rippleMinDist && now - lastRippleTime > CONFIG.rippleMinGapMs) {
      spawnRipple(nx, ny);
      lastRippleTime = now;
      mouse.lastX = nx; mouse.lastY = ny;
    }
  }
  function onLeave() { mouse.active = false; }
  function onClick(e) {
    const r = canvas.getBoundingClientRect();
    spawnRipple(e.clientX - r.left, e.clientY - r.top);
  }

  resize();
  raf = requestAnimationFrame(step);
  window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('mousemove', onMove, { passive: true });
  canvas.addEventListener('mouseleave', onLeave, { passive: true });
  canvas.addEventListener('click', onClick, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseleave', onLeave);
    canvas.removeEventListener('click', onClick);
  };
}
