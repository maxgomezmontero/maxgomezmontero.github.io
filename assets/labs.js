/* Interactive project labs.
   tracker + restaurant: GENERIC SAMPLE DATA only. No real clients, amounts, emails or code
   from the original projects — these are re-creations for demonstration.
   engineering: real drawing excerpts (identifiers removed) + a generic simulator.
   lean: the team's real estimates from the final deck.
   Each lab declares this in `data` (shown as the badge in the dialog header)
   and each tab has a one-line `hint` ("what you're looking at / try this"). */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const s = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ======================================================
     1. ProjectTracker — faithful re-creation of the real UX:
        weighted-evidence email matching, deterministic milestone
        detectors, LLM only for one-line summaries, human approval.
     ====================================================== */
  const SIGNALS = {
    proj: ['Project number in subject', 0.97],
    erp: ['ERP opportunity ID', 0.90],
    thread: ['Known thread', 0.88],
    job: ['Bare job number', 0.82],
    email: ['Known contact email', 0.78],
    domain: ['Client domain', 0.62],
    name: ['Contact name', 0.60],
    word: ['Name word', 0.60],
    subj: ['Client name in subject', 0.55],
  };
  const confOf = (sig) => {
    if (!sig.length) return 0;
    const best = Math.max(...sig.map((k) => SIGNALS[k][1]));
    return Math.min(0.99, best + 0.12 * (sig.length - 1));
  };
  const MAILS = [
    { from: 'j.doe@customer-a.example', subj: 'RE: D27-0042 layout rev B — approved', proj: 'D27-0042 · Customer A', sig: ['proj', 'email'], det: 'Approval drawings signed', type: 'done', lane: 'auto', sum: 'Customer approved layout rev B; release to fabrication.' },
    { from: 'orders@booth-vendor.example', subj: 'Order acknowledgement — your PO 55812', proj: 'D27-0042 · Customer A', sig: ['thread', 'job'], det: 'Order accepted', type: 'waiting on vendor', lane: 'auto', sum: 'Vendor accepted PO 55812; submittals due in 2 weeks.' },
    { from: 'logistics@oven-vendor.example', subj: 'Updated ship schedule (PDF)', proj: 'D27-0057 · Example Industries', sig: ['job', 'subj'], det: 'Ship date changed · Mar 3 → Mar 17 (read from PDF)', type: 'action', lane: 'ask', sum: 'Oven ship date slipped two weeks; check install crew and customer shutdown.' },
    { from: 'a.smith@demo-mfg.example', subj: 'Plant shutdown moved', proj: 'D27-0063 · Demo Manufacturing', sig: ['domain', 'name', 'word'], det: null, type: 'waiting on customer', lane: 'ask', sum: 'Customer moved shutdown to 2nd week of March; waiting on final dates.' },
    { from: 'buyer@new-plant.example', subj: 'RFQ — powder booth for Plant 2', proj: null, sig: [], det: 'New opportunity', type: 'new', lane: 'ask', sum: 'New RFQ: powder booth for a second plant. Create project?' },
    { from: 'news@coatings-weekly.example', subj: 'This week in coatings', proj: null, sig: [], det: null, type: 'ignored', lane: 'history', sum: '' },
  ];

  const trackerInbox = (root) => {
    let alive = true;
    const view = h(`<div class="lab-grid">
      <div class="panel">
        <div class="panel-head"><div><h4>Inbox triage</h4><p class="sub">6 sample emails. Each one is matched by evidence, not guesswork.</p></div>
          <button class="sbtn" data-run>Run triage ▶</button></div>
        <div data-list></div>
      </div>
      <div>
        <div class="panel">
          <h4>Needs you</h4>
          <p class="sub">The tool proposes; the engineer approves. Nothing reaches the ERP without a click.</p>
          <div data-queue><div class="empty">Run triage to see proposals.</div></div>
        </div>
        <div class="kpis">
          <div><b data-k="auto">0</b><span>filed automatically</span></div>
          <div><b data-k="ask">0</b><span>need a decision</span></div>
          <div><b data-k="erp">0</b><span>ERP notes approved</span></div>
        </div>
      </div>
    </div>`);
    root.appendChild(view);
    const list = view.querySelector('[data-list]'), queue = view.querySelector('[data-queue]'), run = view.querySelector('[data-run]');
    const k = (n, v) => { view.querySelector(`[data-k="${n}"]`).textContent = v; };
    const rows = MAILS.map((m) => {
      const r = h(`<div class="mail"><div class="from"></div><div class="res"></div><div class="subj"></div><div class="ev"></div></div>`);
      r.querySelector('.from').textContent = m.from;
      r.querySelector('.subj').textContent = m.subj;
      list.appendChild(r); return r;
    });
    let erp = 0;
    run.addEventListener('click', async () => {
      run.disabled = true; run.textContent = 'Reading…'; queue.innerHTML = '';
      let auto = 0, ask = 0; erp = 0; k('erp', 0);
      rows.forEach((r) => { r.querySelector('.res').innerHTML = ''; r.querySelector('.ev').innerHTML = ''; });
      for (let i = 0; i < MAILS.length && alive; i++) {
        const m = MAILS[i], r = rows[i], res = r.querySelector('.res'), ev = r.querySelector('.ev');
        r.classList.add('active');
        for (const sk of m.sig) { await wait(260); if (!alive) return; ev.appendChild(h(`<span class="sig">${SIGNALS[sk][0]} <b>${SIGNALS[sk][1].toFixed(2)}</b></span>`)); }
        if (m.sig.length > 1) ev.appendChild(h(`<span class="sig">+ extra evidence <b>+0.12</b></span>`));
        if (m.det) ev.appendChild(h(`<span class="sig det">Detector: ${m.det}</span>`));
        await wait(320); if (!alive) return;
        r.classList.remove('active');
        const c = confOf(m.sig);
        if (m.proj) res.append(h(`<span class="pill red">${m.proj}</span>`), h(`<span class="pill dim">confidence ${(c * 100).toFixed(0)}%</span>`));
        else if (m.type === 'new') res.append(h(`<span class="pill white">＋ Create project</span>`));
        else res.append(h(`<span class="pill dim">below 0.45 · ignored</span>`));
        if (m.sum) ev.appendChild(h(`<span class="gist">“${m.sum}” <i>— LLM summary, ≤160 chars</i></span>`));
        if (m.lane === 'auto') { auto++; res.appendChild(h(`<span class="pill white">auto-filed · ${m.type}</span>`)); }
        if (m.lane === 'ask') {
          ask++;
          const q = h(`<div class="queue-item"><div class="what"><b>${m.proj ? m.proj.split(' · ')[0] : 'NEW'}</b><span></span></div><div class="btns"><button class="sbtn small">Approve</button><button class="sbtn small ghost">Discard</button></div></div>`);
          q.querySelector('.what span').textContent = m.sum;
          const [ok, no] = q.querySelectorAll('button');
          ok.addEventListener('click', () => { q.classList.add('done'); q.querySelector('.btns').replaceWith(h('<span class="st" style="color:var(--ok)">✓ noted · ERP sync queued</span>')); k('erp', ++erp); });
          no.addEventListener('click', () => { q.classList.add('no'); q.querySelector('.btns').replaceWith(h('<span class="st">discarded</span>')); });
          queue.appendChild(q);
        }
        k('auto', auto); k('ask', ask);
      }
      run.disabled = false; run.textContent = 'Run again ↻';
    });
    return () => { alive = false; };
  };

  /* Board with drag-and-drop and status hints */
  const COLS = ['In Progress', 'Quoting', 'Quoted – Hot', 'Quoted – Old'];
  const COLC = { 'In Progress': '#22b8cf', 'Quoting': '#f59f00', 'Quoted – Hot': '#e64980', 'Quoted – Old': '#7c83ff' };
  const trackerBoard = (root) => {
    const cards = [
      { id: 'D27-0042', c: 'Customer A', col: 'In Progress', next: 'Submittals received', erp: '8.9 PO received', days: 1 },
      { id: 'D27-0057', c: 'Example Industries', col: 'In Progress', next: 'Equipment shipped', erp: '8.9 PO received', days: 3 },
      { id: 'D27-0063', c: 'Demo Manufacturing', col: 'In Progress', next: 'Installation', erp: '8.9 PO received', days: 6 },
      { id: 'D27-0071', c: 'Sample Fab Co.', col: 'Quoting', next: 'Vendor quotes received', erp: '8.5 Assemble quote', days: 2 },
      { id: 'D27-0074', c: 'Acme Coatings', col: 'Quoting', next: 'Layout drawing', erp: '8.5 Assemble quote', days: 4 },
      { id: 'D27-0068', c: 'Northwind Metals', col: 'Quoted – Hot', next: 'Customer PO', erp: '8.7 Quoted', days: 52, hint: { to: 'Quoted – Old', why: 'Hot but silent 52 days (> 45)' } },
      { id: 'D27-0049', c: 'Globex Parts', col: 'Quoted – Hot', next: 'Customer PO', erp: '8.7 Quoted', days: 9 },
      { id: 'D26-0311', c: 'Initech Steel', col: 'Quoted – Old', next: 'Follow-up', erp: '8.7 Quoted', days: 3, hint: { to: 'Quoted – Hot', why: 'Old but news 3 days ago (< 14)' } },
    ];
    const view = h(`<div>
      <div class="hints" data-hints></div>
      <div class="board" data-board></div>
      <p class="sub" style="margin:14px 0 0">Status hints come from simple, explainable rules: Hot with no news for 45 days → Old; Old with fresh news in the last 14 days → back to Hot. Customer names here are invented.</p>
    </div>`);
    root.appendChild(view);
    const board = view.querySelector('[data-board]'), hints = view.querySelector('[data-hints]');
    let dragId = null;
    const render = () => {
      board.innerHTML = '';
      COLS.forEach((col) => {
        const items = cards.filter((x) => x.col === col);
        const colEl = h(`<div class="bcol"><div class="bhead"><i style="background:${COLC[col]}"></i>${col}<span>${items.length}</span></div><div class="bdrop"></div></div>`);
        const drop = colEl.querySelector('.bdrop');
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', (e) => { e.preventDefault(); const cd = cards.find((x) => x.id === dragId); if (cd) { cd.col = col; delete cd.hint; } render(); });
        items.forEach((cd) => {
          const ci = COLS.indexOf(cd.col);
          const el = h(`<div class="bcard" draggable="true"><div class="btop"><b>${cd.id}</b><span class="days ${cd.days > 30 ? 'late' : ''}">${cd.days}d</span></div><div class="bcli"></div><div class="bnext">next: ${cd.next}</div><div class="bfoot"><span class="pill dim">${cd.erp}</span><span class="bmove"><button type="button" aria-label="Move ${cd.id} to the previous column" ${ci === 0 ? 'disabled' : ''}>‹</button><button type="button" aria-label="Move ${cd.id} to the next column" ${ci === COLS.length - 1 ? 'disabled' : ''}>›</button></span></div></div>`);
          el.querySelector('.bcli').textContent = cd.c;
          el.style.borderLeftColor = COLC[cd.col];
          el.querySelectorAll('.bmove button').forEach((b, d) => b.addEventListener('click', () => {
            cd.col = COLS[ci + (d ? 1 : -1)]; delete cd.hint; render();
            const again = [...board.querySelectorAll('.bcard')].find((x) => x.querySelector('b').textContent === cd.id);
            const nb = again && again.querySelectorAll('.bmove button')[d];
            if (nb) (nb.disabled ? again.querySelectorAll('.bmove button')[d ? 0 : 1] : nb).focus();
          }));
          el.addEventListener('dragstart', () => { dragId = cd.id; el.classList.add('drag'); });
          el.addEventListener('dragend', () => el.classList.remove('drag'));
          drop.appendChild(el);
        });
        board.appendChild(colEl);
      });
      hints.innerHTML = '';
      const hs = cards.filter((x) => x.hint);
      if (!hs.length) hints.appendChild(h('<div class="hint ok">✓ Board is tidy. No status hints.</div>'));
      hs.forEach((cd) => {
        const el = h(`<div class="hint"><span><b>${cd.id}</b> ${cd.hint.why} → suggest <b>${cd.hint.to}</b></span><button class="sbtn small">Apply</button></div>`);
        el.querySelector('button').addEventListener('click', () => { cd.col = cd.hint.to; delete cd.hint; render(); });
        hints.appendChild(el);
      });
    };
    render();
  };

  /* Drawing QA: 44 criteria in 7 groups + cross-checks */
  const GROUPS = [
    ['Title block, numbering & revisions', 7, 0, 'Rev, date and “sheet X of N” match on every sheet'],
    ['Views & sheets', 6, 0, 'Plan + elevations, building context, part-loading detail'],
    ['Dimensions & references', 8, 1, 'Penetrations located by centerline from the building grid'],
    ['Utilities & penetrations', 7, 0, 'Utility chart with X / F / E / A / B / G IDs'],
    ['Notes, callouts & “by others”', 5, 1, 'Scope by others called out explicitly'],
    ['Format & delivery', 5, 0, 'Standard file name, PDF set complete'],
    ['Review & communication', 6, 0, 'Checker initials, transmittal ready'],
  ];
  const trackerQA = (root) => {
    let alive = true;
    const view = h(`<div class="lab-grid">
      <div class="panel">
        <div class="panel-head"><div><h4>Layout check — 44 criteria</h4><p class="sub">Reads the layout PDF set and scores it, group by group.</p></div>
          <button class="sbtn" data-run>Run check ▶</button></div>
        <div data-groups></div>
        <div class="score" data-score></div>
      </div>
      <div class="panel">
        <h4>Cross-checks</h4>
        <p class="sub">Same dimension, different documents: in-house layout vs vendor drawing vs quote. Near-misses within 2.5% get flagged too.</p>
        <div data-x><div class="empty">Run the check to compare documents.</div></div>
      </div>
    </div>`);
    root.appendChild(view);
    const gBox = view.querySelector('[data-groups]'), score = view.querySelector('[data-score]'), xBox = view.querySelector('[data-x]'), run = view.querySelector('[data-run]');
    const rows = GROUPS.map(([n, tot, , ex]) => {
      const r = h(`<div class="qg"><div class="qgh"><span></span><b>0 / ${tot}</b></div><div class="qbar"><i></i></div><small></small></div>`);
      r.querySelector('span').textContent = n; r.querySelector('small').textContent = 'e.g. ' + ex;
      gBox.appendChild(r); return r;
    });
    run.addEventListener('click', async () => {
      run.disabled = true; xBox.innerHTML = ''; score.innerHTML = '';
      let ok = 0;
      for (let i = 0; i < GROUPS.length && alive; i++) {
        const [, tot, miss] = GROUPS[i], r = rows[i];
        await wait(300); if (!alive) return;
        r.querySelector('i').style.width = ((tot - miss) / tot * 100) + '%';
        r.querySelector('b').textContent = `${tot - miss} / ${tot}`;
        r.classList.toggle('miss', miss > 0); ok += tot - miss;
      }
      score.innerHTML = `<span class="label">Layout score</span><b>${Math.round(ok / 44 * 100)}%</b><span class="sub" style="margin:0">${44 - ok} missing</span>`;
      const X = [
        ['Hook load', 'Layout: 350 lb', 'Quote: 500 lb', 'bad'],
        ['Roof height', 'Layout: 28′-6″', 'Vendor GA: 28′-0″', 'bad'],
        ['Booth working width', 'Layout: 12′-0″', 'Vendor GA: 12′-0″', 'ok'],
        ['Stack termination', 'Layout: 8′-2″ above roof', 'Contractor: 8′-0″', 'near'],
      ];
      for (const [what, a, b, st] of X) {
        await wait(260); if (!alive) return;
        xBox.appendChild(h(`<div class="xc ${st}"><b>${what}</b><span>${a}</span><span>${b}</span><em>${st === 'ok' ? '✓ match' : st === 'near' ? '≈ near-miss' : '✕ mismatch'}</em></div>`));
      }
      xBox.appendChild(h(`<div class="alert"><b>Caught before release.</b> In real use, the hook-load mismatch (350 vs 500 lb) was flagged by this check before the drawing went out.</div>`));
      run.disabled = false; run.textContent = 'Run again ↻';
    });
    return () => { alive = false; };
  };

  const arch = (nodes) => `<div class="arch">${nodes.map((n, i) => `<div class="node" style="animation-delay:${i * 0.12}s"><span class="label">${n[0]}</span><b>${n[1]}</b><p>${n[2]}</p></div>`).join('')}</div>`;

  const trackerBuilt = (root) => {
    root.appendChild(h(`<div>
      <p class="motto">Rules decide. The LLM writes. A human approves.</p>
      ${arch([
        ['Ingest', 'Outlook · ERP · SharePoint', 'Mail exported read-only every 2 h; daily read-only ERP refresh; project folders and drawings.'],
        ['Match', 'Weighted evidence', '9 signal types (project no. 0.97 … client name 0.55), +0.12 per extra kind; below 0.45 is ignored.'],
        ['Detect', '13 milestone detectors', 'Order accepted, submittals, ship date (read from the vendor PDF), new opportunity, site access…'],
        ['Explain', 'LLM one-liners', 'Optional summarizer writes a ≤160-char factual gist. It never sets ids or decisions.'],
        ['Act', 'Human-approved ERP push', 'Re-read the record, append ticked lines, confirm, save, re-read to verify, keep a backup.'],
      ])}
      <div class="lab-grid">
        <div class="panel"><h4>Results</h4><p class="sub">From the real tool</p>
          <div class="big-kpis">
            <div><b>94%</b><span>agreement with past manual decisions</span></div>
            <div><b>~7.3 h</b><span>saved per week (~340 h/year)</span></div>
            <div><b>1,697</b><span>equipment items indexed from 620 archived projects</span></div>
            <div><b>44</b><span>drawing criteria checked automatically</span></div>
          </div></div>
        <div class="panel"><h4>Stack</h4><p class="sub">Built with AI-assisted development (Claude Code)</p>
          <div class="stack"><span>Electron</span><span>JavaScript</span><span>Node tests</span><span>PowerShell + Outlook COM</span><span>pdf.js</span><span>DWG → DXF</span><span>three.js</span><span>Acumatica ERP</span><span>SharePoint REST</span></div>
          <p class="sub" style="margin:16px 0 0">Why rules first: every decision is explainable and testable, accuracy is measured against a year of real mail, and the LLM is used where language matters — writing summaries — not where correctness matters.</p></div>
      </div></div>`));
  };

  /* ======================================================
     2. Restaurant system
     ====================================================== */
  const CH = {
    POS: { c: '#ffffff', label: 'POS ticket PDF', fmt: 'PDF' },
    DoorDash: { c: '#ff2b1c', label: 'DoorDash', fmt: 'CSV' },
    UberEats: { c: '#9c9ca2', label: 'UberEats', fmt: 'CSV' },
    GrubHub: { c: '#ff8a7f', label: 'GrubHub', fmt: 'CSV' },
    Receipt: { c: '#55555c', label: 'Paper receipt', fmt: 'OCR' },
  };
  const ROWS = {
    POS: [['Table 4 — dinner', 86.4], ['Table 9 — lunch', 42.1], ['Counter — takeout', 23.75], ['Table 2 — dinner', 118.3]],
    DoorDash: [['Order #D-5512', 34.9], ['Order #D-5530', 27.45]],
    UberEats: [['Order #U-8821', 41.2], ['Order #U-8840', 19.99], ['Order #U-8862', 52.6]],
    GrubHub: [['Order #G-3301', 31.15]],
    Receipt: [['Catering deposit (handwritten)', 150]],
  };
  const restUnify = (root) => {
    let alive = true;
    const view = h(`<div>
      <div class="panel-head"><div><h4 style="margin:0">Five sources, one ledger</h4><p class="sub">Click a source to import its sample file — or import everything at once.</p></div>
        <button class="sbtn" data-all>Import all ▶</button></div>
      <div class="sources" data-src></div>
      <div class="lab-grid">
        <div class="panel"><h4>Unified ledger</h4><p class="sub">Sample day</p>
          <div class="ledger-wrap"><table class="ledger"><thead><tr><th>Source</th><th>Item</th><th class="num">Amount</th></tr></thead><tbody data-body><tr><td colspan="3" style="color:var(--muted)">No data yet.</td></tr></tbody></table></div></div>
        <div class="panel"><h4>Sales by channel</h4><p class="sub">Updates as data arrives</p>
          <div data-bars></div>
          <div class="total"><span class="label">Day total</span><b data-total>$0.00</b></div></div>
      </div></div>`);
    root.appendChild(view);
    const srcBox = view.querySelector('[data-src]'), tbody = view.querySelector('[data-body]'), bars = view.querySelector('[data-bars]'), totalEl = view.querySelector('[data-total]');
    const sums = {}, barEls = {};
    Object.entries(CH).forEach(([k, v]) => {
      sums[k] = 0;
      const b = h(`<div class="chbar"><span>${v.label.replace(' ticket PDF', '')}</span><span class="tr"><i style="background:${v.c}"></i></span><span class="v">$0</span></div>`);
      bars.appendChild(b); barEls[k] = b;
    });
    const refresh = () => {
      const tot = Object.values(sums).reduce((a, b) => a + b, 0), max = Math.max(1, ...Object.values(sums));
      Object.entries(barEls).forEach(([k, b]) => { b.querySelector('i').style.width = (sums[k] / max * 100) + '%'; b.querySelector('.v').textContent = '$' + Math.round(sums[k]); });
      totalEl.textContent = money(tot);
    };
    const done = new Set();
    const importSrc = async (k, btn) => {
      if (done.has(k)) return; done.add(k);
      btn.classList.add('done'); btn.querySelector('span').textContent = 'Parsing…';
      if (tbody.querySelector('td[colspan]')) tbody.innerHTML = '';
      for (const [item, amt] of ROWS[k]) {
        await wait(220); if (!alive) return;
        const tr = h(`<table><tr class="new"><td><i style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${CH[k].c}"></i>${CH[k].label.replace(' ticket PDF', '')}</td><td></td><td class="num">${money(amt)}</td></tr></table>`).querySelector('tr');
        tr.children[1].textContent = item;
        tbody.prepend(tr);
        sums[k] += amt; refresh();
      }
      btn.querySelector('span').textContent = `${ROWS[k].length} rows ✓`;
    };
    const btns = Object.entries(CH).map(([k, v]) => {
      const b = h(`<button class="src"><b><i style="background:${v.c}"></i>${v.label}</b><span>${v.fmt} · click to import</span></button>`);
      b.addEventListener('click', () => importSrc(k, b));
      srcBox.appendChild(b);
      return [k, b];
    });
    view.querySelector('[data-all]').addEventListener('click', async (e) => { e.target.disabled = true; for (const [k, b] of btns) { await importSrc(k, b); if (!alive) return; } });
    return () => { alive = false; };
  };

  const DISHES = [['Sample Burger', 14, 4.6], ['Veggie Bowl', 12, 3.1], ['Fish Tacos', 15, 5.9], ['House Salad', 10, 2.2], ['Steak Plate', 26, 11.5]];
  const restMenu = (root) => {
    const view = h(`<div class="lab-grid">
      <div class="panel"><div class="panel-head"><div><h4>Menu margins</h4><p class="sub">Edit any price or ingredient cost — margins update live</p></div></div>
        <div class="dish head"><span>Dish</span><span>Price</span><span>Cost</span><span>Margin</span></div>
        <div data-dishes></div></div>
      <div class="panel"><h4>What-if</h4><p class="sub">Delivery platforms take a cut. Try it.</p>
        <div class="slider"><label for="fee">Delivery platform fee</label><output data-feeo>0%</output><input type="range" id="fee" min="0" max="30" value="0" data-fee></div>
        <div class="slider"><label for="share">Share of orders through delivery</label><output data-shareo>0%</output><input type="range" id="share" min="0" max="100" value="0" data-share></div>
        <div class="readout" style="margin-top:8px"><div data-avgbox><b data-avg>—</b><span>average menu margin</span></div><div><b data-worst>—</b><span>lowest-margin dish</span></div></div>
        <p class="sub" style="margin:16px 0 0">All numbers are made up. The real system computes cost per dish from actual ingredient prices.</p></div>
    </div>`);
    root.appendChild(view);
    const list = view.querySelector('[data-dishes]'), fee = view.querySelector('[data-fee]'), share = view.querySelector('[data-share]');
    const data = DISHES.map((d) => ({ n: d[0], p: d[1], c: d[2] }));
    const rows = data.map((d) => {
      const r = h(`<div class="dish"><span></span><input type="number" step="0.5" min="0" aria-label="Price"><input type="number" step="0.1" min="0" aria-label="Cost"><div class="mbar"><span class="tr"><i></i></span><span></span></div></div>`);
      r.firstChild.textContent = d.n;
      const [pi, ci] = r.querySelectorAll('input');
      pi.value = d.p; ci.value = d.c;
      pi.addEventListener('input', () => { d.p = +pi.value || 0; calc(); });
      ci.addEventListener('input', () => { d.c = +ci.value || 0; calc(); });
      list.appendChild(r); return r;
    });
    const calc = () => {
      const f = +fee.value / 100, sh = +share.value / 100;
      view.querySelector('[data-feeo]').textContent = fee.value + '%';
      view.querySelector('[data-shareo]').textContent = share.value + '%';
      const ms = data.map((d) => { const net = d.p * (1 - f * sh); return net > 0 ? (net - d.c) / net : 0; });
      let worst = 0;
      ms.forEach((m, i) => {
        const mb = rows[i].querySelector('.mbar');
        mb.querySelector('i').style.width = Math.max(0, Math.min(100, m * 100)) + '%';
        mb.lastChild.textContent = Math.round(m * 100) + '%';
        if (m < ms[worst]) worst = i;
      });
      rows.forEach((r, i) => r.querySelector('.mbar').classList.toggle('low', i === worst));
      const avg = ms.reduce((a, b) => a + b, 0) / ms.length;
      view.querySelector('[data-avg]').textContent = Math.round(avg * 100) + '%';
      view.querySelector('[data-avgbox]').classList.toggle('warn', avg < 0.55);
      view.querySelector('[data-worst]').textContent = data[worst].n;
    };
    fee.addEventListener('input', calc); share.addEventListener('input', calc);
    calc();
  };

  const restBuilt = (root) => {
    root.appendChild(h(`<div>
      ${arch([
        ['Inputs', 'POS PDFs · delivery CSVs · receipts', 'Ticket PDFs, DoorDash / UberEats / GrubHub exports and photographed paper receipts.'],
        ['Parsing', 'PDF + CSV parsers · OCR', 'Every source normalised into the same transaction format.'],
        ['Storage', 'SQLite', 'Local-first database with cloud sync.'],
        ['Modules', 'Payroll · cash · close · menu', 'Payroll, cash reconciliation, monthly close and menu analytics.'],
        ['Output', 'Excel / PDF reports', 'Reports for the owner and the accountant. Auto-updating releases.'],
      ])}
      <div class="lab-grid">
        <div class="panel"><h4>Status</h4><p class="sub">Real deployment</p>
          <div class="big-kpis" style="grid-template-columns:repeat(2,1fr)">
            <div><b>Oct 2026</b><span>in daily use by the restaurant since</span></div>
            <div><b>5</b><span>data sources unified</span></div>
          </div></div>
        <div class="panel"><h4>Stack</h4><p class="sub">Windows desktop app</p>
          <div class="stack"><span>Electron</span><span>React</span><span>TypeScript</span><span>SQLite</span><span>OCR</span><span>Claude Code</span></div>
          <p class="sub" style="margin:16px 0 0">Client data stays private. This lab uses an invented menu and invented orders.</p></div>
      </div></div>`));
  };

  /* ======================================================
     3. Finishing line
     ====================================================== */
  const STATIONS = [
    { id: 'load', n: 'Load', k: 'manual', w: 90, d: 'Parts are hung on the overhead conveyor. Hook spacing and hook load define what the line can carry.' },
    { id: 'wash', n: 'Wash', k: 'pretreatment', w: 150, d: 'Multi-stage spray washer: cleans and pretreats the metal so the coating bonds. Stage count and chemistry depend on the substrate and the spec.' },
    { id: 'dry', n: 'Dry-off', k: 'oven', w: 110, d: 'Removes the water left by the washer before coating. Sized by mass of steel and line speed.' },
    { id: 'booth', n: 'Booth', k: 'paint / powder', w: 140, d: 'Where the coating is applied. Airflow, filtration and the spray equipment are sized for the parts, the finish and the throughput.' },
    { id: 'cure', n: 'Cure oven', k: 'thermal', w: 200, d: 'Brings parts to metal temperature and holds them there long enough to cure. Dwell time = conveyor length inside the oven ÷ line speed.' },
    { id: 'cool', n: 'Cool', k: 'tunnel', w: 100, d: 'Parts cool down before people handle them.' },
    { id: 'unload', n: 'Unload', k: 'manual', w: 90, d: 'Finished parts come off the line and hooks return to load.' },
  ];

  const drawLine = (svg, opts = {}) => {
    const W = 1000, Y = opts.preview ? 190 : 150;
    svg.setAttribute('viewBox', opts.preview ? '0 0 1000 340' : '0 0 1000 260');
    svg.innerHTML = '';
    // grid
    const g = s('g', { opacity: 0.25 }, svg);
    for (let x = 0; x <= W; x += 25) s('line', { x1: x, y1: 0, x2: x, y2: 400, stroke: '#2a2a2e', 'stroke-width': 1 }, g);
    const total = STATIONS.reduce((a, b) => a + b.w, 0), gap = (W - 40 - total) / (STATIONS.length - 1);
    let x = 20;
    const stEls = [];
    STATIONS.forEach((st) => {
      const grp = s('g', { class: 'st', 'data-id': st.id, tabindex: opts.preview ? -1 : 0, role: opts.preview ? 'presentation' : 'button', 'aria-label': st.n }, svg);
      s('rect', { x, y: Y - 70, width: st.w, height: 120, rx: 10 }, grp);
      const t1 = s('text', { x: x + 12, y: Y + 34 }, grp); t1.textContent = st.n.toUpperCase();
      const t2 = s('text', { x: x + 12, y: Y - 50, class: 'k' }, grp); t2.textContent = st.k;
      if (st.id === 'cure' || st.id === 'dry') {
        const glow = s('rect', { x: x + 6, y: Y + 42, width: st.w - 12, height: 3, fill: '#ff2b1c', opacity: 0.8 }, grp);
        if (!reduced) { const a = s('animate', { attributeName: 'opacity', values: '.3;1;.3', dur: '2.4s', repeatCount: 'indefinite' }, glow); }
      }
      stEls.push({ st, grp, x, w: st.w });
      x += st.w + gap;
    });
    // conveyor
    s('line', { x1: 0, y1: Y - 30, x2: W, y2: Y - 30, stroke: '#ff2b1c', 'stroke-width': 2 }, svg);
    const parts = s('g', {}, svg);
    return { svg, parts, Y, stEls };
  };

  const animateParts = (line, getState, onPart) => {
    const { parts, Y } = line;
    let off = 0, last = performance.now(), raf = 0, alive = true;
    const PX_PER_FT = 14, TIME_X = 8; // visual scale, time sped up 8x
    const frame = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const { speed, spacing, cured } = getState();
      const sp = spacing * PX_PER_FT;
      off += speed / 60 * PX_PER_FT * TIME_X * dt;
      while (off >= sp) { off -= sp; onPart && onPart(); }
      const cure = line.stEls.find((e) => e.st.id === 'cure');
      const need = Math.ceil(1000 / sp) + 2;
      while (parts.childNodes.length < need) {
        const g = s('g', {}, parts);
        s('line', { x1: 0, y1: Y - 30, x2: 0, y2: Y - 8, stroke: '#9c9ca2', 'stroke-width': 1.2 }, g);
        s('rect', { x: -9, y: Y - 8, width: 18, height: 26, rx: 2, fill: '#f5f5f3' }, g);
      }
      [...parts.childNodes].forEach((g, i) => {
        const px = -sp + off + i * sp;
        g.setAttribute('transform', `translate(${px},0)`);
        g.style.display = i < need ? '' : 'none';
        const rect = g.lastChild;
        // parts change colour after the booth
        const booth = line.stEls.find((e) => e.st.id === 'booth');
        rect.setAttribute('fill', px > cure.x + cure.w && cured !== undefined ? (cured ? '#3ddc84' : '#f59f00') : px > booth.x + booth.w / 2 ? '#ff2b1c' : '#d9d9d6');
      });
      if (alive && !reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
  };

  const finSim = (root) => {
    const view = h(`<div>
      <div class="panel-head"><div><h4 style="margin:0">Line simulator</h4><p class="sub">A generic powder-coating line. Click any station; move the sliders.</p></div></div>
      <div class="line-scroll"><svg class="line-svg" role="group" aria-label="Generic finishing line"></svg></div><p class="swipe-hint" aria-hidden="true">Swipe sideways to see the whole line →</p>
      <div class="calc">
        <div class="panel">
          <div class="slider"><label for="spd">Line speed</label><output data-o="spd"></output><input id="spd" type="range" min="2" max="20" step="0.5" value="8"></div>
          <div class="slider"><label for="spc">Part spacing on the conveyor</label><output data-o="spc"></output><input id="spc" type="range" min="1" max="8" step="0.5" value="3"></div>
          <div class="slider"><label for="olen">Conveyor length inside the cure oven</label><output data-o="olen"></output><input id="olen" type="range" min="40" max="300" step="5" value="120"></div>
          <div class="slider"><label for="need">Cure time the coating needs</label><output data-o="need"></output><input id="need" type="range" min="8" max="30" step="1" value="15"></div>
        </div>
        <div>
          <div class="readout">
            <div><b data-r="pph"></b><span>parts per hour</span></div>
            <div data-dwellbox><b data-r="dwell"></b><span>minutes in the cure oven</span></div>
            <div><b data-r="ok" style="color:var(--ok)">0</b><span>parts out, cured</span></div>
            <div data-underbox><b data-r="under">0</b><span>parts out, under-cured</span></div>
          </div>
          <div class="panel" style="margin-top:10px"><h4 data-sel-t>Pick a station</h4><p class="sub" style="margin:0" data-sel-d>Click a station on the line to see what it does.</p></div>
        </div>
      </div>
      <p class="sub" style="margin:14px 0 0">Illustrative simulation with generic numbers and station lengths, not a real project; time runs 8× faster. Throughput = speed × 60 ÷ spacing; time in a station = its length ÷ speed. Parts leave grey → red once coated → green if cured, amber if the oven was too short for that speed. Typical powder cure schedules are on the order of 10–20 min at metal temperature; the coating datasheet always rules.</p>
    </div>`);
    root.appendChild(view);
    const line = drawLine(view.querySelector('svg'));
    const spd = view.querySelector('#spd'), spc = view.querySelector('#spc'), olen = view.querySelector('#olen'), need = view.querySelector('#need');
    const LEN = { wash: 80, dry: 50, booth: 30, cool: 50 }; // generic station lengths, ft
    const dw = {};
    line.stEls.forEach((e) => { if (e.st.id in LEN || e.st.id === 'cure') { dw[e.st.id] = s('text', { x: e.x + e.w / 2, y: line.Y + 70, class: 'dw', 'text-anchor': 'middle' }, line.svg); } });
    let nOk = 0, nUnder = 0, isCured = true;
    const upd = () => {
      const v = +spd.value, sp = +spc.value, L = +olen.value;
      view.querySelector('[data-o="need"]').textContent = need.value + ' min';
      Object.keys(dw).forEach((id) => { dw[id].textContent = ((id === 'cure' ? L : LEN[id]) / v).toFixed(1) + ' min'; });
      isCured = L / v >= +need.value; nOk = 0; nUnder = 0;
      view.querySelector('[data-r="ok"]').textContent = 0; view.querySelector('[data-r="under"]').textContent = 0;
      view.querySelector('[data-underbox]').classList.remove('warn');
      view.querySelector('[data-o="spd"]').textContent = v + ' ft/min';
      view.querySelector('[data-o="spc"]').textContent = sp + ' ft';
      view.querySelector('[data-o="olen"]').textContent = L + ' ft';
      view.querySelector('[data-r="pph"]').textContent = Math.round(v * 60 / sp);
      const dwell = L / v;
      view.querySelector('[data-r="dwell"]').textContent = dwell.toFixed(1);
      view.querySelector('[data-dwellbox]').classList.toggle('warn', dwell < +need.value);
      dw.cure.classList.toggle('bad', dwell < +need.value);
    };
    [spd, spc, olen, need].forEach((i) => i.addEventListener('input', upd)); upd();
    const select = (e) => {
      line.stEls.forEach((x) => x.grp.classList.toggle('sel', x === e));
      view.querySelector('[data-sel-t]').textContent = e.st.n;
      view.querySelector('[data-sel-d]').textContent = e.st.d;
    };
    line.stEls.forEach((e) => {
      e.grp.addEventListener('click', () => select(e));
      e.grp.addEventListener('keydown', (k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); select(e); } });
    });
    return animateParts(line, () => ({ speed: +spd.value, spacing: +spc.value, cured: isCured }), () => {
      if (isCured) view.querySelector('[data-r="ok"]').textContent = ++nOk;
      else { view.querySelector('[data-r="under"]').textContent = ++nUnder; view.querySelector('[data-underbox]').classList.add('warn'); }
    });
  };

  const STAGES = [
    ['Sketch', 'First conversation with the customer: what parts, what finish, what volume, what space. A rough concept to anchor the discussion.'],
    ['Process', 'Process selection — pretreatment, liquid vs powder, manual vs automatic application, batch vs conveyorized.'],
    ['Sizing', 'Airflow and thermal sizing: booth airflow, oven heat load, air make-up units.'],
    ['Layout', 'Plant layout in AutoCAD / FactoryCAD: equipment footprint, conveyor path, access and utilities.'],
    ['Specs & quote', 'Equipment specs and quotes, coordinating OEM vendors such as GFS, Rohner, Nordson and Clemco.'],
    ['Review', 'Drawing and submittal review to catch scope and capacity gaps before fabrication.'],
    ['Start-up', 'On-site installation, burner and line start-ups, coordinating customers, installers and vendors.'],
  ];
  const finRole = (root) => {
    const view = h(`<div>
      <h4 style="margin:0 0 6px">From first concept to start-up</h4>
      <p class="sub">What I do at each stage of a project, as engineering lead.</p>
      <div class="stages"></div>
      <div class="panel"><div class="stage-detail"></div></div>
      <div class="big-kpis" style="margin-top:22px">
        <div><b>54</b><span>opportunities led</span></div>
        <div><b>USD 21M</b><span>quoted</span></div>
        <div><b>10 / 23</b><span>decided projects won (USD 4.85M)</span></div>
        <div><b>~6</b><span>installations and start-ups managed on site, incl. a multi-booth paint line for an EV manufacturer</span></div>
      </div>
    </div>`);
    root.appendChild(view);
    const bar = view.querySelector('.stages'), det = view.querySelector('.stage-detail');
    const btns = STAGES.map(([t, d], i) => {
      const b = h(`<button aria-pressed="false"><span class="n">0${i + 1}</span>${t}</button>`);
      b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
        det.innerHTML = ''; const hh = document.createElement('h4'); hh.textContent = t; const p = document.createElement('p'); p.style.margin = 0; p.textContent = d;
        det.append(hh, p); det.animate && det.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced ? 0 : 400, easing: 'ease-out' });
      });
      bar.appendChild(b); return b;
    });
    btns[0].click();
  };

  /* Drawings gallery — partial excerpts, identifiers removed */
  const DRAWINGS = [
    ['paint-line-layout', 'Paint line — system layout', 'Overhead conveyor loop through a paint booth, load/unload zones, building grid and utility callouts (X exhaust, F fresh air, E electrical, A air, B breathing air, G gas).'],
    ['utilities-schedule', 'Utilities schedule', 'Every connection the plant must provide: exhaust and make-up air CFM, electrical loads, compressed and breathing air, and the gas load for the air make-up unit.'],
    ['twin-booth-elevation', 'Two paint booths — back elevation', 'Paint booths for an EV manufacturer, with exhaust and intake ducting routed through the roof and checked against truss and roof heights.'],
    ['booth-back-elevation', 'Same booths, colour-coded', 'Booth shell, doors, fans and ductwork separated by layer so each trade reads its own scope.'],
    ['blast-system-layout', 'Blast booth + media recovery', 'Plan view of an abrasive-blast system with a media-recovery floor, dust collection and utility drops.'],
    ['paint-system-elevation', 'Paint system — elevation', 'Enclosed-track conveyor, booth and air make-up unit against deck and truss heights, with stack clearances.'],
    ['powder-line-plan', 'Powder line — blast, powder, cure', 'A full powder-coating line in plan: blast booth, powder booth and cure oven in sequence on the building grid, with every utility drop tagged.'],
    ['paint-booth-elevations', 'Paint booth — side & front elevations', 'Conveyor centerline, hook-slot width and height, part opening, working and chamber depths, duct termination and roof heights.'],
    ['powder-booth-section', 'Powder booth — section A-A', 'Inside the enclosure: compressed and breathing-air piping, powder hoppers, filter regulators and what is “by others”.'],
    ['mix-room-paint-system', 'Mix room + paint booth + AMU', 'A complete small paint system: mix room, paint booth, air make-up unit and a looping conveyor fitted between gas tanks, storage and an exterior wall.'],
  ];
  const finDrawings = (root) => {
    const view = h(`<div>
      <div class="gal-main"><button type="button" class="gal-zoom" aria-label="Open this drawing full size in a new tab"><img alt=""></button><div class="gal-cap"><h4></h4><p></p></div></div>
      <div class="gal-thumbs"></div>
      <p class="sub" style="margin:14px 0 0">Excerpts from layout drawings I produced. Customer names, title blocks and equipment identifiers removed.</p>
    </div>`);
    root.appendChild(view);
    const img = view.querySelector('.gal-main img'), t = view.querySelector('.gal-cap h4'), p = view.querySelector('.gal-cap p'), thumbs = view.querySelector('.gal-thumbs');
    const show = (i) => {
      const [f, title, desc] = DRAWINGS[i];
      img.src = `${document.documentElement.dataset.base || ''}img/drawings/${f}.webp`; img.alt = title; t.textContent = title; p.textContent = desc;
      [...thumbs.children].forEach((b, j) => b.setAttribute('aria-pressed', i === j));
      img.animate && img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 0 : 350 });
    };
    DRAWINGS.forEach(([f, title], i) => {
      const b = h(`<button class="gal-th" aria-pressed="false"><img src="${document.documentElement.dataset.base || ''}img/drawings/${f}.webp" alt="" loading="lazy"><span></span></button>`);
      b.querySelector('span').textContent = title;
      b.addEventListener('click', () => show(i));
      thumbs.appendChild(b);
    });
    view.querySelector('.gal-zoom').addEventListener('click', () => window.open(img.src, '_blank', 'noopener'));
    show(0);
  };

  /* ======================================================
     4. Lean — 2K mixing-system assembly (Bradley, team of 5)
        Figures are the team's estimates from the final deck.
     ====================================================== */
  const leanVSM = (root) => {
    const PROC = 15.5, LEAD = 666.65, AVAIL = 2000;
    const view = h(`<div>
      <div class="lab-grid">
        <div class="panel">
          <h4>Current state value stream</h4>
          <p class="sub">Assembly of a two-component paint mixing &amp; dosing system, from the time study and the shop floor.</p>
          <div class="vsm-flow">${['Cutting', 'Grinding', 'Frame', 'Air system', 'Fluid system', 'Electrical', 'Final assembly', 'Crate'].map((s, i) => `<div class="vsm-box" style="animation-delay:${i * 0.07}s"><span>${s}</span></div>`).join('<i class="vsm-tri">▲</i>')}</div>
          <div class="vsm-time">
            <div class="vsm-row"><span class="label">Lead time</span><b>${LEAD} h</b></div>
            <div class="vsm-bar"><i class="va" style="width:${(PROC / LEAD * 100).toFixed(2)}%"></i></div>
            <div class="vsm-row"><span class="label red">Value-adding time</span><b>${PROC} h</b></div>
          </div>
          <p class="big-claim"><b>${(PROC / LEAD * 100).toFixed(1)}%</b> of the lead time actually adds value. The rest is waiting, searching and rework — the muda.</p>
        </div>
        <div class="panel">
          <h4>Takt time</h4>
          <p class="sub">Takt = available time ÷ demand. Move the demand.</p>
          <div class="slider"><label for="dem">Demand (units / year)</label><output data-o="dem"></output><input id="dem" type="range" min="5" max="120" step="1" value="15"></div>
          <div class="readout">
            <div><b data-r="takt"></b><span>hours per unit (takt)</span></div>
            <div data-capbox><b data-r="cap"></b><span>of takt used by processing</span></div>
          </div>
          <p class="sub" style="margin:14px 0 0">At the real demand of 15 units/year, takt is 133.3 h/unit against 15.5 h of processing: capacity isn't the problem — flow is. ${AVAIL.toLocaleString()} available hours/year.</p>
        </div>
      </div>
      <div class="panel" style="margin-top:22px">
        <h4>Proposed future state — three loops</h4>
        <p class="sub">A proposal: it was not implemented.</p>
        <div class="loops">
          <div><span class="label red">Loop 1 · Pacemaker</span><b>Continuous flow in a dedicated cell</b><p>Kaizen target: 6 h cycle time, finished-goods pull, zero WIP, 40% less walking.</p></div>
          <div><span class="label red">Loop 2 · Frame &amp; fittings</span><b>Pull, not push</b><p>Frames and fittings pulled to the cell by kanban, batch sizes calculated.</p></div>
          <div><span class="label red">Loop 3 · Supplier</span><b>Just-in-time delivery</b><p>Fittings and components on 2-day pull delivery, less inventory on the floor.</p></div>
        </div>
      </div>
    </div>`);
    root.appendChild(view);
    const dem = view.querySelector('#dem');
    const upd = () => {
      const d = +dem.value, takt = AVAIL / d, used = PROC / takt;
      view.querySelector('[data-o="dem"]').textContent = d;
      view.querySelector('[data-r="takt"]').textContent = takt.toFixed(1);
      view.querySelector('[data-r="cap"]').textContent = Math.round(used * 100) + '%';
      view.querySelector('[data-capbox]').classList.toggle('warn', used > 0.85);
    };
    dem.addEventListener('input', upd); upd();
  };

  const MUDA = [
    { k: 'Overprocessing', cost: 6311, fix: 'kanban', why: ['Customers change specs after parts are ordered and received.', 'The new specs were never communicated before ordering.', 'No customer check-in happens before the pump is ordered.'], root: 'No gate between “spec approved” and “part ordered”.', act: 'Kanban + poka-yoke checklist: sales re-confirms specs with the customer before purchasing releases the order.' },
    { k: 'Defects / rework', cost: 4237.5, save: 3178, fix: 'kanban', why: ['Operators pick and test the wrong fittings.', 'Many similar fittings, none labelled.', 'Even with labels, there is no pull mechanism bringing the right parts to the job.'], root: 'No visual management and no pull system for fittings.', act: 'Labels + “supermarket” kanban so the right fittings arrive with each job. Assumes 75% of defects removed.' },
    { k: 'Waiting', cost: 3750, fix: 'sop', why: ['Operators wait for the right parts to finish the job.', 'Parts are not on site when needed.', 'No defined assembly sequence or instructions.'], root: 'No standard procedure synchronising parts and steps.', act: 'Standard Operating Procedure for the assembly, built on the new cell and kanban.' },
    { k: 'Motion', cost: 2531, save: 2024, fix: 'cell', why: ['Excessive walking to fetch tools and information.', 'Tools are scattered across the facility.', 'There is no dedicated assembly area.'], root: 'Tool, material and information locations are undefined.', act: 'Dedicated assembly cell with 5S: fixed places for tools, parts and documents. Assumes 80% less motion.' },
    { k: 'Inventory', cost: 1250, fix: 'cell', why: ['Excess parts and clutter on the floor.', 'Parts aren’t returned to a designated place.', '5S and visual management were never implemented or trained.'], root: 'No standardised, visual inventory control.', act: '5S, labels and colour-coded zones, JIT ordering by job, kanban to regulate flow.' },
  ];
  const FIXES = {
    cell: ['Assembly cell + 5S', 7080, 'Motion · Inventory'],
    kanban: ['Kanban + poka-yoke', 2550, 'Overprocessing · Defects'],
    sop: ['Assembly SOP', 2760, 'Waiting'],
  };
  const leanMuda = (root) => {
    const on = { cell: true, kanban: true, sop: true };
    const view = h(`<div>
      <div class="muda-grid" data-muda></div>
      <div class="lab-grid" style="margin-top:22px">
        <div class="panel">
          <h4>Proposed countermeasures</h4>
          <p class="sub">Switch them on and off — savings, investment and payback update.</p>
          <div data-fixes></div>
        </div>
        <div class="panel">
          <div class="readout">
            <div><b data-r="sav"></b><span>estimated savings / year, if implemented</span></div>
            <div><b data-r="inv"></b><span>investment</span></div>
            <div><b data-r="pay"></b><span>payback</span></div>
            <div><b data-r="cum"></b><span>cumulative after 5 years</span></div>
          </div>
          <svg class="cf" viewBox="0 0 400 150" data-cf aria-label="Cumulative cash flow, years 0 to 5"></svg>
        </div>
      </div>
      <p class="sub" style="margin:14px 0 0">With all three switched on you see the team's proposal as presented. It was a proposal: none of it was implemented, so savings and payback are estimates. Estimates from the final project deck (labour at $25/h plus overhead, 15 units/year).</p>
    </div>`);
    root.appendChild(view);
    const grid = view.querySelector('[data-muda]'), fixes = view.querySelector('[data-fixes]'), cf = view.querySelector('[data-cf]');
    const cards = MUDA.map((m) => {
      const c = h(`<div class="muda"><span class="label"></span><b class="mc"></b><small>current cost / year</small><div class="mfix"></div></div>`);
      c.querySelector('.label').textContent = m.k; c.querySelector('.mc').textContent = '$' + Math.round(m.cost).toLocaleString();
      grid.appendChild(c); return c;
    });
    Object.entries(FIXES).forEach(([k, [n, inv, covers]]) => {
      const r = h(`<label class="fix"><input type="checkbox" checked><span><b></b><small></small></span><em>$${inv.toLocaleString()}</em></label>`);
      r.querySelector('b').textContent = n; r.querySelector('small').textContent = 'fixes ' + covers;
      r.querySelector('input').addEventListener('change', (e) => { on[k] = e.target.checked; upd(); });
      fixes.appendChild(r);
    });
    const upd = () => {
      let sav = 0, inv = 0;
      MUDA.forEach((m, i) => {
        const s = m.save ?? m.cost, active = on[m.fix];
        if (active) sav += s;
        cards[i].classList.toggle('fixed', active);
        cards[i].querySelector('.mfix').textContent = active ? `−$${Math.round(s).toLocaleString()} / yr` : 'not addressed';
      });
      Object.entries(FIXES).forEach(([k, [, v]]) => { if (on[k]) inv += v; });
      const pay = sav ? inv / sav : Infinity;
      view.querySelector('[data-r="sav"]').textContent = '$' + Math.round(sav).toLocaleString();
      view.querySelector('[data-r="inv"]').textContent = '$' + inv.toLocaleString();
      view.querySelector('[data-r="pay"]').textContent = sav ? (pay * 12).toFixed(0) + ' months' : '—';
      view.querySelector('[data-r="cum"]').textContent = '$' + Math.round(sav * 5 - inv).toLocaleString();
      // cash-flow chart
      cf.innerHTML = '';
      const pts = [0, 1, 2, 3, 4, 5].map((y) => sav * y - inv), mx = Math.max(80000, ...pts), mn = Math.min(-15000, ...pts);
      const X = (y) => 30 + y * 70, Y = (v) => 10 + (mx - v) / (mx - mn) * 120;
      s('line', { x1: 30, x2: 380, y1: Y(0), y2: Y(0), stroke: 'rgba(255,255,255,.25)' }, cf);
      pts.forEach((v, y) => {
        s('rect', { x: X(y) - 14, width: 28, y: Math.min(Y(0), Y(v)), height: Math.max(1, Math.abs(Y(v) - Y(0))), fill: v < 0 ? '#ff2b1c' : '#f5f5f3', rx: 3 }, cf);
        const t = s('text', { x: X(y), y: 148, 'text-anchor': 'middle', fill: '#9c9ca2', 'font-size': 10, 'font-family': 'JetBrains Mono, monospace' }, cf); t.textContent = 'Y' + y;
      });
    };
    upd();
  };

  const leanWhys = (root) => {
    const view = h(`<div>
      <p class="sub">Pick a waste, then keep asking “why?” until you hit the root cause.</p>
      <div class="stages" data-pick></div>
      <div class="panel why-panel"><div data-chain></div><div class="why-btns"><button class="sbtn" data-why>Why? ▶</button><button class="sbtn ghost" data-reset>Reset</button></div></div>
    </div>`);
    root.appendChild(view);
    const pick = view.querySelector('[data-pick]'), chain = view.querySelector('[data-chain]'), btn = view.querySelector('[data-why]');
    let cur = 0, step = 0;
    const render = () => {
      const m = MUDA[cur];
      chain.innerHTML = '';
      chain.appendChild(h(`<div class="why q"><span class="label">Problem</span><p></p></div>`)).querySelector('p').textContent = m.why[0];
      for (let i = 1; i <= step && i < m.why.length; i++) chain.appendChild(h(`<div class="why"><span class="label red">Why? ${i}</span><p></p></div>`)).querySelector('p').textContent = m.why[i];
      if (step >= m.why.length) {
        const r = chain.appendChild(h(`<div class="why root"><span class="label red">Root cause</span><p></p></div>`)); r.querySelector('p').textContent = m.root;
        const a = chain.appendChild(h(`<div class="why act"><span class="label">Proposed countermeasure</span><p></p></div>`)); a.querySelector('p').textContent = m.act;
      }
      btn.disabled = step >= m.why.length;
    };
    const btns = MUDA.map((m, i) => {
      const b = h(`<button aria-pressed="false"><span class="n">0${i + 1}</span></button>`);
      b.appendChild(document.createTextNode(m.k));
      b.addEventListener('click', () => { cur = i; step = 0; btns.forEach((x) => x.setAttribute('aria-pressed', x === b)); render(); });
      pick.appendChild(b); return b;
    });
    btn.addEventListener('click', () => { step++; render(); });
    view.querySelector('[data-reset]').addEventListener('click', () => { step = 0; render(); });
    btns[0].click();
  };

  /* ======================================================
     registry
     ====================================================== */
  window.LABS = {
    drawLine: (svg, opts) => {
      const line = drawLine(svg, opts);
      if (!reduced) {
        let stop = null;
        new IntersectionObserver(([e]) => {
          if (e.isIntersecting && !stop) stop = animateParts(line, () => ({ speed: 10, spacing: 4 }));
          else if (!e.isIntersecting && stop) { stop(); stop = null; }
        }).observe(svg);
      } else animateParts(line, () => ({ speed: 10, spacing: 4 }));
    },
    tracker: {
      title: 'ProjectTracker — workflow automation for project engineers',
      data: 'sample data',
      note: 'Re-creation with invented emails and projects that mirrors the real tool’s logic. Only the figures under “How it’s built → Results” come from the real tool. The original code and project data are private.',
      tabs: [
        { name: 'Inbox triage', render: trackerInbox, hint: 'What you’re looking at: how the tool files incoming email. Try this: press “Run triage”, then approve or discard what lands in “Needs you”.' },
        { name: 'Board', render: trackerBoard, hint: 'What you’re looking at: the project board with rule-based status hints. Try this: press “Apply” on a hint, or move a card with its ‹ › buttons (or drag it).' },
        { name: 'Drawing QA', render: trackerQA, hint: 'What you’re looking at: the 44-criteria layout check and drawing-vs-quote cross-checks. Try this: press “Run check”.' },
        { name: 'How it’s built', render: trackerBuilt, hint: 'What you’re looking at: the architecture, the stack and the real tool’s measured results.' },
      ],
    },
    restaurant: {
      title: 'Restaurant accounting & analytics app',
      data: 'sample data',
      note: 'Re-creation with an invented menu and invented orders. The restaurant’s real data is private.',
      tabs: [
        { name: 'Unify sales', render: restUnify, hint: 'What you’re looking at: five sales sources merged into one ledger. Try this: click a source to import it, or press “Import all”.' },
        { name: 'Menu margins', render: restMenu, hint: 'What you’re looking at: margin per dish. Try this: edit a price or a cost, then move the delivery-fee sliders.' },
        { name: 'How it’s built', render: restBuilt, hint: 'What you’re looking at: the data pipeline, the stack and where the app stands today.' },
      ],
    },
    engineering: {
      title: 'Industrial equipment projects, concept to start-up',
      data: 'real drawing excerpts + generic simulator',
      note: 'Drawings are partial excerpts of layouts I produced, with customer names, title blocks and equipment identifiers removed. The line simulator is generic and illustrative, not a real project.',
      tabs: [
        { name: 'Drawings', render: finDrawings, hint: 'What you’re looking at: excerpts from layout drawings I produced. Try this: pick a thumbnail; click the big image to open it full size.' },
        { name: 'Concept to start-up', render: finRole, hint: 'What you’re looking at: what I do at each stage of a project. Try this: click a stage.' },
        { name: 'Line simulator', render: finSim, hint: 'What you’re looking at: a generic conveyorized coating line. Try this: move the sliders and watch throughput and oven time; click a station to see what it does.' },
      ],
    },
    lean: {
      title: 'Lean redesign proposal for a paint-mixing system assembly',
      data: 'team’s real estimates · proposal',
      note: 'Team project of 5, Bradley University (2025). My part: workflow and waste mapping, layout redesign and the work-cell design. The redesign is a proposal and was not implemented; savings and payback are the team’s estimates from the final project deck. The sliders and switches are what-ifs.',
      tabs: [
        { name: 'Value stream', render: leanVSM, hint: 'What you’re looking at: the measured current-state value stream and the proposed future state. Try this: move the demand slider to see takt time change.' },
        { name: 'Muda & payback', render: leanMuda, hint: 'What you’re looking at: the cost of each waste and the three countermeasures. Try this: switch countermeasures off and on to see savings and payback change.' },
        { name: '5 Whys', render: leanWhys, hint: 'What you’re looking at: the root-cause analysis behind each waste. Try this: pick a waste and press “Why?” until you reach the root cause.' },
      ],
    },
  };
})();
