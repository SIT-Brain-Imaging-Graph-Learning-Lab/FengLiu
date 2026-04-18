// Force-directed interests graph on <canvas> (centered, high-DPI, with hover particles).
// Gold-on-charcoal palette, mouse hover highlights nearest node and emits small sparks.

export function renderInterestsGraph(canvas, tags) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let nodes = [];
  let edges = [];
  let sparks = [];
  let hoverId = -1;
  let mouse = { x: -1e6, y: -1e6, active: false };
  let raf = 0;

  const COLOR = {
    ink:   'rgba(245, 245, 247, ',
    gold:  'rgba(245, 245, 247, ',   // unified white accent, no gold
    goldHex: '#F5F5F7',
    bgDot: 'rgba(245, 245, 247, 0.1)'
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function layout() {
    nodes = [];
    // Hub at center
    nodes.push({
      id: 0, label: 'Brain', hub: true,
      x: W / 2, y: H / 2, vx: 0, vy: 0,
      ox: W / 2, oy: H / 2, r: 11
    });
    // Arrange tags in a loose ring, randomized
    const n = tags.length;
    const radius = Math.min(W, H) * 0.36;
    tags.forEach((tag, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.35;
      const r = radius * (0.8 + Math.random() * 0.35);
      const x = W / 2 + Math.cos(angle) * r;
      const y = H / 2 + Math.sin(angle) * r;
      nodes.push({
        id: i + 1,
        label: tag.label,
        brief: tag.brief,
        hub: false,
        x, y, vx: 0, vy: 0, ox: x, oy: y, r: 5.5
      });
    });
    edges = [];
    for (let i = 1; i < nodes.length; i++) edges.push([0, i]);
    // Add a few ring links for richness
    for (let i = 1; i < nodes.length; i++) {
      const next = (i % (nodes.length - 1)) + 1;
      if (Math.random() < 0.45) edges.push([i, next]);
    }
  }

  function physics() {
    // Soft spring to home + subtle wobble
    for (const n of nodes) {
      if (n.hub) {
        n.x += (n.ox - n.x) * 0.12;
        n.y += (n.oy - n.y) * 0.12;
        continue;
      }
      const dx = n.ox - n.x, dy = n.oy - n.y;
      n.vx += dx * 0.012;
      n.vy += dy * 0.012;

      // hover attraction / bloom
      if (hoverId === n.id) {
        const mdx = mouse.x - n.x, mdy = mouse.y - n.y;
        const d = Math.hypot(mdx, mdy) + 0.01;
        n.vx += (mdx / d) * 0.12;
        n.vy += (mdy / d) * 0.12;
      }

      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  function closestNode() {
    if (!mouse.active) return -1;
    let best = -1, bestD = 30 * 30;
    for (const n of nodes) {
      if (n.hub) continue;
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = n.id; }
    }
    return best;
  }

  function emitSpark(x, y) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.6 + Math.random() * 1.2;
      sparks.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        age: 0, life: 40 + Math.floor(Math.random() * 30),
        r: 0.6 + Math.random() * 0.8
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle background dot-grid (very low contrast)
    const gridGap = 28;
    for (let x = (W % gridGap) / 2; x < W; x += gridGap) {
      for (let y = (H % gridGap) / 2; y < H; y += gridGap) {
        ctx.fillStyle = COLOR.bgDot;
        ctx.beginPath();
        ctx.arc(x, y, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Edges — faint with gold tint on hovered edge
    for (const [a, b] of edges) {
      const na = nodes[a], nb = nodes[b];
      const highlighted = (hoverId === a || hoverId === b);
      ctx.strokeStyle = highlighted ? COLOR.gold + '0.6)' : COLOR.ink + '0.18)';
      ctx.lineWidth = highlighted ? 1.1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
    }

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age++;
      if (s.age > s.life) { sparks.splice(i, 1); continue; }
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      const a = 1 - s.age / s.life;
      ctx.fillStyle = COLOR.gold + (a * 0.8).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nodes
    for (const n of nodes) {
      const hovered = hoverId === n.id;
      if (n.hub) {
        // gold ring hub with inner dot
        ctx.strokeStyle = COLOR.gold + '0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = COLOR.goldHex;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // outer halo on hover
        if (hovered) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22);
          g.addColorStop(0, COLOR.gold + '0.35)');
          g.addColorStop(1, COLOR.gold + '0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = hovered ? COLOR.goldHex : COLOR.ink + '0.85)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, hovered ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        const fontSize = hovered ? 13 : 12;
        ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = hovered ? '#F5F5F7' : 'rgba(199, 199, 204, 0.92)';
        ctx.fillText(n.label, n.x, n.y - 14);

        if (hovered && n.brief) {
          ctx.font = '400 11px Inter, sans-serif';
          ctx.fillStyle = 'rgba(199, 199, 204, 0.85)';
          wrapText(ctx, n.brief, n.x, n.y + 20, 180, 14);
        }
      }
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, yy);
        line = word + ' ';
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, yy);
  }

  function tick() {
    physics();
    const newHover = closestNode();
    if (newHover !== hoverId && newHover !== -1) {
      const n = nodes[newHover];
      emitSpark(n.x, n.y);
    }
    hoverId = newHover;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
  }
  function onLeave() {
    mouse.active = false;
    mouse.x = -1e6; mouse.y = -1e6;
    hoverId = -1;
  }

  resize();
  raf = requestAnimationFrame(tick);
  window.addEventListener('resize', () => {
    clearTimeout(window.__igResize);
    window.__igResize = setTimeout(resize, 180);
  }, { passive: true });
  canvas.addEventListener('mousemove', onMove, { passive: true });
  canvas.addEventListener('mouseleave', onLeave, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseleave', onLeave);
  };
}
