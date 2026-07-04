// Lightweight confetti — no dependencies, works offline. window.PFConfetti.
// burst({x, y, count}) fires one pop; celebrate() fires 10 staggered pops.
(function () {
  let canvas, ctx, raf, parts = [];
  const COLORS = ['#2f6bff', '#12b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#22d3ee'];

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5000';
    document.body.appendChild(canvas);
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!canvas) return;
    const d = window.devicePixelRatio || 1;
    canvas.width = innerWidth * d; canvas.height = innerHeight * d;
    ctx = canvas.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function burst(opts) {
    opts = opts || {}; ensure();
    const x = opts.x != null ? opts.x : innerWidth / 2;
    const y = opts.y != null ? opts.y : innerHeight * 0.4;
    const n = opts.count || 110;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: 0.14 + Math.random() * 0.1,
        s: 5 + Math.random() * 6, c: COLORS[i % COLORS.length], rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * .3, life: 0, max: 70 + Math.random() * 45, shape: Math.random() < .5 ? 'r' : 'c',
      });
    }
    if (!raf) loop();
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.shape === 'r') ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.28); ctx.fill(); }
      ctx.restore();
      if (p.life >= p.max || p.y > innerHeight + 40) parts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    if (parts.length === 0) { cancelAnimationFrame(raf); raf = null; }
  }
  function celebrate() {
    let i = 0;
    const t = setInterval(() => {
      burst({ x: innerWidth * (0.15 + Math.random() * 0.7), y: innerHeight * (0.18 + Math.random() * 0.32), count: 90 });
      if (++i >= 10) clearInterval(t);
    }, 220);
  }
  window.PFConfetti = { burst, celebrate };
})();
