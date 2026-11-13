// Generates the static case-study pages in /projects from the data below.
// Run:  node tools/build-projects.mjs      (output is plain HTML; the site itself has no build step)
import { writeFileSync, mkdirSync } from 'node:fs';
import { NOTES } from './notes-data.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'projects');
const SITE = 'https://maxgomezmontero.github.io/';
const V = '20261113f';   // asset version: bump (also in index.html and 404.html) when CSS/JS change, so caches refresh
mkdirSync(OUT, { recursive: true });

const lab = (key, tabs) => `<div class="lab-inline" data-lab-inline="${key}"${tabs ? ` data-tabs="${tabs}"` : ''}><p class="il-hint">Loading the interactive demo…</p></div>`;
const steps = (arr) => `<ol class="steps">${arr.map((s) => `<li>${s}</li>`).join('')}</ol>`;
const decisions = (arr) => `<div class="decisions">${arr.map(([t, p]) => `<div><span class="why">Decision</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div>`;
const results = (arr) => `<div class="results">${arr.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>`;
const video = (src, poster, cap, loop = true) => `<figure>${loop
  ? `<video muted loop playsinline preload="none" data-loop data-src="../img/planta/${src}" poster="../img/planta/${poster}" aria-label="${cap}"></video>`
  : `<video controls playsinline preload="none" src="../img/planta/${src}" poster="../img/planta/${poster}" aria-label="${cap}"></video>`}<figcaption>${cap}</figcaption></figure>`;

// "Beyond work" helpers: lite YouTube embeds (thumbnail first, see case.js), stills and muted loops from img/beyond/
const vp2 = (name, cap) => `<figure><video muted loop playsinline preload="none" data-loop data-src="../img/planta-v2/${name}.mp4" poster="../img/planta-v2/${name}-poster.webp" aria-label="${cap}"></video><figcaption>${cap}</figcaption></figure>`;
const yt = (id, title, extra = '') => `<div class="yt" data-yt="${id}" data-title="${title}"${extra}></div>`;
const still = (src, alt, cap) => `<figure><img src="../img/beyond/${src}" alt="${alt}" loading="lazy" width="960" height="540"><figcaption>${cap}</figcaption></figure>`;
const loopB = (src, poster, cap) => `<figure><video muted loop playsinline preload="none" data-loop data-src="../img/beyond/${src}" poster="../img/beyond/${poster}" aria-label="${cap}"></video><figcaption>${cap}</figcaption></figure>`;
const rally = ({ facts, body, video, media }) => `<dl class="rally-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${body}
  <div class="rally-media"><div class="rally-video">${video}<p class="label">Full pitch on YouTube · in Spanish</p></div><div class="rally-stills">${media}</div></div>`;

// ProjectTracker tour: screenshots and muted loops from img/tracker/ (the app running on fictional sample data)
const T = '../img/tracker/';
const tourShot = (src, alt) => `<a class="shot" href="${T}${src}.webp" target="_blank" rel="noopener" aria-label="${alt} (full size)"><img src="${T}${src}.webp" alt="${alt}" loading="lazy" decoding="async" width="1600" height="1000"></a>`;
const tourLoop = (src, alt) => `<div class="shot"><video muted loop playsinline preload="none" data-loop data-src="${T}${src}.mp4" poster="${T}${src}-poster.webp" aria-label="${alt}" width="1280" height="800"></video><span class="rec">Loop</span></div>`;
const tour = (arr) => `<div class="tour">${arr.map(([name, media, what, why]) => `<figure>${media}<figcaption><b>${name}</b><span class="what">${what}</span><span class="why"><i>Why it helps</i>${why}</span></figcaption></figure>`).join('')}</div>`;

const ALL = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'projecttracker', track: 'Applied AI · project engineering', short: 'ProjectTracker',
    title: 'ProjectTracker',
    desc: 'The visual command center I run my projects from every day: project board, Today digest, a timeline per problem, 180-day schedule and flow maps, with rules-first email and ERP automation built in.',
    lead: 'The visual command center I run my projects from every day. A board for every job, a digest of what changed, a timeline of each problem, a 180-day schedule and a flow map of what is holding each project — with the email, milestone and drawing automation built in. I built it for my own job as a project engineer.',
    meta: [['Role', 'Sole designer &amp; developer'], ['Team', 'Me, building with AI coding agents (Claude Code)'], ['When', 'Jun 2026 – present'], ['Stack', 'Electron · JavaScript · Outlook · Acumatica ERP · SharePoint'], ['Status', 'In daily use']],
    hero: `<div class="frame light"><video muted loop playsinline preload="none" data-loop data-src="${T}loop-story.mp4" poster="${T}loop-story-poster.webp" aria-label="ProjectTracker: the project board, then one project opened on its Story timeline" width="1280" height="800"></video></div>`,
    heroCap: 'Board → open a project → its Story: one lane per problem, colour = who has the ball. Recorded in the app running on fictional sample data; the real tool and its data are private.',
    tldr: [
      'Running ~20–25 live projects meant information spread across Outlook, the ERP and SharePoint: hours each week matching ~145 emails to jobs, updating the ERP by hand and catching drawing errors late.',
      'A desktop command center — board, Today digest, Story timelines, 180-day schedule, flow maps, equipment ledger — fed by rules-first automation that files email, detects milestones and checks drawings. I approve every ERP write; the LLM only writes one-line summaries.',
      '~7.3 h saved per week (~340 h/year), 94% agreement with my past manual decisions, and real drawing errors caught before release.',
    ],
    sections: [
      ['tour', 'Tour', `<p>These are the screens I work in all day. Every screenshot and loop below is the real app running on <b>fictional sample data</b> — invented companies, people, job numbers and amounts. Click a screenshot to see it full size.</p>
        ${tour([
          ['Projects board', tourLoop('loop-board', 'Dragging a project card from Quoted to In Progress on the board'), 'Every job as a card in its stage column, with its current phase and next step, value, days since the last news and my next action. Drag a card to change its stage; the strip on top flags updates that are late.', 'I see all my jobs at once, and the ones going quiet stand out before a customer has to ask.'],
          ['Today', tourShot('today', 'Today view: since-you-left digest, my actions, waiting on others and stalled projects'), 'A “since you left” digest of new mail, due dates and logged updates, then my actions, what I am waiting on (customer, vendor or teammate, and for how many days) and projects with no news in 14 days.', 'My morning starts from what changed and who owes what, not from a full inbox.'],
          ['Project window', tourShot('project', 'Project window with phase stepper, next step box, activity log and scope and pricing'), 'One job on one screen: the phase stepper from lead to aftermarket, the next step with who it waits on, the activity log of notes, actions and waiting-on items (each linked to its source), and scope &amp; pricing.', 'Everything about a job is in one place, and every line says where it came from.'],
          ['Story timeline', tourShot('story', 'Story timeline: one swimlane per problem, coloured by who has the ball, with a today line'), 'One lane per problem, from its first mail to its last, coloured by who has the ball — me, the team, the customer or a vendor — with a dot per mail and a today line.', 'In a status meeting I can show how long a problem has been open and who it is waiting on.'],
          ['Inbox', tourLoop('loop-inbox', 'Triaging the inbox with the keyboard: J to move, A to approve, X to discard'), 'Mail already matched to its project. Problems come as issue cards (cause, who it waits on, next step, consequences such as a return visit); everything else is one proposed line per message. J/K to move, A to approve, X to discard.', 'Triage takes minutes, and nothing reaches the project record or the ERP without my approval.'],
          ['Schedule', tourShot('schedule', 'Schedule: 180 days week by week with ship, install, start-up and training bars and install clash alerts'), 'The next 180 days, week by week: shipments, installs, start-ups, training and site visits, read from the Gantt, mail notices and my notes. Two installs in the same week raise a clash alert.', 'A clash between two installs shows up weeks ahead, while it can still be moved.'],
          ['Project flow', tourShot('flow', 'Project flow list: each project’s phases as dots, its next step and what is holding it'), 'Every project’s phases as a row of dots, the next step and its owner, and what is holding it, with the initials of who it waits on.', 'One glance tells me which job is blocked and by whom.'],
          ['Flow map', tourLoop('loop-flow', 'Opening one project’s flow map and moving between its phases with the arrow keys'), 'One project as a map: phases as columns, each step with its owner, site work in parallel, and the open items hanging off the step they hold. Arrow keys fly between phases.', 'A long email history becomes a map I can walk my manager or a new teammate through.'],
          ['Equipment ledger', tourShot('equipment', 'Equipment ledger: searching a crossdraft booth by working size, with similar equipment from past projects'), 'Every equipment record from past projects, searchable by type and working size (“crossdraft 40x14x12”), with the full spec sheet and similar equipment from other jobs. The real one holds 1,697 items from 620 projects.', '“Have we built this before?” takes seconds, so a quote starts from real past jobs.'],
          ['Insights', tourShot('insights', 'Insights: open pipeline, win rate, projects by stage and top customers'), 'Open pipeline, win rate, open actions, projects by stage and top customers, across every project on the board.', 'I know what I am carrying and where it sits, without building a spreadsheet.'],
          ['Control center', tourShot('control-center', 'Control center slide listing projects in progress with their phase dots and open items'), 'Slides for a screen left open during the day: projects in progress, the next 45 days, new mail, what needs attention, pipeline and who holds the open items.', 'The week stays visible without opening anything.'],
          ['System overview', tourShot('system-overview', 'System overview: the program drawn as a finishing line, with data sources feeding stations'), 'The program drawn as a finishing line, for presenting: mail, ERP, project folders and the archive feed stations such as “sort the mail”, “find the step”, “plan 180 days” and “check the layout”.', 'I explain the software the same way I explain a paint line.'],
        ])}`],
      ['context', 'Context', `<p>As a project engineer I lead the engineering on <b>54 opportunities (USD 21M quoted)</b>. The information for each one is spread across Outlook threads, the Acumatica ERP and SharePoint folders full of layouts, vendor drawings and quotes. Keeping the ERP current and catching mismatches between documents was manual, slow and easy to get wrong.</p>
        <p>Constraints I designed around: mail and ERP are read-only unless I approve a change, nothing may be written silently, and every decision the tool makes has to be explainable to me in one line.</p>`],
      ['role', 'My role', `<div class="role-box"><p><b>Everything, end to end.</b> I scoped the problem from my own workload, designed the matching rules and detectors, built the desktop app with AI coding agents, wired it to Outlook, the ERP and SharePoint, and measured it against my own past decisions.</p></div>`],
      ['approach', 'How the automation works', steps([
        '<b>Ingest.</b> Mail is exported read-only every 2 hours; the ERP is refreshed read-only once a day; project folders and drawings are read from SharePoint.',
        '<b>Match.</b> Each email is scored against every project with 9 evidence signals — project number in the subject (0.97), ERP opportunity ID (0.90), known thread (0.88) … client name in the subject (0.55) — plus 0.12 for each extra kind of evidence. Below 0.45 it is ignored.',
        '<b>Detect.</b> 13 deterministic detectors spot milestones: order accepted, submittals, ship date (read from the vendor PDF), new opportunity, site access and more.',
        '<b>Check drawings.</b> Layout PDFs are scored against 44 criteria in 7 groups and cross-checked against quotes and vendor drawings; near-misses within 2.5% are flagged too.',
        '<b>Explain.</b> An optional LLM writes a ≤160-character factual summary of the thread. It never sets IDs, statuses or decisions.',
        '<b>Approve &amp; write.</b> Proposals land in an inbox (J/K to move, A to approve, X to discard). An approved ERP note is re-read, appended, confirmed, saved, re-read to verify, and backed up.',
      ])],
      ['decisions', 'Rules decide, the LLM writes, a human approves', decisions([
        ['Rules decide; the LLM only writes', 'Matching, milestones and drawing checks are rules with weights I can read and test. The LLM is used where language matters — summaries — not where correctness matters.'],
        ['A human approves every ERP write', 'The tool proposes, I decide. Every write is re-read and verified afterwards, with a backup of what was there before.'],
        ['Measure against my own history', 'Accuracy is reported as agreement with decisions I had already made by hand (94%), not as a self-reported model score.'],
        ['Index the past to answer the present', '1,697 equipment items from 620 archived projects are searchable by size and type, so “have we built this before?” takes seconds.'],
      ])],
      ['results', 'Results', `${results([['~7.3 h', 'saved per week (~340 h/year)'], ['94%', 'agreement with my past manual decisions'], ['1,697', 'equipment items indexed from 620 projects'], ['44', 'drawing criteria checked automatically']])}
        <p>Errors caught before a drawing was released include an order-number typo, a <b>350 vs 500 lb hook-load</b> mismatch and a ceiling-height mismatch.</p>`],
      ['evaluation', 'How I evaluated it', `<p>I didn’t trust the tool until it had been measured against real mail and real decisions. Three checks, each answering a different question:</p>
        ${results([['63% → 95%', 'email-to-project accuracy, first version vs. current'], ['1 / 141', 'approved proposals filed to the wrong project'], ['8,771', 'emails (one year) replayed to benchmark the detectors'], ['94%', 'agreement with my past manual decisions']])}
        <ul>
          <li><b>Iterating on real history.</b> Each version of the matching rules was replayed against threads I had already filed by hand. Accuracy went from 63% in the first version to 95%.</li>
          <li><b>Benchmarking the detectors on a full year.</b> I replayed 8,771 emails through the milestone detectors and checked every hit; for example, order acknowledgements 9/9, new opportunities 12/12 and site-access requests 13/13 were caught.</li>
          <li><b>Auditing real use.</b> After it went live I audited what I had approved: 1 of 141 approved proposals had been filed to the wrong project.</li>
        </ul>
        <p>The method is written up as a note: <a href="../notes/measure-against-past-decisions.html">Measure AI against your own past decisions →</a></p>`],
      ['try', 'Try parts of it', `<p>Small interactive rebuilds of pieces of the tool, running in your browser on sample data: replay one email from inbox to ERP note, triage an inbox, move cards on a board, run the drawing check, and see how it is built.</p>${lab('tracker', 'Replay one email,Inbox triage,Board,Drawing QA,How it’s built')}`],
      ['confidential', 'Confidentiality', '<p class="conf">ProjectTracker is a tool I built and use at work. Its source code and real project data are private. The screenshots and loops come from the app running on fictional sample data — invented companies, people, emails, job numbers and amounts, with company branding removed. The interactive labs are rebuilds on sample data that mirror the real logic.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'industrial-projects', track: 'Manufacturing', short: 'Industrial projects',
    title: 'Industrial equipment projects, sketch to start-up',
    desc: 'Engineering lead on paint and powder finishing lines for EV, heavy-equipment and building-products plants: 54 opportunities, USD 21M quoted.',
    lead: 'Engineering lead on paint and powder finishing lines — booths, cure ovens, air make-up units, wash systems and conveyors — for EV, heavy-equipment and building-products plants.',
    meta: [['Role', 'Project Engineer · engineering lead'], ['Team', 'Customers, sales, installers, OEM vendors'], ['When', 'Jan 2025 – present (intern Jan–May 2025, project engineer since Jun 2025)'], ['Tools', 'AutoCAD · FactoryCAD · Creo · Acumatica ERP'], ['Status', '54 opportunities · ~6 installs managed']],
    hero: lab('engineering', '3D line'),
    heroCap: '3D model of a paint line built from the dimensions on my own layout drawings. Drag to orbit.',
    tldr: [
      'Every plant needs a finishing system sized to its parts, throughput, building and utilities — and every quote and drawing has to close scope gaps before anything is fabricated.',
      'Process selection, airflow and thermal sizing, layouts and equipment specs; coordinating vendors such as GFS, Rohner, Nordson and Clemco; reviewing drawings and submittals; on-site installs and start-ups.',
      '54 opportunities led (USD 21M quoted); 10 of 23 decided projects won (USD 4.85M); managed ~6 on-site installations and start-ups, including a multi-booth paint line for an EV manufacturer.',
    ],
    sections: [
      ['drawings', 'Drawings I produce', `<p>Ten excerpts from layout drawings I produced across five projects — paint lines, powder lines, blast systems, mix rooms and the utilities each plant has to provide. Pick a drawing; click it to open full size. Customer names, title blocks and equipment identifiers are removed.</p>${lab('engineering', 'Drawings')}`],
      ['site', 'On site: installation &amp; start-up', `<p>Drawings end on a concrete floor. I have managed about six on-site installations and start-ups: coordinating the installers and the on-site schedule, tracking progress, running the punch list and bringing burners and lines up at start-up. Below are some of those sites — booths, conveyor structures and air make-up units. Customer signage and people’s faces are blurred.</p>
        <div class="gallery photos">
          <figure><img src="../img/installs/large-equipment-booths.webp" alt="Two large-equipment paint booths with roof exhaust stacks, ready for start-up." loading="lazy" width="1050" height="1400"><figcaption>Two large-equipment paint booths with roof exhaust stacks, ready for start-up.</figcaption></figure>
          <figure><img src="../img/installs/start-up-on-site.webp" alt="Start-up day: booth, conveyor and paint equipment being commissioned." loading="lazy" width="1050" height="1400"><figcaption>Start-up day: booth, conveyor and paint equipment being commissioned.</figcaption></figure>
          <figure><img src="../img/installs/booth-and-conveyor-structure.webp" alt="Booth and the steel structure that carries the overhead conveyor, mid-install." loading="lazy" width="1050" height="1400"><figcaption>Booth and the steel structure that carries the overhead conveyor, mid-install.</figcaption></figure>
          <figure><img src="../img/installs/booth-install-in-progress.webp" alt="Booth panels up, exhaust ducting through the roof, conveyor structure next." loading="lazy" width="1050" height="1400"><figcaption>Booth panels up, exhaust ducting through the roof, conveyor structure next.</figcaption></figure>
          <figure><img src="../img/installs/air-make-up-unit.webp" alt="Air make-up unit outside the exterior wall, ducted into the booth." loading="lazy" width="1050" height="1400"><figcaption>Air make-up unit outside the exterior wall, ducted into the booth.</figcaption></figure>
          <figure><img src="../img/installs/open-face-booth.webp" alt="Open-face booth with its filter wall, installed inside an existing building." loading="lazy" width="1050" height="1400"><figcaption>Open-face booth with its filter wall, installed inside an existing building.</figcaption></figure>
          <figure><img src="../img/installs/enclosed-booth-wood-products.webp" alt="Enclosed booth for a building-products finisher, in production." loading="lazy" width="1050" height="1400"><figcaption>Enclosed booth for a building-products finisher, in production.</figcaption></figure>
        </div>`],
      ['role', 'My role', `<div class="role-box"><p><b>Engineering lead from first sketch to start-up.</b> I turn a customer’s parts, finish and volume into a process, size the equipment, draw the layout, write the specs, coordinate the OEM vendors, and manage installation and start-up on site.</p><p>I manage ~20–25 concurrent opportunities at a time.</p></div>`],
      ['approach', 'How a project runs', lab('engineering', 'Sketch to start-up')],
      ['checks', 'What I check before release', `<p>Most expensive mistakes are scope gaps between documents. Before a layout goes out I check, among other things:</p>
        <ul><li><b>Hook load</b> on the drawing vs. what the conveyor was quoted for.</li><li><b>Ceiling and truss heights</b> against stacks, ducts and the air make-up unit.</li><li><b>Electrical scope</b> — what we supply and what is “by others”.</li><li>A <b>utilities chart</b> with every connection the plant must provide: exhaust and fresh-air CFM, electrical, compressed and breathing air, gas.</li></ul>
        <p>Those checks are also what I automated in <a href="projecttracker.html">ProjectTracker</a>’s 44-criteria drawing review.</p>`],
      ['simulator', 'Throughput &amp; cure, in numbers', `<p>A generic line to play with: line speed and part spacing set throughput; conveyor length in the oven sets dwell time, which has to meet the coating’s cure schedule.</p>${lab('engineering', 'Line simulator')}`],
      ['results', 'Results', results([['54', 'opportunities led'], ['USD 21M', 'quoted'], ['10 / 23', 'decided projects won (USD 4.85M)'], ['~6', 'installations &amp; start-ups managed on site']])],
      ['confidential', 'Confidentiality', '<p class="conf">Customers are described generically. Drawings are partial excerpts with identifiers removed; the 3D model and simulator are illustrative, not a customer’s line.</p>'],
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: 'planta', track: 'Side project · 3D simulation', short: 'PLANTA (side project)',
    title: 'PLANTA — a 3D plant simulator for learning industrial engineering',
    desc: 'A side project: a walkable 3D industrial plant with 68 interactive simulators, where you learn industrial engineering by running equipment and troubleshooting faults. Built in TypeScript, React and three.js.',
    lead: 'A side project I started to understand real industry more visually: the problems I kept running into day after day on the job, rebuilt as a walkable 3D plant where you run the equipment, chase a fault upstream and learn by troubleshooting. Every plant, company and person in it is fictional.',
    meta: [['Role', 'Sole designer &amp; developer'], ['Type', 'Personal side project'], ['Stack', 'TypeScript · React · three.js'], ['Scale', '68 simulators · 93 courses'], ['Status', 'In development']],
    hero: `<div class="frame"><video controls muted playsinline preload="metadata" src="../img/planta-v2/planta-highlight.mp4" poster="../img/planta-v2/sugar-mill-flyover-poster.webp" aria-label="PLANTA highlight reel"></video></div>`,
    heroCap: '40-second highlight captured from the current build. No sound. All plants, companies and people are fictional.',
    tldrHeads: ['Why', 'What I built', 'Engineering'],
    tldr: [
      'Every day on the job I met problems school never showed me: why a burner locks out, why parts come out of the oven tacky, why the alarm in one unit starts three units upstream. I wanted to see them, not just read about them.',
      'Five walkable plants — sugar mill, citrus processing, foundry &amp; heavy manufacturing, car assembly and industrial finishing — with 68 interactive 3D simulators, 93 courses and a teacher mode that plants faults.',
      'Strict TypeScript, React and three.js; process and physics models as pure, tested functions; ~2,700 automated tests; every piece of content schema-validated; offline-first; LMS export (SCORM / cmi5).',
    ],
    sections: [
      ['inside', 'Inside the simulator', `<div class="gallery">
        ${vp2('sugar-mill-flyover', 'Sugar mill flyover: cane yard, milling, boiler house and the rest of the plant.')}
        ${vp2('control-room-night-shift', 'Night shift in the control room: live process panels of the whole mill.')}
        ${vp2('build-mode-sugar-mill', 'Build mode: lay out a plant, link the units in order and start it up with a live mass balance.')}
        ${vp2('lab-car-assembly-line', 'Car final assembly: stations, takt and the jobs-per-hour board.')}
        ${vp2('lab-sugar-milling-tandem', 'Milling tandem simulator: extraction, imbibition and mill loads.')}
        ${vp2('lab-steel-foundry-melt-shop', 'Foundry melt shop simulator.')}
        </div>`],
      ['teacher', 'Teacher mode: plant a fault', `<div class="decisions"><div><span class="why">How it works</span><h3>The teacher hides the fault</h3><p>Pick a fault from a catalogue grouped by industry — for example “imbibition left low” or “worn shredder hammers” — and hand students a code. Each student troubleshoots from the symptoms alone, and the teacher gets a step-by-step report of what they checked.</p></div><figure style="margin:0"><img src="../img/planta-v2/still-teacher-planted-fault.webp" alt="Teacher screen: choosing a fault to plant in the sugar mill" loading="lazy" width="1280" height="720" style="width:100%;border-radius:14px;border:1px solid var(--line)"></figure></div>`],
      ['built', 'How it’s built', `<ul>
          <li><b>Content is data.</b> Courses, items and plants are JSON validated by zod schemas in the test suite; adding a course or a plant never touches engine code.</li>
          <li><b>Simulation layer as pure functions.</b> 76 process and physics modules written as plain TypeScript, with their simplifications stated at the top of each file — testable without any UI.</li>
          <li><b>Tests that enforce the teaching.</b> Besides unit tests, the suite checks that no question asks for something the learner hasn’t been taught yet, that every skill is evidenced by at least two items, and that episodes mix item types.</li>
          <li><b>Offline-first.</b> Progress is saved locally with export/import and versioned save migrations; it runs fully without a network.</li>
          <li><b>Delivery.</b> Windows desktop build with Electron, a student edition without teacher tools, and SCORM 1.2 / cmi5 export for school learning platforms.</li>
          <li><b>Built with AI coding agents</b> — the same way I build my other tools — with a headless capture pipeline that records the footage on this page frame by frame.</li>
        </ul>`],
      ['scale', 'By the numbers', results([['68', 'interactive 3D simulators'], ['93', 'courses · 321 lessons'], ['4,242', 'assessment items'], ['~2,700', 'automated test cases']])],
      ['learning', 'Learning design', `<ul><li><b>Mastery gating at 80%</b> with varied retries, spaced review of what you missed, and an explanation on every wrong answer.</li><li><b>Safety is never optional:</b> bypassing an interlock or skipping lockout/tagout is a serious violation.</li><li><b>Your country, your codes, your units:</b> United States, Canada, Mexico and Argentina; SI and imperial side by side. English text with full Spanish, and a glossary of 916 terms in English, Spanish and French.</li></ul>`],
      ['context', 'Context', '<p class="conf">A personal side project, built on my own computer in my spare time. It is not affiliated with any employer. Every plant, company and person in it is fictional.</p>'],
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
  <div class="cvs"><a class="chip-btn" href="../Maxi_Gomez_Montero_Resume_Manufacturing.pdf" target="_blank" rel="noopener"><span class="short">Eng&nbsp;</span>CV<span class="long">&nbsp;· Manufacturing</span><span class="sr-only"> résumé (PDF)</span> ↓</a><a class="chip-btn" href="../Maxi_Gomez_Montero_Resume_AI_Engineer.pdf" target="_blank" rel="noopener"><span class="short">AI&nbsp;</span>CV<span class="long">&nbsp;· Applied AI</span><span class="sr-only"> résumé (PDF)</span> ↓</a></div>
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
// "How I think" notes -> /notes/<slug>.html
const NOUT = join(ROOT, 'notes');
mkdirSync(NOUT, { recursive: true });
const byslug = Object.fromEntries(P.map((p) => [p.slug, p]));
NOTES.forEach((n, i) => {
  const prev = NOTES[(i - 1 + NOTES.length) % NOTES.length], next = NOTES[(i + 1) % NOTES.length];
  const rel = (n.related || []).filter(([s]) => byslug[s]).map(([s, label]) => `<a href="../projects/${s}.html">${label} →</a>`).join('');
  const html = `<!DOCTYPE html>
<html lang="en" data-base="../">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${n.title} — Maxi Gomez Montero</title>
<meta name="description" content="${n.desc}">
<meta property="og:title" content="${n.title} — Maxi Gomez Montero">
<meta property="og:description" content="${n.desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}notes/${n.slug}.html">
<meta property="og:image" content="${SITE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Manufacturing engineer. AI builder. Same person. — Maxi Gomez Montero, Toronto/GTA">
<link rel="canonical" href="${SITE}notes/${n.slug}.html">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0b">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%23ff2b1c'/></svg>">
<link rel="preload" href="../assets/fonts/inter-tight-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../assets/style.css?v=${V}">
</head>
<body class="case note">
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
${nav}
<main id="main">
<header class="case-hero wrap">
  <a class="back" href="../index.html#think">← How I think</a>
  <span class="label red">Note · ${n.kicker}</span>
  <h1>${n.title}</h1>
  <p class="case-lead">${n.lead}</p>
</header>
<article class="note-body wrap case-body">${n.body}
  ${rel ? `<p class="case-links">${rel}</p>` : ''}
</article>
<nav class="case-next wrap" aria-label="More notes">
  <a href="${prev.slug}.html"><span class="label">← Previous note</span><b>${prev.title}</b></a>
  <a class="nx" href="${next.slug}.html"><span class="label">Next note →</span><b>${next.title}</b></a>
</nav>
</main>
<footer class="case-foot wrap">
  <p>Maxi Gomez Montero · Manufacturing engineer &amp; AI builder · Toronto/GTA · Canadian PR · available January 2027</p>
  <div class="contact-links"><a href="mailto:maxigmontero@gmail.com">Email →</a><a href="https://www.linkedin.com/in/maxgomezmontero" target="_blank" rel="noopener">LinkedIn ↗</a></div>
</footer>
<script src="../assets/case.js?v=${V}" defer></script>
</body>
</html>
`;
  writeFileSync(join(NOUT, `${n.slug}.html`), html);
  console.log('wrote note', n.slug);
});
writeFileSync(join(NOUT, 'index.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Notes — Maxi Gomez Montero</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=../index.html#think"></head><body><p><a href="../index.html#think">How I think →</a></p></body></html>
`);
// sitemap: home + every public case page (hidden pages such as PLANTA are never listed)
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, ...P.map((p) => `${SITE}projects/${p.slug}.html`), ...NOTES.map((n) => `${SITE}notes/${n.slug}.html`)].map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('wrote projects.json, projects/index.html, sitemap.xml');
