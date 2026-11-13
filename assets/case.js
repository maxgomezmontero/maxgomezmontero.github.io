/* Case-study pages: nav, reveals and labs mounted inline (no modal). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* nav + progress */
  const nav = $('nav.top'), bar = $('.progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (nav) nav.classList.toggle('scrolled', scrollY > 40);
    if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* reveals */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* table of contents: highlight the section in view */
  const toc = $$('.toc a'), secs = toc.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = () => {
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * 0.3) cur = i; });
    toc.forEach((a, i) => a.classList.toggle('on', i === cur));
  };
  if (toc.length) { addEventListener('scroll', spy, { passive: true }); spy(); }

  /* inline labs */
  const mount = (box) => {
    const lab = window.LABS && window.LABS[box.dataset.labInline];
    if (!lab) return;
    const only = box.dataset.tabs ? box.dataset.tabs.split(',').map((s) => s.trim()) : null;
    const tabs = lab.tabs.filter((t) => !only || only.includes(t.name));
    box.innerHTML = `<div class="il-head"><span class="label">Interactive · <span class="il-data"></span></span><div class="lab-tabs" role="tablist"></div></div><p class="lab-hint il-hint"></p><div class="lab-body il-body" role="tabpanel"></div><p class="lab-note il-note"></p>`;
    const data = $('.il-data', box), tabsEl = $('.lab-tabs', box), hint = $('.il-hint', box), body = $('.il-body', box);
    data.textContent = lab.data || 'sample data';
    data.classList.toggle('real', !/^(sample|synthetic)/.test(lab.data || 'sample'));
    $('.il-note', box).textContent = lab.note || '';
    let cleanup = null;
    const show = (i) => {
      if (cleanup) { cleanup(); cleanup = null; }
      $$('button', tabsEl).forEach((b, j) => { b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
      hint.textContent = tabs[i].hint || ''; hint.hidden = !tabs[i].hint;
      body.innerHTML = '';
      cleanup = tabs[i].render(body) || null;
    };
    tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = t.name;
      b.addEventListener('click', () => show(i));
      b.addEventListener('keydown', (e) => {
        const n = tabs.length, to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : -1;
        if (to < 0) return; e.preventDefault(); show(to); tabsEl.children[to].focus();
      });
      tabsEl.appendChild(b);
    });
    if (tabs.length < 2) tabsEl.hidden = true;
    // lab panels use <h4> (they were written for the home-page dialog); on case pages they sit right
    // under the page h1 (hero demo) or a section h2, so expose them one level below that
    const level = box.closest('.case-body') ? '3' : '2';
    const relevel = () => $$('h4:not([aria-level])', body).forEach((x) => x.setAttribute('aria-level', level));
    new MutationObserver(relevel).observe(body, { childList: true, subtree: true });
    show(0); relevel();
  };
  // mount each lab only when it scrolls near the viewport (keeps 3D and canvases off until needed)
  let pending = $$('[data-lab-inline]');
  const check = () => {
    pending = pending.filter((b) => {
      if (b.getBoundingClientRect().top < innerHeight + 300) { try { mount(b); } catch (err) { console.error(err); } return false; }
      return true;
    });
    if (!pending.length) removeEventListener('scroll', check);
  };
  addEventListener('scroll', check, { passive: true });
  check();

  /* lite YouTube embeds: thumbnail first, iframe only on click (same as main.js on the home page) */
  $$('.yt[data-yt]').forEach((box) => {
    const id = box.dataset.yt, title = box.dataset.title || 'Video';
    const b = document.createElement('button');
    b.type = 'button';
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

  /* videos: play muted loops only while visible */
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { if (v.dataset.src && !v.src) v.src = v.dataset.src; v.play && v.play().catch(() => {}); }
    else v.pause && v.pause();
  }), { threshold: 0.25 });
  // reduced motion: no autoplay; show the poster with controls so the loop can still be played on request
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $$('video[data-loop]').forEach((v) => vio.observe(v));
  else $$('video[data-loop]').forEach((v) => { v.controls = true; v.src = v.dataset.src; });
})();
