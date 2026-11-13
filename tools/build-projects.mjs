// Generates the static case-study pages in /projects from the data below.
// Run:  node tools/build-projects.mjs      (output is plain HTML; the site itself has no build step)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'projects');
const SITE = 'https://maxgomezmontero.github.io/';
const V = '20261113';   // asset version: bump (also in index.html and 404.html) when CSS/JS change, so caches refresh
mkdirSync(OUT, { recursive: true });

const lab = (key, tabs) => `<div class="lab-inline" data-lab-inline="${key}"${tabs ? ` data-tabs="${tabs}"` : ''}><p class="il-hint">Loading the interactive demo…</p></div>`;
const steps = (arr) => `<ol class="steps">${arr.map((s) => `<li>${s}</li>`).join('')}</ol>`;
const decisions = (arr) => `<div class="decisions">${arr.map(([t, p]) => `<div><span class="why">Decision</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div>`;
const results = (arr) => `<div class="results">${arr.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>`;
const video = (src, poster, cap, loop = true) => `<figure>${loop
  ? `<video muted loop playsinline preload="none" data-loop data-src="../img/planta/${src}" poster="../img/planta/${poster}" aria-label="${cap}"></video>`
  : `<video controls playsinline preload="none" src="../img/planta/${src}" poster="../img/planta/${poster}" aria-label="${cap}"></video>`}<figcaption>${cap}</figcaption></figure>`;

// "Beyond work" helpers: lite YouTube embeds (thumbnail first, see case.js), stills and muted loops from img/beyond/
const yt = (id, title, extra = '') => `<div class="yt" data-yt="${id}" data-title="${title}"${extra}></div>`;
const still = (src, alt, cap) => `<figure><img src="../img/beyond/${src}" alt="${alt}" loading="lazy" width="960" height="540"><figcaption>${cap}</figcaption></figure>`;
const loopB = (src, poster, cap) => `<figure><video muted loop playsinline preload="none" data-loop data-src="../img/beyond/${src}" poster="../img/beyond/${poster}" aria-label="${cap}"></video><figcaption>${cap}</figcaption></figure>`;
const rally = ({ facts, body, video, media }) => `<dl class="rally-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${body}
  <div class="rally-media"><div class="rally-video">${video}<p class="label">Full pitch on YouTube · in Spanish</p></div><div class="rally-stills">${media}</div></div>`;

const ALL = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'projecttracker', track: 'Applied AI', short: 'ProjectTracker',
    title: 'ProjectTracker',
    desc: 'A rules-first desktop co-pilot that files a project engineer’s email, flags milestones, checks drawings and queues ERP updates for approval.',
    lead: 'A desktop co-pilot that files a project engineer’s email, flags milestones, checks layout drawings and queues ERP updates for one-click approval. I built it for my own job; I use it every day.',
    meta: [['Role', 'Sole designer &amp; developer'], ['Team', 'Me, building with AI coding agents (Claude Code)'], ['When', 'Jun 2026 – present'], ['Stack', 'Electron · JavaScript · Outlook · Acumatica ERP · SharePoint'], ['Status', 'In daily use']],
    hero: lab('tracker', 'Replay one email'),
    heroCap: 'Replay of one sample email going from inbox to ERP note. Sample data; the real tool and its data are private.',
    tldr: [
      'Running ~20–25 live projects meant hours each week matching ~145 emails to jobs, updating the ERP by hand and catching drawing errors late.',
      'A rules-first app: weighted-evidence email matching, 13 milestone detectors, a 44-criteria drawing check and human-approved ERP writes. The LLM only writes one-line summaries.',
      '~7.3 h saved per week (~340 h/year), 94% agreement with my past manual decisions, and real drawing errors caught before release.',
    ],
    sections: [
      ['context', 'Context', `<p>As a project engineer I lead the engineering on <b>54 opportunities (USD 21M quoted)</b>. The information for each one is spread across Outlook threads, the Acumatica ERP and SharePoint folders full of layouts, vendor drawings and quotes. Keeping the ERP current and catching mismatches between documents was manual, slow and easy to get wrong.</p>
        <p>Constraints I designed around: mail and ERP are read-only unless I approve a change, nothing may be written silently, and every decision the tool makes has to be explainable to me in one line.</p>`],
      ['role', 'My role', `<div class="role-box"><p><b>Everything, end to end.</b> I scoped the problem from my own workload, designed the matching rules and detectors, built the desktop app with AI coding agents, wired it to Outlook, the ERP and SharePoint, and measured it against my own past decisions.</p></div>`],
      ['approach', 'How it works', steps([
        '<b>Ingest.</b> Mail is exported read-only every 2 hours; the ERP is refreshed read-only once a day; project folders and drawings are read from SharePoint.',
        '<b>Match.</b> Each email is scored against every project with 9 evidence signals — project number in the subject (0.97), ERP opportunity ID (0.90), known thread (0.88) … client name in the subject (0.55) — plus 0.12 for each extra kind of evidence. Below 0.45 it is ignored.',
        '<b>Detect.</b> 13 deterministic detectors spot milestones: order accepted, submittals, ship date (read from the vendor PDF), new opportunity, site access and more.',
        '<b>Check drawings.</b> Layout PDFs are scored against 44 criteria in 7 groups and cross-checked against quotes and vendor drawings; near-misses within 2.5% are flagged too.',
        '<b>Explain.</b> An optional LLM writes a ≤160-character factual summary of the thread. It never sets IDs, statuses or decisions.',
        '<b>Approve &amp; write.</b> Proposals land in an inbox (J/K to move, A to approve, X to discard). An approved ERP note is re-read, appended, confirmed, saved, re-read to verify, and backed up.',
      ])],
      ['decisions', 'Key decisions', decisions([
        ['Rules decide; the LLM only writes', 'Matching, milestones and drawing checks are rules with weights I can read and test. The LLM is used where language matters — summaries — not where correctness matters.'],
        ['A human approves every ERP write', 'The tool proposes, I decide. Every write is re-read and verified afterwards, with a backup of what was there before.'],
        ['Measure against my own history', 'Accuracy is reported as agreement with decisions I had already made by hand (94%), not as a self-reported model score.'],
        ['Index the past to answer the present', '1,697 equipment items from 620 archived projects are searchable by size and type, so “have we built this before?” takes seconds.'],
      ])],
      ['results', 'Results', `${results([['~7.3 h', 'saved per week (~340 h/year)'], ['94%', 'agreement with my past manual decisions'], ['1,697', 'equipment items indexed from 620 projects'], ['44', 'drawing criteria checked automatically']])}
        <p>Errors caught before a drawing was released include an order-number typo, a <b>350 vs 500 lb hook-load</b> mismatch and a ceiling-height mismatch.</p>`],
      ['try', 'Try it', lab('tracker', 'Inbox triage,Board,Drawing QA,How it’s built')],
      ['confidential', 'Confidentiality', '<p class="conf">ProjectTracker is a tool I use at work. Its source code and real project data are private. Everything above runs on invented sample data that mirrors the real logic.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'industrial-projects', track: 'Manufacturing', short: 'Industrial projects',
    title: 'Industrial equipment projects, sketch to start-up',
    desc: 'Engineering lead on paint and powder finishing lines for EV, heavy-equipment and building-products plants: 54 opportunities, USD 21M quoted.',
    lead: 'Engineering lead on paint and powder finishing lines — booths, cure ovens, air make-up units, wash systems and conveyors — for EV, heavy-equipment and building-products plants.',
    meta: [['Role', 'Project Engineer · engineering lead'], ['Team', 'Customers, sales, installers, OEM vendors'], ['When', 'Jan 2025 – present (intern Jan–May 2025, project engineer since Jun 2025)'], ['Tools', 'AutoCAD · FactoryCAD · Creo · Acumatica ERP'], ['Status', '54 opportunities · 5+ installs']],
    hero: lab('engineering', '3D line'),
    heroCap: '3D model of a paint line built from the dimensions on my own layout drawings. Drag to orbit.',
    tldr: [
      'Every plant needs a finishing system sized to its parts, throughput, building and utilities — and every quote and drawing has to close scope gaps before anything is fabricated.',
      'Process selection, airflow and thermal sizing, layouts and equipment specs; coordinating vendors such as GFS, Rohner, Nordson and Clemco; reviewing drawings and submittals; on-site installs and start-ups.',
      '54 opportunities led (USD 21M quoted); 10 of 23 decided projects won (USD 4.85M); 5+ installations, including a multi-booth paint line for an EV manufacturer.',
    ],
    sections: [
      ['drawings', 'Drawings I produce', `<p>Excerpts from my layout drawings: system layouts, elevations and the utilities schedule the plant has to provide. Customer names, title blocks and equipment identifiers are removed.</p>${lab('engineering', 'Drawings')}`],
      ['role', 'My role', `<div class="role-box"><p><b>Engineering lead from first sketch to start-up.</b> I turn a customer’s parts, finish and volume into a process, size the equipment, draw the layout, write the specs, coordinate the OEM vendors and installers, and support installation and start-up on site.</p><p>I manage ~20–25 concurrent opportunities at a time.</p></div>`],
      ['approach', 'How a project runs', lab('engineering', 'Sketch to start-up')],
      ['checks', 'What I check before release', `<p>Most expensive mistakes are scope gaps between documents. Before a layout goes out I check, among other things:</p>
        <ul><li><b>Hook load</b> on the drawing vs. what the conveyor was quoted for.</li><li><b>Ceiling and truss heights</b> against stacks, ducts and the air make-up unit.</li><li><b>Electrical scope</b> — what we supply and what is “by others”.</li><li>A <b>utilities chart</b> with every connection the plant must provide: exhaust and fresh-air CFM, electrical, compressed and breathing air, gas.</li></ul>
        <p>Those checks are also what I automated in <a href="projecttracker.html">ProjectTracker</a>’s 44-criteria drawing review.</p>`],
      ['simulator', 'Throughput &amp; cure, in numbers', `<p>A generic line to play with: line speed and part spacing set throughput; conveyor length in the oven sets dwell time, which has to meet the coating’s cure schedule.</p>${lab('engineering', 'Line simulator')}`],
      ['results', 'Results', results([['54', 'opportunities led'], ['USD 21M', 'quoted'], ['10 / 23', 'decided projects won (USD 4.85M)'], ['5+', 'installations and start-ups']])],
      ['confidential', 'Confidentiality', '<p class="conf">Customers are described generically. Drawings are partial excerpts with identifiers removed; the 3D model and simulator are illustrative, not a customer’s line.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'planta', hidden: true, track: 'Founder · 3D simulation', short: 'PLANTA',
    title: 'PLANTA — plant engineering, learned on the floor',
    desc: 'A 3D plant-engineering simulator I am building as founder of Tecnelio: run the machines, chase a fault upstream, build your own line.',
    lead: 'A 3D plant-engineering simulator I’m building as founder of Tecnelio. You run the machines, chase a fault three units upstream, and build your own line — the physics are real.',
    meta: [['Role', 'Founder, Tecnelio'], ['Product', 'Planta — 3D plant simulator'], ['For', 'Technical schools, universities, plant training teams'], ['Regions', 'US · Canada · Mexico · Argentina'], ['Status', 'Early access']],
    hero: `<div class="frame">${video('trailer.mp4', 'trailer.jpg', 'Planta trailer', false).replace('<figure>', '').replace(/<figcaption>.*<\/figcaption><\/figure>/, '')}</div>`,
    heroCap: 'Planta trailer. Every plant, company and character in the game is fictional.',
    tldr: [
      'School teaches the formula; a plant asks why. New engineers meet faults whose cause sits three units upstream — and nobody trains that.',
      'Founded Tecnelio and am building Planta: living 3D plants, a connected control-room shift, a build-your-own-line mode and faults that teachers plant for students to find.',
      'In early access for schools, plants and engineers, with each country’s codes and units — SI and imperial side by side.',
    ],
    sections: [
      ['why', 'Why I built it', `<div class="role-box"><p>“On the job I kept running into the gaps school left: why the burner locks out, what the drive fault really means, why the parts come out of the oven tacky. Planta is what I wish I’d had in my first year.”</p></div>`],
      ['modes', 'Four ways to play', `<div class="gallery">
        ${video('p-live.mp4', 'p-live.jpg', '01 · Live — plants that are alive: trucks arrive, steam rises, night falls, it rains.')}
        ${video('p-shift.mp4', 'p-shift.jpg', '02 · Shift — the whole plant connected: a problem upstream shows up downstream.')}
        ${video('p-build.mp4', 'p-build.jpg', '03 · Build — pick equipment, connect it, start it up. Undersize one unit and the line tells you.')}
        </div><p><b>04 · Class.</b> A teacher hides a fault in a machine and hands out a code; students find it with no hints, and the teacher gets a report of every step.</p>`],
      ['plants', 'The plants', `<div class="gallery">
        ${video('flyover-ingenio.webm', 'flyover-ingenio.jpg', 'Sugar mill in full harvest')}
        ${video('flyover-automotriz.webm', 'flyover-automotriz.jpg', 'Car assembly plant')}
        ${video('sim-boiler.webm', 'sim-boiler.jpg', 'Boiler simulator')}
        ${video('sim-foundry.webm', 'sim-foundry.jpg', 'Foundry simulator')}
        ${video('sim-packline.webm', 'sim-packline.jpg', 'Packing line simulator')}
        </div><p>Sugar, citrus, heavy manufacturing, automotive and industrial finishing — the industries I’ve worked around, rebuilt as fictional plants.</p>`],
      ['design', 'Learning design', `<ul><li><b>Learn by doing, then by explaining.</b> Every mistake comes with the reason behind it.</li><li><b>Move on only when you’ve got it.</b> What you missed comes back until it sticks.</li><li><b>Safety is never optional.</b> Bypass an interlock and the shift is over.</li><li><b>Your country, your codes, your units.</b> United States, Canada, Mexico and Argentina; SI and imperial side by side.</li></ul>`],
      ['role', 'My role', `<div class="role-box"><p><b>Founder.</b> Product, the engineering behind each plant and its faults, and the learning design. Planta is a Tecnelio product.</p></div>`],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'lean-2k-assembly', track: 'Manufacturing · Lean', short: 'Lean redesign',
    title: 'Lean redesign proposal for a paint-mixing system assembly',
    desc: 'Time study, value stream map, muda costing and 5-Whys on a two-component mixing system assembly: a cell + kanban + SOP proposal worth an estimated $16.5K/year.',
    lead: 'Time study, value stream map and 5-Whys on the assembly of a two-component paint mixing & dosing system. Only 15.5 of 666 lead-time hours added value — so we proposed fixing the flow.',
    meta: [['Role', 'Team member · team of 5'], ['Where', 'Bradley University · with Dove Equipment'], ['When', 'Spring 2025 (final deck May 5, 2025)'], ['Methods', 'Time study · VSM · muda costing · 5 Whys · 5S · kanban · poka-yoke'], ['Status', 'Proposal (not implemented)']],
    hero: lab('lean', 'Flow simulation'),
    heroCap: 'The same eight assembly steps run as push (today) and as pull (the proposal). Rates are illustrative.',
    tldr: [
      'Assembling one mixing system took 15.5 h of work but 666.65 h of lead time. Operators walked for tools, waited for parts, picked the wrong fittings and redid work when customers changed specs.',
      'Mapped the current value stream, costed five wastes, ran 5-Whys on each, and proposed an assembly cell with 5S, a kanban + poka-yoke loop and a standard procedure, phased over 6 weeks.',
      'Estimated $16,513/year in savings for a $12,390 investment: a 9-month payback. The plan stayed a proposal.',
    ],
    sections: [
      ['role', 'My role', `<div class="role-box"><p><b>One of five Bradley M.S. students</b>, working with the company’s service, operations and sales managers. My part: mapping the assembly workflow and its waste, redesigning the layout and the dedicated work-cell proposal. The analysis and the deck were a team effort.</p></div>`],
      ['vsm', 'Current state', lab('lean', 'Value stream')],
      ['muda', 'Five wastes, costed', lab('lean', 'Muda & payback')],
      ['whys', 'Root causes', lab('lean', '5 Whys')],
      ['decisions', 'Key decisions', decisions([
        ['Fix flow, not capacity', 'At 15 units a year takt is 133 h per unit against 15.5 h of processing. The line wasn’t short of capacity; work was waiting.'],
        ['Mistake-proof the spec gate', 'Over-processing came from customers changing specs after parts were ordered. A kanban + checklist forces a customer check-in before purchasing.'],
        ['Conservative savings', 'Savings assume 75% fewer defects and 80% less motion — not perfection.'],
        ['Phase it', 'A 6-week plan: build the cell, then kanban and poka-yoke, then the SOP and training.'],
      ])],
      ['results', 'Estimated results', `${results([['$16,513', 'estimated savings per year'], ['$12,390', 'investment'], ['9 months', 'payback'], ['$70,175', 'cumulative after 5 years']])}<p>These are the team’s estimates in the final deck (labour at $25/h plus overhead, 15 units a year). The proposal was not implemented.</p>`],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'wire-edm-research', track: 'Research · ML', short: 'Wire-EDM research',
    title: 'Predicting surface roughness in wire EDM, while cutting',
    desc: 'Peer-reviewed research (Springer, 2026): a neural network that predicts wire-EDM surface roughness online from 12 machine-controller features.',
    lead: 'Surface roughness is usually checked after the part is cut. We predicted it during the cut, from the machine controller’s own signals — published in Neural Computing and Applications (Springer, 2026).',
    meta: [['Role', 'Co-author · M.S. research'], ['Authors', 'Chen, Gomez Montero &amp; Yu'], ['Published', '2026 · Neural Comput. &amp; Applic. 38, 87'], ['Methods', 'Full-factorial DOE · ANN (ReLU) · Python'], ['Result', '~95.8% average accuracy']],
    hero: lab('research', 'Neural network'),
    heroCap: 'A network shaped like the paper’s, trained live in your browser on synthetic data.',
    tldr: [
      'Models built on fixed machine settings assume a steady process. Real wire-EDM cuts drift, so parts still get measured after machining.',
      'Turned the controller’s voltage, current and feed-rate readings into 12 online features and trained a neural network on a designed experiment of 81 cuts.',
      '~95.8% average prediction accuracy (published). On the test set the network never accepted an out-of-spec part (0 Type I errors).',
    ],
    sections: [
      ['design', 'Study design', `<ul><li><b>Machine &amp; material:</b> Sodick VZ-300L, 0.25 mm brass wire, 2507 duplex steel; roughness measured on a Mitutoyo SJ-301.</li><li><b>Experiment:</b> 3³ full factorial — wire tension, supply voltage and feed rate at three levels each, three replicates: 81 cuts, split 64 for training and 17 for testing.</li><li><b>Inputs:</b> 12 online features from the controller — maximum, minimum, difference and average of voltage, current and feed rate.</li><li><b>Model:</b> 12 inputs → 4 hidden layers × 8 neurons (ReLU) → 1 output; learning rate 0.001, 20,000 epochs, MSE loss.</li><li><b>Decision rule:</b> accept the part if predicted Ra ≤ 80 µin.</li></ul>${lab('research', 'Experiment design')}`],
      ['role', 'My role', '<div class="role-box"><p><b>Co-author</b>, as part of my M.S. research at Bradley University with Dr. Joseph Chen.</p></div>'],
      ['results', 'Results', `${results([['~95.8%', 'average prediction accuracy'], ['0', 'Type I errors on the test set'], ['81', 'designed cuts'], ['12', 'online controller features']])}
        <p class="case-links"><a href="https://doi.org/10.1007/s00521-025-11745-x" target="_blank" rel="noopener">Read the paper · doi.org/10.1007/s00521-025-11745-x ↗</a></p>`],
      ['next', 'Follow-up work', '<p>A second study, now under review at the <i>International Journal on Interactive Design and Manufacturing</i>, applies the same idea to CNC milling: Python ML models that estimate surface roughness and perpendicularity from machine vibration.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'restaurant-system', track: 'Software', short: 'Restaurant system',
    title: 'Restaurant accounting &amp; analytics app',
    desc: 'A Windows desktop app that unifies POS PDFs, three delivery portals and paper receipts into payroll, reconciliation and menu margins. In daily use since Oct 2026.',
    lead: 'A Windows desktop app that turns a restaurant’s scattered sales data — POS ticket PDFs, three delivery portals and paper receipts — into payroll, cash reconciliation, monthly close and menu margins.',
    meta: [['Role', 'Designer &amp; developer'], ['Team', 'Me, building with AI coding agents'], ['When', 'Aug 2026 – present'], ['Stack', 'Electron · React · TypeScript · SQLite · OCR'], ['Status', 'In daily use since Oct 2026']],
    hero: lab('restaurant', 'Unify sales'),
    heroCap: 'Import five sample sources into one ledger. Invented menu and orders; the restaurant’s data is private.',
    tldr: [
      'Sales lived in POS ticket PDFs, DoorDash, UberEats and GrubHub exports and paper receipts, so monthly close and menu costing were slow and manual.',
      'Built a desktop app that imports every source into one ledger, OCRs receipts, and runs payroll, cash reconciliation, monthly close and menu analytics, with Excel/PDF reports.',
      'In daily use by the restaurant since October 2026, with auto-updating releases and cloud sync.',
    ],
    sections: [
      ['approach', 'How it works', steps(['<b>Import.</b> POS ticket PDFs and DoorDash / UberEats / GrubHub CSVs are parsed; paper receipts are read with OCR.', '<b>Normalise.</b> Every source becomes the same transaction format in a local SQLite database with cloud sync.', '<b>Operate.</b> Payroll, cash reconciliation and monthly close run on that single ledger.', '<b>Analyse.</b> Cost per dish, margin by item and trends; Excel and PDF reports for the owner and the accountant.'])],
      ['menu', 'Menu margins', lab('restaurant', 'Menu margins')],
      ['decisions', 'Key decisions', decisions([['One format for every source', 'Five very different inputs are converted once, so every report reads the same ledger.'], ['Local-first, synced', 'SQLite on the restaurant’s PC keeps it fast and offline-safe; cloud sync keeps a copy.'], ['Ship updates automatically', 'Auto-updating releases mean fixes reach the restaurant without a visit.']])],
      ['confidential', 'Confidentiality', '<p class="conf">The restaurant’s data is private and the repository stays private. The demos use an invented menu and invented orders.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'operations-logistics', track: 'Industrial engineering', short: 'Operations &amp; logistics',
    title: 'Operations &amp; logistics: time studies to digital workflows',
    desc: 'Warehouse time studies and workforce optimization (+15% operational efficiency) and a WMS/TMS digital transformation final project (+15% perfect deliveries).',
    lead: 'Before plants and software: timing every warehouse process to size the crew, and leading a digital transformation of order-to-delivery workflows.',
    meta: [['Role', 'Logistics Analyst · IE final project lead'], ['Where', 'Tucumán, Argentina'], ['When', '2023'], ['Methods', 'Time studies · staffing models · KPIs · WMS/TMS'], ['Status', 'Completed']],
    hero: `<div class="lab-inline"><div class="il-head"><span class="label">Interactive · <span class="il-data">sample data</span></span></div><p class="il-hint">What you’re looking at: how a time study turns into a crew size. Try this: change the volumes and standard times.</p><div class="il-body" id="staffing"></div></div>`,
    heroCap: 'A generic staffing model in the style I used: volume × standard time = hours needed, per process.',
    tldr: [
      'A distribution warehouse sized its crew by feel, and order-to-delivery workflows ran on paper and phone calls.',
      'Timed each warehouse process to build staffing models by weekday plus a KPI dashboard; separately, led a WMS/TMS digital transformation as my Industrial Engineering final project.',
      '+15% operational efficiency and +10% sales productivity per worker at the distributor; +15% perfect deliveries in the final project.',
    ],
    sections: [
      ['warehouse', 'Warehouse time studies', `<div class="role-box"><p><b>Logistics Analyst, ABC Distributions (Apr – Dec 2023).</b> Raised operational efficiency 15% through time studies and workforce optimization; digital tools lifted sales productivity 10% per worker.</p></div>
        <p>How: each process — receiving, putaway, replenishment, picking, order breakdown, returns — was broken into timed steps, turned into standard times, and multiplied by expected volumes to get the hours needed per weekday. A warehouse KPI dashboard tracked inventory accuracy, turnover and space use.</p>`],
      ['final', 'Industry 4.0 final project', '<div class="role-box"><p><b>Industrial Engineering, National University of Tucumán (2023).</b> Led a WMS/TMS digital transformation of order-to-delivery logistics workflows, raising perfect deliveries by 15%.</p></div>'],
      ['results', 'Results', results([['+15%', 'operational efficiency (warehouse)'], ['+10%', 'sales productivity per worker'], ['+15%', 'perfect deliveries (final project)'], ['2023', 'both completed']])],
    ],
    script: `<script>
(() => {
  const P = [['Receiving', 18, 6], ['Putaway', 18, 4], ['Replenishment', 40, 2.5], ['Picking', 650, 0.9], ['Order breakdown', 120, 1.5], ['Returns', 25, 3]];
  const box = document.getElementById('staffing'); if (!box) return;
  box.innerHTML = '<div class="dish head"><span>Process</span><span>Units/day</span><span>Min/unit</span><span>Hours needed</span></div>' + P.map((p, i) => '<div class="dish"><span>' + p[0] + '</span><input type="number" min="0" value="' + p[1] + '" data-v="' + i + '" aria-label="Units per day for ' + p[0] + '"><input type="number" min="0" step="0.1" value="' + p[2] + '" data-t="' + i + '" aria-label="Minutes per unit for ' + p[0] + '"><div class="mbar"><span class="tr"><i></i></span><span></span></div></div>').join('') + '<div class="readout" style="margin-top:14px"><div><b data-h>—</b><span>hours needed per day</span></div><div><b data-c>—</b><span>people on a 7.5 h shift at 85% utilisation</span></div></div>';
  const calc = () => { let tot = 0; const hs = P.map((p, i) => { const v = +box.querySelector('[data-v="' + i + '"]').value || 0, t = +box.querySelector('[data-t="' + i + '"]').value || 0; const h = v * t / 60; tot += h; return h; }); const mx = Math.max(1, ...hs); box.querySelectorAll('.mbar').forEach((m, i) => { m.querySelector('i').style.width = (hs[i] / mx * 100) + '%'; m.lastChild.textContent = hs[i].toFixed(1) + ' h'; }); box.querySelector('[data-h]').textContent = tot.toFixed(1); box.querySelector('[data-c]').textContent = Math.ceil(tot / (7.5 * 0.85)); };
  box.addEventListener('input', calc); calc();
})();
</script>`,
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'beyond-work', track: 'Initiative · speaking', short: 'Beyond work',
    title: 'Beyond work: on stage and pitching ideas',
    desc: 'Graduate commencement speaker at Bradley University (2025) and three Latin American Innovation Rally pitches (2020, 2021, 2026), including a 1st place at provincial level.',
    lead: 'Alongside engineering, I keep volunteering for the part of a project many engineers avoid: standing up and explaining it. Graduate commencement speaker at Bradley University, and three Latin American Innovation Rally pitches with my teams.',
    meta: [['Role', 'Commencement speaker · rally team member'], ['Where', 'Bradley University (Peoria, IL) · Tucumán, Argentina'], ['When', '2020 – 2026'], ['Languages', 'English (speech) · Spanish (rallies)'], ['Status', 'Side activities, alongside my main job']],
    hero: yt('m2OsEzYm8Uo', 'Graduate commencement speech — Bradley University, Spring 2025', ' data-start="1376" data-end="1824"'),
    heroCap: 'Bradley University, Spring 2025 Master’s &amp; Doctoral Commencement · in English · plays the speech only (22:56 – 30:24, about 7 minutes).',
    tldrHeads: ['Why it’s here', 'What I did', 'Result'],
    tldr: [
      'Engineering work gets approved when someone can explain it clearly. These are the times I chose to do that in front of an audience, outside my job.',
      'Gave the graduate commencement speech at Bradley University, and pitched three ideas with my teams in the Latin American Innovation Rally: a wheelchair motor kit, a domestic-violence alert concept and a smart cane.',
      'Spoke for the Spring 2025 master’s and doctoral graduates; 1st place at provincial level in the 2021 rally; participated in 2020 and 2026.',
    ],
    sections: [
      ['speech', 'Commencement speech', `<div class="role-box"><p><b>Graduate Commencement Speaker, Bradley University · May 2025.</b> I spoke at the Spring 2025 Master’s &amp; Doctoral Commencement, graduating with an M.S. in Manufacturing Engineering (GPA 4.0) and the Marjorie Reynolds Award for academic excellence.</p></div>
        <p><b>What it was about:</b> from Tucumán to Bradley — looking back to understand the path and forward to keep going; gratitude to the people and the community behind us; what I learned by teaching as a TA (“when you’re teaching, you end up learning even more from your students”); and a call to my fellow graduates: <b>don’t be afraid to try.</b></p><p>The video at the top of this page plays only my speech (about 7 minutes, in English).</p>`],
      ['rally', 'The innovation rallies', `<p>The Latin American Innovation Rally is a competition where teams pitch a solution to a challenge in a short video, about two minutes long. I took part three times, with teams from Tucumán, Argentina. All three videos are in Spanish; the stills below are taken from them.</p>
        <p class="conf">These were competition entries, not companies. None of them is a venture I’m running.</p>`],
      ['empujon', '2026 · EMPUJÓN', rally({
        facts: [['Team', 'Norte Disruptivo'], ['Result', 'Participation'], ['Video', 'in Spanish · ~2 min']],
        body: `<p><b>The idea:</b> a kit that motorises the wheelchair a person already has, using motors recovered from discarded appliances — the pitch shows drills, treadmills, washing machines and hoverboards. It has three parts: an <b>EMP-1 port</b> fixed to the chair without welding or drilling, a <b>motor module</b> built around the recovered motor, and a <b>battery and control</b> unit made from recovered cells, with a BMS and sensors. Modules click into the port in seconds, without tools.</p>
          <p>The pitch also covers a chain from donor to user (collection, a workshop that triages modules, a “bank” of modules) and a companion app.</p>
          <div class="results">${[['−78%', 'cost vs the cheapest new motorised chair'], ['1 port', 'for drills, treadmills, washers and hoverboards'], ['4', 'neural networks that check, map and anticipate failures'], ['3 parts', 'port, motor module, battery &amp; control']].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>
          <p class="note-small">Figures as stated in the pitch. They are the team’s pitch numbers, not measured results.</p>`,
        video: yt('SDo8r4xjVNw', 'Latin American Innovation Rally 2026 — Norte Disruptivo — EMPUJÓN'),
        media: `${loopB('empujon-loop.mp4', 'empujon-loop-poster.webp', 'The motor module slides onto the EMP-1 port and locks. CAD animation from the pitch.')}
          ${still('empujon-chain.webp', 'Pitch slide: chain from donor to collection, workshop, module bank and user, with the pitch figures', '“From the trash to the street”: the chain and the pitch figures.')}`,
      })],
      ['stopit', '2021 · STOP IT', rally({
        facts: [['Team', 'Innovación Picante'], ['Result', '<b class="red">1st place, provincial level</b>'], ['Video', 'in Spanish · ~2 min']],
        body: `<p><b>The idea:</b> a technology-based solution to address domestic violence. A tiny sensor detects the body’s stress response (an adrenaline spike) and the STOP IT device alerts an emergency operator. Our team from Tucumán won <b>1st place at the provincial level</b>.</p>`,
        video: yt('h0UK8pPf_hI', 'Latin American Innovation Rally 2021 — Innovación Picante — STOP IT'),
        media: `${still('stopit-logo.webp', 'STOP IT logo: a red hand with a figure inside', 'The STOP IT identity.')}
          ${still('stopit-sketch.webp', 'Whiteboard sketch: a tiny sensor next to a needle tip, a family and an adrenaline spike', 'Whiteboard explainer from the pitch.')}`,
      })],
      ['guideup', '2020 · GuideUp', rally({
        facts: [['Team', 'Innovación Picante'], ['Result', 'Participation'], ['Video', 'in Spanish · ~2 min']],
        body: `<p><b>The idea:</b> GuideUp, a smart white cane for people who are blind or have low vision, paired with a phone app that uses GPS and Bluetooth.</p>`,
        video: yt('guIcYbjlHuE', 'Latin American Innovation Rally 2020 — Innovación Picante — GuideUp'),
        media: `${still('guideup-logo.webp', 'GuideUp logo with a figure walking with a white cane', 'The GuideUp identity.')}
          ${still('guideup-cane.webp', 'Drawings of the GuideUp cane and its handle', 'Concept drawings of the cane and its handle.')}`,
      })],
      ['why', 'What this says about how I work', `<ul><li><b>I explain technical ideas to people who aren’t engineers</b>, in English and in Spanish, in a few minutes.</li><li><b>I pick up problems nobody assigned me</b> and work them through with a team, from the idea to something people can see.</li><li><b>Engineering stays the day job.</b> My main work is in <a href="industrial-projects.html">industrial projects</a> and the <a href="projecttracker.html">software I build for them</a>.</li></ul>`],
    ],
  },
];

// PLANTA is kept out of the public site for now (positioning decision, 2026-11-13).
const P = ALL.filter((p) => !p.hidden);
const nav = `<nav class="top" aria-label="Main"><div class="wrap">
  <a class="brand" href="../index.html"><i></i>Maxi Gomez Montero</a>
  <div class="navlinks"><a href="../index.html#work">All work</a><a href="../index.html#research">Research</a><a href="../index.html#experience">Experience</a><a href="../index.html#contact">Contact</a></div>
  <div class="cvs"><a class="chip-btn" href="../Maxi_Gomez_Montero_Resume_Manufacturing.pdf" target="_blank" rel="noopener">CV<span class="long">&nbsp;· Manufacturing</span><span class="short">&nbsp;Mfg</span><span class="sr-only"> résumé (PDF)</span> ↓</a><a class="chip-btn" href="../Maxi_Gomez_Montero_Resume_AI_Engineer.pdf" target="_blank" rel="noopener">CV<span class="long">&nbsp;· Applied AI</span><span class="short">&nbsp;AI</span><span class="sr-only"> résumé (PDF)</span> ↓</a></div>
</div></nav>`;

P.forEach((p, i) => {
  const prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
  const toc = p.sections.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('');
  const html = `<!DOCTYPE html>
<html lang="en" data-base="../">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title.replace(/&amp;/g, '&')} — Maxi Gomez Montero</title>
<meta name="description" content="${p.desc}">
<meta property="og:title" content="${p.title.replace(/&amp;/g, '&')} — Maxi Gomez Montero">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}projects/${p.slug}.html">
<meta property="og:image" content="${SITE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Manufacturing engineer. AI builder. Same person. — Maxi Gomez Montero, Toronto/GTA">
<meta property="og:site_name" content="Maxi Gomez Montero">
<link rel="canonical" href="${SITE}projects/${p.slug}.html">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0b">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%23ff2b1c'/></svg>">
<link rel="preload" href="../assets/fonts/inter-tight-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../assets/style.css?v=${V}">
</head>
<body class="case">
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
${nav}
<main id="main">
<header class="case-hero wrap">
  <a class="back" href="../index.html#work">← All work</a>
  <span class="label red">Case study · ${p.track}</span>
  <h1>${p.title}</h1>
  <p class="case-lead">${p.lead}</p>
  <dl class="meta">${p.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
</header>
<figure class="case-media wrap">${p.hero}<figcaption>${p.heroCap}</figcaption></figure>
<section class="tldr wrap" aria-label="Summary">
  ${(p.tldrHeads || ['Problem', 'What I did', 'Result']).map((h, k) => `<div><h2>${h}</h2><p>${p.tldr[k]}</p></div>`).join('\n  ')}
</section>
<div class="case-grid wrap">
  <nav class="toc" aria-label="On this page">${toc}</nav>
  <div class="case-body">
${p.sections.map(([id, t, body], j) => `    <section id="${id}"><h2><span class="num">${String(j + 1).padStart(2, '0')}</span>${t}</h2>${body}</section>`).join('\n')}
  </div>
</div>
<nav class="case-next wrap" aria-label="More projects">
  <a href="${prev.slug}.html"><span class="label">← Previous</span><b>${prev.short}</b></a>
  <a class="nx" href="${next.slug}.html"><span class="label">Next →</span><b>${next.short}</b></a>
</nav>
</main>
<footer class="case-foot wrap">
  <p>Maxi Gomez Montero · Manufacturing engineer &amp; AI builder · Toronto/GTA · Canadian PR · available January 2027</p>
  <div class="contact-links"><a href="mailto:maxigmontero@gmail.com">Email →</a><a href="https://www.linkedin.com/in/maxgomezmontero" target="_blank" rel="noopener">LinkedIn ↗</a></div>
</footer>
<script src="../assets/labs.js?v=${V}" defer></script>
<script src="../assets/labs-plus.js?v=${V}" defer></script>
<script src="../assets/case.js?v=${V}" defer></script>
${p.script || ''}
</body>
</html>
`;
  writeFileSync(join(OUT, `${p.slug}.html`), html);
  console.log('wrote', p.slug);
});
// project list as data (not named index.json: GitHub Pages would serve it as /projects/)
writeFileSync(join(OUT, 'projects.json'), JSON.stringify(P.map(({ slug, title, track, desc }) => ({ slug, title, track, desc })), null, 2));
// /projects/ itself: send visitors to the work section of the home page
writeFileSync(join(OUT, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Projects — Maxi Gomez Montero</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${SITE}#work">
<meta http-equiv="refresh" content="0; url=../index.html#work">
</head>
<body><p><a href="../index.html#work">See all projects →</a></p></body>
</html>
`);
// sitemap: home + every public case page (hidden pages such as PLANTA are never listed)
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, ...P.map((p) => `${SITE}projects/${p.slug}.html`)].map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('wrote projects.json, projects/index.html, sitemap.xml');
