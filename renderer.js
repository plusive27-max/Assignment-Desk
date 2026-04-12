// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  assignment: { title: '', subject: '', deadline: '', totalWords: 2000, brief: '' },
  outline: [],
  notes: {},
  progress: {},
  checklist: {}
};

let activeNotesSection = null;
let saveTimer          = null;
let wcInitialised      = false;
let notesSearchQuery = '';
let selectedAiModel = null; // remembers user's model choice
let aiAbortController = null;




// ─── Academic data ────────────────────────────────────────────────────────────
const VERBS = {
  analyse:    'Break down into components and examine each critically',
  analyze:    'Break down into components and examine each critically',
  discuss:    'Present multiple perspectives and evaluate arguments',
  evaluate:   'Make a judgement supported by evidence and reasoning',
  assess:     'Determine the value or significance of something',
  compare:    'Identify and explain similarities between two or more things',
  contrast:   'Identify and explain differences between two or more things',
  describe:   'Give a detailed factual account of something',
  explain:    'Make clear how or why something works or happens',
  define:     'Give the precise meaning of a concept or term',
  examine:    'Look closely and critically at something',
  justify:    'Give strong reasons and evidence to support your position',
  outline:    'Give the main points briefly without going into detail',
  critically: 'Judge using evidence, reasoning, and evaluation',
  review:     'Survey the literature and assess current understanding',
  identify:   'Recognise, name, and briefly describe something',
  explore:    'Investigate from multiple different angles',
  argue:      'Present a case for or against a position using evidence',
  illustrate: 'Use examples or diagrams to clarify a point',
  interpret:  'Explain the meaning or significance of something'
};

const TEMPLATES = {
  essay: [
    { title: 'Introduction',         pct: 10 },
    { title: 'Background / Context', pct: 15 },
    { title: 'Main Argument 1',      pct: 20 },
    { title: 'Main Argument 2',      pct: 20 },
    { title: 'Main Argument 3',      pct: 15 },
    { title: 'Counter-argument',     pct: 10 },
    { title: 'Conclusion',           pct: 10 }
  ],
  report: [
    { title: 'Executive Summary',            pct: 5  },
    { title: 'Introduction',                 pct: 10 },
    { title: 'Literature Review',            pct: 20 },
    { title: 'Methodology',                  pct: 15 },
    { title: 'Findings',                     pct: 20 },
    { title: 'Discussion',                   pct: 15 },
    { title: 'Conclusion & Recommendations', pct: 15 }
  ],
  litreview: [
    { title: 'Introduction', pct: 10 },
    { title: 'Theme 1',      pct: 27 },
    { title: 'Theme 2',      pct: 27 },
    { title: 'Theme 3',      pct: 26 },
    { title: 'Conclusion',   pct: 10 }
  ],
  casestudy: [
    { title: 'Introduction',    pct: 10 },
    { title: 'Background',      pct: 15 },
    { title: 'Analysis',        pct: 30 },
    { title: 'Discussion',      pct: 25 },
    { title: 'Recommendations', pct: 15 },
    { title: 'Conclusion',      pct: 5  }
  ]
};

const CHECKLIST = [
  { group: 'Understanding the Brief', items: [
    { id: 'c1', text: 'I have read and fully understood the assignment question' },
    { id: 'c2', text: 'I have addressed every part of the question' },
    { id: 'c3', text: 'My assignment matches the required format and structure' }
  ]},
  { group: 'Content & Argument', items: [
    { id: 'c4', text: 'My introduction clearly states my argument or thesis' },
    { id: 'c5', text: 'Each paragraph has a clear point, evidence, and explanation (PEE)' },
    { id: 'c6', text: 'I have used relevant and credible academic sources' },
    { id: 'c7', text: 'My conclusion summarises key points and answers the question' },
    { id: 'c8', text: 'I am within the acceptable word count range (±10%)' }
  ]},
  { group: 'Citations & References', items: [
    { id: 'c9',  text: 'Every quote and paraphrased idea has an in-text citation' },
    { id: 'c10', text: 'My reference list is in the correct referencing style' },
    { id: 'c11', text: 'Every in-text citation appears in the reference list' },
    { id: 'c12', text: 'I have not over-relied on any single source' }
  ]},
  { group: 'Proofreading', items: [
    { id: 'c13', text: 'I have spell-checked the entire document' },
    { id: 'c14', text: 'I have read through for grammar, clarity and flow' },
    { id: 'c15', text: 'All headings, tables and figures are labelled correctly' }
  ]},
  { group: 'Submission', items: [
    { id: 'c16', text: 'I know the submission deadline and have time to spare' },
    { id: 'c17', text: 'I have saved a backup copy of my work' },
    { id: 'c18', text: 'My name, student number and module code are included' }
  ]}
];

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  const saved = await window.api.loadData();
  if (saved) Object.assign(state, saved);
  bindUI();
  renderAll();
}

// ─── Save ─────────────────────────────────────────────────────────────────────
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    window.api.stateSave({
      ...state,
      theme: document.documentElement.getAttribute('data-theme') || 'dark'
    });
  }, 600);
}
  
  // ... your existing localStorage saves ...
  
  // Auto-save to disk
  window.api?.stateSave({
    title:    document.getElementById('asgn-title')?.value   || '',
    subject:  document.getElementById('asgn-subject')?.value || '',
    deadline: document.getElementById('asgn-deadline')?.value|| '',
    words:    document.getElementById('asgn-words')?.value   || '',
    brief:    document.getElementById('brief-text')?.value   || '',
    theme:    document.documentElement.getAttribute('data-theme') || 'dark',
    outline:  state.outline,
    notes:    state.notes,
  });



// ─── Window controls ──────────────────────────────────────────────────────────
document.getElementById('btn-min').addEventListener('click',   () => window.api.minimize());
document.getElementById('btn-max').addEventListener('click',   () => window.api.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

// ─── View switching ───────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'notes')     { renderNotesSidebar(); renderNotesBody(); }
    if (btn.dataset.view === 'progress')  renderProgress();
    if (btn.dataset.view === 'checklist') renderChecklist();
    if (btn.dataset.view === 'preview')   renderPreview();
    if (btn.dataset.view === 'refs')      renderRefs();
    if (btn.dataset.view === 'checker')   initChecker();
    document.getElementById('ai-checker-btn')
  ?.addEventListener('click', aiCheckDraft);


  });
});

// ─── Bind UI ──────────────────────────────────────────────────────────────────
function bindUI() {
  const t = document.getElementById('asgn-title');
  const s = document.getElementById('asgn-subject');
  const d = document.getElementById('asgn-deadline');
  const w = document.getElementById('asgn-words');
  const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    scheduleSave();
    showToast('Saved ✔');
    // Paste & Count panel toggle — bind once at startup
const wcToggle = document.getElementById('wc-toggle');
const wcPanel  = document.getElementById('wc-panel');
if (wcToggle && wcPanel) {
  
}
  });
}

  t.value = state.assignment.title;
  s.value = state.assignment.subject;
  d.value = state.assignment.deadline;
  w.value = state.assignment.totalWords || 2000;

  t.addEventListener('input',  () => { state.assignment.title    = t.value; scheduleSave(); });
  s.addEventListener('input',  () => { state.assignment.subject  = s.value; scheduleSave(); });
  d.addEventListener('change', () => { state.assignment.deadline = d.value; updateDeadlinePill(); scheduleSave(); });
  w.addEventListener('input',  () => {
    state.assignment.totalWords = parseInt(w.value) || 0;
    updateOutlineFooter();
    scheduleSave();
  });

  updateDeadlinePill();

  // Brief
  const briefTA = document.getElementById('brief-text');
  briefTA.value = state.assignment.brief || '';
  briefTA.addEventListener('input', () => { state.assignment.brief = briefTA.value; scheduleSave(); });
  document.getElementById('analyse-btn').addEventListener('click', analyseBrief);
  document.getElementById('ai-analyse-btn')?.addEventListener('click', analyseBriefWithAI);


  const uploadBtn = document.getElementById('upload-brief-btn');
  if (uploadBtn) uploadBtn.addEventListener('click', handleBriefUpload);
document.getElementById('export-btn').addEventListener('click', async () => {
  const filePath = await window.api.stateExport(buildStateSnapshot());
  if (filePath) showToast(`Saved to ${filePath}`);
});

document.getElementById('import-btn').addEventListener('click', async () => {
  const saved = await window.api.stateImport();
  if (!saved) return;

  if (saved.error) {
    showToast('⚠️ ' + saved.error);
    return;
  }

  applyStateSnapshot(saved);
  showToast('Assignment loaded');
});

function buildStateSnapshot() {
  return {
    title:    document.getElementById('asgn-title').value,
    subject:  document.getElementById('asgn-subject').value,
    deadline: document.getElementById('asgn-deadline').value,
    words:    document.getElementById('asgn-words').value,
    brief:    document.getElementById('brief-text').value,
    theme:    document.documentElement.getAttribute('data-theme') || 'dark',
    outline:  state.outline,
    notes:    state.notes,
  };
}

function applyStateSnapshot(saved) {
  if (saved.title)    document.getElementById('asgn-title').value    = saved.title;
  if (saved.subject)  document.getElementById('asgn-subject').value  = saved.subject;
  if (saved.deadline) document.getElementById('asgn-deadline').value = saved.deadline;
  if (saved.words)    document.getElementById('asgn-words').value    = saved.words;
  if (saved.brief)    document.getElementById('brief-text').value    = saved.brief;
  if (saved.theme)    document.documentElement.setAttribute('data-theme', saved.theme);
  if (saved.outline)  state.outline = saved.outline;
  if (saved.notes)    state.notes   = saved.notes;
  renderOutline(); renderNotesSidebar(); updateDeadlinePill();
}
  // Outline
  document.getElementById('add-section-btn').addEventListener('click', () => {
    addSection('New Section', Math.round(state.assignment.totalWords * 0.1) || 200);
  });

  document.querySelectorAll('.chip[data-tpl]').forEach(btn => {
    btn.addEventListener('click', () => loadTemplate(btn.dataset.tpl));
  });

  // Preview refresh
  const refreshBtn = document.getElementById('refresh-preview-btn');
  if (refreshBtn) refreshBtn.addEventListener('click', renderPreview);

  // Export PDF  ← NEW
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) exportBtn.addEventListener('click', async () => {
  exportBtn.textContent = 'Exporting...';
  exportBtn.disabled = true;
  const result = await window.api.exportPdf();
  exportBtn.textContent = 'Export PDF';
  exportBtn.disabled = false;
  if (result?.canceled) return;
  if (result?.error) {
    showToast('⚠️ Export failed: ' + result.error);
    return;
  }
  if (result?.success) {
    showToast('✅ PDF saved successfully!');
  }
});

  // New assignment
  document.getElementById('new-btn').addEventListener('click', newAssignment);
}

// ─── Deadline pill ────────────────────────────────────────────────────────────
function updateDeadlinePill() {
  const pill = document.getElementById('deadline-pill');
  const d    = state.assignment.deadline;
  if (!d) { pill.textContent = 'Set a deadline'; pill.className = 'deadline-pill'; return; }
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0)        { pill.textContent = 'Overdue!';          pill.className = 'deadline-pill urgent'; }
  else if (days === 0) { pill.textContent = 'Due today!';         pill.className = 'deadline-pill urgent'; }
  else if (days <= 3)  { pill.textContent = `${days}d left ⚠️`;  pill.className = 'deadline-pill soon';   }
  else                 { pill.textContent = `${days} days left`;  pill.className = 'deadline-pill ok';     }
}

// ─── Brief analyser ───────────────────────────────────────────────────────────
function analyseBrief() {
  const text = document.getElementById('brief-text').value.trim();
  if (!text) return;
  state.assignment.brief = text;
  scheduleSave();

  const lower = text.toLowerCase();

  // FIX 1: Use word-boundary regex instead of .includes()
  const found = [];
  for (const [verb, meaning] of Object.entries(VERBS)) {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(lower)) found.push({ verb, meaning });
  }

  const totalWords = state.assignment.totalWords || 2000;
  const verbNames = found.map(f => f.verb);

  // FIX 2: Smart template selection based on ALL detected verbs
  let chosenTemplate = 'essay';
  let structureItems;

  if (verbNames.some(v => ['compare', 'contrast'].includes(v))) {
    chosenTemplate = 'compare';
    structureItems = [
      { title: 'Introduction', pct: 10 },
      { title: 'Subject A Overview', pct: 20 },
      { title: 'Subject B Overview', pct: 20 },
      { title: 'Similarities', pct: 20 },
      { title: 'Differences', pct: 20 },
      { title: 'Conclusion', pct: 10 }
    ];
  } else if (verbNames.some(v => ['review', 'critically'].includes(v))) {
    chosenTemplate = 'litreview';
    structureItems = TEMPLATES.litreview;
  } else if (verbNames.some(v => ['assess', 'evaluate', 'recommend'].includes(v))) {
    chosenTemplate = 'casestudy';
    structureItems = TEMPLATES.casestudy;
  } else if (verbNames.some(v => ['report', 'investigate', 'analyse', 'analyze'].includes(v))) {
    chosenTemplate = 'report';
    structureItems = TEMPLATES.report;
  } else {
    chosenTemplate = 'essay';
    structureItems = TEMPLATES.essay;
  }

  // FIX 3: Try to extract word count from the brief text itself
  const wcMatch = text.match(/\b(\d{3,5})\s*(words?|word\s*count)/i);
  if (wcMatch) {
    const detectedWC = parseInt(wcMatch[1]);
    if (detectedWC >= 250 && detectedWC <= 20000) {
      document.getElementById('asgn-words').value = detectedWC;
      state.assignment.totalWords = detectedWC;
      showToast(`Word count detected from brief: ${detectedWC}`);
    }
  }

  const structureHtml = structureItems.map(s =>
    `<div class="suggestion-item">
      <span>${s.title}</span>
      <span class="pct">${Math.round(totalWords * s.pct / 100)} words</span>
    </div>`
  ).join('');

  const verbsHtml = found.length
    ? found.map(f =>
        `<div>
          <span class="verb-tag">${f.verb}</span>
          <div class="verb-meaning">${f.meaning}</div>
        </div>`
      ).join('')
    : `<p style="color:var(--faint);font-size:0.8rem">
        No specific instruction verbs detected. Re-read the question carefully.
      </p>`;

  document.getElementById('brief-results').innerHTML = `
    <div class="result-section">
      <h4>Instruction Verbs Detected</h4>
      ${verbsHtml}
    </div>
    <div class="result-section">
      <h4>Suggested Structure: <em>${chosenTemplate}</em></h4>
      ${structureHtml}
      <button class="btn-ghost" style="margin-top:0.5rem;width:100%;font-size:0.775rem"
        id="apply-structure-btn">Apply as Outline</button>
    </div>`;

  // FIX 4: Apply button now uses the ACTUALLY detected template, not always 'essay'
  document.getElementById('apply-structure-btn')?.addEventListener('click', () => {
    if (chosenTemplate === 'compare') {
      // Custom template — apply manually
      if (state.outline.length && !confirm('Replace current outline with this template?')) return;
      const total = state.assignment.totalWords || 2000;
      state.outline = structureItems.map(s => ({
        id: Date.now().toString(16) + Math.random().toString(16).slice(2),
        title: s.title,
        words: Math.round(total * s.pct / 100)
      }));
      state.outline.forEach(s => {
        if (!state.notes[s.id]) state.notes[s.id] = { content: '', citations: [] };
      });
      activeNotesSection = state.outline[0]?.id || null;
      renderOutline();
      scheduleSave();
    } else {
      loadTemplate(chosenTemplate);
    }
    document.querySelector('[data-view="outline"]').click();
  });
}
    async function analyseBriefWithAI() {
  const text = document.getElementById('brief-text').value.trim();
  if (!text) { showToast('Paste a brief first.'); return; }

  const btn = document.getElementById('ai-analyse-btn');
  const resultsEl = document.getElementById('brief-results');

  // Check Ollama is running
  try {
    const ping = await fetch('http://localhost:11434/api/tags');
    if (!ping.ok) throw new Error();
  } catch {
    resultsEl.innerHTML = `
    <div class="result-section" style="
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 80px;">
      <h4 style="
        color: var(--accent-l);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 12px;">
        ✨ AI Analysis — ${model}
      </h4>
      <div id="ai-stream-output" style="
        color: var(--text);
        font-size: 0.875rem;
        line-height: 1.9;
        white-space: pre-wrap;
        max-height: calc(100vh - 320px);
        overflow-y: auto;
        padding-right: 8px;
        padding-bottom: 12px;">
        <span style="color:var(--muted)">Loading ${model}... this may take a moment on first run.</span>
      </div>
    </div>`;
    return;
  }

  // Check a model is available
  const tagsRes = await fetch('http://localhost:11434/api/tags');
  const { models } = await tagsRes.json();
  if (!models?.length) {
    resultsEl.innerHTML = `
      <div class="result-section">
        <h4>⚠️ No Models Installed</h4>
        <p style="color:var(--muted);font-size:0.85rem;line-height:1.7">
          Run this in your terminal then try again:<br><br>
          <code style="background:var(--bg);padding:4px 8px;border-radius:4px;
            font-size:0.8rem">ollama pull llama3.2</code>
        </p>
      </div>`;
    return;
  }

  // Pick best available model
  const preferred = ['llama3.2', 'llama3.2:3b', 'llama3', 'mistral', 'gemma3'];
  const modelNames = models.map(m => m.name);
  // Use previously selected model if still available, otherwise pick best
if (!selectedAiModel || !modelNames.includes(selectedAiModel)) {
  selectedAiModel = preferred.find(p => modelNames.some(m => m.startsWith(p)))
    || modelNames[0];
}
const model = selectedAiModel;

  btn.textContent = '⏳ Analysing...';
  btn.disabled = true;

  resultsEl.innerHTML = `
  <div style="
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);">
    <span style="font-size:0.75rem;color:var(--muted);white-space:nowrap">
      🤖 Model:
    </span>
    <select id="ai-model-select" style="
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 5px 8px;
      border-radius: var(--radius);
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;">
      ${modelNames.map(m => `
        <option value="${m}" ${m === model ? 'selected' : ''}>${m}</option>
      `).join('')}
    </select>
    <button id="ai-rerun-btn" style="
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      padding: 5px 10px;
      border-radius: var(--radius);
      font: inherit;
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;">
      ↺ Re-run
    </button>
  </div>
  <div class="result-section" style="
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 80px;">
    <h4 style="
      color: var(--accent-l);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;">
      ✨ AI Analysis — ${model}
    </h4>
    <div id="ai-stream-output" style="
      color: var(--text);
      font-size: 0.875rem;
      line-height: 1.9;
      white-space: pre-wrap;
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      padding-right: 8px;
      padding-bottom: 12px;">
      <span style="color:var(--muted)">Thinking...</span>
    </div>
  </div>`;

// Wire up model selector
document.getElementById('ai-model-select')?.addEventListener('change', e => {
  selectedAiModel = e.target.value;
});

// Wire up re-run button
document.getElementById('ai-rerun-btn')?.addEventListener('click', () => {
  analyseBriefWithAI();
});

  const prompt = `You are an academic writing assistant helping a student understand their assignment brief.

Analyse the following brief and respond with these sections:

1. **Assignment Type** — what kind of assignment is this?
2. **Key Instruction Verbs** — list each verb and exactly what it requires
3. **Core Requirements** — bullet point everything the student must cover
4. **Suggested Structure** — section headings with word count percentages (total: ${state.assignment.totalWords || 2000} words)
5. **Mistakes to Avoid** — 2 to 3 specific warnings based on this brief

Be concise and practical. Use plain language. Do not repeat the brief back.

BRIEF:
${text}`;

  try {
    // Cancel any in-progress request first
if (aiAbortController) {
  aiAbortController.abort();
}
aiAbortController = new AbortController();

const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, prompt, stream: true }),
  signal: aiAbortController.signal
});

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const outputEl = document.getElementById('ai-stream-output');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            fullText += json.response;
            outputEl.innerHTML = fullText
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
  .replace(/^#{1,3} (.*)/gm,
    '<div style="color:var(--accent-l);font-weight:700;font-size:0.9rem;' +
    'margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border)">$1</div>')
  .replace(/^\d+\.\s\*\*(.*?)\*\*(.*)/gm,
    '<div style="margin:12px 0 4px;color:var(--accent-l);font-weight:700">$1</div>' +
    '<div style="color:var(--text);padding-left:12px">$2</div>')
  .replace(/^\d+\.\s(.*)/gm,
    '<div style="margin:8px 0;color:var(--text);padding-left:8px">$1</div>')
  .replace(/^[-•]\s(.*)/gm,
    '<div style="padding:3px 0 3px 16px;color:var(--text)">' +
    '<span style="color:var(--accent-l);margin-right:6px">›</span>$1</div>')
  .replace(/\n\n/g, '<div style="height:8px"></div>')
  .replace(/\n/g, '<br>');
          }
        } catch { /* skip malformed chunks */ }
      }
    }

    btn.textContent = '✨ AI Analyse';
    btn.disabled = false;
    showToast('AI analysis complete!');

  } catch (err) {
    if (err.name === 'AbortError') {
    return; // silently cancelled, new request is starting
  }
    resultsEl.innerHTML += `
      <p style="color:var(--rose);font-size:0.85rem;margin-top:8px">
        ⚠️ Error: ${escHtml(err.message)}
      </p>`;
    btn.textContent = '✨ AI Analyse';
    btn.disabled = false;
  }
}
async function aiCheckDraft() {
  const text = document.getElementById('checker-textarea').value.trim();
  if (!text) { showToast('Paste your draft text first.'); return; }

  const btn = document.getElementById('ai-checker-btn');
  const resultsEl = document.getElementById('checker-results');

  // Check Ollama is running
  try {
    const ping = await fetch('http://localhost:11434/api/tags');
    if (!ping.ok) throw new Error();
  } catch {
    resultsEl.innerHTML = `
      <div class="check-block open">
        <div class="check-block-header">
          <span class="check-block-title">⚠️ Ollama Not Detected</span>
        </div>
        <div class="check-block-body" style="display:block">
          <p style="line-height:1.7">
            Install Ollama from <strong>ollama.com</strong> then run:<br><br>
            <code style="background:var(--bg);padding:4px 8px;border-radius:4px;
              font-size:0.8rem">ollama pull llama3.2</code><br><br>
            Once running, click <strong>✨ AI Check</strong> again.
          </p>
        </div>
      </div>`;
    return;
  }

  // Check models available
  const tagsRes = await fetch('http://localhost:11434/api/tags');
  const { models } = await tagsRes.json();
  if (!models?.length) {
    resultsEl.innerHTML = `
      <div class="check-block open">
        <div class="check-block-header">
          <span class="check-block-title">⚠️ No Models Installed</span>
        </div>
        <div class="check-block-body" style="display:block">
          Run <code>ollama pull llama3.2</code> in your terminal then try again.
        </div>
      </div>`;
    return;
  }

  // Pick model — reuse selectedAiModel if available
  const preferred = ['llama3.2', 'llama3.2:3b', 'llama3', 'mistral', 'gemma3'];
  const modelNames = models.map(m => m.name);
  if (!selectedAiModel || !modelNames.includes(selectedAiModel)) {
    selectedAiModel = preferred.find(p => modelNames.some(m => m.startsWith(p)))
      || modelNames[0];
  }
  const model = selectedAiModel;

  btn.textContent = '⏳ Checking...';
  btn.disabled = true;

  // Include brief if one is saved
  const brief = state.assignment.brief?.trim();
  const briefSection = brief
    ? `\nASSIGNMENT BRIEF:\n${brief}\n`
    : '\n(No assignment brief provided)\n';

  const wordCount = text.trim().split(/\s+/).length;

  resultsEl.innerHTML = `
    <div style="
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 80px;">
      <h4 style="
        color: var(--accent-l);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;">
        ✨ AI Check — ${model}
      </h4>
      <p style="color:var(--muted);font-size:0.75rem;margin-bottom:12px">
        Analysing ${wordCount.toLocaleString()} words — 
        Loading ${model}... this may take a moment on first run.
      </p>
      <div id="ai-check-output" style="
        color: var(--text);
        font-size: 0.875rem;
        line-height: 1.9;
        max-height: calc(100vh - 320px);
        overflow-y: auto;
        padding-right: 8px;
        padding-bottom: 12px;">
        <span style="color:var(--muted)">Reading your draft...</span>
      </div>
    </div>`;

  const prompt = `You are an experienced university lecturer giving detailed written feedback on a student's assignment draft.
${briefSection}
DRAFT TEXT (${wordCount} words):
${text}

Analyse the draft and give feedback under exactly these six headings. Be specific — quote directly from the text where helpful. Be honest but constructive.

## 📋 Brief Alignment
Does the draft answer the question? Are all parts of the brief addressed? Flag anything missing or off-topic.

## 🎓 Academic Tone & Language
Flag any informal phrases, contractions, first-person overuse, or vague language. Quote specific examples and suggest improvements. Also flag if the writing feels impersonal or generic with no distinct academic voice — students sometimes over-rely on AI tools and this flattens their writing.

## 💬 Argument & Structure
Is the argument logical, coherent and well-developed? Does each paragraph have a clear point? Does the introduction set up what the conclusion delivers?

## 🔗 Cohesion & Flow
Are there abrupt topic changes? Missing transitions? Does it read as one coherent piece or a list of disconnected points?

## 📚 Citation Gaps
Identify specific claims or statements that need a source but don't have one. Quote the exact phrase and explain why it needs a citation.

## ⭐ Overall Feedback & Grade Estimate
Write 3-4 sentences summarising the main strengths and weaknesses. End with an estimated UK grade band (First, 2:1, 2:2, Third) and one specific thing that would move it up a grade.`;

  // Abort any previous request
  if (aiAbortController) aiAbortController.abort();
  aiAbortController = new AbortController();

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true }),
      signal: aiAbortController.signal
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const outputEl = document.getElementById('ai-check-output');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            fullText += json.response;
            outputEl.innerHTML = fullText
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
              .replace(/^## (.*)/gm,
                '<div style="color:var(--accent-l);font-weight:700;font-size:0.9rem;' +
                'margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)">$1</div>')
              .replace(/^[-•]\s(.*)/gm,
                '<div style="padding:3px 0 3px 16px;color:var(--text)">' +
                '<span style="color:var(--accent-l);margin-right:6px">›</span>$1</div>')
              .replace(/^> (.*)/gm,
                '<div style="border-left:3px solid var(--accent);padding:4px 0 4px 12px;' +
                'color:var(--muted);font-style:italic;margin:6px 0">$1</div>')
              .replace(/\n\n/g, '<div style="height:8px"></div>')
              .replace(/\n/g, '<br>');
          }
        } catch { /* skip malformed chunks */ }
      }
    }

    btn.textContent = '✨ AI Check';
    btn.disabled = false;
    showToast('AI check complete!');

  } catch (err) {
    if (err.name === 'AbortError') return;
    resultsEl.innerHTML += `
      <p style="color:var(--rose);font-size:0.85rem;margin-top:8px">
        ⚠️ Error: ${escHtml(err.message)}
      </p>`;
    btn.textContent = '✨ AI Check';
    btn.disabled = false;
  }
}

// ─── File upload ──────────────────────────────────────────────────────────────
async function handleBriefUpload() {
  const btn = document.getElementById('upload-brief-btn');
  btn.textContent = '⏳ Reading…';
  btn.disabled    = true;

  const result = await window.api.openBriefFile();

  btn.textContent = '📎 Upload PDF or DOCX';
  btn.disabled    = false;

  if (!result) return;
  if (result.error) { alert(result.error); return; }

  const cleaned = result.text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  document.getElementById('brief-text').value = cleaned;
  state.assignment.brief = cleaned;
  scheduleSave();

  const filenameEl = document.getElementById('upload-filename');
  if (filenameEl) filenameEl.textContent = `📄 ${result.filename}`;
}

// ─── Outline ──────────────────────────────────────────────────────────────────
function addSection(title = 'New Section', words = 200) {
  const id = crypto.randomUUID();
  state.outline.push({ id, title, words });
  if (!state.notes[id]) state.notes[id] = { content: '', citations: [] };
  renderOutline();
  scheduleSave();
}
 function loadTemplate(type) {
  if (!TEMPLATES[type]) return;
  if (state.outline.length && !confirm('Replace current outline with this template?')) return;

  const total = state.assignment.totalWords || 2000;
  state.outline = TEMPLATES[type].map(s => ({
  id: crypto.randomUUID(),
    title: s.title,
    words: Math.round(total * s.pct / 100)
  }));

  state.outline.forEach(s => {
    if (!state.notes[s.id]) state.notes[s.id] = { content: '', citations: [] };
  });

  activeNotesSection = state.outline.length ? state.outline[0].id : null;

  renderOutline();
  scheduleSave();

  // Make sure window/input regain focus after the heavy DOM update
  setTimeout(() => {
    const firstTitle = document.querySelector('.outline-section .os-title');
    if (firstTitle) firstTitle.focus();
    else window.focus();
  }, 0);
}

function renderOutline() {
  const list = document.getElementById('outline-list');
  list.innerHTML = '';

  state.outline.forEach(section => {
    const el = document.createElement('div');
    el.className = 'outline-section';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = section.title;
    titleInput.placeholder = 'Section title';
    titleInput.className = 'os-title';

    const wordsInput = document.createElement('input');
    wordsInput.type = 'number';
    wordsInput.value = section.words;
    wordsInput.placeholder = 'Words';
    wordsInput.className = 'os-words';
    wordsInput.min = 0;

    const delBtn = document.createElement('button');
    delBtn.className = 'del-section-btn';
    delBtn.title = 'Remove section';
    delBtn.textContent = '×';

    el.appendChild(titleInput);
    el.appendChild(wordsInput);
    el.appendChild(delBtn);

    // Use the section id captured in closure, not data attributes
    const sectionId = section.id;

    titleInput.addEventListener('input', () => {
      const s = state.outline.find(x => x.id === sectionId);
      if (s) {
        s.title = titleInput.value;
        scheduleSave();
      }
    });

    wordsInput.addEventListener('input', () => {
      const s = state.outline.find(x => x.id === sectionId);
      if (s) {
        s.words = parseInt(wordsInput.value, 10) || 0;
        updateOutlineFooter();
        scheduleSave();
      }
    });

    delBtn.addEventListener('click', () => {
      state.outline = state.outline.filter(x => x.id !== sectionId);
      if (activeNotesSection === sectionId) {
        activeNotesSection = state.outline.length ? state.outline[0].id : null;
      }
      renderOutline();
      scheduleSave();
    });

    list.appendChild(el);
  });

  updateOutlineFooter();
  const lastTitleInput = list.querySelector('.outline-section:last-child .os-title');
  if (lastTitleInput) {
    lastTitleInput.focus();
  }
}

function updateOutlineFooter() {
  const allocated = state.outline.reduce((a, s) => a + (s.words || 0), 0);
  const target = state.assignment.totalWords || 0;
  const diff = target - allocated;

  document.getElementById('alloc-words').textContent = allocated.toLocaleString();
  document.getElementById('target-words').textContent = target.toLocaleString();

  const diffEl = document.getElementById('wc-diff');
  if (diff === 0) {
    diffEl.textContent = 'Perfectly allocated';
    diffEl.className = 'ok';
  } else if (diff > 0) {
    diffEl.textContent = `${diff.toLocaleString()} still to allocate`;
    diffEl.className = '';
  } else {
    diffEl.textContent = `${Math.abs(diff).toLocaleString()} over target`;
    diffEl.className = '';
  }
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function renderNotesSidebar() {
  const nav = document.getElementById('notes-nav');
  nav.innerHTML = '';

  if (!state.outline.length) {
    nav.innerHTML = '<div style="color:var(--faint);font-size:0.775rem;padding:0.5rem;">Build your outline first.</div>';
    activeNotesSection = null;
    return;
  }

  // Validate — if activeNotesSection no longer exists, reset to first
  if (!activeNotesSection || !state.outline.find(s => s.id === activeNotesSection)) {
    activeNotesSection = state.outline[0].id;
  }

  state.outline.forEach(section => {
    const btn = document.createElement('button');
    btn.className   = 'notes-section-btn' + (activeNotesSection === section.id ? ' active' : '');
    btn.textContent = section.title;
    btn.addEventListener('click', () => {
      activeNotesSection = section.id;
      renderNotesSidebar();
      renderNotesBody();
    });
    nav.appendChild(btn);
  });
}

function renderNotesBody() {
  const body = document.getElementById('notes-body');
  if (!body) return;

  if (!activeNotesSection) {
    body.innerHTML = '<div class="placeholder-msg">Select a section from the left.</div>';
    return;
  }

  if (!state.notes[activeNotesSection]) {
    state.notes[activeNotesSection] = { content: '', citations: [] };
  }

  const note    = state.notes[activeNotesSection];
  const section = state.outline.find(s => s.id === activeNotesSection);
  const noteWordCount = note.content.trim() === ''
    ? 0
    : note.content.trim().split(/\s+/).length;

  body.innerHTML = `
    <div class="notes-editor-wrap">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <label class="field-label" style="margin-bottom:0;">${escHtml(section?.title || 'Notes')}</label>
          <button class="btn-ghost" style="font-size:11px;padding:4px 10px;" id="count-notes-btn"
            title="Push note word count to Progress">
            📊 Count notes (${noteWordCount} words) → Progress
          </button>
        </div>
        <textarea class="notes-textarea" id="notes-ta"
          placeholder="Type your research notes, key points, ideas…"
          style="min-height:180px;">${escHtml(note.content)}</textarea>
      </div>
      <div class="citations-section">
        <h4>📚 References for this section</h4>
        <div class="add-citation-form" id="cite-form">
          <input id="cite-author" placeholder="Author(s) e.g. Smith, J." />
          <input id="cite-year"   placeholder="Year e.g. 2023" />
          <input id="cite-title"  placeholder="Title of work"      style="grid-column:1/-1;" />
          <input id="cite-pub"    placeholder="Publisher / Journal" style="grid-column:1/-1;" />
          <button class="btn-primary small" id="add-cite-btn">＋ Add Citation</button>
        </div>
        <div id="cite-list"></div>
      </div>
    </div>
  `;

  // Notes textarea
  const ta = document.getElementById('notes-ta');
  ta.addEventListener('input', () => {
    state.notes[activeNotesSection].content = ta.value;
    scheduleSave();
    // Update the count button label live
    const wc = ta.value.trim() === '' ? 0 : ta.value.trim().split(/\s+/).length;
    const cb = document.getElementById('count-notes-btn');
    if (cb) cb.textContent = `📊 Count notes (${wc} words) → Progress`;
  });
// Highlight first search match in textarea
if (notesSearchQuery && ta.value) {
  const idx = ta.value.toLowerCase().indexOf(notesSearchQuery.toLowerCase());
  if (idx !== -1) setTimeout(() => ta.setSelectionRange(idx, idx + notesSearchQuery.length), 50);
}
  // Count notes → Progress
  document.getElementById('count-notes-btn').addEventListener('click', () => {
    const wc = ta.value.trim() === '' ? 0 : ta.value.trim().split(/\s+/).length;
    if (wc === 0) return;
    state.progress[activeNotesSection] = wc;
    scheduleSave();
    const btn = document.getElementById('count-notes-btn');
    const orig = btn.textContent;
    btn.textContent = '✓ Saved to Progress!';
    btn.style.color = 'var(--green)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
  });

  document.getElementById('add-cite-btn').addEventListener('click', addCitation);
  renderCitations();
}

// ─── Citations ────────────────────────────────────────────────────────────────
function addCitation() {
  const author = document.getElementById('cite-author').value.trim();
  const year   = document.getElementById('cite-year').value.trim();
  const title  = document.getElementById('cite-title').value.trim();
  const pub    = document.getElementById('cite-pub').value.trim();
  if (!author || !year || !title) return;

  state.notes[activeNotesSection].citations.push({
  id: crypto.randomUUID(), author, year, title, pub });
  scheduleSave();
  ['cite-author','cite-year','cite-title','cite-pub'].forEach(id =>
    document.getElementById(id).value = '');
  renderCitations();
}

function renderCitations() {
  const list = document.getElementById('cite-list');
  if (!list) return;
  const citations = state.notes[activeNotesSection]?.citations || [];
  list.innerHTML = citations.map(c => `
    <div class="citation-item">
      <span class="cite-text">
        <em>${escHtml(c.author)} (${escHtml(c.year)}).</em> ${escHtml(c.title)}${c.pub ? '. <em>' + escHtml(c.pub) + '</em>' : ''}.
      </span>
      <button class="del-cite-btn" data-id="${c.id}">✕</button>
    </div>
  `).join('') || '<div style="color:var(--faint);font-size:0.775rem;">No references added yet.</div>';

  list.querySelectorAll('.del-cite-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.notes[activeNotesSection].citations =
        state.notes[activeNotesSection].citations.filter(c => c.id !== btn.dataset.id);
      scheduleSave();
      renderCitations();
    });
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function renderProgress() {
  const totalTarget = state.assignment.totalWords || 0;
  const sections    = document.getElementById('progress-sections');
  sections.innerHTML = '';

  if (!state.outline.length) {
    sections.innerHTML = '<div class="placeholder-msg">Build your outline first to track progress.</div>';
    updateProgressStats(0, totalTarget);
    initWordCounter();
    return;
  }

  let totalWritten = 0;
  state.outline.forEach(section => {
    const written = state.progress[section.id] || 0;
    totalWritten += written;
    const target  = section.words || 0;
    const pct     = target > 0 ? Math.min(100, Math.round(written / target * 100)) : 0;

    const el = document.createElement('div');
    el.className = 'progress-section-item';
    el.innerHTML = `
      <div>
        <div class="ps-name">${escHtml(section.title)}</div>
        <div class="ps-bar-wrap"><div class="ps-bar" style="width:${pct}%"></div></div>
        <div class="ps-meta">${written.toLocaleString()} / ${target.toLocaleString()} words — ${pct}%</div>
      </div>
      <div class="ps-input-wrap">
        <label>Words written</label>
        <input type="number" value="${written}" min="0" placeholder="0" data-id="${section.id}" />
      </div>
    `;
    el.querySelector('input').addEventListener('input', e => {
      state.progress[section.id] = parseInt(e.target.value) || 0;
      scheduleSave();
      renderProgress();
    });
    sections.appendChild(el);
  });

  updateProgressStats(totalWritten, totalTarget);
  initWordCounter();
}

function updateProgressStats(written, target) {
  const pct  = target > 0 ? Math.min(100, Math.round(written / target * 100)) : 0;
  const left = Math.max(0, target - written);
  document.getElementById('stat-pct').textContent     = pct + '%';
  document.getElementById('stat-written').textContent = written.toLocaleString();
  document.getElementById('stat-left').textContent    = left.toLocaleString();

  const deadline = state.assignment.deadline;
  const daysEl   = document.getElementById('stat-days');
  if (deadline) {
    const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    daysEl.textContent = days < 0 ? 'Overdue' : days === 0 ? 'Today' : days;
    daysEl.style.color = days <= 0 ? 'var(--rose)' : days <= 3 ? 'var(--amber)' : 'var(--accent-l)';
  } else {
    daysEl.textContent = '–';
  }
}

// ─── Word Count Panel ─────────────────────────────────────────────────────────
function initWordCounter() {
  const panel    = document.getElementById('wc-panel');
  const toggle   = document.getElementById('wc-toggle');
  const textarea = document.getElementById('wc-textarea');
  const applyBtn = document.getElementById('wc-apply-btn');
  const applyMsg = document.getElementById('wc-apply-msg');
  if (!panel) return;

  // Always refresh section dropdown
  const select  = document.getElementById('wc-section-select');
  const prevVal = select.value;
  select.innerHTML = '<option value="">— Select section to apply count —</option>';
  state.outline.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.title;
    select.appendChild(opt);
  });
  if (prevVal) select.value = prevVal;

  if (wcInitialised) return;
wcInitialised = true;
// (toggle binding moved to bindUI)

  textarea.addEventListener('input', () => {
    const text      = textarea.value;
    const words     = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars     = text.length;
    const sentences = text.trim() === '' ? 0 : (text.match(/[^.!?]*[.!?]/g) || []).length;
    const reading   = words === 0 ? 0 : Math.max(1, Math.round(words / 200));
    document.getElementById('wc-words').textContent     = words.toLocaleString();
    document.getElementById('wc-chars').textContent     = chars.toLocaleString();
    document.getElementById('wc-sentences').textContent = sentences.toLocaleString();
    document.getElementById('wc-reading').textContent   = reading + ' min';
  });

  applyBtn.addEventListener('click', () => {
    const sectionId = select.value;
    const words     = parseInt(document.getElementById('wc-words').textContent.replace(/,/g, '')) || 0;
    if (!sectionId) {
      applyMsg.style.color = 'var(--rose)';
      applyMsg.textContent = '⚠ Please select a section first.';
      setTimeout(() => applyMsg.textContent = '', 2500);
      return;
    }
    if (words === 0) {
      applyMsg.style.color = 'var(--rose)';
      applyMsg.textContent = '⚠ No text pasted yet.';
      setTimeout(() => applyMsg.textContent = '', 2500);
      return;
    }
    state.progress[sectionId] = words;
    scheduleSave();
    renderProgress();
    applyMsg.style.color = 'var(--green)';
    const name = state.outline.find(s => s.id === sectionId)?.title || 'Section';
    applyMsg.textContent = `✓ ${words.toLocaleString()} words applied to "${name}"`;
    setTimeout(() => applyMsg.textContent = '', 3000);
  });
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function renderPreview() {
  const container = document.getElementById('preview-content');
  if (!container) return;

  if (!state.outline.length) {
    container.innerHTML = '<div class="placeholder-msg">Build your outline first to see a preview.</div>';
    return;
  }

  const asgn     = state.assignment;
  const deadline = asgn.deadline
    ? new Date(asgn.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : 'No deadline set';

  const totalWritten = state.outline.reduce((a, s) => a + (state.progress[s.id] || 0), 0);
  const totalTarget  = asgn.totalWords || 0;
  const pct          = totalTarget > 0 ? Math.min(100, Math.round(totalWritten / totalTarget * 100)) : 0;

  const sectionsHtml = state.outline.map(section => {
    const note      = state.notes[section.id] || { content: '', citations: [] };
    const written   = state.progress[section.id] || 0;
    const target    = section.words || 0;
    const secPct    = target > 0 ? Math.min(100, Math.round(written / target * 100)) : 0;

    const notesHtml = note.content.trim()
      ? `<div class="preview-notes-text">${escHtml(note.content)}</div>`
      : `<div class="preview-empty">No notes yet for this section.</div>`;

    const citeHtml = note.citations?.length
      ? `<div class="preview-citations">
          <h5>References</h5>
          ${note.citations.map(c =>
            `<div class="preview-cite-item">
              ${escHtml(c.author)} (${escHtml(c.year)}). <em>${escHtml(c.title)}</em>${c.pub ? '. ' + escHtml(c.pub) : ''}.
            </div>`
          ).join('')}
        </div>`
      : '';

    return `
      <div class="preview-section">
        <div class="preview-section-title">${escHtml(section.title)}</div>
        <div class="preview-section-meta">
          Target: ${target.toLocaleString()} words &nbsp;·&nbsp;
          Written: ${written.toLocaleString()} words &nbsp;·&nbsp;
          ${secPct}% complete
        </div>
        ${notesHtml}
        ${citeHtml}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="preview-doc">
      <div class="preview-header">
        <div class="preview-title">${escHtml(asgn.title || 'Untitled Assignment')}</div>
        <div class="preview-meta">
          ${asgn.subject ? escHtml(asgn.subject) + ' &nbsp;·&nbsp; ' : ''}
          Deadline: ${deadline} &nbsp;·&nbsp;
          ${totalWritten.toLocaleString()} / ${totalTarget.toLocaleString()} words (${pct}% complete)
        </div>
      </div>
      ${sectionsHtml}
    </div>
  `;
}

// ─── Checklist ────────────────────────────────────────────────────────────────
function renderChecklist() {
  const container = document.getElementById('checklist-groups');
  container.innerHTML = '';

  CHECKLIST.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'checklist-group';
    groupEl.innerHTML = `<h4>${group.group}</h4>`;

    group.items.forEach(item => {
      const done = !!state.checklist[item.id];
      const el   = document.createElement('div');
      el.className = 'checklist-item' + (done ? ' done' : '');
      el.innerHTML = `
        <div class="ci-checkbox">${done ? '✓' : ''}</div>
        <span class="ci-text">${escHtml(item.text)}</span>
      `;
      el.addEventListener('click', () => {
        state.checklist[item.id] = !state.checklist[item.id];
        scheduleSave();
        renderChecklist();
      });
      groupEl.appendChild(el);
    });

    container.appendChild(groupEl);
  });

  updateChecklistScore();
}

function updateChecklistScore() {
  const total = CHECKLIST.reduce((a, g) => a + g.items.length, 0);
  const done  = Object.values(state.checklist).filter(Boolean).length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;
  document.getElementById('cs-done').textContent  = done;
  document.getElementById('cs-total').textContent = total;
  document.getElementById('cs-fill').style.width  = pct + '%';
}

// ─── New Assignment ───────────────────────────────────────────────────────────
function newAssignment() {
  if (!confirm('Start a new assignment? All current data will be cleared.')) return;
  Object.assign(state, {
    assignment: { title: '', subject: '', deadline: '', totalWords: 2000, brief: '' },
    outline: [],
    notes: {},
    progress: {},
    checklist: {}
  });
  activeNotesSection = null;
  wcInitialised      = false;
  document.getElementById('asgn-title').value    = '';
  document.getElementById('asgn-subject').value  = '';
  document.getElementById('asgn-deadline').value = '';
  document.getElementById('asgn-words').value    = 2000;
  document.getElementById('brief-text').value    = '';
  document.getElementById('brief-results').innerHTML = '<div class="placeholder-msg">✦ Paste your brief and click Analyse</div>';
  const filenameEl = document.getElementById('upload-filename');
  if (filenameEl) filenameEl.textContent = '';
  updateDeadlinePill();
  renderAll();
  scheduleSave();
}

// ─── Render all ───────────────────────────────────────────────────────────────
function renderAll() {
  renderOutline();
  renderNotesSidebar();
  renderNotesBody();
  renderProgress();
  renderChecklist();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// ─── Pomodoro ─────────────────────────────────────────────────────────────────
(function initPomodoro() {
  const CIRCUMFERENCE = 2 * Math.PI * 48; // r=48

  let totalSecs    = 25 * 60;
  let remainSecs   = totalSecs;
  let timerRunning = false;
  let timerInterval= null;
  let sessionCount = 0;
  let currentLabel = 'Focus Session';

  const ring      = document.getElementById('pomo-ring-fill');
  const display   = document.getElementById('pomo-time-display');
  const label     = document.getElementById('pomo-label');
  const startBtn  = document.getElementById('pomo-start');
  const resetBtn  = document.getElementById('pomo-reset');
  const countEl   = document.getElementById('pomo-count');
  const header    = document.getElementById('pomo-header');
  const panel     = document.getElementById('pomodoro');
  const minIcon   = document.getElementById('pomo-minimise');

  ring.style.strokeDasharray  = CIRCUMFERENCE;
  ring.style.strokeDashoffset = 0;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function updateRing() {
    const pct    = remainSecs / totalSecs;
    const offset = CIRCUMFERENCE * (1 - pct);
    ring.style.strokeDashoffset = offset;
  }

  function updateDisplay() {
    display.textContent = formatTime(remainSecs);
    updateRing();
  }

  function setMode(duration, lbl) {
    clearInterval(timerInterval);
    timerRunning  = false;
    totalSecs     = duration * 60;
    remainSecs    = totalSecs;
    currentLabel  = lbl;
    startBtn.textContent = '▶ Start';
    // Ring colour — green for breaks, accent for focus
    ring.style.stroke = duration === 25 ? 'var(--accent)' : 'var(--green)';
    label.textContent = lbl;
    updateDisplay();
  }

  function tick() {
    if (remainSecs <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = '▶ Start';
      // Count focus sessions only
      if (totalSecs === 25 * 60) {
        sessionCount++;
        countEl.textContent = sessionCount;
      }
      // Flash display
      let flashes = 0;
      const flash = setInterval(() => {
        display.style.color = flashes % 2 === 0 ? 'var(--green)' : 'var(--text)';
        if (++flashes >= 6) { clearInterval(flash); display.style.color = ''; }
      }, 400);
      return;
    }
    remainSecs--;
    updateDisplay();
  }

  // Mode buttons
  document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setMode(parseInt(btn.dataset.duration), btn.dataset.label);
    });
  });

  // Start / Pause
  startBtn.addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = '▶ Start';
    } else {
      timerInterval = setInterval(tick, 1000);
      timerRunning  = true;
      startBtn.textContent = '⏸ Pause';
    }
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning  = false;
    remainSecs    = totalSecs;
    startBtn.textContent = '▶ Start';
    updateDisplay();
  });

  // Minimise toggle
  header.addEventListener('click', () => {
    panel.classList.toggle('minimised');
    minIcon.textContent = panel.classList.contains('minimised') ? '▼' : '▲';
  });

  updateDisplay();
})();
// ─── Theme toggle ─────────────────────────────────────────────────────────────
(function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Default to dark
  let theme = 'dark';
  root.setAttribute('data-theme', theme);
  btn.textContent = '🌙';

  btn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  });
})();
// ─── References ───────────────────────────────────────────────────────────────
// ─── References ───────────────────────────────────────────────────────────────
let refsStyle = 'solent';

const REFS_FIELDS = {
  book: [
    { id: 'r-author',    label: 'Author(s) e.g. Smith, J.',       full: false },
    { id: 'r-year',      label: 'Year',                            full: false },
    { id: 'r-title',     label: 'Title of Book',                   full: true  },
    { id: 'r-place',     label: 'Place of Publication',            full: false },
    { id: 'r-publisher', label: 'Publisher',                       full: false },
    { id: 'r-edition',   label: 'Edition (optional)',              full: false }
  ],
  journal: [
    { id: 'r-author',  label: 'Author(s) e.g. Smith, J.',         full: false },
    { id: 'r-year',    label: 'Year',                              full: false },
    { id: 'r-atitle',  label: 'Article Title',                     full: true  },
    { id: 'r-journal', label: 'Journal Name',                      full: true  },
    { id: 'r-volume',  label: 'Volume',                            full: false },
    { id: 'r-issue',   label: 'Issue',                             full: false },
    { id: 'r-pages',   label: 'Pages e.g. 45-67',                 full: false },
    { id: 'r-doi',     label: 'DOI / URL (optional)',              full: true  }
  ],
  website: [
    { id: 'r-author',  label: 'Author or Organisation',            full: false },
    { id: 'r-year',    label: 'Year',                              full: false },
    { id: 'r-title',   label: 'Page / Article Title',              full: true  },
    { id: 'r-site',    label: 'Website Name (optional)',           full: true  },
    { id: 'r-url',     label: 'Full URL',                          full: true  },
    { id: 'r-viewed',  label: 'Date Accessed e.g. 24 August 2023', full: true  }
  ],
  chapter: [
    { id: 'r-author',    label: 'Chapter Author(s)',               full: false },
    { id: 'r-year',      label: 'Year',                            full: false },
    { id: 'r-atitle',    label: 'Chapter Title',                   full: true  },
    { id: 'r-editor',    label: 'Editor(s) e.g. Jones, B.',       full: false },
    { id: 'r-title',     label: 'Book Title',                      full: true  },
    { id: 'r-place',     label: 'Place of Publication',            full: false },
    { id: 'r-publisher', label: 'Publisher',                       full: false },
    { id: 'r-pages',     label: 'Pages e.g. 45-67',               full: false }
  ],
  report: [
    { id: 'r-author',    label: 'Author or Organisation',          full: false },
    { id: 'r-year',      label: 'Year',                            full: false },
    { id: 'r-title',     label: 'Report Title',                    full: true  },
    { id: 'r-place',     label: 'Place (optional)',                full: false },
    { id: 'r-publisher', label: 'Publisher / Department',          full: false },
    { id: 'r-url',       label: 'URL (optional)',                  full: true  },
    { id: 'r-viewed',    label: 'Date Accessed (if online)',       full: true  }
  ]
};

function getRefsValues() {
  const vals = {};
  document.querySelectorAll('#refs-fields input').forEach(inp => { vals[inp.id] = inp.value.trim(); });
  return vals;
}

function getSurname(author) {
  if (!author) return '';
  if (author.includes(',')) return author.split(',')[0].trim();
  const parts = author.trim().split(' ');
  return parts[parts.length - 1];
}

function getInitials(author) {
  if (!author) return '';
  if (author.includes(',')) { const p = author.split(','); return p[1]?.trim() || ''; }
  const parts = author.trim().split(' ');
  return parts.slice(0, -1).map(p => p[0] + '.').join('') || '';
}

const STYLE_FORMATTERS = {
  solent: {
    name: 'Solent Harvard',
    format(type, v) {
      const surname  = getSurname(v['r-author']).toUpperCase();
      const initials = getInitials(v['r-author']);
      const author   = surname && initials ? `${surname}, ${initials}` : surname || v['r-author']?.toUpperCase() || '';
      if (type === 'book') {
        const ed = v['r-edition'] ? ` ${v['r-edition']} edn.` : '';
        return `${author}, ${v['r-year']}. <em>${v['r-title']}</em>.${ed} ${v['r-place']}: ${v['r-publisher']}`;
      }
      if (type === 'journal') {
        const doi = v['r-doi'] ? `. doi: ${v['r-doi']}` : '';
        return `${author}, ${v['r-year']}. ${v['r-atitle']}. <em>${v['r-journal']}</em>, ${v['r-volume']}(${v['r-issue']}), ${v['r-pages']}${doi}`;
      }
      if (type === 'website') {
        return `${author}, ${v['r-year']}. <em>${v['r-title']}</em> [viewed ${v['r-viewed']}]. Available from: ${v['r-url']}`;
      }
      if (type === 'chapter') {
        const ed = v['r-editor'] ? `In: ${v['r-editor'].toUpperCase()}, ed. ` : '';
        return `${author}, ${v['r-year']}. ${v['r-atitle']}. ${ed}<em>${v['r-title']}</em>. ${v['r-place']}: ${v['r-publisher']}, pp. ${v['r-pages']}`;
      }
      if (type === 'report') {
        const url = v['r-url'] ? ` [viewed ${v['r-viewed']}]. Available from: ${v['r-url']}` : '';
        return `${author}, ${v['r-year']}. <em>${v['r-title']}</em>. ${v['r-place'] ? v['r-place'] + ': ' : ''}${v['r-publisher']}${url}`;
      }
      return '';
    },
    intext(type, v) {
      const surname = getSurname(v['r-author']).toUpperCase() || v['r-author'];
      return `(${surname}, ${v['r-year']})`;
    }
  },
  harvard: {
    name: 'Harvard',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']);
      const author   = surname && initials ? `${surname}, ${initials}` : v['r-author'] || '';
      if (type === 'book') {
        const ed = v['r-edition'] ? ` (${v['r-edition']} ed.)` : '';
        return `${author} (${v['r-year']}) <em>${v['r-title']}</em>${ed}. ${v['r-place']}: ${v['r-publisher']}.`;
      }
      if (type === 'journal') {
        const doi = v['r-doi'] ? ` doi: ${v['r-doi']}` : '';
        return `${author} (${v['r-year']}) '${v['r-atitle']}', <em>${v['r-journal']}</em>, ${v['r-volume']}(${v['r-issue']}), pp. ${v['r-pages']}.${doi}`;
      }
      if (type === 'website') {
        return `${author} (${v['r-year']}) <em>${v['r-title']}</em> [online]. Available at: ${v['r-url']} [Accessed ${v['r-viewed']}].`;
      }
      if (type === 'chapter') {
        const ed = v['r-editor'] ? `in ${v['r-editor']} (ed.) ` : '';
        return `${author} (${v['r-year']}) '${v['r-atitle']}', ${ed}<em>${v['r-title']}</em>. ${v['r-place']}: ${v['r-publisher']}, pp. ${v['r-pages']}.`;
      }
      if (type === 'report') {
        const url = v['r-url'] ? ` Available at: ${v['r-url']} [Accessed ${v['r-viewed']}].` : '';
        return `${author} (${v['r-year']}) <em>${v['r-title']}</em>. ${v['r-place'] ? v['r-place'] + ': ' : ''}${v['r-publisher']}.${url}`;
      }
      return '';
    },
    intext(type, v) { return `(${getSurname(v['r-author']) || v['r-author']}, ${v['r-year']})`; }
  },
  apa: {
    name: 'APA 7th',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']);
      const author   = surname && initials ? `${surname}, ${initials}` : v['r-author'] || '';
      if (type === 'book') {
        const ed = v['r-edition'] ? ` (${v['r-edition']} ed.).` : '.';
        return `${author} (${v['r-year']}). <em>${v['r-title']}</em>${ed} ${v['r-publisher']}.`;
      }
      if (type === 'journal') {
        const doi = v['r-doi'] ? ` https://doi.org/${v['r-doi']}` : '';
        return `${author} (${v['r-year']}). ${v['r-atitle']}. <em>${v['r-journal']}, ${v['r-volume']}</em>(${v['r-issue']}), ${v['r-pages']}.${doi}`;
      }
      if (type === 'website') {
        return `${author} (${v['r-year']}). <em>${v['r-title']}</em>. ${v['r-site'] || ''}. ${v['r-url']}`;
      }
      if (type === 'chapter') {
        const ed = v['r-editor'] ? `In ${v['r-editor']} (Ed.), ` : '';
        return `${author} (${v['r-year']}). ${v['r-atitle']}. ${ed}<em>${v['r-title']}</em> (pp. ${v['r-pages']}). ${v['r-publisher']}.`;
      }
      if (type === 'report') {
        const url = v['r-url'] ? ` ${v['r-url']}` : '';
        return `${author} (${v['r-year']}). <em>${v['r-title']}</em>. ${v['r-publisher']}.${url}`;
      }
      return '';
    },
    intext(type, v) { return `(${getSurname(v['r-author']) || v['r-author']}, ${v['r-year']})`; }
  },
  mla: {
    name: 'MLA 9th',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']).replace(/\./g, '');
      const first    = initials ? `${initials} ` : '';
      const author   = surname ? `${surname}, ${first}` : v['r-author'] || '';
      if (type === 'book') {
        const ed = v['r-edition'] ? `, ${v['r-edition']} ed.` : '';
        return `${author}<em>${v['r-title']}</em>${ed}. ${v['r-publisher']}, ${v['r-year']}.`;
      }
      if (type === 'journal') {
        return `${author}"${v['r-atitle']}." <em>${v['r-journal']}</em>, vol. ${v['r-volume']}, no. ${v['r-issue']}, ${v['r-year']}, pp. ${v['r-pages']}.`;
      }
      if (type === 'website') {
        return `${author}"${v['r-title']}." <em>${v['r-site'] || 'Web'}</em>, ${v['r-year']}, ${v['r-url']}. Accessed ${v['r-viewed']}.`;
      }
      if (type === 'chapter') {
        const ed = v['r-editor'] ? `, edited by ${v['r-editor']}` : '';
        return `${author}"${v['r-atitle']}." <em>${v['r-title']}</em>${ed}. ${v['r-publisher']}, ${v['r-year']}, pp. ${v['r-pages']}.`;
      }
      if (type === 'report') {
        const url = v['r-url'] ? ` ${v['r-url']}.` : '';
        return `${author}<em>${v['r-title']}</em>. ${v['r-publisher']}, ${v['r-year']}.${url}`;
      }
      return '';
    },
    intext(type, v) { return `(${getSurname(v['r-author']) || v['r-author']})`; }
  },
  vancouver: {
    name: 'Vancouver',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']).replace(/\./g, '');
      const author   = surname && initials ? `${surname} ${initials}` : v['r-author'] || '';
      if (type === 'book')    return `${author}. ${v['r-title']}. ${v['r-place']}: ${v['r-publisher']}; ${v['r-year']}.`;
      if (type === 'journal') { const doi = v['r-doi'] ? ` doi: ${v['r-doi']}` : ''; return `${author}. ${v['r-atitle']}. ${v['r-journal']}. ${v['r-year']};${v['r-volume']}(${v['r-issue']}):${v['r-pages']}.${doi}`; }
      if (type === 'website') return `${author}. ${v['r-title']} [Internet]. ${v['r-year']} [cited ${v['r-viewed']}]. Available from: ${v['r-url']}`;
      if (type === 'chapter') { const ed = v['r-editor'] ? `In: ${v['r-editor']}, editor. ` : ''; return `${author}. ${v['r-atitle']}. ${ed}${v['r-title']}. ${v['r-place']}: ${v['r-publisher']}; ${v['r-year']}. p. ${v['r-pages']}.`; }
      if (type === 'report')  { const url = v['r-url'] ? ` Available from: ${v['r-url']}` : ''; return `${author}. ${v['r-title']}. ${v['r-place'] ? v['r-place'] + ': ' : ''}${v['r-publisher']}; ${v['r-year']}.${url}`; }
      return '';
    },
    intext() { return '[n] — use numbered citation'; }
  },
  oscola: {
    name: 'OSCOLA',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']).replace(/\./g, '');
      const author   = initials && surname ? `${initials} ${surname}` : v['r-author'] || '';
      if (type === 'book')    { const ed = v['r-edition'] ? `, ${v['r-edition']} edn` : ''; return `${author}, <em>${v['r-title']}</em>${ed} (${v['r-publisher']} ${v['r-year']})`; }
      if (type === 'journal') return `${author}, '${v['r-atitle']}' (${v['r-year']}) ${v['r-volume']} <em>${v['r-journal']}</em> ${v['r-pages']}`;
      if (type === 'website') return `${author}, '${v['r-title']}' (${v['r-site'] || ''}, ${v['r-year']}) &lt;${v['r-url']}&gt; accessed ${v['r-viewed']}`;
      if (type === 'chapter') { const ed = v['r-editor'] ? `${v['r-editor']} (ed), ` : ''; return `${author}, '${v['r-atitle']}' in ${ed}<em>${v['r-title']}</em> (${v['r-publisher']} ${v['r-year']}) ${v['r-pages']}`; }
      if (type === 'report')  { const url = v['r-url'] ? ` &lt;${v['r-url']}&gt; accessed ${v['r-viewed']}` : ''; return `${author}, <em>${v['r-title']}</em> (${v['r-publisher']} ${v['r-year']})${url}`; }
      return '';
    },
    intext() { return '(n) — use footnote number'; }
  },
  chicago: {
    name: 'Chicago',
    format(type, v) {
      const surname  = getSurname(v['r-author']);
      const initials = getInitials(v['r-author']).replace(/\./g, '');
      const first    = initials ? `${initials} ` : '';
      const author   = surname ? `${surname}, ${first}` : v['r-author'] || '';
      if (type === 'book')    { const ed = v['r-edition'] ? ` ${v['r-edition']} ed.` : ''; return `${author}${v['r-year']}. <em>${v['r-title']}</em>${ed}. ${v['r-place']}: ${v['r-publisher']}.`; }
      if (type === 'journal') { const doi = v['r-doi'] ? `. https://doi.org/${v['r-doi']}` : ''; return `${author}${v['r-year']}. "${v['r-atitle']}." <em>${v['r-journal']}</em> ${v['r-volume']} (${v['r-issue']}): ${v['r-pages']}${doi}.`; }
      if (type === 'website') return `${author}${v['r-year']}. "${v['r-title']}." ${v['r-site'] || ''}. Accessed ${v['r-viewed']}. ${v['r-url']}.`;
      if (type === 'chapter') { const ed = v['r-editor'] ? `edited by ${v['r-editor']}, ` : ''; return `${author}${v['r-year']}. "${v['r-atitle']}." In <em>${v['r-title']}</em>, ${ed}${v['r-pages']}. ${v['r-place']}: ${v['r-publisher']}.`; }
      if (type === 'report')  { const url = v['r-url'] ? ` ${v['r-url']}.` : ''; return `${author}${v['r-year']}. <em>${v['r-title']}</em>. ${v['r-place'] ? v['r-place'] + ': ' : ''}${v['r-publisher']}.${url}`; }
      return '';
    },
    intext(type, v) { return `(${getSurname(v['r-author']) || v['r-author']} ${v['r-year']})`; }
  }
};

function renderRefs() {
  document.querySelectorAll('.refs-style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === refsStyle);
    btn.onclick = () => { refsStyle = btn.dataset.style; renderRefs(); };
  });
  renderRefsFields();
  renderAllRefsList();
  const copyAllBtn = document.getElementById('refs-copy-all-btn');
  if (copyAllBtn) {
    copyAllBtn.onclick = () => {
      const items = document.querySelectorAll('#refs-all-list .refs-all-item');
      const text  = Array.from(items).map(el => el.innerText).join('\n');
      navigator.clipboard.writeText(text);
      copyAllBtn.textContent = '✓ Copied!';
      setTimeout(() => copyAllBtn.textContent = '📋 Copy All as Reference List', 2000);
    };
  }
}

function renderRefsFields() {
  const typeSelect = document.getElementById('refs-source-type');
  const fieldsDiv  = document.getElementById('refs-fields');
  if (!typeSelect || !fieldsDiv) return;
  const type   = typeSelect.value;
  const fields = REFS_FIELDS[type] || [];
  fieldsDiv.innerHTML = fields.map(f =>
    `<input id="${f.id}" placeholder="${f.label}" class="${f.full ? 'full' : ''}" />`
  ).join('');
  fieldsDiv.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateRefsOutput));
  typeSelect.onchange = () => { renderRefsFields(); updateRefsOutput(); };
  updateRefsOutput();
  bindRefsCopyBtns();
}

function updateRefsOutput() {
  const typeSelect = document.getElementById('refs-source-type');
  const outputBox  = document.getElementById('refs-output');
  if (!typeSelect || !outputBox) return;
  const type      = typeSelect.value;
  const vals      = getRefsValues();
  const formatter = STYLE_FORMATTERS[refsStyle];
  const ref       = formatter.format(type, vals);
  const intext    = formatter.intext(type, vals);
  if (!ref || ref.replace(/<[^>]+>/g, '').replace(/[,.()\s]/g, '') === '') {
    outputBox.innerHTML = '<div class="refs-output-empty">Fill in the fields above to generate your reference.</div>';
    return;
  }
  outputBox.innerHTML = `
    <div class="ref-formatted">${ref}</div>
    <div class="intext-label">In-text citation</div>
    <div class="intext-formatted">${intext}</div>
  `;
}

function bindRefsCopyBtns() {
  const copyRef    = document.getElementById('refs-copy-ref-btn');
  const copyIntext = document.getElementById('refs-copy-intext-btn');
  const clearBtn   = document.getElementById('refs-clear-btn');
  if (copyRef) copyRef.onclick = () => {
    const el = document.querySelector('#refs-output .ref-formatted');
    if (!el) return;
    navigator.clipboard.writeText(el.innerText);
    copyRef.textContent = '✓ Copied!';
    setTimeout(() => copyRef.textContent = '📋 Copy Reference', 2000);
  };
  if (copyIntext) copyIntext.onclick = () => {
    const el = document.querySelector('#refs-output .intext-formatted');
    if (!el) return;
    navigator.clipboard.writeText(el.innerText);
    copyIntext.textContent = '✓ Copied!';
    setTimeout(() => copyIntext.textContent = '📋 Copy In-Text', 2000);
  };
  if (clearBtn) clearBtn.onclick = () => {
    document.querySelectorAll('#refs-fields input').forEach(i => i.value = '');
    updateRefsOutput();
  };
}

function renderAllRefsList() {
  const container = document.getElementById('refs-all-list');
  if (!container) return;
  const formatter = STYLE_FORMATTERS[refsStyle];
  let html = '';
  let hasAny = false;
  state.outline.forEach(section => {
    const note = state.notes[section.id];
    if (!note?.citations?.length) return;
    hasAny = true;
    html += `<div class="refs-all-section-label">${escHtml(section.title)}</div>`;
    const sorted = [...note.citations].sort((a, b) =>
      getSurname(a.author).toUpperCase().localeCompare(getSurname(b.author).toUpperCase())
    );
    sorted.forEach(c => {
      const vals = {
        'r-author': c.author, 'r-year': c.year, 'r-title': c.title,
        'r-atitle': c.title,  'r-publisher': c.pub, 'r-journal': c.pub,
        'r-place': '', 'r-volume': '', 'r-issue': '', 'r-pages': '',
        'r-url': '', 'r-viewed': '', 'r-site': '', 'r-doi': '',
        'r-edition': '', 'r-editor': ''
      };
      const type      = c.pub ? 'book' : 'website';
      const formatted = formatter.format(type, vals);
      html += `<div class="refs-all-item">${formatted || `${escHtml(c.author)} (${escHtml(c.year)}). <em>${escHtml(c.title)}</em>. ${escHtml(c.pub)}.`}</div>`;
    });
  });
  if (!hasAny) html = '<div class="refs-all-empty">No references added yet. Add them in the Notes tab per section.</div>';
  container.innerHTML = html;
}
// ─── Writing Checker ──────────────────────────────────────────────────────────
const AI_PHRASES = [
  'it is important to note','it is worth noting','it should be noted',
  'in conclusion','in summary','to summarise','to summarize',
  'furthermore','moreover','additionally','in addition',
  'it is clear that','it is evident that','it is obvious that',
  'needless to say','as previously mentioned','as stated above',
  'in today\'s society','in the modern world','in recent years',
  'a myriad of','it cannot be denied','the fact that',
  'plays a crucial role','plays an important role',
  'significantly','substantially','undoubtedly','certainly',
  'delve into','dive into','shed light on','landscape',
  'robust','leverage','utilize','utilise','paradigm',
  'it is imperative','one must consider','one could argue',
  'this essay will','this report will','this paper will',
  'in order to','due to the fact that','with regard to',
  'at this point in time','for all intents and purposes'
];
const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi,
  /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+en\b/gi,
];

function initChecker() {
  const runBtn  = document.getElementById('checker-run-btn');
  const textarea = document.getElementById('checker-textarea');
    if (!runBtn || !textarea) return;

    // Update meta on input
      textarea.addEventListener('input', updateCheckerMeta);
    
      runBtn.onclick = runChecker;
  }


function updateCheckerMeta() {
  const text  = document.getElementById('checker-textarea').value;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const sents = text.trim() === '' ? 0 : (text.match(/[^.!?]+[.!?]+/g) || []).length;
  document.getElementById('checker-meta').textContent =
    `${words.toLocaleString()} words · ${sents} sentences`;
}

function runChecker() {
  const text = document.getElementById('checker-textarea').value.trim();
  if (!text) return;

  const results = [
    checkQuoting(text),
    checkRepeatedPhrases(text),
    checkSentenceComplexity(text),
    checkAIPhrases(text),
    checkPassiveVoice(text),
    checkReadability(text) 
  ];

  // Score: each passing check = 20 points
  const scorable = results.filter(r => r.status !== 'info');
  const score = Math.round(scorable.filter(r => r.status === 'pass').length / scorable.length * 100); 
  const fill  = document.getElementById('checker-score-fill');
  const label = document.getElementById('checker-score-label');
  fill.style.width      = score + '%';
  fill.style.background = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--rose)';
  label.style.color     = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--rose)';
  label.textContent     = score + '%';

  // Render blocks
  const container = document.getElementById('checker-results');
  container.innerHTML = results.map(r => buildCheckBlock(r)).join('');

  // Bind toggles
  container.querySelectorAll('.check-block-header').forEach(h => {
    h.addEventListener('click', () => {
      h.closest('.check-block').classList.toggle('open');
    });
  });
}

function buildCheckBlock(r) {
  const pillClass = r.status === 'pass' ? 'pass' : r.status === 'warn' ? 'warn' : r.status === 'fail' ? 'fail' : 'info';
  const pillText  = r.status === 'pass' ? '✓ Pass' : r.status === 'warn' ? '⚠ Review' : r.status === 'fail' ? '✗ Fail' : 'ℹ Info';
  const bodyHtml  = r.items?.length
    ? `<ul class="check-highlight-list">${r.items.map(i => `<li class="highlight-${r.type}">"${escHtml(i)}"</li>`).join('')}</ul>`
    : `<div class="check-empty">${r.detail || 'No issues found.'}</div>`;

  return `
    <div class="check-block ${r.open ? 'open' : ''}">
      <div class="check-block-header">
        <div class="check-block-title">
          <span>${r.icon}</span>
          <span>${r.title}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="check-pill ${pillClass}">${pillText}</span>
          <span class="check-chevron">▼</span>
        </div>
      </div>
      <div class="check-block-body">
        <p style="margin-bottom:8px;color:var(--muted);font-size:11px;">${r.summary}</p>
        ${bodyHtml}
      </div>
    </div>
  `;
}

// ── Check 1: Over-quoting ────────────────────────────────────────────────────
function checkQuoting(text) {
  const quotes   = text.match(/"[^"]{10,}"/g) || [];
  const quotedWC = quotes.reduce((a, q) => a + q.trim().split(/\s+/).length, 0);
  const totalWC  = text.trim().split(/\s+/).length;
  const pct      = totalWC > 0 ? Math.round(quotedWC / totalWC * 100) : 0;
  const status   = pct <= 10 ? 'pass' : pct <= 20 ? 'warn' : 'fail';
  return {
    icon: '💬', title: 'Over-Quoting Detector', type: 'quote', status,
    summary: `${pct}% of your text is directly quoted. Aim for under 15%. Use your own words and cite instead.`,
    items: pct > 10 ? quotes.slice(0, 5).map(q => q.replace(/"/g, '').substring(0, 80) + (q.length > 80 ? '…' : '')) : [],
    detail: 'No over-quoting detected — good use of your own words.',
    open: status !== 'pass'
  };
}

// ── Check 2: Repeated phrases ────────────────────────────────────────────────
function checkRepeatedPhrases(text) {
  const clean  = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
  const words  = clean.split(/\s+/).filter(w => w.length > 2);
  const counts = {};

  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
    // Skip if contains stopwords
    const stops = ['the','and','for','that','this','with','from','are','was','were','have','has','its','but','not','they','you'];
    if (stops.includes(words[i]) || stops.includes(words[i+2])) continue;
    counts[phrase] = (counts[phrase] || 0) + 1;
  }

  const repeated = Object.entries(counts)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase, count]) => `${phrase} (×${count})`);

  const status = repeated.length === 0 ? 'pass' : repeated.length <= 3 ? 'warn' : 'fail';
  return {
    icon: '🔁', title: 'Repeated Phrase Finder', type: 'repeat', status,
    summary: repeated.length
      ? `Found ${repeated.length} phrase(s) repeated 3+ times. Vary your language to avoid repetition.`
      : 'No overused phrases detected.',
    items: repeated,
    detail: 'No repeated phrases detected — good vocabulary variation.',
    open: status !== 'pass'
  };
}

// ── Check 3: Sentence complexity ─────────────────────────────────────────────
function checkSentenceComplexity(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const short     = sentences.filter(s => s.trim().split(/\s+/).length < 8);
  const long      = sentences.filter(s => s.trim().split(/\s+/).length > 45);

  const issues = [
    ...short.slice(0, 4).map(s => `[SHORT] ${s.trim().substring(0, 80)}`),
    ...long.slice(0, 4).map(s =>  `[LONG]  ${s.trim().substring(0, 80)}…`)
  ];

  const status = issues.length === 0 ? 'pass' : issues.length <= 4 ? 'warn' : 'fail';
  return {
    icon: '📏', title: 'Sentence Complexity', type: issues.some(i => i.startsWith('[LONG]')) ? 'long' : 'short', status,
    summary: `${short.length} very short sentence(s) (<8 words), ${long.length} very long sentence(s) (>45 words). Aim for 15-30 words per sentence.`,
    items: issues,
    detail: 'All sentences are within a good length range.',
    open: status !== 'pass'
  };
}

// ── Check 4: AI writing patterns ─────────────────────────────────────────────
function checkAIPhrases(text) {
  const lower = text.toLowerCase();
  const found = AI_PHRASES.filter(p => lower.includes(p));
  const status = found.length === 0 ? 'pass' : found.length <= 3 ? 'warn' : 'fail';
  return {
    icon: '🤖', title: 'AI / Cliché Phrase Detector', type: 'ai', status,
    summary: found.length
      ? `Found ${found.length} overused/AI-style phrase(s). Replace with more specific, academic language.`
      : 'No AI or cliché phrases detected.',
    items: found,
    detail: 'No AI-style or cliché phrases detected — great writing.',
    open: status !== 'pass'
  };
}

// ── Check 5: Passive voice ───────────────────────────────────────────────────
function checkPassiveVoice(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const passive   = [];

  sentences.forEach(s => {
    const hit = PASSIVE_PATTERNS.some(p => { p.lastIndex = 0; return p.test(s); });
    if (hit) passive.push(s.trim().substring(0, 90) + (s.trim().length > 90 ? '…' : ''));
  });

  const pct    = sentences.length > 0 ? Math.round(passive.length / sentences.length * 100) : 0;
  const status = pct <= 15 ? 'pass' : pct <= 30 ? 'warn' : 'fail';
  return {
    icon: '🔇', title: 'Passive Voice', type: 'passive', status,
    summary: `${passive.length} of ${sentences.length} sentences (${pct}%) may use passive voice. Aim for under 15%. Use active voice where possible.`,
    items: passive.slice(0, 6),
    detail: 'Passive voice is minimal — good active writing.',
    open: status !== 'pass'
  };
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function checkReadability(text) {
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0;
  if (words.length < 30 || sentences === 0) {
    return { icon: '📖', title: 'Readability Score', type: 'readability',
      status: 'info', summary: 'Paste at least 30 words to get a readability score.',
      items: [], detail: 'Not enough text to analyse.', open: false };
  }
  const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
  const fk = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  const score = Math.max(0, Math.min(100, Math.round(fk)));
  let level, status, advice;
  if      (score >= 70) { level = 'Easy / Conversational'; status = 'warn'; advice = 'Too informal for academic writing. Aim for 40–60.'; }
  else if (score >= 60) { level = 'Standard';              status = 'warn'; advice = 'Slightly informal. Aim for 40–60 for academic work.'; }
  else if (score >= 40) { level = 'Academic ✓';            status = 'pass'; advice = 'Good academic readability — clear and appropriately complex.'; }
  else if (score >= 20) { level = 'Difficult';             status = 'warn'; advice = 'Very dense. Try breaking up long sentences.'; }
  else                  { level = 'Very Difficult';        status = 'fail'; advice = 'Extremely dense. Shorten sentences and simplify vocabulary.'; }
  return {
    icon: '📖', title: `Readability — ${score}/100 (${level})`, type: 'readability',
    status, open: status !== 'pass',
    summary: `Flesch-Kincaid score: ${score}. ${advice}`,
    items: [`Words: ${words.length}`, `Sentences: ${sentences}`,
            `Avg words / sentence: ${(words.length / sentences).toFixed(1)}`,
            `Avg syllables / word: ${(syllables / words.length).toFixed(2)}`],
    detail: `Score: ${score} — ${level}`
  };
}

function showToast(msg, duration = 2500) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:var(--surface2); border:1px solid var(--border);
      color:var(--text); padding:8px 20px; border-radius:var(--radius);
      font-size:13px; z-index:99999; box-shadow:0 4px 16px rgba(0,0,0,0.4);
      opacity:0; transition:opacity 0.2s; pointer-events:none;
    `;
    document.body.appendChild(toast);
  }
  window.addEventListener('unhandledrejection', event => {
  console.error('[Assignment Desk] Unhandled promise rejection:', event.reason);
  showToast('Something went wrong. Check the console for details.');
});
  
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.style.opacity = '0', duration);
}
// Paste & Count toggle — bound once at startup, guaranteed
const _wcPanel  = document.getElementById('wc-panel');
const _wcToggle = document.getElementById('wc-toggle');
if (_wcToggle && _wcPanel) {
  _wcToggle.addEventListener('click', () => _wcPanel.classList.toggle('open'));
}
window.api.onSaveError(msg => {
  showToast('⚠️ Save failed: ' + msg);
});
// ─── Start ────────────────────────────────────────────────────────────────────
init();