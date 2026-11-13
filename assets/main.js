/* Maxi Gomez Montero — portfolio interactions (no dependencies) */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- headline: split into words ---------- */
  const h1 = $('#headline');
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(h1);
  // short delays: the hero copy is the LCP element (on phones CSS skips the animation entirely)
  $$('.w > span', h1).forEach((s, i) => { s.style.transitionDelay = (0.05 + i * 0.05) + 's'; });
  $$('.hero .fade-up').forEach((el, i) => { el.style.transitionDelay = (0.15 + i * 0.08) + 's'; });
  requestAnimationFrame(() => {
    h1.classList.add('in');
    $$('.hero .fade-up').forEach((el) => el.classList.add('in'));
  });

  /* ---------- nav + progress ---------- */
  const nav = $('nav.top'), bar = $('.progress');
  const tl = $('.tl'), fill = $('.tl .fill'), tlItems = $$('.tl .item');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      fill.style.height = (p * (r.height - 16)) + 'px';
      tlItems.forEach((it) => it.classList.toggle('on', it.getBoundingClientRect().top + 20 < innerHeight * 0.6));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(onScroll);   // first read after the first layout, not during it

  /* decorative CSS animations (card previews, marquee, network lines, status ping) only run while on screen */
  const aio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('paused', !e.isIntersecting)));
  $$('.lab-card .pv, svg[data-nn], .marquee, .hero, .scroll-cue').forEach((el) => { el.classList.add('paused'); aio.observe(el); });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => {
    // stagger siblings
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.transitionDelay = (sibs.indexOf(el) * 0.08) + 's';
    io.observe(el);
  });

  /* ---------- count-up ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      if (reduced) return;
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        el.textContent = (to * k).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = (0).toFixed(dec);
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- hero field (blueprint dots reacting to cursor) ---------- */
  const cv = $('#field'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, pts = [], mx = -9999, my = -9999, heroVisible = true, raf = 0;
  const GAP = 30;
  const build = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = [];
    for (let y = GAP / 2; y < H; y += GAP) for (let x = GAP / 2; x < W; x += GAP) pts.push({ x, y, ox: x, oy: y });
  };
  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);
    const scan = (t * 0.00012 % 1.3) * H;            // slow red scanline
    for (const p of pts) {
      const dx = p.ox - mx, dy = p.oy - my, d = Math.hypot(dx, dy), R = 220;
      let tx = p.ox, ty = p.oy, hot = 0;
      if (d < R) { const f = (1 - d / R); tx += dx / (d || 1) * f * 34; ty += dy / (d || 1) * f * 34; hot = f; }
      p.x += (tx - p.x) * 0.12; p.y += (ty - p.y) * 0.12;
      const s = Math.max(0, 1 - Math.abs(p.oy - scan) / 60);
      const a = 0.22 + hot * 0.75 + s * 0.45;
      ctx.fillStyle = (hot > 0.15 || s > 0.5) ? `rgba(255,43,28,${Math.min(1, a)})` : `rgba(255,255,255,${a})`;
      const r = 1 + hot * 1.6;
      ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r);
    }
    if (live()) raf = requestAnimationFrame(draw);
  };
  // phones / touch / reduced motion: draw the field once, no animation loop (saves seconds of CPU on mobile)
  const still = reduced || matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const live = () => heroVisible && !still && !document.hidden;
  const restart = () => { cancelAnimationFrame(raf); if (live()) raf = requestAnimationFrame(draw); };
  build(); draw(0);
  addEventListener('resize', () => { build(); if (still) draw(0); });
  if (!still) addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; restart(); }).observe(cv);
  document.addEventListener('visibilitychange', restart);

  /* ---------- lite YouTube embeds ---------- */
  $$('.yt[data-yt]').forEach((box) => {
    const id = box.dataset.yt, title = box.dataset.title || 'Video';
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Play video: ' + title);
    b.innerHTML = `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"><span class="play"></span>`;
    b.addEventListener('click', () => {
      const q = new URLSearchParams({ autoplay: 1, rel: 0, modestbranding: 1 });
      if (box.dataset.start) q.set('start', box.dataset.start);
      if (box.dataset.end) q.set('end', box.dataset.end);
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?${q}`;
      f.title = title;
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      box.replaceChildren(f);
    });
    box.appendChild(b);
  });

  /* "Watch me present" in the hero: scroll to the speech and start it (the click is the user gesture) */
  $$('[data-play-speech]').forEach((a) => a.addEventListener('click', (e) => {
    const box = document.getElementById('speech');
    if (!box) return;
    e.preventDefault();
    box.classList.add('in');
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    const play = box.querySelector('.yt button');
    if (play) play.click();
    history.replaceState(null, '', '#speech');
  }));

  /* ---------- research visuals ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  $$('svg[data-nn]').forEach((svg) => {
    const layers = [3, 6, 6, 1], xs = [40, 150, 260, 360], nodes = [];
    layers.forEach((n, li) => {
      nodes[li] = [];
      for (let i = 0; i < n; i++) nodes[li].push({ x: xs[li], y: 75 + (i - (n - 1) / 2) * 22 });
    });
    for (let li = 0; li < layers.length - 1; li++)
      nodes[li].forEach((a, ai) => nodes[li + 1].forEach((b, bi) => {
        const hot = (ai + bi + li) % 4 === 0;
        const l = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: hot ? 'hot' : '' }, svg);
        if (hot) l.style.animationDelay = (li * 0.5 + bi * 0.12) + 's';
      }));
    nodes.forEach((L, li) => L.forEach((p) => el('circle', { cx: p.x, cy: p.y, r: li === 3 ? 8 : 6, class: li === 3 ? 'out' : '' }, svg)));
  });
  $$('svg[data-wave]').forEach((svg) => {
    const path = el('path', { fill: 'none', stroke: '#0a0a0b', 'stroke-width': 1.4 }, svg);
    const env = el('path', { fill: 'none', stroke: '#ff2b1c', 'stroke-width': 2 }, svg);
    const draw = (t) => {
      let d = '', e = '';
      for (let x = 0; x <= 400; x += 3) {
        const amp = 30 + 18 * Math.sin(x / 60 + t / 1400);
        const y = 75 + Math.sin(x / 5 + t / 120) * amp * 0.55 + Math.sin(x / 2.3 + t / 90) * amp * 0.25;
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
        e += (x ? 'L' : 'M') + x + ' ' + (75 - amp * 0.85).toFixed(1);
      }
      path.setAttribute('d', d); env.setAttribute('d', e);
      if (!reduced) requestAnimationFrame(draw);
    };
    draw(0);
  });

  /* ---------- finishing preview (card) ---------- */
  const pv = $('#pvLine');
  if (pv && window.LABS) window.LABS.drawLine(pv, { preview: true });

  /* ---------- lab dialog ---------- */
  const dlg = $('#lab'), tabsEl = $('.lab-tabs', dlg), body = $('.lab-body', dlg), note = $('.lab-note', dlg);
  const dataEl = $('#labData'), hintEl = $('.lab-hint', dlg);
  let cleanup = null, opener = null;
  const openLab = (key, from) => {
    const lab = window.LABS && window.LABS[key];
    if (!lab) return;
    opener = from || null;
    $('#labTitle').textContent = lab.title;
    dataEl.textContent = lab.data || 'sample data';
    dataEl.classList.toggle('real', !/^(sample|synthetic)/.test(lab.data || 'sample'));
    note.textContent = lab.note;
    tabsEl.innerHTML = '';
    const show = (i) => {
      if (cleanup) { cleanup(); cleanup = null; }
      $$('button', tabsEl).forEach((b, j) => { b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
      body.setAttribute('aria-labelledby', 'labTab' + i);
      hintEl.textContent = lab.tabs[i].hint || '';
      hintEl.hidden = !lab.tabs[i].hint;
      body.innerHTML = '';
      body.scrollTop = 0; dlg.scrollTop = 0;
      cleanup = lab.tabs[i].render(body) || null;
    };
    lab.tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.id = 'labTab' + i;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'labPanel'); b.textContent = t.name;
      b.addEventListener('click', () => show(i));
      b.addEventListener('keydown', (e) => {
        const n = lab.tabs.length;
        const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
        if (to < 0) return;
        e.preventDefault(); show(to); tabsEl.children[to].focus();
      });
      tabsEl.appendChild(b);
    });
    show(0);
    dlg.showModal();
    document.body.style.overflow = 'hidden';
  };
  dlg.addEventListener('close', () => {
    if (dlg.open) return;
    if (cleanup) { cleanup(); cleanup = null; }
    body.innerHTML = ''; document.body.style.overflow = '';
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  $('.lab-close', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $$('[data-lab]').forEach((c) => c.addEventListener('click', () => openLab(c.dataset.lab, c)));

  /* ---------- nav: mark the section in view ---------- */
  const links = $$('.navlinks a'), secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = () => {
    const line = innerHeight * 0.35;
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) cur = i; });
    links.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  addEventListener('scroll', spy, { passive: true });
  spy();
})();
