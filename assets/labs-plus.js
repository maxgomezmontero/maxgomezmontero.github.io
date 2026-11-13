/* Deeper demos, added on top of labs.js (load after it, before main.js):
   - engineering: 3D walk-around of a paint line (three.js, lazy-loaded from a CDN only when the tab opens)
   - lean: push vs pull flow simulation
   - tracker: step-by-step replay of one email
   - research: Taguchi DOE + neural-network explorer (synthetic data, method only)
   Data rules: the 3D model uses only dimensions visible in the published drawing excerpts;
   everything else here is invented/synthetic and says so on screen. */
(() => {
  if (!window.LABS) return;
  const NS = 'http://www.w3.org/2000/svg';
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const s = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

  /* ======================================================
     1. 3D paint line — from the published layout excerpts:
        91'-0" x 39'-3" system, conveyor at 10'-6", truss 23'-3",
        deck 25'-6", 16 ft booth, 6'-0" stack clearance above the roof.
        The conveyor path is simplified.
     ====================================================== */
  const SPOTS = [
    { id: 'all', n: 'Whole line', t: [45.5, 6, 19.6], th: 0.55, ph: 1.0, r: 125, d: 'One closed conveyor loop on 91′-0″ × 39′-3″ of floor. Parts are hung on the right, painted in the booth, dry while they ride the serpentine and come off on the left. Empty hooks return along the front.' },
    { id: 'load', n: 'Load', t: [88, 6, 26], th: 1.2, ph: 1.15, r: 42, d: 'Operators hang parts on the moving conveyor here. The loop never stops, so hook spacing and line speed set the pace of the whole line.' },
    { id: 'booth', n: 'Paint booth', t: [70, 6, 13], th: 0.5, ph: 1.05, r: 46, d: 'Parts ride through the booth on the conveyor while the painter works. Booth airflow pulls overspray into the filters and away from the operator. 16 ft wide in the layout.' },
    { id: 'stack', n: 'Exhaust stack', t: [70, 20, 9], th: 0.9, ph: 1.35, r: 60, d: 'Booth exhaust leaves through the roof. The layout checks the run against the truss (23′-3″) and the deck (25′-6″) and keeps a 6′-0″ minimum clearance above the roofline.' },
    { id: 'amu', n: 'Air make-up unit', t: [72, 8, -6], th: -0.5, ph: 1.15, r: 46, d: 'The AMU replaces the air the booth exhausts with filtered, tempered fresh air, so the booth stays balanced. It sits outside the exterior wall and ducts in to the booth.' },
    { id: 'conv', n: 'Conveyor', t: [32, 9, 19], th: 0.2, ph: 0.85, r: 70, d: 'Enclosed-track overhead conveyor at 10′-6″. The serpentine is there for drying time: it folds a long run into a small footprint, so parts get more minutes on the line without more floor.' },
    { id: 'unload', n: 'Unload', t: [3, 6, 30], th: -0.9, ph: 1.15, r: 42, d: 'Painted, dry parts come off here. The empty hooks travel back to the load zone.' },
  ];
  const line3d = (root) => {
    let alive = true, raf = 0, dispose = () => {};
    const view = h(`<div>
      <div class="l3">
        <div class="l3-stage"><canvas aria-label="3D model of a paint line with booth, exhaust stack, air make-up unit and overhead conveyor"></canvas>
          <div class="l3-load">Loading 3D model…</div>
          <div class="l3-help">Drag to orbit · scroll or pinch to zoom</div></div>
        <div class="l3-side">
          <div class="stages" data-spots></div>
          <div class="panel"><h4 data-t></h4><p class="sub" style="margin:0" data-d></p></div>
          <div class="panel">
            <div class="slider"><label for="l3spd">Line speed</label><output data-o></output><input id="l3spd" type="range" min="3" max="16" step="0.5" value="8"></div>
            <div class="readout">
              <div><b data-r="pph"></b><span>parts per hour (6 ft hook spacing)</span></div>
              <div><b data-r="dry"></b><span>minutes drying, booth to unload</span></div>
            </div>
          </div>
        </div>
      </div>
      <p class="sub" style="margin:14px 0 0">Model built from the dimensions on my published layout excerpts (see the Drawings tab): overall size, conveyor height, truss and deck heights, booth width, stack clearance. The conveyor route is simplified, so the drying time is this model's, not the real line's. Motion runs 8× faster than real time.</p>
    </div>`);
    root.appendChild(view);
    const stage = view.querySelector('.l3-stage'), canvas = view.querySelector('canvas'), loadEl = view.querySelector('.l3-load');
    const spd = view.querySelector('#l3spd');
    let select = () => {}, dryLen = 0;
    const upd = () => {
      const v = +spd.value;
      view.querySelector('[data-o]').textContent = v + ' ft/min';
      view.querySelector('[data-r="pph"]').textContent = Math.round(v * 60 / 6);
      view.querySelector('[data-r="dry"]').textContent = dryLen ? (dryLen / v).toFixed(0) : '—';
    };
    spd.addEventListener('input', upd); upd();
    const btns = SPOTS.map((sp, i) => {
      const b = h(`<button type="button" aria-pressed="false"></button>`); b.textContent = sp.n;
      b.addEventListener('click', () => select(i, true));
      view.querySelector('[data-spots]').appendChild(b); return b;
    });
    const showSpot = (i) => {
      btns.forEach((b, j) => b.setAttribute('aria-pressed', i === j));
      view.querySelector('[data-t]').textContent = SPOTS[i].n; view.querySelector('[data-d]').textContent = SPOTS[i].d;
    };
    select = (i) => showSpot(i); showSpot(0);

    import(THREE_URL).then((T) => {
      if (!alive) return;
      const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2));
      const scene = new T.Scene(), cam = new T.PerspectiveCamera(38, 1, 1, 600);
      const g = new T.Group(); g.position.set(-45.5, 0, -19.6); scene.add(g);
      const WHITE = 0xf5f5f3, RED = 0xff2b1c, DIM = 0x55555c;
      const edges = {}; // spot id -> edge materials to highlight
      const reg = (id, mat) => { (edges[id] = edges[id] || []).push(mat); return mat; };
      const box = (w, hh, d, x, y, z, o = {}) => {
        const geo = new T.BoxGeometry(w, hh, d);
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: o.fill ?? 0x1b1b1f, transparent: true, opacity: o.op ?? 0.6, depthWrite: false }));
        m.position.set(x, y, z);
        const lm = new T.LineBasicMaterial({ color: o.line ?? WHITE }); if (o.id) reg(o.id, lm);
        m.add(new T.LineSegments(new T.EdgesGeometry(geo), lm)); g.add(m); return m;
      };
      const seg = (pts, color, id) => {
        const lm = new T.LineBasicMaterial({ color }); if (id) reg(id, lm);
        const l = new T.Line(new T.BufferGeometry().setFromPoints(pts.map((p) => new T.Vector3(...p))), lm); g.add(l); return l;
      };
      const label = (txt, x, y, z, w = 15, color = '#f5f5f3') => {
        const c = document.createElement('canvas'); c.width = 512; c.height = 96;
        const k = c.getContext('2d'); k.font = '500 46px "JetBrains Mono", Consolas, monospace'; k.fillStyle = color; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(txt, 256, 50);
        const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false }));
        sp.scale.set(w, w * 96 / 512, 1); sp.position.set(x, y, z); g.add(sp); return sp;
      };
      // floor + building (column bays read off the plan view)
      const grid = new T.GridHelper(160, 32, 0x2a2a2e, 0x1d1d21); scene.add(grid);
      const cols = [-9, 8.75, 24.25, 44.25, 58.67, 82.25, 95.75], Z0 = -3.4, Z1 = 42.75;
      cols.forEach((x) => { seg([[x, 0, Z0], [x, 23.25, Z0], [x, 23.25, Z1], [x, 0, Z1]], DIM); });
      seg([[-9, 25.5, Z0], [95.75, 25.5, Z0], [95.75, 25.5, Z1], [-9, 25.5, Z1], [-9, 25.5, Z0]], DIM);
      box(104.75, 25.5, 0.3, 43.4, 12.75, Z0, { op: 0.16, line: DIM });           // exterior wall
      // dimension lines
      seg([[0, 0.1, 41], [91, 0.1, 41]], RED); seg([[-2, 0.1, 0], [-2, 0.1, 39.25]], RED);
      label('91′-0″', 45.5, 1.6, 41, 16, '#ff5a4d'); label('39′-3″', -5.5, 1.6, 19.6, 16, '#ff5a4d');
      label('TRUSS 23′-3″', -9, 24.6, 30, 22, '#9c9ca2'); label('CONVEYOR 10′-6″', 30, 12.2, 36, 24, '#9c9ca2');
      // booth, stack, fresh-air unit
      box(16, 10, 13, 70, 5, 13, { id: 'booth', op: 0.5 });
      box(16, 1.2, 13, 70, 10.6, 13, { id: 'booth', op: 0.7 });                    // plenum
      label('PAINT BOOTH', 70, 13.6, 19.5, 20);
      const cyl = (r, len, x, y, z, id, rotX) => {
        const geo = new T.CylinderGeometry(r, r, len, 14, 1, true);
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0x1b1b1f, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false }));
        m.position.set(x, y, z); if (rotX) m.rotation.x = Math.PI / 2;
        m.add(new T.LineSegments(new T.EdgesGeometry(geo, 30), reg(id, new T.LineBasicMaterial({ color: WHITE })))); g.add(m); return m;
      };
      cyl(1, 20.3, 70, 21.35, 9, 'stack'); cyl(1.5, 0.8, 70, 31.9, 9, 'stack');     // up to 6 ft above the 25.5 ft deck
      label('EXHAUST', 70, 34, 9, 14);
      box(7, 9, 5, 72, 8.1, -9.5, { id: 'amu', op: 0.6 }); box(5, 3.6, 3, 72, 1.8, -9.5, { id: 'amu', op: 0.3 });
      cyl(1.2, 13.5, 72, 11.2, -0.25, 'amu', true);
      label('AIR MAKE-UP UNIT', 72, 14.6, -9.5, 24);
      // load / unload zones
      box(8, 0.2, 18, 88, 0.1, 26, { id: 'load', op: 0.25 }); label('LOAD', 88, 1.8, 37.5, 9);
      box(8, 0.2, 12, 3, 0.1, 30.5, { id: 'unload', op: 0.25 }); label('UNLOAD', 3, 1.8, 38, 12);
      // conveyor path (simplified serpentine)
      const P = [[88, 36], [88, 13], [8, 13], [8, 19], [56, 19], [56, 25], [3, 25], [3, 36]].map(([x, z]) => new T.Vector3(x, 10.5, z));
      const path = new T.CurvePath(), R = 2, cut = (a, b) => a.clone().add(b.clone().sub(a).setLength(R));
      P.forEach((a, i) => {
        const b = P[(i + 1) % P.length], c = P[(i + 2) % P.length];
        path.add(new T.LineCurve3(cut(a, b), cut(b, a)));
        path.add(new T.QuadraticBezierCurve3(cut(b, a), b, cut(b, c)));
      });
      // Sample the loop once. CurvePath.getPoint() can return null right at the seam (float rounding),
      // which made getTangentAt() throw at random, so the animation never asks the curve again.
      const L = path.getLength(), samples = path.getSpacedPoints(600).filter(Boolean), NS = samples.length - 1;
      const track = new T.Line(new T.BufferGeometry().setFromPoints(samples), reg('conv', new T.LineBasicMaterial({ color: RED }))); g.add(track);
      const distAt = (x, z) => { let best = 0, bd = 1e9; samples.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = i; } }); return best / NS * L; };
      const dLoad = distAt(88, 26), dBooth = distAt(70, 13), dOut = distAt(62, 13), dUnload = distAt(3, 30);
      dryLen = dUnload - dOut; upd();
      // carriers
      const N = Math.floor(L / 6), partGeo = new T.BoxGeometry(2.2, 3.6, 0.5);
      const mRaw = new T.MeshBasicMaterial({ color: 0xd9d9d6 }), mWet = new T.MeshBasicMaterial({ color: RED });
      const hookGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, -2.2, 0)]), hookMat = new T.LineBasicMaterial({ color: 0x9c9ca2 });
      const carriers = [...Array(N)].map(() => { const c = new T.Group(); c.add(new T.Line(hookGeo, hookMat)); const p = new T.Mesh(partGeo, mRaw); p.position.y = -4; c.add(p); g.add(c); return c; });
      let off = 0;
      const place = () => carriers.forEach((c, i) => {
        const d = (off + i * L / N) % L, fi = Math.min(NS - 1e-6, Math.max(0, d / L * NS)), k = Math.floor(fi), a = samples[k], b = samples[k + 1];
        c.position.lerpVectors(a, b, fi - k); c.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
        const part = c.children[1]; part.visible = d > dLoad && d < dUnload; part.material = d > dBooth ? mWet : mRaw;
      });
      // camera: tiny orbit controller
      const cur = { th: 0.55, ph: 1.0, r: 125, t: new T.Vector3(0, 6, 0) }, goal = { th: 0.55, ph: 1.0, r: 125, t: new T.Vector3(0, 6, 0) };
      let auto = !reduced;
      select = (i, user) => {
        showSpot(i); const sp = SPOTS[i];
        Object.assign(goal, { th: sp.th, ph: sp.ph, r: innerWidth < 700 ? sp.r * 1.25 : sp.r }); goal.t.set(sp.t[0] - 45.5, sp.t[1], sp.t[2] - 19.6);
        Object.entries(edges).forEach(([id, ms]) => ms.forEach((m) => m.color.setHex(id === sp.id ? RED : id === 'conv' ? RED : WHITE)));
        if (sp.id !== 'all' && sp.id !== 'conv') edges.conv.forEach((m) => m.color.setHex(0x8a2a22));
        if (user) auto = false;
        if (reduced) { cur.th = goal.th; cur.ph = goal.ph; cur.r = goal.r; cur.t.copy(goal.t); }
      };
      select(0);
      const ptrs = new Map(); let pinch = 0;
      canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); auto = false; pinch = 0; view.querySelector('.l3-help').classList.add('gone'); });
      canvas.addEventListener('pointermove', (e) => {
        if (!ptrs.has(e.pointerId)) return;
        const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptrs.size === 1) { goal.th -= (e.clientX - px) * 0.008; goal.ph = Math.min(1.5, Math.max(0.15, goal.ph - (e.clientY - py) * 0.006)); }
        else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) goal.r = Math.min(220, Math.max(18, goal.r * pinch / d)); pinch = d; }
      });
      const up = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('wheel', (e) => { e.preventDefault(); auto = false; goal.r = Math.min(220, Math.max(18, goal.r * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
      canvas.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
        if (k) { e.preventDefault(); auto = false; goal.th += k[0]; goal.ph = Math.min(1.5, Math.max(0.15, goal.ph + k[1])); }
        if (e.key === '+' || e.key === '=') goal.r = Math.max(18, goal.r * 0.9);
        if (e.key === '-') goal.r = Math.min(220, goal.r * 1.1);
      });
      canvas.tabIndex = 0;
      const size = () => { const w = stage.clientWidth, hh = stage.clientHeight; if (!w || !hh) return; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(size); ro.observe(stage); size();
      let last = performance.now();
      const frame = (t) => {
        if (!alive) return;
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        if (!reduced) off = (off + (+spd.value) / 60 * 8 * dt) % L;
        place();
        if (auto) goal.th += dt * 0.07;
        const k = 0.09; cur.th += (goal.th - cur.th) * k; cur.ph += (goal.ph - cur.ph) * k; cur.r += (goal.r - cur.r) * k; cur.t.lerp(goal.t, k);
        cam.position.set(cur.t.x + cur.r * Math.sin(cur.ph) * Math.sin(cur.th), cur.t.y + cur.r * Math.cos(cur.ph), cur.t.z + cur.r * Math.sin(cur.ph) * Math.cos(cur.th));
        cam.lookAt(cur.t); renderer.render(scene, cam);
        if (alive) raf = requestAnimationFrame(frame);
      };
      loadEl.remove(); raf = requestAnimationFrame(frame);
      dispose = () => { dispose = () => {}; select = () => {}; ro.disconnect(); renderer.setAnimationLoop(null); renderer.dispose(); renderer.forceContextLoss(); scene.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && (o.material.map && o.material.map.dispose(), o.material.dispose()); }); };
    }).catch(() => { if (alive) { loadEl.textContent = '3D could not load here (it needs WebGL and a connection to the three.js CDN). The Drawings tab shows the same system in 2D.'; loadEl.classList.add('err'); } });
    return () => { alive = false; cancelAnimationFrame(raf); raf = 0; dispose(); };
  };

  /* ======================================================
     2. Lean — push vs pull, same eight steps, side by side.
        Mechanism only: speeds and stoppages are invented.
     ====================================================== */
  const STEPS = ['Cutting', 'Grinding', 'Frame', 'Air system', 'Fluid system', 'Electrical', 'Final assy', 'Crate'];
  const mkLine = (pull) => ({ pull, q: STEPS.map(() => []), st: STEPS.map(() => ({ unit: null, left: 0, blocked: 0, out: [] })), t: 0, next: 0, done: 0, sumT: 0, wip: 0, peak: 0 });
  const stepLine = (ln, dt, rnd) => {
    ln.t += dt;
    const wip = ln.q.reduce((a, b) => a + b.length, 0) + ln.st.reduce((a, x) => a + (x.unit ? 1 : 0) + x.out.length, 0);
    ln.wip = wip; ln.peak = Math.max(ln.peak, wip);
    // release: push builds to a schedule, pull releases only when a kanban card is free
    if (ln.pull ? (wip < 4 && ln.q[0].length === 0) : ln.t >= ln.next) { ln.q[0].push({ born: ln.t }); ln.next = ln.t + 1.2; }
    ln.st.forEach((x, i) => {
      if (x.blocked > 0) { x.blocked -= dt; return; }
      if (x.unit) {
        x.left -= dt;
        if (x.left <= 0) { x.out.push(x.unit); x.unit = null; if (rnd() < (ln.pull ? 0.06 : 0.3)) x.blocked = ln.pull ? 0.8 : 1.5 + rnd() * 3; }
      }
      // move finished work on: push moves batches of 3, pull moves one piece when the next step has room
      const last = i === STEPS.length - 1, batch = ln.pull || last ? 1 : 3;
      if (x.out.length >= batch && (last || !ln.pull || ln.q[i + 1].length < 1)) {
        x.out.splice(0, batch).forEach((u) => { if (last) { ln.done++; ln.sumT += ln.t - u.born; } else ln.q[i + 1].push(u); });
      }
      if (!x.unit && x.out.length < batch && ln.q[i].length) { x.unit = ln.q[i].shift(); x.left = 1; }
    });
  };
  const leanFlow = (root) => {
    let alive = true, raf = 0, playing = false, seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const view = h(`<div>
      <div class="panel-head"><div><h4 style="margin:0">Same eight steps, two ways to run them</h4><p class="sub">Top: push, batches of 3, parts missing at the wrong moment. Bottom: one-piece flow in a cell, pulled by kanban.</p></div>
        <div style="display:flex;gap:8px"><button class="sbtn" data-play>Run ▶</button><button class="sbtn ghost" data-reset>Reset</button></div></div>
      <div class="line-scroll"><canvas class="flow-cv" width="1000" height="420" role="img" aria-label="Animated comparison of work in process piling up under push and staying low under pull"></canvas></div>
      <div class="lab-grid two" style="grid-template-columns:1fr 1fr;margin-top:16px">
        <div class="panel"><h4>Current state · push</h4><div class="readout" style="grid-template-columns:repeat(3,1fr);margin-top:10px">
          <div><b data-a="wip">0</b><span>units of WIP now</span></div><div><b data-a="done">0</b><span>units finished</span></div><div><b data-a="lt">—</b><span>avg. time in system</span></div></div></div>
        <div class="panel"><h4>Proposed future state · cell + kanban</h4><div class="readout" style="grid-template-columns:repeat(3,1fr);margin-top:10px">
          <div><b data-b="wip">0</b><span>units of WIP now</span></div><div><b data-b="done">0</b><span>units finished</span></div><div><b data-b="lt">—</b><span>avg. time in system</span></div></div></div>
      </div>
      <p class="sub" style="margin:14px 0 0">This is a simulation of the mechanism, not the measured data: step times, batch size and stoppage rates are invented, and time is in simulation units. The redesign was a proposal and was not implemented. The team's measured figures (666 h lead time, 15.5 h of it adding value) and its estimates for the proposal are in the other tabs.</p>
    </div>`);
    root.appendChild(view);
    const cv = view.querySelector('canvas'), ctx = cv.getContext('2d'), play = view.querySelector('[data-play]');
    const dpr = Math.min(2, devicePixelRatio || 1); cv.width = 1000 * dpr; cv.height = 420 * dpr; ctx.scale(dpr, dpr);
    let A = mkLine(false), B = mkLine(true);
    const drawLine = (ln, y, title) => {
      ctx.font = '500 12px "JetBrains Mono", Consolas, monospace'; ctx.fillStyle = '#9c9ca2'; ctx.textAlign = 'left'; ctx.fillText(title, 10, y - 78);
      const bw = 92, gap = (1000 - 20 - bw * 8) / 7;
      STEPS.forEach((n, i) => {
        const x = 10 + i * (bw + gap), st = ln.st[i];
        ctx.fillStyle = st.blocked > 0 ? '#2a0f0c' : '#17171a'; ctx.strokeStyle = st.blocked > 0 ? '#ff2b1c' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x, y, bw, 54, 8); ctx.fill(); ctx.stroke();
        if (st.unit) { ctx.fillStyle = '#f5f5f3'; ctx.fillRect(x + 8, y + 40, (bw - 16) * (1 - Math.max(0, st.left)), 4); }
        ctx.fillStyle = '#e9e9ea'; ctx.font = '12px "Inter Tight", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(n, x + bw / 2, y + 22);
        if (st.blocked > 0) { ctx.fillStyle = '#ff5a4d'; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText('waiting', x + bw / 2, y + 36); }
        // queue in front of the step, stacked upward; finished batch waits to the right
        const dots = (cnt, cx, col) => { for (let k = 0; k < Math.min(cnt, 18); k++) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + (k % 3) * 11, y - 10 - Math.floor(k / 3) * 11, 4, 0, 7); ctx.fill(); } if (cnt > 18) { ctx.fillStyle = '#ff5a4d'; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText('+' + (cnt - 18), cx + 11, y - 80); } };
        dots(ln.q[i].length, x + 6, ln.q[i].length > 3 ? '#ff2b1c' : '#f5f5f3');
        dots(st.out.length, x + bw - 30, '#9c9ca2');
        if (i < 7) { ctx.strokeStyle = ln.pull ? '#3ddc84' : '#55555c'; ctx.beginPath(); ctx.moveTo(x + bw + 4, y + 27); ctx.lineTo(x + bw + gap - 4, y + 27); ctx.stroke(); }
      });
    };
    const paint = () => {
      ctx.clearRect(0, 0, 1000, 420);
      drawLine(A, 110, 'CURRENT · PUSH + BATCH   ● waiting in queue   ● finished, waiting for its batch');
      drawLine(B, 320, 'PROPOSED · ONE-PIECE FLOW, PULLED BY KANBAN (green = pull signal)');
      const put = (k, ln) => { view.querySelector(`[data-${k}="wip"]`).textContent = ln.wip; view.querySelector(`[data-${k}="done"]`).textContent = ln.done; view.querySelector(`[data-${k}="lt"]`).textContent = ln.done ? (ln.sumT / ln.done).toFixed(1) : '—'; };
      put('a', A); put('b', B);
    };
    let last = 0;
    const frame = (t) => {
      if (!alive || !playing) return;
      const dt = Math.min(0.05, (t - last) / 1000) * 1.6; last = t;
      for (let k = 0; k < 2; k++) { stepLine(A, dt / 2, rnd); stepLine(B, dt / 2, rnd); }
      paint(); raf = requestAnimationFrame(frame);
    };
    play.addEventListener('click', () => { playing = !playing; play.textContent = playing ? 'Pause ❚❚' : 'Run ▶'; if (playing) { last = performance.now(); raf = requestAnimationFrame(frame); } });
    view.querySelector('[data-reset]').addEventListener('click', () => { A = mkLine(false); B = mkLine(true); seed = 7; paint(); });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => alive && paint());
    paint();
    if (!reduced) play.click();
    return () => { alive = false; cancelAnimationFrame(raf); };
  };

  /* ======================================================
     3. ProjectTracker — one email, step by step (sample data)
     ====================================================== */
  const trackerReplay = (root) => {
    let alive = true, step = 0;
    const view = h(`<div class="lab-grid rp">
      <div>
        <div class="panel rp-mail">
          <div class="rp-row"><span class="label">From</span><span><mark data-m="dom">logistics@oven-vendor.example</mark></span></div>
          <div class="rp-row"><span class="label">Subject</span><b>Updated ship schedule — <mark data-m="subj">Example Industries</mark></b></div>
          <p>Hi, please see the attached revised schedule for job <mark data-m="job">0057</mark>. The cure oven will now ship on <mark data-m="date">March 17</mark> instead of March 3. Sorry for the change.</p>
          <div class="rp-att"><span class="pill dim">PDF</span> ship-schedule-rev2.pdf <mark data-m="pdf">Ship date: 03/17</mark></div>
        </div>
        <div class="rp-ctl"><button class="sbtn ghost" data-back disabled>‹ Back</button><button class="sbtn" data-next>Start ▶</button><span class="label" data-count></span></div>
      </div>
      <div class="rp-steps" data-steps></div>
    </div>`);
    root.appendChild(view);
    const stepsEl = view.querySelector('[data-steps]'), next = view.querySelector('[data-next]'), back = view.querySelector('[data-back]');
    const bar = (name, v, why, win) => `<div class="rp-cand ${win ? 'win' : ''}"><div><b>${name}</b><small>${why}</small></div><div class="rp-bar"><i style="width:${v * 100}%"></i><em style="left:45%"></em></div><span>${v.toFixed(2)}</span></div>`;
    const STEPS_R = [
      { t: 'Email arrives', who: 'Read-only', marks: [], html: 'The mailbox is exported read-only every 2 hours. Nothing is sent, moved or flagged in Outlook.' },
      { t: 'Collect evidence', who: 'Rules', marks: ['job', 'subj'], html: 'Rules look for known kinds of evidence. Found here: <span class="sig">Bare job number <b>0.82</b></span> <span class="sig">Client name in subject <b>0.55</b></span>. The sender’s domain is a vendor, so it points to no customer.' },
      { t: 'Score the candidates', who: 'Rules', marks: ['job', 'subj'], html: 'Confidence = strongest signal + 0.12 for each extra kind of evidence. Anything under 0.45 is ignored.' + bar('D27-0057 · Example Industries', 0.94, 'job number 0.82 + client name → +0.12', true) + bar('D26-0311 · Example Industries (older quote)', 0.55, 'client name only', false) },
      { t: 'Detect the milestone', who: 'Rules', marks: ['date', 'pdf'], html: 'A detector reads the attached PDF and compares it with the date on file: <span class="sig det">Ship date changed · Mar 3 → Mar 17</span>. A date change needs a person, so this goes to “Needs you”.' },
      { t: 'Write the one-liner', who: 'LLM', marks: [], html: '<span class="gist" data-type></span><br><small>The LLM only writes this summary (160 characters max). It does not choose the project or the milestone.</small>' },
      { t: 'You approve, then the ERP is updated', who: 'Human', marks: [], html: '<div class="queue-item" style="margin:0 0 10px"><div class="what"><b>D27-0057</b><span>Add note: “Oven ship date moved Mar 3 → Mar 17 (vendor schedule rev 2).”</span></div><div class="btns"><button class="sbtn small" data-ok>Approve</button></div></div><div class="rp-erp" data-erp></div>' },
    ];
    const render = async () => {
      stepsEl.innerHTML = '';
      view.querySelectorAll('mark').forEach((m) => m.classList.remove('on'));
      STEPS_R.slice(0, step).forEach((st, i) => {
        const el = h(`<div class="rp-step ${i === step - 1 ? 'cur' : ''}"><div class="rp-h"><span class="n">0${i + 1}</span><b>${st.t}</b><span class="pill ${st.who === 'LLM' ? 'white' : st.who === 'Human' ? 'red' : 'dim'}">${st.who}</span></div><div class="rp-b">${st.html}</div></div>`);
        stepsEl.appendChild(el);
      });
      if (!step) stepsEl.appendChild(h('<div class="empty">Six steps from inbox to ERP. Press Start.</div>'));
      const cur = STEPS_R[step - 1];
      if (cur) cur.marks.forEach((m) => view.querySelector(`[data-m="${m}"]`).classList.add('on'));
      back.disabled = step === 0; next.disabled = step === STEPS_R.length;
      next.textContent = step === 0 ? 'Start ▶' : step === STEPS_R.length ? 'Done ✓' : 'Next step ▶';
      view.querySelector('[data-count]').textContent = step ? `step ${step} of ${STEPS_R.length}` : '';
      const last = stepsEl.lastElementChild; last && last.scrollIntoView && last.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      const ty = stepsEl.querySelector('.cur [data-type]'), all = stepsEl.querySelectorAll('[data-type]');
      const msg = '“Oven ship date slipped two weeks; check install crew and customer shutdown.”';
      all.forEach((e) => { e.textContent = msg; });
      if (ty && !reduced) { const mine = step; ty.textContent = ''; for (const ch of msg) { if (!alive || step !== mine) return; ty.textContent += ch; await wait(14); } }
      const ok = stepsEl.querySelector('[data-ok]');
      if (ok) ok.addEventListener('click', async () => {
        const mine = step; ok.disabled = true; const erp = stepsEl.querySelector('[data-erp]');
        for (const line of ['Re-read the ERP record', 'Append the approved line', 'Save', 'Re-read to verify the line is there', 'Keep a backup of the previous value']) {
          await wait(380); if (!alive || step !== mine || !erp.isConnected) return;
          erp.appendChild(h(`<div class="rp-tick">✓ ${line}</div>`));
        }
        ok.closest('.btns').replaceWith(h('<span class="st" style="color:var(--ok)">✓ written and verified</span>'));
      });
    };
    next.addEventListener('click', () => { if (step < STEPS_R.length) { step++; render(); } });
    back.addEventListener('click', () => { if (step > 0) { step--; render(); } });
    render();
    return () => { alive = false; };
  };

  /* ======================================================
     4. Research — the wire-EDM paper (Chen, Gomez Montero & Yu, 2026).
        Study facts (machine, factors, levels, run counts, network, test errors)
        come from the paper. Every data point drawn here is SYNTHETIC,
        generated in the browser, and labelled so on screen.
     ====================================================== */
  const FACTORS = [['Wire tension', 'g', [1599, 1600, 1601]], ['Supply voltage', 'V', ['9.7', '9.8', '9.9']], ['Feed rate', 'in/min', ['0.09', '0.10', '0.11']]];
  const L9 = [[0, 0, 0], [0, 1, 1], [0, 2, 2], [1, 0, 1], [1, 1, 2], [1, 2, 0], [2, 0, 2], [2, 1, 0], [2, 2, 1]];
  const LIMIT = 80; // µin, acceptance limit in the paper
  /*NN-CORE*/
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
  // 81 synthetic runs shaped like the study: 27 combinations x 3 replicates, 12 controller features each
  const genRuns = (noiseAmp) => {
    const runs = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let rep = 0; rep < 3; rep++) {
      const T = a - 1, V = b - 1, F = c - 1, x = [];
      [[9.8 + 0.1 * V, 0.05], [5 + 0.6 * F + 0.3 * V, 0.4], [0.10 + 0.01 * F, 0.004]].forEach(([m, k]) => {
        const avg = m + k * 0.2 * gauss(), half = k * (0.6 - 0.25 * T + 0.15 * Math.abs(gauss()));
        x.push(avg + half, avg - half, 2 * half, avg);            // max, min, difference, average
      });
      runs.push({ x, y: 72 + 5 * F - 3.5 * T + 2.5 * V + 2 * V * F + noiseAmp * gauss() });
    }
    for (let i = runs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [runs[i], runs[j]] = [runs[j], runs[i]]; }
    const tr = runs.slice(0, 64), te = runs.slice(64), mu = [], sd = [];
    for (let k = 0; k < 12; k++) { const v = tr.map((r) => r.x[k]), m = v.reduce((p, q) => p + q, 0) / v.length; mu[k] = m; sd[k] = Math.sqrt(v.reduce((p, q) => p + (q - m) ** 2, 0) / v.length) || 1; }
    const ym = tr.reduce((p, r) => p + r.y, 0) / tr.length, ys = Math.sqrt(tr.reduce((p, r) => p + (r.y - ym) ** 2, 0) / tr.length) || 1;
    [...tr, ...te].forEach((r) => { r.z = r.x.map((v, k) => (v - mu[k]) / sd[k]); r.t = (r.y - ym) / ys; });
    return { tr, te, ym, ys };
  };
  // same shape as the paper's network: 12 -> 8 -> 8 -> 8 -> 8 -> 1, ReLU
  const mkNet = () => { const sizes = [12, 8, 8, 8, 8, 1]; return { sizes, W: sizes.slice(1).map((n, l) => [...Array(n)].map(() => [...Array(sizes[l])].map(() => gauss() * Math.sqrt(2 / sizes[l]) * 0.6))), b: sizes.slice(1).map((n) => Array(n).fill(0.01)) }; };
  const fwd = (net, z) => { const acts = [z]; net.W.forEach((Wl, l) => { const last = l === net.W.length - 1, prev = acts[l]; acts.push(Wl.map((w, j) => { let v = net.b[l][j]; for (let k = 0; k < w.length; k++) v += w[k] * prev[k]; return last ? v : Math.max(0, v); })); }); return acts; };
  const trainEpoch = (net, rows, lr) => {
    let se = 0;
    rows.forEach((r) => {
      const acts = fwd(net, r.z); let delta = [acts[acts.length - 1][0] - r.t]; se += delta[0] ** 2;
      for (let l = net.W.length - 1; l >= 0; l--) {
        const prev = acts[l], nd = Array(prev.length).fill(0);
        net.W[l].forEach((w, j) => { const d = delta[j]; for (let k = 0; k < w.length; k++) { nd[k] += d * w[k]; w[k] -= lr * d * prev[k]; } net.b[l][j] -= lr * d; });
        delta = nd.map((v, k) => (l > 0 && prev[k] <= 0 ? 0 : v));
      }
    });
    return se / rows.length;
  };
  /*END-NN-CORE*/

  const resNN = (root) => {
    let alive = true, raf = 0, training = false, net, data, epoch = 0, losses = [];
    const MAXE = 1500;
    const view = h(`<div class="lab-grid">
      <div class="panel">
        <div class="panel-head"><div><h4>Train the network</h4><p class="sub">12 inputs → 4 hidden layers of 8 neurons (ReLU) → roughness. Same shape as the paper's network.</p></div>
          <div style="display:flex;gap:8px"><button class="sbtn" data-train>Train ▶</button><button class="sbtn ghost" data-reset>New data</button></div></div>
        <svg class="nn-sc" viewBox="0 0 320 250" role="img" aria-label="Predicted versus measured roughness for the 17 test cuts, with the 80 microinch acceptance limit"></svg>
        <p class="sub" style="margin:8px 0 0">Each dot is one of 17 test cuts the network never saw. On the diagonal = perfect. Red lines = the 80 µin acceptance limit.</p>
      </div>
      <div>
        <div class="panel">
          <div class="readout">
            <div><b data-acc>—</b><span>accuracy on the 17 test cuts</span></div><div><b data-ep>0</b><span>training passes</span></div>
            <div><b data-t1>—</b><span>Type I: good part flagged as bad</span></div><div><b data-t2>—</b><span>Type II: bad part passed as good</span></div>
          </div>
          <svg class="nn-loss" viewBox="0 0 320 70" role="img" aria-label="Training error going down"></svg>
          <div class="slider" style="margin-top:14px"><label for="nnn">Measurement noise</label><output data-no></output><input id="nnn" type="range" min="0" max="25" value="5"></div>
        </div>
        <div class="panel" style="margin-top:14px"><p class="sub" style="margin:0 0 8px"><b style="color:var(--text)">In the paper:</b> 81 real cuts (64 to train, 17 to test), 12 online features built from the controller's voltage, current and feed rate (max, min, difference, average of each), trained for 20,000 passes. Result: ~95.8% average accuracy; against the 80 µin limit, 0 Type I and 1 Type II error on the test set.</p><p class="sub" style="margin:0"><b style="color:var(--text)">Here:</b> same sizes and the same network shape, but the 81 cuts are synthetic and generated in your browser, and training is shortened. The numbers above are this demo's, not research results.</p></div>
      </div>
    </div>`);
    root.appendChild(view);
    const sc = view.querySelector('.nn-sc'), lossEl = view.querySelector('.nn-loss'), nEl = view.querySelector('#nnn'), btn = view.querySelector('[data-train]');
    const init = () => { data = genRuns(+nEl.value * 0.2); net = mkNet(); epoch = 0; losses = []; training = false; btn.textContent = 'Train ▶'; view.querySelector('[data-no]').textContent = nEl.value + '%'; paint(); };
    const paint = () => {
      sc.innerHTML = ''; const ys = [...data.tr, ...data.te].map((r) => r.y), lo = Math.min(...ys, LIMIT) - 4, hi = Math.max(...ys, LIMIT) + 4, X = (v) => 36 + (v - lo) / (hi - lo) * 270, Y = (v) => 220 - (v - lo) / (hi - lo) * 205, cl = (v) => Math.min(hi, Math.max(lo, v));
      s('line', { x1: X(lo), y1: Y(lo), x2: X(hi), y2: Y(hi), stroke: '#55555c', 'stroke-dasharray': '4 4' }, sc);
      s('line', { x1: 36, y1: 220, x2: 306, y2: 220, stroke: 'rgba(255,255,255,.25)' }, sc); s('line', { x1: 36, y1: 15, x2: 36, y2: 220, stroke: 'rgba(255,255,255,.25)' }, sc);
      s('line', { x1: X(LIMIT), y1: 15, x2: X(LIMIT), y2: 220, stroke: '#ff2b1c', 'stroke-dasharray': '2 3', opacity: 0.8 }, sc); s('line', { x1: 36, y1: Y(LIMIT), x2: 306, y2: Y(LIMIT), stroke: '#ff2b1c', 'stroke-dasharray': '2 3', opacity: 0.8 }, sc);
      const tl = s('text', { x: X(LIMIT) + 4, y: 24, class: 'tg-t' }, sc); tl.textContent = '80 µin';
      const tx = s('text', { x: 171, y: 242, 'text-anchor': 'middle', class: 'tg-t' }, sc); tx.textContent = 'measured roughness (µin) →';
      const ty = s('text', { x: 12, y: 118, 'text-anchor': 'middle', class: 'tg-t', transform: 'rotate(-90 12 118)' }, sc); ty.textContent = 'predicted →';
      let err = 0, t1 = 0, t2 = 0;
      data.te.forEach((r) => {
        const a = fwd(net, r.z), p = a[a.length - 1][0] * data.ys + data.ym; err += Math.abs(p - r.y) / r.y;
        const bad1 = r.y <= LIMIT && p > LIMIT, bad2 = r.y > LIMIT && p <= LIMIT; t1 += bad1; t2 += bad2;
        s('circle', { cx: X(cl(r.y)), cy: Y(cl(p)), r: 4, fill: epoch && (bad1 || bad2) ? '#f59f00' : '#f5f5f3', opacity: 0.9 }, sc);
      });
      view.querySelector('[data-acc]').textContent = epoch ? (100 * (1 - err / data.te.length)).toFixed(1) + '%' : '—';
      view.querySelector('[data-ep]').textContent = epoch;
      view.querySelector('[data-t1]').textContent = epoch ? t1 : '—'; view.querySelector('[data-t2]').textContent = epoch ? t2 : '—';
      lossEl.innerHTML = '';
      if (losses.length > 1) { const mx = Math.max(...losses), step = Math.max(1, Math.floor(losses.length / 150)); const pts = losses.filter((_, i) => i % step === 0).map((v, i, a) => `${4 + i / (a.length - 1) * 312},${64 - v / mx * 56}`).join(' '); s('polyline', { points: pts, fill: 'none', stroke: '#f5f5f3', 'stroke-width': 1.5 }, lossEl); }
      const lt = s('text', { x: 316, y: 12, 'text-anchor': 'end', class: 'tg-t' }, lossEl); lt.textContent = 'training error (MSE)';
    };
    const frame = () => {
      if (!alive || !training) return;
      for (let k = 0; k < 8; k++) { losses.push(trainEpoch(net, data.tr, 0.01)); epoch++; }
      paint();
      if (epoch >= MAXE) { training = false; btn.textContent = 'Trained ✓'; return; }
      raf = requestAnimationFrame(frame);
    };
    btn.addEventListener('click', () => { if (epoch >= MAXE) return; training = !training; btn.textContent = training ? 'Pause ❚❚' : 'Train ▶'; if (training) raf = requestAnimationFrame(frame); });
    view.querySelector('[data-reset]').addEventListener('click', init);
    nEl.addEventListener('input', init);
    init();
    return () => { alive = false; cancelAnimationFrame(raf); };
  };

  const resDesign = (root) => {
    let alive = true, eff, noise;
    const view = h(`<div>
      <div class="panel">
        <h4>What the study did: a 3³ full factorial</h4>
        <p class="sub">Every combination of three cutting parameters at three levels, cut three times each.</p>
        <div class="lab-grid" style="align-items:start">
          <table class="ledger tg"><thead><tr><th style="text-align:left">Parameter</th><th>Level 1</th><th>Level 2</th><th>Level 3</th></tr></thead><tbody>${FACTORS.map(([n, u, lv]) => `<tr><td style="text-align:left">${n} (${u})</td>${lv.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <div class="big-kpis" style="grid-template-columns:repeat(3,1fr)"><div><b>27</b><span>combinations</span></div><div><b>81</b><span>cuts (3 replicates)</span></div><div><b>64 / 17</b><span>train / test split</span></div></div>
        </div>
        <p class="sub" style="margin:14px 0 0">Set-up: Sodick VZ-300L wire EDM, 0.25 mm brass wire, 2507 duplex steel, roughness measured with a Mitutoyo SJ-301 profilometer.</p>
      </div>
      <div class="lab-grid" style="margin-top:22px">
        <div class="panel">
          <div class="panel-head"><div><h4><span class="pill dim" style="animation:none;margin-right:6px">Teaching demo</span> What a Taguchi L9 would do</h4><p class="sub">Not what the study did. With the same three parameters, an L9 array tests 9 balanced combinations instead of 27.</p></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="sbtn" data-run>Run the 9 cuts ▶</button><button class="sbtn ghost" data-new>New process</button></div></div>
          <div class="ledger-wrap" style="max-height:none"><table class="ledger tg" style="min-width:400px"><thead><tr><th>Run</th><th>Tension</th><th>Voltage</th><th>Feed</th><th class="num">Roughness</th><th class="num">S/N (dB)</th></tr></thead><tbody data-rows></tbody></table></div>
        </div>
        <div>
          <div class="panel"><h4>Main effects</h4><p class="sub">Average signal-to-noise ratio at each level. Lower roughness is better, so the highest point of each parameter wins.</p>
            <div class="tg-fx" data-fx></div></div>
          <div class="panel" style="margin-top:14px" data-verdict hidden></div>
        </div>
      </div>
      <p class="sub" style="margin:14px 0 0">The L9 demo runs on a synthetic process generated in your browser: its roughness values are placeholders, not the paper's measurements.</p>
    </div>`);
    root.appendChild(view);
    const rowsEl = view.querySelector('[data-rows]'), fx = view.querySelector('[data-fx]'), verdict = view.querySelector('[data-verdict]'), run = view.querySelector('[data-run]');
    const EMPTY = '<div class="empty">Run the 9 cuts to see which level of each parameter helps.</div>';
    const fresh = () => {
      eff = [0, 1, 2].map(() => [0, 1, 2].map(() => Math.random() * 9)); noise = () => (Math.random() - 0.5) * 0.8;
      rowsEl.innerHTML = L9.map((r, i) => `<tr><td>${i + 1}</td>${r.map((l, f) => `<td>${FACTORS[f][2][l]}</td>`).join('')}<td class="num" data-y>·</td><td class="num" data-sn>·</td></tr>`).join('');
      fx.innerHTML = EMPTY; verdict.hidden = true; run.disabled = false; run.textContent = 'Run the 9 cuts ▶';
    };
    const truth = (r) => 62 + eff[0][r[0]] + eff[1][r[1]] + eff[2][r[2]];
    run.addEventListener('click', async () => {
      run.disabled = true; const sn = [];
      for (let i = 0; i < 9 && alive; i++) {
        await wait(170); const y = truth(L9[i]) + noise(); sn.push(-20 * Math.log10(y));
        const tr = rowsEl.children[i]; if (!tr) return; tr.classList.add('new');
        tr.querySelector('[data-y]').textContent = y.toFixed(1) + ' µin'; tr.querySelector('[data-sn]').textContent = sn[i].toFixed(2);
      }
      if (!alive) return;
      const mean = (f, l) => { const v = sn.filter((_, i) => L9[i][f] === l); return v.reduce((a, b) => a + b, 0) / v.length; };
      const M = [0, 1, 2].map((f) => [0, 1, 2].map((l) => mean(f, l))), lo = Math.min(...M.flat()), hi = Math.max(...M.flat());
      const best = M.map((m) => m.indexOf(Math.max(...m)));
      fx.innerHTML = '';
      M.forEach((m, f) => {
        const svg = s('svg', { viewBox: '0 0 120 100', class: 'tg-svg', role: 'img', 'aria-label': `${FACTORS[f][0]}: best level ${FACTORS[f][2][best[f]]} ${FACTORS[f][1]}` });
        const X = (l) => 20 + l * 40, Y = (v) => 70 - (v - lo) / (hi - lo || 1) * 46;
        const tt = s('text', { x: 60, y: 12, 'text-anchor': 'middle', class: 'tg-t' }, svg); tt.textContent = FACTORS[f][0];
        s('polyline', { points: m.map((v, l) => `${X(l)},${Y(v)}`).join(' '), fill: 'none', stroke: '#f5f5f3', 'stroke-width': 1.5 }, svg);
        m.forEach((v, l) => { s('circle', { cx: X(l), cy: Y(v), r: l === best[f] ? 5 : 3.5, fill: l === best[f] ? '#ff2b1c' : '#f5f5f3' }, svg); const t = s('text', { x: X(l), y: 92, 'text-anchor': 'middle', class: 'tg-t' }, svg); t.textContent = FACTORS[f][2][l]; });
        fx.appendChild(svg);
      });
      const all = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) all.push(truth([a, b, c]));
      const pick = truth(best), rank = all.filter((v) => v < pick - 1e-9).length + 1, tested = L9.some((r) => r.every((l, i) => l === best[i]));
      verdict.hidden = false;
      verdict.innerHTML = `<h4>Predicted best setting: ${best.map((l, f) => `${FACTORS[f][2][l]} ${FACTORS[f][1]}`).join(' · ')}</h4><p class="sub" style="margin:0">Checked against all 27 combinations of this synthetic process, it ranks <b style="color:var(--text)">#${rank} of 27</b>${tested ? '' : ', and it was not even one of the 9 cuts that were made'}.</p>`;
      run.disabled = false; run.textContent = 'Run again ↻';
    });
    view.querySelector('[data-new]').addEventListener('click', fresh);
    fresh();
    return () => { alive = false; };
  };

  /* ======================================================
     wire into the registry
     ====================================================== */
  const L = window.LABS;
  L.engineering.data = 'model from real drawings + generic simulator';
  L.engineering.tabs.unshift({ name: '3D line', render: line3d, hint: 'What you’re looking at: a 3D model of a paint line, built from my layout dimensions. Try this: drag to orbit, pick a component, change the line speed.' });
  L.lean.tabs.unshift({ name: 'Flow simulation', render: leanFlow, hint: 'What you’re looking at: the same eight assembly steps run as push (today) and as pull (the proposal). Try this: let it run and watch where work piles up.' });
  L.tracker.tabs.unshift({ name: 'Replay one email', render: trackerReplay, hint: 'What you’re looking at: one sample email going from inbox to ERP note. Try this: press Start and step through; approve at the end.' });
  L.research = {
    title: 'Predicting surface roughness in wire EDM, while cutting',
    data: 'synthetic data · real study design',
    note: 'Chen, Gomez Montero & Yu (2026), Neural Computing and Applications 38(4), 87. The study design, network and results quoted here are the paper’s. Every data point you see drawn is synthetic and generated in your browser.',
    tabs: [
      { name: 'Neural network', render: resNN, hint: 'What you’re looking at: a network shaped like the paper’s, learning to predict roughness from 12 controller features. Try this: press Train; then raise the noise and train again.' },
      { name: 'Experiment design', render: resDesign, hint: 'What you’re looking at: how the 81 cuts of the study were planned, plus a teaching demo of a Taguchi L9. Try this: press “Run the 9 cuts”.' },
    ],
  };
})();
