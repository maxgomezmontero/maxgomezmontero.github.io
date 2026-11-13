// "How I think" notes. Rendered to /notes/<slug>.html by tools/build-projects.mjs.
// Only facts already on the site / in the résumés. Opinions are Maxi's, drafted for his review.

export const NOTES = [
  {
    slug: 'where-ai-belongs',
    kicker: 'AI on the plant floor',
    title: 'Where AI belongs in a plant — and where it doesn’t',
    desc: 'Rules decide, the LLM writes, a human approves: how I split the work between deterministic logic, language models and people in industrial workflows.',
    lead: 'A plant runs on decisions that someone must be able to trace: which job an email belongs to, whether a drawing can be released, what goes into the ERP. That shapes where I let AI in.',
    body: `
<p>When I started automating my own project-engineering work, the temptation was obvious: give every email and every drawing to a language model and let it sort things out. I didn’t, and the reason is not that LLMs are bad. It’s that different parts of the job carry very different costs when they go wrong.</p>
<h2>Three kinds of work</h2>
<div class="decisions">
  <div><span class="why">Rules</span><h3>Decisions with a cost</h3><p>Filing an email to the wrong project, releasing a drawing with the wrong hook load, writing the wrong date into the ERP. These need logic I can read, test and explain in one line.</p></div>
  <div><span class="why">LLM</span><h3>Messy language a person will read</h3><p>Summarising a long thread into one factual line, drafting a note, pulling the gist out of a vendor email. Here an LLM is excellent, and a human reads the result anyway.</p></div>
  <div><span class="why">Human</span><h3>Writes that are hard to undo</h3><p>Anything that changes a system of record. The tool proposes; I approve. Every write is re-read and verified afterwards.</p></div>
  <div><span class="why">Measure</span><h3>Before moving the line</h3><p>A task moves from “human approves” to “automatic” only after it has been measured against decisions already made by hand.</p></div>
</div>
<h2>What that looks like in practice</h2>
<p>In <a href="../projects/projecttracker.html">ProjectTracker</a>, emails are matched to projects with 9 weighted evidence signals (a project number in the subject counts for much more than a client’s name), 13 deterministic detectors catch milestones like an accepted order or a changed ship date, and layout drawings are checked against 44 criteria. The LLM only writes a ≤160-character summary of each thread. It never sets an ID, a status or a decision. Nothing reaches the ERP without my click.</p>
<h2>My rule of thumb</h2>
<ul>
  <li><b>If the logic can be written down and a wrong answer is expensive, write the rule.</b> It’s cheaper to test, and you can explain it to a manager.</li>
  <li><b>If the input is messy language and a person will read the output, use the LLM.</b></li>
  <li><b>If the action is hard to undo, keep a human in the loop</b> — and make approving fast (one keystroke), or people will route around it.</li>
  <li><b>Let the model decide only where you have measured it</b> and its mistakes are cheap and reversible.</li>
</ul>
<p>None of this is anti-AI. It’s the same thinking any process engineer applies to a new machine on the line: put it where it’s strong, guard it where it’s weak, and measure before you trust it.</p>`,
    related: [['projecttracker', 'ProjectTracker case study']],
  },
  {
    slug: 'measure-against-past-decisions',
    kicker: 'Evaluation',
    title: 'Measure AI against your own past decisions',
    desc: 'Why I evaluate automation as agreement with decisions a team already made by hand, and how the same idea shows up in my machining research as Type I / Type II errors.',
    lead: 'A model’s accuracy score doesn’t convince a plant manager. “It agrees with what we already decided, 94% of the time, and here are the misses” does.',
    body: `
<p>Most AI demos are judged on a benchmark nobody in the plant cares about. When I built tools for my own work, I wanted a number that answered the only question that matters to the people who would rely on it: <b>would this have done what we did?</b></p>
<h2>The method</h2>
<ol class="steps">
  <li><b>Collect decisions that were already made by hand.</b> Emails that were filed, milestones that were logged, drawings that were corrected.</li>
  <li><b>Replay the inputs through the tool</b> and compare its proposal with the decision on record.</li>
  <li><b>Sort the disagreements.</b> Some are tool errors; some reveal that the original decision was inconsistent. Both are useful.</li>
  <li><b>Fix the rules, re-run, repeat.</b> Only then let a task run in shadow mode, and only after that let it act — with a human approving writes.</li>
</ol>
<p>For <a href="../projects/projecttracker.html">ProjectTracker</a> that gave me <b>94% agreement with my past manual decisions</b>, and every ERP write still goes through an approval and a read-back.</p>
<h2>Not all errors cost the same</h2>
<p>The same idea runs through my <a href="../projects/wire-edm-research.html">wire-EDM research</a>. Predicting surface roughness is not the goal; deciding whether to accept a part is. So we judged the network on its decisions: accepting a bad part (Type I) is far worse than flagging a good one for re-measurement (Type II). On the test set the network made <b>zero Type I errors</b>.</p>
<p>In email triage it’s the same: filing a message to the wrong project silently is worse than sending it to a review queue. Good automation is designed around that asymmetry, not around a single accuracy number.</p>
<h2>Why this matters for anyone deploying AI</h2>
<ul>
  <li>It uses data the organisation already has: its own history.</li>
  <li>It speaks the language of the people who carry the risk.</li>
  <li>It turns “do we trust the AI?” into a measured, staged rollout.</li>
</ul>`,
    related: [['projecttracker', 'ProjectTracker case study'], ['wire-edm-research', 'Wire-EDM research']],
  },
  {
    slug: 'time-studies-to-ai',
    kicker: 'Lean × AI',
    title: 'From time studies to AI: same method, new tool',
    desc: 'Lean taught me to measure work, find the waste and mistake-proof the process. Office work in engineering has the same seven wastes, and AI is a new way to remove them.',
    lead: 'I learned to improve processes with a stopwatch: time every step, find the waste, standardise, mistake-proof. I use AI the same way — on the paperwork side of engineering.',
    body: `
<p>In a warehouse in Argentina I timed every process to size the crew, and in a <a href="../projects/lean-2k-assembly.html">Lean project at Bradley</a> our team found that only <b>15.5 of 666 lead-time hours</b> of an assembly actually added value. The rest was walking for tools, waiting for parts, picking the wrong fitting and redoing work after a spec change.</p>
<p>Then I became a project engineer and noticed the same wastes on my desk.</p>
<h2>The seven wastes, in an engineer’s inbox</h2>
<div class="decisions">
  <div><span class="why">Motion</span><h3>Searching</h3><p>Digging through threads, folders and ERP screens to find the latest status of a job.</p></div>
  <div><span class="why">Waiting</span><h3>Missed signals</h3><p>An order acknowledgement or a ship-date change buried in a vendor PDF, noticed days later.</p></div>
  <div><span class="why">Over-processing</span><h3>Re-typing</h3><p>Copying the same facts from email into notes, from notes into the ERP.</p></div>
  <div><span class="why">Defects</span><h3>Late errors</h3><p>A drawing that says 350 lb when the quote says 500 lb, caught only after release.</p></div>
</div>
<h2>AI as poka-yoke for paperwork</h2>
<p><a href="../projects/projecttracker.html">ProjectTracker</a> is essentially a Lean project on my own job: it finds the right project for each email (motion), detects milestones the moment they arrive (waiting), proposes the ERP note so I don’t retype it (over-processing), and checks drawings against quotes before release (defects). The result was ~7.3 hours a week back — and the method was the one I learned with a stopwatch.</p>
<p>The lesson I carry from Lean into AI work: <b>don’t start from the technology. Start from the waste, measure it, and only then pick the tool.</b> Sometimes the tool is a rule. Sometimes it’s a model. Often it’s a better process.</p>`,
    related: [['lean-2k-assembly', 'Lean redesign proposal'], ['operations-logistics', 'Operations & logistics'], ['projecttracker', 'ProjectTracker']],
  },
  {
    slug: 'ai-meets-hardware',
    kicker: 'AI × the physical world',
    title: 'AI meets hardware',
    desc: 'The AI problems I care most about sit next to machines: predicting part quality from a controller’s signals, checking equipment drawings before fabrication, motorising a wheelchair with recovered motors.',
    lead: 'The AI problems I find most interesting don’t live in a browser. They sit next to a machine: a wire cutting steel, a booth about to be fabricated, a motor pulled out of a discarded appliance.',
    body: `
<p>Software-only AI is having its moment. But most of the economy still runs on physical processes — cutting, painting, curing, moving, assembling — and that’s where I’ve spent my career. Three examples of what I mean:</p>
<div class="decisions">
  <div><span class="why">Research</span><h3>Quality, predicted while cutting</h3><p>In our <a href="../projects/wire-edm-research.html">peer-reviewed study</a>, a neural network predicts wire-EDM surface roughness from 12 features of the machine controller’s own voltage, current and feed-rate signals — so a part can be judged during the cut instead of measured afterwards.</p></div>
  <div><span class="why">Work</span><h3>Equipment drawings, checked before steel is cut</h3><p>My drawing checks compare layouts against quotes and vendor drawings — hook loads, ceiling heights, electrical scope — before a booth or an oven is fabricated. A mismatch caught on paper is cheap; caught on site, it isn’t.</p></div>
  <div><span class="why">Initiative</span><h3>Recovered motors, new mobility</h3><p>In the <a href="../projects/beyond-work.html">2026 innovation rally</a> our team pitched EMPUJÓN: a kit that motorises a person’s existing wheelchair with motors recovered from discarded appliances, plus sensors and models to check, map and anticipate failures.</p></div>
  <div><span class="why">Building</span><h3>One engineer, real software</h3><p>With AI coding agents I’ve shipped two production desktop apps used every day. The barrier between “engineer with an idea” and “working tool” has never been lower.</p></div>
</div>
<h2>What it takes</h2>
<ul>
  <li><b>Knowing the process.</b> You can’t pick the right signal or the right failure mode without understanding the physics and the plant.</li>
  <li><b>Designing for asymmetric costs.</b> In hardware, the wrong “accept” can hurt someone or scrap a batch.</li>
  <li><b>Keeping people in the loop</b> where safety and expensive mistakes live.</li>
  <li><b>Measuring against reality</b> — the part on the profilometer, the decision on record — not just a validation score.</li>
</ul>
<p>That intersection — process knowledge, software I can ship myself, and AI used where it is strong — is where I want to work.</p>`,
    related: [['wire-edm-research', 'Wire-EDM research'], ['industrial-projects', 'Industrial projects'], ['beyond-work', 'Beyond work']],
  },
];
