/* Flow field: potential flow around a cylinder (uniform stream U past a cylinder of radius R),
   the textbook airflow problem behind booth and oven sizing, drawn as a live vector grid.
   Home: the cylinder tours the project tiles (or follows the cursor), tiles drift away from it.
   Case pages: it drifts behind the title band. Static frame under prefers-reduced-motion,
   paused off screen / in background tabs, capped at 30 fps and 1x DPR on phones. No dependencies. */
(() => {
  const cv = document.querySelector('canvas.field');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const home = !!document.querySelector('.pg-tiles');
  const tiles = home ? [...document.querySelectorAll('.pg-tiles .pt')] : [];
  const G = small ? 30 : 26;                 // grid pitch, px
  const FRAME = small ? 1000 / 30 : 0;       // phones: 30 fps cap
  let W = 0, H = 0, R = 60, ob = { x: 0, y: 0 }, goal = { x: 0, y: 0 };
  let visible = true, raf = 0, last = 0, t0 = performance.now();
  let pointer = null, pointerAt = -1e9, hover = null, tour = 0, tourAt = performance.now();
  const rect = (el) => { const a = el.getBoundingClientRect(), b = cv.getBoundingClientRect(); return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, w: a.width, h: a.height }; };

  const size = () => {
    const dpr = small ? 1 : Math.min(1.5, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = home ? Math.max(54, Math.min(110, (tiles[0] ? tiles[0].offsetWidth : 160) * 0.62)) : Math.max(48, Math.min(120, Math.min(W, H) * 0.2));
    if (!ob.x) { aim(performance.now()); ob.x = goal.x; ob.y = goal.y; }
  };

  // where the cylinder wants to be
  const aim = (now) => {
    if (home && hover) { const r = rect(hover); goal = r; return; }
    if (pointer && now - pointerAt < 2500) { goal = pointer; return; }
    if (home && tiles.length) {
      if (now - tourAt > 2600) { tour = (tour + 1) % tiles.length; tourAt = now; }
      goal = rect(tiles[tour]);
      return;
    }
    const s = (now - t0) / 1000;           // case band: slow drift on the right
    goal = { x: W * (small ? 0.8 : 0.84 + 0.06 * Math.sin(s / 4.3)), y: H * (small ? 0.12 : 0.36 + 0.2 * Math.sin(s / 2.9)) };
  };

  const hot = (el) => tiles.forEach((t) => t.classList.toggle('hot', t === el));

  const draw = (now) => {
    aim(now);
    const k = reduced ? 1 : 0.07;
    ob.x += (goal.x - ob.x) * k; ob.y += (goal.y - ob.y) * k;
    ctx.clearRect(0, 0, W, H);
    const R2 = R * R;
    ctx.lineCap = 'round';
    // two passes (gray, then red) so we only switch stroke style twice
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.strokeStyle = pass ? 'rgba(229,19,47,.55)' : 'rgba(11,11,12,.16)';
      ctx.lineWidth = pass ? 1.4 : 1;
      for (let y = G / 2; y < H; y += G) for (let x = G / 2; x < W; x += G) {
        const dx = x - ob.x, dy = y - ob.y, r2 = dx * dx + dy * dy;
        if (r2 < R2) continue;
        const near = Math.sqrt(r2) < R * 2.2;
        if (near !== !!pass) continue;
        const q = R2 / (r2 * r2);            // w = U (z + R²/z)  ->  velocity field
        const vx = 1 - q * (dx * dx - dy * dy), vy = -q * 2 * dx * dy;
        const sp = Math.hypot(vx, vy) || 1, L = Math.min(G * 0.8, 5 + sp * 6.5) / 2;
        ctx.moveTo(x - vx / sp * L, y - vy / sp * L); ctx.lineTo(x + vx / sp * L, y + vy / sp * L);
      }
      ctx.stroke();
    }
    // the cylinder: ring + centre lines (only visible where tiles don't cover it)
    ctx.strokeStyle = 'rgba(11,11,12,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ob.x, ob.y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([7, 4, 1, 4]); ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(ob.x - R - 16, ob.y); ctx.lineTo(ob.x + R + 16, ob.y);
    ctx.moveTo(ob.x, ob.y - R - 16); ctx.lineTo(ob.x, ob.y + R + 16); ctx.stroke(); ctx.setLineDash([]);

    if (home) {
      // tiles are pushed gently away from the cylinder (transform only: no layout shift)
      let closest = null, cd = 1e9;
      tiles.forEach((el) => {
        const c = rect(el), dx = c.x - ob.x, dy = c.y - ob.y, d = Math.hypot(dx, dy) || 1;
        if (d < cd) { cd = d; closest = el; }
        const push = reduced ? 0 : Math.min(7, (R2 / (d * d)) * 9);
        el.style.translate = d < 8 ? '0 0' : `${(dx / d * push).toFixed(1)}px ${(dy / d * push).toFixed(1)}px`;
      });
      hot(cd < R ? closest : null);
    }
  };

  const loop = (now) => {
    raf = 0;
    if (!live()) return;
    if (!FRAME || now - last >= FRAME) { last = now; draw(now); }
    raf = requestAnimationFrame(loop);
  };
  const live = () => visible && !reduced && !document.hidden;
  const kick = () => { if (live() && !raf) raf = requestAnimationFrame(loop); };

  size(); draw(performance.now());
  addEventListener('resize', () => { size(); draw(performance.now()); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(cv);
  document.addEventListener('visibilitychange', kick);
  if (!reduced) {
    const host = cv.parentElement;
    host.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const b = cv.getBoundingClientRect(); pointer = { x: e.clientX - b.left, y: e.clientY - b.top }; pointerAt = performance.now();
    }, { passive: true });
    host.addEventListener('pointerleave', () => { pointerAt = -1e9; });
    tiles.forEach((el) => {
      const on = () => { hover = el; }, off = () => { if (hover === el) hover = null; tourAt = performance.now(); tour = tiles.indexOf(el); };
      el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
      el.addEventListener('focus', on); el.addEventListener('blur', off);
    });
  }
  kick();

  // optional highlight filter on the project tiles (dims the others; nothing is hidden)
  document.querySelectorAll('.pg-filter button').forEach((b, _, all) => b.addEventListener('click', () => {
    all.forEach((x) => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    tiles.forEach((t) => t.classList.toggle('dim', f !== 'all' && t.dataset.t !== f));
  }));
})();
