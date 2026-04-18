
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


// ═══════════════════════════════════════════════════════════════════════════════
// NEW FEATURES - Undo/Redo, Keyboard Shortcuts, Statistics
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Undo/Redo System ─────────────────────────────────────────────────────────
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 50;

function saveUndoState() {
  undoStack.push(JSON.stringify({ outline: state.outline, notes: state.notes }));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

function undo() {
  if (!undoStack.length) {
    showToast('⚠️ Nothing to undo');
    return;
  }
  redoStack.push(JSON.stringify({ outline: state.outline, notes: state.notes }));
  const prev = JSON.parse(undoStack.pop());
  state.outline = prev.outline;
  state.notes = prev.notes;
  renderOutline();
  if (typeof renderNotesSidebar === 'function') renderNotesSidebar();
  if (typeof renderNotesBody === 'function') renderNotesBody();
  showToast('↶ Undo');
}

function redo() {
  if (!redoStack.length) {
    showToast('⚠️ Nothing to redo');
    return;
  }
  undoStack.push(JSON.stringify({ outline: state.outline, notes: state.notes }));
  const next = JSON.parse(redoStack.pop());
  state.outline = next.outline;
  state.notes = next.notes;
  renderOutline();
  if (typeof renderNotesSidebar === 'function') renderNotesSidebar();
  if (typeof renderNotesBody === 'function') renderNotesBody();
  showToast('↷ Redo');
}

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      scheduleSave();
      showToast('💾 Saved');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (typeof newAssignment === 'function') newAssignment();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      document.getElementById('export-btn')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      document.querySelector('[data-view="preview"]')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('[data-view="checklist"]')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay, [style*="position:fixed"][style*="z-index:99"]')
        .forEach(m => m.remove());
    }
  });
}

// ─── Statistics Dashboard ─────────────────────────────────────────────────────
function showStatistics() {
  const totalSections = state.outline.length;
  const totalTarget = state.assignment.totalWords || 0;
  const totalWritten = Object.values(state.progress || {}).reduce((a, b) => a + b, 0);
  const completion = totalTarget > 0 ? Math.round((totalWritten / totalTarget) * 100) : 0;
  const notesCount = Object.keys(state.notes || {}).length;
  const refsCount = Object.values(state.notes || {}).reduce((a, n) => a + (n.citations?.length || 0), 0);
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  
  overlay.innerHTML = `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:30px;max-width:500px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.4)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="margin:0;color:var(--text);font-size:1.3rem">📊 Statistics</h2>
        <button id="stats-close-btn" style="background:transparent;border:none;color:var(--muted);font-size:1.5rem;cursor:pointer;padding:0;width:30px;height:30px">✕</button>
      </div>
      <div style="display:grid;gap:12px">
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg);border-radius:6px">
          <span style="color:var(--muted)">Sections Created</span>
          <strong style="color:var(--text)">${totalSections}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg);border-radius:6px">
          <span style="color:var(--muted)">Words Written</span>
          <strong style="color:var(--text)">${totalWritten.toLocaleString()} / ${totalTarget.toLocaleString()}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg);border-radius:6px">
          <span style="color:var(--muted)">Completion</span>
          <strong style="color:var(--accent)">${completion}%</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg);border-radius:6px">
          <span style="color:var(--muted)">Notes Sections</span>
          <strong style="color:var(--text)">${notesCount}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg);border-radius:6px">
          <span style="color:var(--muted)">References</span>
          <strong style="color:var(--text)">${refsCount}</strong>
        </div>
      </div>
      <button id="stats-close-btn-2" style="width:100%;margin-top:20px;background:var(--accent);border:none;color:#fff;padding:10px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.9rem;font-weight:600">Close</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Add event listeners AFTER adding to DOM (this is the fix!)
  const closeBtn = document.getElementById('stats-close-btn');
  const closeBtn2 = document.getElementById('stats-close-btn-2');
  
  closeBtn.addEventListener('click', () => overlay.remove());
  closeBtn2.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}


// ─── Model Selection Popup ────────────────────────────────────────────────────
async function showModelSelectionPopup(title = "Select AI Model", currentModel = null) {
  const models = await ollamaGetModels();
  
  if (!models.length) {
    showToast('⚠️ No Ollama models found. Start Ollama and pull a model first.');
    return null;
  }

  const preferred = AI_ANALYSIS_CONFIG?.preferredModels || ['llama3.2', 'llama3.2:3b', 'llama3', 'mistral', 'qwen2.5'];
  const defaultModel = currentModel || 
                       preferred.find(p => models.some(m => m.startsWith(p))) || 
                       models[0];

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    
    overlay.innerHTML = `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:24px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.4)">
        <h3 style="margin:0 0 8px;color:var(--text);font-size:1.1rem;font-weight:600">${title}</h3>
        <p style="margin:0 0 16px;color:var(--muted);font-size:0.85rem">Choose an AI model to use for this task</p>
        
        <div style="margin-bottom:20px">
          <label style="display:block;color:var(--muted);font-size:0.75rem;margin-bottom:6px;font-weight:600">AVAILABLE MODELS</label>
          <select id="model-select" style="width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:10px 12px;border-radius:var(--radius);font:inherit;font-size:0.9rem;cursor:pointer">
            ${models.map(m => `<option value="${m}" ${m === defaultModel ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <div style="margin-top:8px;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:0.75rem;color:var(--muted)">
            <strong style="color:var(--accent-l)">💡 Tip:</strong> Larger models (7B+) give better quality. Smaller models (3B) are faster.
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="model-cancel" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:8px 20px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.9rem">Cancel</button>
          <button id="model-start" style="background:var(--accent);border:none;color:#fff;padding:8px 20px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.9rem;font-weight:600">▶ Start</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('model-select')?.focus(), 100);
    
    document.getElementById('model-start').onclick = () => {
      const selectedModel = document.getElementById('model-select').value;
      overlay.remove();
      resolve(selectedModel);
    };
    
    document.getElementById('model-cancel').onclick = () => {
      overlay.remove();
      resolve(null);
    };
    
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(null);
      }
    });
    
    document.getElementById('model-select').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const selectedModel = document.getElementById('model-select').value;
        overlay.remove();
        resolve(selectedModel);
      }
    });
  });
}

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
  document.getElementById('stats-btn')?.addEventListener('click', showStatistics);
  document.getElementById('undo-btn')?.addEventListener('click', undo);
  document.getElementById('redo-btn')?.addEventListener('click', redo);
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

  // FIX: Restore focus to window after template application
  setTimeout(() => {
    const firstInput = document.querySelector('.outline-section .os-title-input');
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    } else {
      // If no input found, just click on the window to restore focus
      document.body.focus();
    }
  }, 100);
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


// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED AI BRIEF ANALYSIS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

// Configuration for AI Analysis
const AI_ANALYSIS_CONFIG = {
  preferredModels: ['llama3.2', 'llama3.2:3b', 'llama3', 'mistral', 'gemma2', 'qwen2.5'],
  analysisTypes: {
    OVERVIEW: 'overview',
    RESEARCH: 'research',
    TIMELINE: 'timeline',
    RUBRIC: 'rubric',
    ARGUMENTS: 'arguments'
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// Enhanced AI Brief Analyser (REPLACES old analyseBriefWithAI)
// ───────────────────────────────────────────────────────────────────────────────

async function analyseBriefWithAI() {
  const text = document.getElementById('brief-text').value.trim();
  if (!text) {
    showToast('Paste a brief first.');
    return;
  }

  // ✨ NEW: Show model selection popup
  const model = await showModelSelectionPopup('Select Model for Brief Analysis', selectedAiModel);
  if (!model) return; // User cancelled
  
  selectedAiModel = model;

  const btn = document.getElementById('ai-analyse-btn');
  const resultsEl = document.getElementById('brief-results');

  btn.textContent = '⏳ Analysing…';
  btn.disabled = true;

  resultsEl.innerHTML = createEnhancedAnalysisUI([model], model);
  bindAnalysisUIEvents();
  await runComprehensiveAnalysis(text, model);
  
  btn.textContent = '✨ AI Analyse';
  btn.disabled = false;
}

function createEnhancedAnalysisUI(models, selectedModel) {
  return `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="font-size:0.75rem;color:var(--muted)">Model:</span>
        <select id="ai-model-sel" style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:var(--radius);font:inherit;font-size:0.8rem">
          ${models.map(n => `<option value="${n}"${n === selectedModel ? ' selected' : ''}>${n}</option>`).join('')}
        </select>
        <button id="ai-rerun-btn" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;border-radius:var(--radius);font:inherit;font-size:0.75rem;cursor:pointer;white-space:nowrap">
          🔄 Re-run
        </button>
      </div>
      <div class="analysis-tabs" style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:8px;overflow-x:auto;flex-wrap:wrap">
        <button class="analysis-tab-btn active" data-type="overview" style="background:var(--accent);color:#fff;border:none;padding:6px 12px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.75rem;white-space:nowrap;flex-shrink:0">📋 Overview</button>
        <button class="analysis-tab-btn" data-type="research" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:6px 12px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.75rem;white-space:nowrap;flex-shrink:0">🔍 Research Plan</button>
        <button class="analysis-tab-btn" data-type="timeline" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:6px 12px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.75rem;white-space:nowrap;flex-shrink:0">⏱️ Timeline</button>
        <button class="analysis-tab-btn" data-type="rubric" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:6px 12px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.75rem;white-space:nowrap;flex-shrink:0">✅ Marking Rubric</button>
        <button class="analysis-tab-btn" data-type="arguments" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:6px 12px;border-radius:var(--radius);cursor:pointer;font:inherit;font-size:0.75rem;white-space:nowrap;flex-shrink:0">💡 Arguments</button>
      </div>
      <div id="analysis-panel-overview" class="analysis-panel" style="font-size:0.875rem;line-height:1.9;color:var(--text);min-height:200px">
        <span style="color:var(--muted)">Analysing brief...</span>
      </div>
      <div id="analysis-panel-research" class="analysis-panel" style="display:none;font-size:0.875rem;line-height:1.9;color:var(--text);min-height:200px">
        <button class="btn-primary" onclick="generateAnalysisForType('research')" style="width:100%">🔍 Generate Research Plan</button>
      </div>
      <div id="analysis-panel-timeline" class="analysis-panel" style="display:none;font-size:0.875rem;line-height:1.9;color:var(--text);min-height:200px">
        <button class="btn-primary" onclick="generateAnalysisForType('timeline')" style="width:100%">⏱️ Generate Study Timeline</button>
      </div>
      <div id="analysis-panel-rubric" class="analysis-panel" style="display:none;font-size:0.875rem;line-height:1.9;color:var(--text);min-height:200px">
        <button class="btn-primary" onclick="generateAnalysisForType('rubric')" style="width:100%">✅ Extract Marking Criteria</button>
      </div>
      <div id="analysis-panel-arguments" class="analysis-panel" style="display:none;font-size:0.875rem;line-height:1.9;color:var(--text);min-height:200px">
        <button class="btn-primary" onclick="generateAnalysisForType('arguments')" style="width:100%">💡 Generate Argument Structures</button>
      </div>
    </div>
  `;
}

function createOllamaNotFoundMessage() {
  return `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;color:var(--muted);font-size:0.85rem;line-height:1.7">
      <strong style="color:var(--rose)">⚠️ Ollama not detected</strong><br><br>
      Make sure Ollama is running, then click AI Analyse again.<br><br>
      <strong>Recommended models for academic work:</strong><br>
      <code style="background:var(--bg);padding:2px 6px;border-radius:4px;display:block;margin-top:8px">ollama pull llama3.2</code>
      <code style="background:var(--bg);padding:2px 6px;border-radius:4px;display:block;margin-top:4px">ollama pull qwen2.5:7b</code>
      <br>
      <a href="https://ollama.com" target="_blank" style="color:var(--accent)">Download Ollama →</a>
    </div>
  `;
}

function bindAnalysisUIEvents() {
  document.getElementById('ai-model-sel')?.addEventListener('change', (e) => {
    selectedAiModel = e.target.value;
  });

  document.getElementById('ai-rerun-btn')?.addEventListener('click', () => {
    const activeTab = document.querySelector('.analysis-tab-btn.active');
    if (activeTab) {
      const type = activeTab.dataset.type;
      if (type === 'overview') {
        analyseBriefWithAI();
      } else {
        generateAnalysisForType(type);
      }
    }
  });

  document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      
      document.querySelectorAll('.analysis-tab-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.border = '1px solid var(--border)';
        b.style.color = 'var(--muted)';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--accent)';
      btn.style.border = 'none';
      btn.style.color = '#fff';
      btn.classList.add('active');

      document.querySelectorAll('.analysis-panel').forEach(p => {
        p.style.display = 'none';
      });
      const panel = document.getElementById(`analysis-panel-${type}`);
      panel.style.display = 'block';
    });
  });
}

async function runComprehensiveAnalysis(briefText, model) {
  const panel = document.getElementById('analysis-panel-overview');
  const totalWords = state.assignment.totalWords || 2000;
  
  const prompt = `You are an expert academic advisor helping a university student understand their assignment brief.

ASSIGNMENT BRIEF:
${briefText}

TARGET WORD COUNT: ${totalWords} words

Provide a comprehensive analysis in the following format. Use markdown-style formatting.

# 📋 ASSIGNMENT OVERVIEW
- **Assignment Type:** [essay/report/case study/literature review/etc.]
- **Subject Area:** [field of study]
- **Topic Summary:** [1-2 sentences]
- **Word Count:** [extract exact requirement]
- **Submission Deadline:** [if mentioned, otherwise state "not specified"]
- **Weighting/Marks:** [if mentioned, otherwise state "not specified"]

# 🎯 CORE REQUIREMENTS
List EVERY task, question, or requirement you found in the brief. Number them clearly.

1. [First requirement]
2. [Second requirement]
3. [Continue...]

# 📝 COMMAND VERBS DECODED
For each instruction verb in the brief (analyse, evaluate, discuss, etc.), explain what it demands:

- **[Verb]:** [What this verb requires you to do in academic writing]
- **[Verb]:** [Continue...]

# 🏆 ASSESSMENT CRITERIA
Based on this brief, markers are likely looking for:
- [Specific criterion 1]
- [Specific criterion 2]
- [Specific criterion 3]
- [Continue...]

# 📐 RECOMMENDED STRUCTURE
Suggest ${state.outline.length > 0 ? state.outline.length : '5-7'} sections with word allocations totaling ${totalWords} words.

Format each as: **Section name** (~X words) - brief description of what goes here

# ⚠️ COMMON PITFALLS
List 3-5 specific mistakes students make with THIS type of assignment:

1. [Specific mistake and how to avoid it]
2. [Continue...]

# 💡 SUCCESS TIPS
Provide 3-5 actionable tips for excelling at this specific brief:

1. [Specific tip]
2. [Continue...]

Keep your tone supportive and academic. Be specific to THIS brief, not generic advice.`;
  
  let fullResponse = '';
  panel.innerHTML = '';
  
  await new Promise((resolve) => {
    ollamaStream(
      model,
      prompt,
      (chunk) => {
        fullResponse += chunk;
        panel.innerHTML = renderMarkdown(fullResponse);
      },
      () => {
        addOverviewActionButtons(panel, fullResponse);
        showToast('✅ Analysis complete!');
        resolve();
      },
      (err) => {
        panel.innerHTML = `<span style="color:var(--rose)">Error: ${escHtml(err)}</span>`;
        resolve();
      }
    );
  });
}

async function generateAnalysisForType(type) {
  const briefText = document.getElementById('brief-text').value.trim();
  if (!briefText) {
    showToast('No brief text found');
    return;
  }

  const panel = document.getElementById(`analysis-panel-${type}`);
  const model = selectedAiModel;
  
  const prompts = {
    research: createResearchPlanPrompt(briefText),
    timeline: createTimelinePrompt(briefText),
    rubric: createRubricPrompt(briefText),
    arguments: createArgumentsPrompt(briefText)
  };
  
  const prompt = prompts[type];
  if (!prompt) {
    showToast('Unknown analysis type');
    return;
  }
  
  let fullResponse = '';
  panel.innerHTML = '<span style="color:var(--muted)">Generating...</span>';
  
  await new Promise((resolve) => {
    ollamaStream(
      model,
      prompt,
      (chunk) => {
        fullResponse += chunk;
        panel.innerHTML = renderMarkdown(fullResponse);
      },
      () => {
        addTypeSpecificActionButtons(panel, type, fullResponse);
        showToast(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} analysis complete!`);
        resolve();
      },
      (err) => {
        panel.innerHTML = `<span style="color:var(--rose)">Error: ${escHtml(err)}</span>`;
        resolve();
      }
    );
  });
}

function createResearchPlanPrompt(briefText) {
  return `You are a research librarian helping a student plan their research strategy.

ASSIGNMENT BRIEF:
${briefText}

Create a detailed, actionable research plan:

# 🔍 RESEARCH QUESTIONS
Generate 5-7 focused research questions that directly address this brief's requirements.

1. [Primary question addressing main brief requirement]
2. [Secondary question]
3. [Continue...]

# 📚 KEY SEARCH TERMS

**Primary Keywords:** [5-8 core terms from the brief]
**Related Concepts:** [5-8 broader/related terms]
**Alternative Phrasings:** [3-5 synonyms or variations]
**Boolean Operators:** [Suggested AND/OR/NOT combinations]

# 🏛️ RECOMMENDED DATABASES

1. **[Database name]:** Why it's useful for this topic
2. **[Database name]:** Why it's useful for this topic
3. [Continue for 4-6 databases]

# 📖 LITERATURE TYPES

- **Peer-reviewed Journals:** [Specific journal names if possible, or types]
- **Seminal Texts:** [Foundational works you should look for]
- **Recent Publications:** Why currency matters for this topic
- **Alternative Sources:** [Grey literature, reports, etc. if relevant]

# 🔎 SEARCH STRATEGY

Provide 3-4 actual search strings using Boolean operators. Example format:
- \`"keyword1" AND ("keyword2" OR "keyword3") NOT "keyword4"\`

# 📊 SOURCE EVALUATION

How to judge if a source is credible and relevant for THIS assignment:
- [Criterion 1]
- [Criterion 2]
- [Continue...]

# ⏱️ RESEARCH TIMELINE

Suggest realistic time allocation:
- Initial search & skim: X hours
- Deep reading: X hours
- Note-taking: X hours
- Source organization: X hours

Be specific and practical for a university student.`;
}

function createTimelinePrompt(briefText) {
  const deadline = state.assignment.deadline;
  const today = new Date().toISOString().split('T')[0];
  const wordCount = state.assignment.totalWords || 2000;
  
  return `You are an academic study skills advisor creating a realistic work timeline.

ASSIGNMENT BRIEF:
${briefText}

TODAY'S DATE: ${today}
${deadline ? `DEADLINE: ${deadline}` : 'DEADLINE: Not specified (assume 4 weeks from today)'}
WORD COUNT: ${wordCount} words

Create a detailed, realistic timeline with specific tasks:

# 📅 WEEKLY BREAKDOWN

## Week 1: Research Foundation
**Goal:** Complete initial research and planning

- **Day 1-2:** [Specific tasks]
- **Day 3-4:** [Specific tasks]
- **Day 5-7:** [Specific tasks]

**📊 Checkpoint:** [What should be achieved by end of week 1]

## Week 2: Deep Research & Structure
**Goal:** [Describe goal]

- **Day 1-3:** [Specific tasks]
- **Day 4-7:** [Specific tasks]

**📊 Checkpoint:** [What should be achieved]

## Week 3: Main Writing Phase
**Goal:** [Describe goal]

[Continue pattern...]

## Week 4: Review & Polish
**Goal:** Complete assignment to submission standard

[Final week tasks]

# ⏰ DAILY STUDY SESSIONS

**Recommended Session Structure:**
- Study session length: [X] minutes
- Break frequency: [X] minutes
- Sessions per day: [X]
- Best times: [morning/afternoon/evening for this work type]

# 🚨 BUFFER TIME

- Built-in buffer for revisions: [X days]
- Contingency for setbacks: [X days]
- Final proofread buffer: [X days]

# ✅ WEEKLY CHECKPOINTS

**Week 1:** [Specific question to ask yourself]
**Week 2:** [Specific question]
**Week 3:** [Specific question]
**Week 4:** [Specific question]

# 🎯 PROGRESS TRACKING

Track these metrics weekly:
- [Metric 1]
- [Metric 2]
- [Metric 3]

Be realistic about student workload and include actual time estimates (hours).`;
}

function createRubricPrompt(briefText) {
  return `You are an assessment expert extracting marking criteria from an assignment brief.

ASSIGNMENT BRIEF:
${briefText}

Extract and organize assessment criteria that markers will use:

# ✅ EXPLICIT CRITERIA
List any marking criteria DIRECTLY stated in the brief:

1. **[Criterion]:** [Description] — likely worth ~X%
2. **[Criterion]:** [Description] — likely worth ~X%
[Continue...]

# 🎯 IMPLIED CRITERIA
Based on the brief type and academic standards, markers will also assess:

- **[Criterion]:** Why this matters for this assignment
- **[Criterion]:** Why this matters
[Continue...]

# 📊 ESTIMATED GRADING BREAKDOWN

- **Content & Understanding:** X%
- **Critical Analysis & Evaluation:** X%
- **Structure & Organization:** X%
- **Academic Writing Quality:** X%
- **Research & Referencing:** X%
- **[Other criteria]:** X%

**Total:** 100%

# 🏆 DISTINCTION LEVEL (70%+)
To achieve top marks (70-100%), your work must:

1. [Specific, measurable requirement]
2. [Specific, measurable requirement]
3. [Continue for 5-7 items]

# ✔️ MERIT LEVEL (60-69%)
To achieve good marks (60-69%), your work must:

1. [Specific requirement]
2. [Continue for 4-5 items]

# 📍 PASS LEVEL (40-59%)
Minimum requirements to pass:

1. [Essential requirement]
2. [Continue for 3-4 items]

# ❌ COMMON MARK DEDUCTIONS

- **[Issue]:** Typical deduction: -X marks or X%
- **[Issue]:** Typical deduction: -X marks or X%
[Continue for 5-8 common issues]

# ✅ PRE-SUBMISSION CHECKLIST

Before you submit, verify:
☐ [Specific item to check]
☐ [Specific item to check]
[Continue for 10-15 items]

Be specific to THIS brief. Include percentage estimates where possible.`;
}

function createArgumentsPrompt(briefText) {
  const wordCount = state.assignment.totalWords || 2000;
  
  return `You are an academic writing tutor helping structure arguments.

ASSIGNMENT BRIEF:
${briefText}

WORD COUNT: ${wordCount} words

Help the student develop strong, well-structured arguments:

# 💡 POSSIBLE THESIS STATEMENTS

Generate 3-5 potential thesis statements that DIRECTLY answer the assignment question.

## Option 1: [Descriptive title]
**Thesis:** "[Complete thesis statement]"

**Rationale:** Why this thesis works for this brief
**Strength:** What makes this approach strong
**Challenge:** What you'll need to address

## Option 2: [Descriptive title]
[Continue same format for 3-5 options]

# 🏗️ ARGUMENT STRUCTURE OPTIONS

## Structure A: Classical Argument
- Introduction with clear thesis
- Background/Context (~X words)
- Argument 1 + Evidence (~X words)
- Argument 2 + Evidence (~X words)
- Argument 3 + Evidence (~X words)
- Counter-argument (~X words)
- Rebuttal (~X words)
- Conclusion (~X words)

**Best for:** [When to use this structure for THIS assignment]

## Structure B: [Alternative name]
[Provide 2-3 structural options total]

# 📝 KEY ARGUMENTS TO ADDRESS

Based on the brief, you MUST discuss:

## 1. [Required theme/argument]
- **Evidence needed:** [Type of evidence]
- **Key points to cover:** [Specific points]
- **Counter-perspectives:** [What to address]
- **Word allocation:** ~X words

## 2. [Required theme/argument]
[Continue for all major required arguments]

# 🔗 ARGUMENT FLOW & TRANSITIONS

**Introduction → First Point:**
[Specific transitional approach]

**Between Main Points:**
[Linking strategy]

**To Counter-argument:**
[How to introduce opposing views]

**To Conclusion:**
[Strategy for final section]

# ⚖️ CONTENT BALANCE (for ${wordCount} words)

- Introduction: ~${Math.round(wordCount * 0.1)} words (10%)
- Main arguments: ~${Math.round(wordCount * 0.7)} words (70%)
- Counter-arguments: ~${Math.round(wordCount * 0.1)} words (10%)
- Conclusion: ~${Math.round(wordCount * 0.1)} words (10%)

# 🎯 PERSUASION TECHNIQUES

For THIS assignment type, use:

1. **[Technique]:** When and how to apply it
2. **[Technique]:** When and how to apply it
[Continue for 4-6 techniques]

# 🚫 ARGUMENT PITFALLS TO AVOID

1. **[Common mistake]:** Why it weakens your argument
2. **[Common mistake]:** Why it weakens your argument
[Continue...]

Be specific to the brief's requirements and the assignment type.`;
}

function addOverviewActionButtons(panel, analysisText) {
  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px solid var(--border)';
  actionsDiv.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-primary" id="apply-structure-btn" style="flex:1;min-width:180px;font-size:0.85rem">
        📐 Apply Structure to Outline
      </button>
      <button class="btn-ghost" id="copy-analysis-btn" style="font-size:0.85rem">
        📋 Copy All
      </button>
      <button class="btn-ghost" id="extract-dates-btn" style="font-size:0.85rem">
        📅 Extract Dates
      </button>
    </div>
  `;
  
  panel.appendChild(actionsDiv);
  
  document.getElementById('apply-structure-btn')?.addEventListener('click', async () => {
    await applyStructureFromAnalysis(analysisText);
  });
  
  document.getElementById('copy-analysis-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(analysisText);
    showToast('📋 Analysis copied to clipboard!');
  });
  
  document.getElementById('extract-dates-btn')?.addEventListener('click', () => {
    extractAndApplyDeadline(analysisText);
  });
}

function addTypeSpecificActionButtons(panel, type, content) {
  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px solid var(--border)';
  
  const actionConfigs = {
    research: {
      buttons: [
        { id: 'copy-search-terms', text: '📋 Copy Search Terms', action: () => copySearchTerms(content) },
        { id: 'open-scholar', text: '🔗 Open Google Scholar', action: () => window.open('https://scholar.google.com/', '_blank') },
        { id: 'copy-all-research', text: '📄 Copy All', action: () => {navigator.clipboard.writeText(content); showToast('Copied!');} }
      ]
    },
    timeline: {
      buttons: [
        { id: 'copy-timeline', text: '📋 Copy Timeline', action: () => {navigator.clipboard.writeText(content); showToast('Timeline copied!');} }
      ]
    },
    rubric: {
      buttons: [
        { id: 'add-to-checklist', text: '✅ Add Criteria to Checklist', action: () => createChecklistFromRubric(content) },
        { id: 'copy-rubric', text: '📋 Copy Rubric', action: () => {navigator.clipboard.writeText(content); showToast('Rubric copied!');} }
      ]
    },
    arguments: {
      buttons: [
        { id: 'apply-thesis', text: '💡 Add Thesis to Notes', action: () => applyThesisToNotes(content) },
        { id: 'copy-arguments', text: '📋 Copy Arguments', action: () => {navigator.clipboard.writeText(content); showToast('Arguments copied!');} }
      ]
    }
  };
  
  const config = actionConfigs[type];
  if (!config) return;
  
  actionsDiv.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${config.buttons.map(btn => `
        <button class="btn-ghost" id="${btn.id}" style="font-size:0.85rem">
          ${btn.text}
        </button>
      `).join('')}
    </div>
  `;
  
  panel.appendChild(actionsDiv);
  
  config.buttons.forEach(btn => {
    document.getElementById(btn.id)?.addEventListener('click', btn.action);
  });
}

async function applyStructureFromAnalysis(analysisText) {
  const lines = analysisText.split('\n');
  const structStart = lines.findIndex(l => 
    l.toUpperCase().includes('RECOMMENDED STRUCTURE') || 
    l.toUpperCase().includes('STRUCTURE')
  );
  
  if (structStart === -1) {
    showToast('⚠️ Could not find structure recommendations');
    return;
  }
  
  const structEnd = lines.findIndex((l, i) => 
    i > structStart && (l.trim().startsWith('#') || (i > structStart + 20))
  );
  
  const structLines = lines.slice(structStart + 1, structEnd > structStart ? structEnd : structStart + 20)
    .filter(l => /^[-•*]|\d+\./.test(l.trim()) && /\d+/.test(l));
  
  const parsed = structLines.map(l => {
    const match = l.match(/[-•*\d.]\s*\*?\*?([^(~\d]+)[\s(~]*(\d+)/);
    if (match) {
      let title = match[1].trim().replace(/\*\*/g, '').replace(/^['"]|['"]$/g, '');
      const words = parseInt(match[2]);
      title = title.replace(/\s*-\s*$/, '').trim();
      return { title, words };
    }
    return null;
  }).filter(Boolean);
  
  if (parsed.length < 2) {
    showToast('⚠️ Could not parse structure. Using defaults.');
    const total = state.assignment.totalWords || 2000;
    parsed.length = 0;
    parsed.push(
      { title: 'Introduction', words: Math.round(total * 0.1) },
      { title: 'Main Body', words: Math.round(total * 0.7) },
      { title: 'Conclusion', words: Math.round(total * 0.2) }
    );
  }
  
  if (state.outline.length > 0) {
    const confirmed = await appConfirm(
      `Apply ${parsed.length} sections to your outline?\n\nThis will replace your current ${state.outline.length} section(s).`
    );
    if (!confirmed) return;
  }
  
  state.outline = parsed.map(s => ({
    id: crypto.randomUUID(),
    title: s.title,
    words: s.words
  }));
  
  state.outline.forEach(s => {
    if (!state.notes[s.id]) {
      state.notes[s.id] = { content: '', citations: [] };
    }
  });
  
  activeNotesSection = state.outline[0]?.id || null;
  renderOutline();
  scheduleSave();
  showToast(`✅ ${parsed.length} sections applied to outline!`);
}

function copySearchTerms(content) {
  const lines = content.split('\n');
  const keywordSection = [];
  let inKeywordSection = false;
  
  for (const line of lines) {
    if (line.match(/KEY SEARCH TERMS|Primary Keywords|Related Concepts/i)) {
      inKeywordSection = true;
    } else if (inKeywordSection && line.startsWith('#')) {
      break;
    } else if (inKeywordSection && line.trim()) {
      keywordSection.push(line);
    }
  }
  
  const text = keywordSection.length > 0 ? keywordSection.join('\n') : content;
  navigator.clipboard.writeText(text);
  showToast('🔍 Search terms copied to clipboard!');
}

function extractAndApplyDeadline(content) {
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const dateStr = match[0];
      document.getElementById('asgn-deadline').value = dateStr;
      state.assignment.deadline = dateStr;
      updateDeadlinePill();
      scheduleSave();
      showToast(`📅 Deadline set to ${dateStr}`);
      return;
    }
  }
  
  showToast('⚠️ No clear deadline found in analysis');
}

function createChecklistFromRubric(content) {
  const lines = content.split('\n');
  const checklistItems = [];
  
  const checklistStart = lines.findIndex(l => l.includes('CHECKLIST') || l.includes('Before you submit'));
  
  if (checklistStart !== -1) {
    for (let i = checklistStart + 1; i < lines.length && i < checklistStart + 30; i++) {
      const line = lines[i].trim();
      if (line.match(/^[-☐✓•*]\s+/) || line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^[-☐✓•*\d.]\s*/, '').trim();
        if (text.length > 10 && text.length < 200) {
          checklistItems.push(text);
        }
      }
      if (line.startsWith('#')) break;
    }
  }
  
  if (checklistItems.length === 0) {
    lines.forEach(line => {
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^[-•*\d.]\s*/, '').replace(/\*\*/g, '').trim();
        if (text.length > 15 && text.length < 200 && !text.startsWith('#')) {
          checklistItems.push(text);
        }
      }
    });
  }
  
  if (checklistItems.length === 0) {
    showToast('⚠️ No checklist items found in rubric');
    return;
  }
  
  let added = 0;
  checklistItems.slice(0, 15).forEach(text => {
    const id = 'rubric-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    if (!Object.values(state.checklist).includes(text)) {
      state.checklist[id] = false;
      added++;
    }
  });
  
  scheduleSave();
  renderChecklist();
  showToast(`✅ Added ${added} criteria to checklist!`);
}

function applyThesisToNotes(content) {
  const lines = content.split('\n');
  let thesis = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Thesis:') || line.includes('Option 1:')) {
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const candidate = lines[j].replace(/^\*\*Thesis:\*\*|^Thesis:/i, '').trim();
        if (candidate && !candidate.startsWith('#') && !candidate.includes('Option') && candidate.length > 20) {
          thesis = candidate.replace(/^["']|["']$/g, '');
          break;
        }
      }
      if (thesis) break;
    }
  }
  
  if (!thesis) {
    showToast('⚠️ No thesis statement found');
    return;
  }
  
  if (state.outline.length === 0) {
    const introSection = {
      id: crypto.randomUUID(),
      title: 'Introduction',
      words: Math.round((state.assignment.totalWords || 2000) * 0.1)
    };
    state.outline.unshift(introSection);
    state.notes[introSection.id] = { content: '', citations: [] };
  }
  
  const firstSection = state.outline[0];
  if (!state.notes[firstSection.id]) {
    state.notes[firstSection.id] = { content: '', citations: [] };
  }
  
  const thesisNote = `📝 **THESIS STATEMENT**\n${thesis}\n\n---\n\n`;
  
  if (!state.notes[firstSection.id].content.includes(thesis)) {
    state.notes[firstSection.id].content = thesisNote + state.notes[firstSection.id].content;
    scheduleSave();
    renderOutline();
    showToast(`💡 Thesis added to "${firstSection.title}" notes!`);
  } else {
    showToast('ℹ️ Thesis already in notes');
  }
}


// ─── AI Draft Checker ─────────────────────────────────────────────────────────
async function aiCheckDraft() {
  const text = document.getElementById('checker-textarea').value.trim();
  if (!text) {
    showToast('⚠️ Paste your draft text first.');
    return;
  }

  // Show model selection popup
  const model = await showModelSelectionPopup('Select Model for Draft Checking', selectedAiModel);
  if (!model) return;
  
  selectedAiModel = model;

  const btn = document.getElementById('ai-checker-btn');
  const resultsEl = document.getElementById('checker-results');
  const wordCount = text.split(/\s+/).length;
  const brief = state.assignment.brief?.trim() || '';
  
  btn.textContent = '⏳ Checking…';
  btn.disabled = true;

  const outDiv = document.createElement('div');
  outDiv.style.cssText = 'font-size:0.875rem;line-height:1.9;color:var(--text)';
  outDiv.innerHTML = '<span style="color:var(--muted)">Reading draft…</span>';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px';
  
  const meta = document.createElement('p');
  meta.style.cssText = 'color:var(--muted);font-size:0.75rem;margin:0 0 12px';
  meta.textContent = `AI Feedback · ${wordCount.toLocaleString()} words · ${model}`;
  
  wrapper.appendChild(meta);
  wrapper.appendChild(outDiv);
  resultsEl.innerHTML = '';
  resultsEl.appendChild(wrapper);

  const prompt = `You are a strict academic checker. Return ONLY direct feedback on the student's draft.

Rules:
- Do NOT invent a persona, greeting, signature, or commentary.
- Do NOT write as a teacher, lecturer, or named person.
- Do NOT add "Dear student" or any salutation.
- Do NOT include markdown headings beyond the six required sections.
- Be factual, concise, and specific.

Use exactly these six headings:
1. Brief Alignment
2. Academic Tone
3. Argument & Structure
4. Cohesion & Flow
5. Citation Gaps
6. Overall & Grade Estimate

BRIEF:
${brief || 'Not provided'}

DRAFT:
${text}`;

  let full = '';
  outDiv.innerHTML = '';
  
  ollamaStream(
    model,
    prompt,
    (chunk) => {
      full += chunk;
      outDiv.innerHTML = renderMarkdown(full);
    },
    () => {
      showToast('✅ Check complete!');
      btn.textContent = '✨ AI Check';
      btn.disabled = false;
    },
    (err) => {
      outDiv.innerHTML = `<span style="color:var(--rose)">Error: ${escHtml(err)}</span>`;
      btn.textContent = '✨ AI Check';
      btn.disabled = false;
    }
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
  if (!state.outline.length) {
    showToast('⚠️ Build your outline first');
    return;
  }

  // ✨ NEW: Show model selection popup
  const model = await showModelSelectionPopup('Select Model for Draft Generation', selectedAiModel);
  if (!model) return; // User cancelled
  
  selectedAiModel = model;

  const isFull = await appConfirm(
    'Generate full draft?\n\n' +
    '✅ YES = Complete paragraphs for each section\n' +
    '📝 NO = Opening paragraphs only (faster)'
  );

  const genBtn = document.getElementById('draft-generate-btn');
  const stopBtn = document.getElementById('draft-stop-btn');
  const output = document.getElementById('draft-output');
  const total = state.outline.length;
  let stopped = false;
  
  window._draftStop = () => {
    stopped = true;
    window.api.removeAllOllamaListeners();
    stopBtn.style.display = 'none';
    genBtn.style.display = '';
  };
  
  genBtn.style.display = 'none';
  stopBtn.style.display = '';

  output.innerHTML = `
    <div id="dp-wrap" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:0.8rem;color:var(--text);font-weight:600;margin-bottom:4px">🤖 Using: ${escHtml(model)}</div>
          <div id="dp-label" style="font-size:0.75rem;color:var(--muted)">Starting…</div>
        </div>
        <span id="dp-count" style="font-size:0.75rem;color:var(--muted)">0 / ${total}</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:4px;overflow:hidden">
        <div id="dp-fill" style="height:100%;width:0%;background:var(--accent);border-radius:4px;transition:width 0.4s"></div>
      </div>
    </div>
    ${state.outline.map((s, i) => `
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
function reattachAnalysisListeners() {
  // Re-run button
  const rerunBtn = document.getElementById('rerun-analysis');
  if (rerunBtn) {
    rerunBtn.addEventListener('click', async () => {
      const model = await showModelSelectionPopup('Select Model for Brief Analysis', selectedAiModel);
      if (!model) return;
      selectedAiModel = model;
      runBriefAnalysis(model);
    });
  }

  // Generate buttons for each analysis type
  const generateBtns = document.querySelectorAll('[id^="gen-"]');
  generateBtns.forEach(btn => {
    const type = btn.id.replace('gen-', '');
    btn.addEventListener('click', async () => {
      const model = await showModelSelectionPopup(`Generate ${type.charAt(0).toUpperCase() + type.slice(1)}`, selectedAiModel);
      if (!model) return;
      selectedAiModel = model;
      
      // Call appropriate generation function
      if (type === 'research') generateResearchPlan(model);
      else if (type === 'timeline') generateTimeline(model);
      else if (type === 'rubric') generateRubric(model);
      else if (type === 'arguments') generateArguments(model);
    });
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
init();