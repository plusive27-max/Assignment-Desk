
window.addEventListener('unhandledrejection', (event) => {
  alert('Promise error:\n' + event.reason);
});
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
  saveTimer = setTimeout(() => window.api.saveData(state), 600);
}

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
    if (btn.dataset.view === 'checker') initChecker();
    if (btn.dataset.view === 'draft')   initDraftView();
  });
});
document.getElementById('ai-checker-btn')?.addEventListener('click', aiCheckDraft);

// ─── Bind UI ──────────────────────────────────────────────────────────────────
function bindUI() {
  const t = document.getElementById('asgn-title');
  const s = document.getElementById('asgn-subject');
  const d = document.getElementById('asgn-deadline');
  const w = document.getElementById('asgn-words');
  const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', () => { scheduleSave(); showToast('Saved ✔'); });
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
  if (saved) { applyStateSnapshot(saved); showToast('Assignment loaded ✓'); }
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
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      exportBtn.textContent = '⏳ Exporting…';
      exportBtn.disabled = true;

      const result = await window.api.exportPdf();

      exportBtn.textContent = '📄 Export PDF';
      exportBtn.disabled = false;

      if (result?.canceled) return;
      if (result?.error) { alert('Export failed: ' + result.error); return; }
      if (result?.success) alert('✅ PDF saved to:\n' + result.path);
    });
  }

  // Export DOCX
  const exportDocxBtn = document.getElementById('export-docx-btn');
  if (exportDocxBtn) {
    exportDocxBtn.addEventListener('click', async () => {
      exportDocxBtn.textContent = '⏳ Exporting…';
      exportDocxBtn.disabled = true;
      const result = await window.api.exportDocx(buildStateSnapshot());
      exportDocxBtn.textContent = 'Export DOCX';
      exportDocxBtn.disabled = false;
      if (result?.canceled) return;
      if (result?.error) { showToast('⚠️ ' + result.error); return; }
      if (result?.success) showToast('✅ DOCX saved to ' + result.path);
    });
  }
  // Draft
  document.getElementById('draft-generate-btn')?.addEventListener('click', generateDraft);
  document.getElementById('draft-stop-btn')?.addEventListener('click', () => { if (window._draftStop) window._draftStop(); });
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
  const found = [];
  for (const [verb, meaning] of Object.entries(VERBS)) {
    if (lower.includes(verb)) found.push({ verb, meaning });
  }

  const totalWords = state.assignment.totalWords || 2000;

  let structureItems = TEMPLATES.essay;
  if (found.some(f => ['compare','contrast'].includes(f.verb))) {
    structureItems = [
      { title: 'Introduction',       pct: 10 },
      { title: 'Subject A Overview', pct: 20 },
      { title: 'Subject B Overview', pct: 20 },
      { title: 'Similarities',       pct: 20 },
      { title: 'Differences',        pct: 20 },
      { title: 'Conclusion',         pct: 10 }
    ];
  }

  const structureHtml = structureItems.map(s =>
    `<div class="suggestion-item"><span>${s.title}</span><span class="pct">${Math.round(totalWords * s.pct / 100)} words</span></div>`
  ).join('');

  const verbsHtml = found.length
    ? found.map(f =>
        `<div><span class="verb-tag">${f.verb}</span><div class="verb-meaning">${f.meaning}</div></div>`
      ).join('')
    : '<p style="color:var(--faint);font-size:0.8rem;">No specific instruction verbs detected. Re-read the question carefully.</p>';

  document.getElementById('brief-results').innerHTML = `
    <div class="result-section">
      <h4>📌 Instruction Verbs Detected</h4>
      ${verbsHtml}
    </div>
    <div class="result-section">
      <h4>📐 Suggested Word Count Split</h4>
      ${structureHtml}
      <button class="btn-ghost" style="margin-top:0.5rem;width:100%;font-size:0.775rem;" id="apply-structure-btn">Apply as Outline →</button>
    </div>
  `;

  const applyBtn = document.getElementById('apply-structure-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      if (state.outline.length) {
        const ok = await appConfirm('This will replace your current outline with the suggested structure. Continue?');
        if (!ok) return;
      }
      const total = state.assignment.totalWords || 2000;
      state.outline = structureItems.map(s => ({
        id:    crypto.randomUUID(),
        title: s.title,
        words: Math.round(total * s.pct / 100)
      }));
      state.outline.forEach(s => { if (!state.notes[s.id]) state.notes[s.id] = { content: '', citations: [] }; });
      activeNotesSection = state.outline[0]?.id || null;
      renderOutline();
      scheduleSave();
      showToast('✅ Outline applied!');
      document.querySelector('[data-view="outline"]').click();
    });
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
  const id = Date.now().toString();
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
    id: Date.now().toString() + Math.random(),
    title: s.title,
    words: Math.round(total * s.pct / 100)
  }));
  state.outline.forEach(s => {
    if (!state.notes[s.id]) state.notes[s.id] = { content: '', citations: [] };
  });
  // Reset active notes section since outline changed
// end of loadTemplate(...)
activeNotesSection = state.outline.length ? state.outline[0].id : null;
renderOutline();
scheduleSave();
function loadTemplate(type) {
  if (!TEMPLATES[type]) return;
  if (state.outline.length && !confirm('Replace current outline with this template?')) return;

  const total = state.assignment.totalWords || 2000;
  state.outline = TEMPLATES[type].map(s => ({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
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

  state.notes[activeNotesSection].citations.push({ id: Date.now().toString(), author, year, title, pub });
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


// ─── Custom confirm modal ─────────────────────────────────────────────────────
function appConfirm(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:24px 28px;max-width:360px;width:90%">
      <p style="margin:0 0 20px;color:var(--text);font-size:0.95rem">${msg}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="_no"  style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:6px 16px;border-radius:var(--radius);cursor:pointer;font:inherit">Cancel</button>
        <button id="_yes" style="background:var(--accent);border:none;color:#fff;padding:6px 16px;border-radius:var(--radius);cursor:pointer;font:inherit;font-weight:600">OK</button>
      </div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#_yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#_no').onclick  = () => { overlay.remove(); resolve(false); };
  });
}

// ─── Ollama helper (routes through main process IPC) ─────────────────────────
let selectedAiModel = null;

async function ollamaGetModels() {
  try {
    const r = await window.api.ollamaFetch('/api/tags');
    if (!r.ok) return [];
    return (JSON.parse(r.text || '{}').models || []).map(m => m.name);
  } catch { return []; }
}

let _streamCounter = 0;
function ollamaStream(model, prompt, onChunk, onDone, onError) {
  const streamId = ++_streamCounter;
  // Clean up chunk listeners from previous streams
  window.api.removeAllOllamaListeners();
  window.api.onOllamaChunk(streamId, onChunk);
  window.api.onOllamaDone(streamId,  onDone);
  window.api.onOllamaError(streamId, onError);
  window.api.ollamaStream(model, prompt, streamId);
}

function renderMarkdown(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm,'<div style="color:var(--accent-l);font-weight:700;font-size:0.9rem;margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border)">$1</div>')
    .replace(/^\d+\. (.+)$/gm,'<div style="color:var(--accent-l);font-weight:700;margin:14px 0 4px">$1</div>')
    .replace(/^[•\-] (.+)$/gm,'<div style="padding:2px 0 2px 16px"><span style="color:var(--accent-l);margin-right:6px">•</span>$1</div>')
    .replace(/\n\n/g,'<div style="height:8px"></div>')
    .replace(/\n/g,'<br>');
}

// ─── AI Brief Analyser ────────────────────────────────────────────────────────
async function analyseBriefWithAI() {
  const text = document.getElementById('brief-text').value.trim();
  if (!text) { showToast('Paste a brief first.'); return; }
  const btn       = document.getElementById('ai-analyse-btn');
  const resultsEl = document.getElementById('brief-results');

  const models = await ollamaGetModels();
  if (!models.length) {
    resultsEl.innerHTML = `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;color:var(--muted);font-size:0.85rem;line-height:1.7">
      <strong style="color:var(--rose)">Ollama not detected.</strong><br>
      Make sure Ollama is running, then click AI Analyse again.<br>
      No model? Run: <code style="background:var(--bg);padding:2px 6px;border-radius:4px">ollama pull llama3.2</code></div>`;
    return;
  }

  const preferred = ['llama3.2','llama3.2:3b','llama3','mistral','gemma3'];
  if (!selectedAiModel || !models.includes(selectedAiModel))
    selectedAiModel = preferred.find(p => models.some(n => n.startsWith(p))) || models[0];

  btn.textContent = '⏳ Analysing…';
  btn.disabled = true;

  resultsEl.innerHTML = `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <span style="font-size:0.75rem;color:var(--muted)">Model:</span>
      <select id="ai-model-sel" style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:var(--radius);font:inherit;font-size:0.8rem">
        ${models.map(n => `<option value="${n}"${n===selectedAiModel?' selected':''}>${n}</option>`).join('')}
      </select>
      <button id="ai-rerun-btn" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;border-radius:var(--radius);font:inherit;font-size:0.75rem;cursor:pointer;white-space:nowrap;flex-shrink:0">🔄 Re-run</button>
    </div>
    <div id="ai-out" style="font-size:0.875rem;line-height:1.9;color:var(--text)"><span style="color:var(--muted)">Thinking…</span></div>
  </div>`;

  document.getElementById('ai-model-sel')?.addEventListener('change', e => { selectedAiModel = e.target.value; });
  document.getElementById('ai-rerun-btn')?.addEventListener('click', analyseBriefWithAI);

  const prompt = `You are an academic assignment analyst. Extract and summarise the KEY INFORMATION from this brief. Do NOT write any essay content, drafts, or references.

Respond with ONLY these sections:

📋 ASSIGNMENT OVERVIEW
- Type: (essay / report / literature review / case study / etc.)
- Topic: (one sentence)
- Word count: (extract from brief, or state "not specified")
- Deadline: (if mentioned)
- Module/Subject: (if mentioned)

🎯 WHAT YOU MUST DO
List every task, question, or requirement as bullet points. Be specific.

📝 KEY INSTRUCTION VERBS
For each command verb found, state exactly what it demands.

📐 RECOMMENDED STRUCTURE
Suggest section headings with approximate word counts that add up to ${state.assignment.totalWords||2000} words total. Format as:
- Section name (~X words)

⚠️ COMMON MISTAKES TO AVOID
2-3 specific pitfalls for THIS type of assignment.

ASSIGNMENT BRIEF:
${text}

Remember: analyse and extract only. Do not write any content.`;

  const out = document.getElementById('ai-out');
  let full = '';
  out.innerHTML = '';
  ollamaStream(selectedAiModel, prompt,
    chunk => { full += chunk; out.innerHTML = renderMarkdown(full); },
    ()    => {
      showToast('✅ Analysis complete!');
      btn.textContent = '✨ AI Analyse';
      btn.disabled = false;
      // Add Apply Structure button at the bottom of AI output
      const applyAiBtn = document.createElement('button');
      applyAiBtn.className = 'btn-primary';
      applyAiBtn.style.cssText = 'margin-top:16px;width:100%;font-size:0.8rem';
      applyAiBtn.textContent = '📐 Apply Recommended Structure to Outline';
      out.after(applyAiBtn);
      applyAiBtn.addEventListener('click', async () => {
        // Parse sections from the AI output text (lines starting with "- " under STRUCTURE)
        const lines = full.split('\n');
        const structStart = lines.findIndex(l => l.includes('RECOMMENDED STRUCTURE') || l.includes('Recommended Structure'));
        const structEnd   = lines.findIndex((l, i) => i > structStart && l.trim().startsWith('#') || (i > structStart + 1 && l.trim() === ''));
        const structLines = lines.slice(structStart + 1, structEnd > structStart ? structEnd : structStart + 15)
          .filter(l => l.trim().startsWith('-') && l.includes('~'));
        const parsed = structLines.map(l => {
          const match = l.match(/-\s*(.+?)\s*\(~?(\d+)/);
          return match ? { title: match[1].trim(), words: parseInt(match[2]) } : null;
        }).filter(Boolean);
        const items = parsed.length >= 2 ? parsed
          : [{ title: 'Introduction', words: Math.round((state.assignment.totalWords||2000)*0.1) },
             { title: 'Main Body',    words: Math.round((state.assignment.totalWords||2000)*0.7) },
             { title: 'Conclusion',   words: Math.round((state.assignment.totalWords||2000)*0.2) }];
        if (state.outline.length) {
          const ok = await appConfirm('Apply ' + items.length + ' sections to your outline? This replaces your current outline.');
          if (!ok) return;
        }
        state.outline = items.map(s => ({ id: crypto.randomUUID(), title: s.title, words: s.words }));
        state.outline.forEach(s => { if (!state.notes[s.id]) state.notes[s.id] = { content: '', citations: [] }; });
        activeNotesSection = state.outline[0]?.id || null;
        renderOutline();
        scheduleSave();
        applyAiBtn.textContent = '✅ Applied! Go to Outline tab to review';
        applyAiBtn.disabled = true;
        showToast('✅ ' + items.length + ' sections applied to outline!');
      });
    },
    err   => { out.innerHTML = `<span style="color:var(--rose)">Error: ${escHtml(err)}</span>`; btn.textContent = '✨ AI Analyse'; btn.disabled = false; }
  );
}

// ─── AI Draft Checker ─────────────────────────────────────────────────────────
async function aiCheckDraft() {
  const text = document.getElementById('checker-textarea').value.trim();
  if (!text) { showToast('Paste your draft text first.'); return; }
  const btn       = document.getElementById('ai-checker-btn');
  const resultsEl = document.getElementById('checker-results');

  const models = await ollamaGetModels();
  if (!models.length) {
    resultsEl.innerHTML = `<div class="check-block open"><div class="check-block-header"><span class="check-block-title">Ollama Not Running</span></div>
      <div class="check-block-body" style="display:block">Start Ollama, then click ✨ AI Check again.<br>
      Run <code>ollama pull llama3.2</code> if you need a model.</div></div>`;
    return;
  }

  const preferred = ['llama3.2','llama3.2:3b','llama3','mistral','gemma3'];
  if (!selectedAiModel || !models.includes(selectedAiModel))
    selectedAiModel = preferred.find(p => models.some(n => n.startsWith(p))) || models[0];

  const wordCount = text.split(/\s+/).length;
  const brief     = state.assignment.brief?.trim() || '';
  btn.textContent = '⏳ Checking…';
  btn.disabled    = true;

  // Build output elements directly — avoids getElementById stale-reference bug
  const outDiv = document.createElement('div');
  outDiv.style.cssText = 'font-size:0.875rem;line-height:1.9;color:var(--text)';
  outDiv.innerHTML = '<span style="color:var(--muted)">Reading draft…</span>';

  const modelRow = document.createElement('div');
  modelRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px';
  modelRow.innerHTML = `<span style="font-size:0.75rem;color:var(--muted)">Model:</span>
    <select id="check-model-sel" style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:var(--radius);font:inherit;font-size:0.8rem">
      ${models.map(n => `<option value="${n}"${n===selectedAiModel?' selected':''}>${n}</option>`).join('')}
    </select>
    <button id="check-rerun-btn" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;border-radius:var(--radius);font:inherit;font-size:0.75rem;cursor:pointer;white-space:nowrap">🔄 Re-run</button>`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px';
  const meta = document.createElement('p');
  meta.style.cssText = 'color:var(--muted);font-size:0.75rem;margin:0 0 12px';
  meta.textContent = `AI Feedback · ${wordCount.toLocaleString()} words · ${selectedAiModel}`;
  wrapper.appendChild(modelRow);
  wrapper.appendChild(meta);
  wrapper.appendChild(outDiv);
  resultsEl.innerHTML = '';
  resultsEl.appendChild(wrapper);

  document.getElementById('check-model-sel')?.addEventListener('change', e => { selectedAiModel = e.target.value; });
  document.getElementById('check-rerun-btn')?.addEventListener('click', aiCheckDraft);

  const prompt = `You are a strict academic checker. Return ONLY direct feedback on the student's draft.

Rules:
- Do NOT invent a persona, greeting, signature, or commentary.
- Do NOT write as a teacher, lecturer, or named person.
- Do NOT add "Dear student" or any salutation.
- Do NOT include markdown headings beyond the six required sections.
- Do NOT mention references unless you are pointing out missing citations in the draft.
- Be factual, concise, and specific.

Use exactly these six headings and nothing else:
1. Brief Alignment
2. Academic Tone
3. Argument & Structure
4. Cohesion & Flow
5. Citation Gaps
6. Overall & Grade Estimate

For each heading:
- Use 2-5 bullet points.
- Quote short phrases from the draft when giving examples.
- If a section is weak, say exactly why.
- End with a short overall grade band only in the last heading.

BRIEF:
${brief || 'Not provided'}

DRAFT:
${text}`;

  let full = '';
  outDiv.innerHTML = '';
  ollamaStream(selectedAiModel, prompt,
    chunk => { full += chunk; outDiv.innerHTML = renderMarkdown(full); },
    ()    => { showToast('✅ Check complete!'); btn.textContent = '✨ AI Check'; btn.disabled = false; },
    err   => { outDiv.innerHTML = `<span style="color:var(--rose)">Error: ${escHtml(err)}</span>`; btn.textContent = '✨ AI Check'; btn.disabled = false; }
  );
}

// ─── AI Draft Starter ─────────────────────────────────────────────────────────
async function initDraftView() {
  if (initDraftView._done) return;
  const sel = document.getElementById('draft-model-select');
  if (!sel) return;
  const models = await ollamaGetModels();
  if (!models.length) {
    sel.innerHTML = '<option>⚠️ Ollama not running — click Draft tab again</option>';
    initDraftView._done = false;
    return;
  }
  const preferred = ['llama3.2','llama3.2:3b','llama3','mistral','gemma3'];
  if (!selectedAiModel || !models.includes(selectedAiModel))
    selectedAiModel = preferred.find(p => models.some(n => n.startsWith(p))) || models[0];
sel.innerHTML = models.map(n => `<option value="${escHtml(n)}"...>${escHtml(n)}</option>`).join('');
  sel.addEventListener('change', e => { selectedAiModel = e.target.value; });
  // Wire toggle
  const toggle = document.getElementById('draft-full-toggle');
  const track  = document.getElementById('draft-toggle-track');
  const thumb  = document.getElementById('draft-toggle-thumb');
  if (toggle) {
    const updateToggle = () => {
      if (track) track.style.background = toggle.checked ? 'var(--accent)' : 'var(--border)';
      if (thumb) thumb.style.left       = toggle.checked ? '19px' : '3px';
    };
    toggle.addEventListener('change', updateToggle);
    if (track) track.addEventListener('click', () => { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event('change')); });
    if (thumb) thumb.addEventListener('click', () => { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event('change')); });
  }
  initDraftView._done = true;
}

async function generateDraft() {
  if (!state.outline?.length) { showToast('Build your outline first.'); return; }
  const model = document.getElementById('draft-model-select')?.value || selectedAiModel;
  if (!model || model.includes('⚠️')) { showToast('Select a model first.'); return; }
  const isFull    = document.getElementById('draft-full-toggle')?.checked || false;
  const genBtn    = document.getElementById('draft-generate-btn');
  const stopBtn   = document.getElementById('draft-stop-btn');
  const output    = document.getElementById('draft-output');
  const total     = state.outline.length;
  let   stopped   = false;
  window._draftStop = () => { stopped = true; window.api.removeAllOllamaListeners(); stopBtn.style.display = 'none'; genBtn.style.display = ''; };
  genBtn.style.display = 'none';
  stopBtn.style.display = '';

  output.innerHTML = `
    <div id="dp-wrap" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted);margin-bottom:6px">
        <span id="dp-label">Starting…</span><span id="dp-count">0 / ${total}</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:4px;overflow:hidden">
        <div id="dp-fill" style="height:100%;width:0%;background:var(--accent);border-radius:4px;transition:width 0.4s"></div>
      </div>
    </div>
    ${state.outline.map((s,i) => `
    <div class="draft-section-card" id="dsc-${i}">
      <div class="draft-section-header">
        <span class="draft-section-title">${escHtml(s.title)}</span>
        <span class="draft-section-meta" style="font-size:11px;color:var(--muted);margin-left:8px">~${s.words} words</span>
        <button id="dcopy-${i}" class="btn-ghost small" style="margin-left:auto;display:none">📋 Copy</button>
      </div>
      <div id="db-${i}" class="draft-section-body" style="color:var(--muted);font-style:italic;font-size:0.8rem">Waiting…</div>
    </div>`).join('')}`;

  for (let i = 0; i < state.outline.length; i++) {
    if (stopped) break;
    const s      = state.outline[i];
    const note   = state.notes?.[s.id]?.content?.trim() || '';
    const bodyEl = document.getElementById(`db-${i}`);
    const copyBtn= document.getElementById(`dcopy-${i}`);
    document.getElementById('dp-label').textContent = `✍️ Writing: ${s.title}…`;
    document.getElementById('dp-count').textContent = `${i+1} / ${total}`;
    document.getElementById('dp-fill').style.width  = `${Math.round((i/total)*100)}%`;
    bodyEl.innerHTML   = '<span style="color:var(--muted);font-size:0.8rem">⏳ Generating…</span>';
    bodyEl.style.fontStyle = 'italic';

    // Simpler prompt for code/instruct models that struggle with complex instructions
    const isSimpleModel = /codellama|starcoder|deepseek-coder|phi|tinyllama|orca/i.test(model);
    const prompt = isFull
      ? isSimpleModel
        ? `Write ${s.words} words of academic body text for a section called "${s.title}" in an assignment titled "${state.assignment.title||'Untitled'}". No headings. No references. Just paragraphs.${note ? ' Notes: '+note : ''}`
        : `Write the body text for the "${s.title}" section of an academic assignment.

Assignment: ${state.assignment.title||'Untitled'}
Target length: ${s.words} words
${state.assignment.brief ? 'Brief: '+state.assignment.brief+'\n' : ''}${note ? 'Student notes for this section: '+note+'\n' : ''}
STRICT RULES:
- Do NOT include any headings, sub-headings, or the section title itself
- Do NOT write a reference list, bibliography, or list of sources at the end
- Do NOT include in-text citations like (Author, 2023)
- Do NOT start with "In this section..." or restate what you will do
- Write ONLY the body paragraphs — flowing academic prose
- Stay within ${s.words} words
- Use formal academic English throughout`
      : isSimpleModel
        ? `Write one opening paragraph for "${s.title}" in an assignment called "${state.assignment.title||'Untitled'}". About ${Math.round(s.words*0.2)} words. No headings. No references.${note ? ' Notes: '+note : ''}`
        : `Write ONE opening paragraph for the "${s.title}" section of an academic assignment.

Assignment: ${state.assignment.title||'Untitled'}
Target: ~${Math.round(s.words*0.2)} words
${note ? 'Student notes: '+note+'\n' : ''}
RULES:
- ONE paragraph only — no headings, no bullet points, no sub-sections, no references
- Do NOT include the section title, any heading, or any reference list
- Formal academic English
- End with a sentence that leads into the next point
- Do not include references or a reference list`;

    await new Promise(resolve => {
      let full = '';
      bodyEl.innerHTML = '';
      bodyEl.style.fontStyle = 'normal';
      ollamaStream(model, prompt,
        chunk => { full += chunk; bodyEl.innerHTML = full.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); },
        ()    => {
          if (copyBtn && full.trim()) {
            copyBtn.style.display = '';
            copyBtn.onclick = () => { navigator.clipboard.writeText(full); copyBtn.textContent = '✅ Copied!'; setTimeout(()=>copyBtn.textContent='📋 Copy',2000); };
          }
          resolve();
        },
        err   => { bodyEl.innerHTML = `<span style="color:var(--rose);font-size:0.8rem">Error: ${escHtml(err)}</span>`; resolve(); }
      );
    });
    if (stopped) break;
  }

  // ── Post-process: strip references from sections, collect them ───────────────
  const collectedRefs = [];
  if (!stopped) {
    state.outline.forEach((s, i) => {
      const bodyEl = document.getElementById('db-' + i);
      if (!bodyEl) return;
      // Get raw text (strip HTML tags for analysis)
      const rawHtml = bodyEl.innerHTML;
      // Detect reference block: lines that look like citations
      // Pattern: line starting with a number+dot, or author (Year), or URL
      const lines = rawHtml.replace(/<br>/gi, '\n').replace(/<[^>]+>/g, '').split('\n');
      const refStart = lines.findIndex((l, idx) => {
        const t = l.trim();
        return idx > 3 && (
          /^\d+\.\s+[A-Z]/.test(t) ||                          // 1. Author...
          /^[A-Z][a-z]+,\s+[A-Z]/.test(t) ||                   // Smith, J.
          /^[A-Z][a-z]+\s+\([12]\d{3}\)/.test(t) ||           // Smith (2023)
          /^https?:\/\//.test(t) ||                             // URL
          /^References?\s*$/i.test(t) ||                        // "References" heading
          /^Bibliography\s*$/i.test(t)                           // "Bibliography"
        );
      });
      if (refStart > 2) {
        const contentLines = lines.slice(0, refStart);
        const refLines     = lines.slice(refStart).filter(l => l.trim());
        // Rebuild HTML without refs
        bodyEl.innerHTML = contentLines.join('<br>').replace(/(<br>)+$/, '');
        // Collect refs with section label
        if (refLines.length) {
          collectedRefs.push({ section: s.title, refs: refLines });
        }
      }
    });
  }

  // ── Show collected references card ────────────────────────────────────────────
  if (collectedRefs.length) {
    const refCard = document.createElement('div');
    refCard.className = 'draft-section-card';
    refCard.style.cssText = 'border-color:var(--accent);margin-top:8px';
    const allRefs = [...new Set(collectedRefs.flatMap(r => r.refs))]; // deduplicate
    refCard.innerHTML = `
      <div class="draft-section-header">
        <span class="draft-section-title" style="color:var(--accent-l)">📚 References (collected from draft)</span>
        <button id="refs-copy-all" class="btn-ghost small" style="margin-left:auto">📋 Copy All</button>
      </div>
      <p style="font-size:11px;color:var(--muted);margin:0 0 10px">These were generated by the AI. Verify each one before submitting.</p>
      <div id="refs-list" style="font-size:0.8rem;line-height:1.9;color:var(--text);font-family:Georgia,serif">
        ${allRefs.map(r => `<div style="margin-bottom:4px">${escHtml(r)}</div>`).join('')}
      </div>`;
    document.getElementById('draft-output').appendChild(refCard);
    document.getElementById('refs-copy-all').addEventListener('click', () => {
      navigator.clipboard.writeText(allRefs.join('\n'));
      document.getElementById('refs-copy-all').textContent = '✅ Copied!';
      setTimeout(() => { const b = document.getElementById('refs-copy-all'); if(b) b.textContent = '📋 Copy All'; }, 2000);
    });
  }

  document.getElementById('dp-label').textContent = stopped ? '⏹ Stopped' : '✅ Done!';
  document.getElementById('dp-fill').style.cssText += ';width:100%;background:var(--' + (stopped?'amber':'green') + ')';
  document.getElementById('dp-count').textContent = `${state.outline.length} / ${total}`;
  genBtn.style.display = '';
  stopBtn.style.display = 'none';
  if (!stopped) showToast(collectedRefs.length ? '✅ Draft done — refs collected at bottom!' : '✅ Draft complete!');
}

// ─── Start ────────────────────────────────────────────────────────────────────
init();