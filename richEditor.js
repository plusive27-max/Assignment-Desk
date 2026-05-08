// ═══════════════════════════════════════════════════════════════
// RICH TEXT EDITOR - Assignment Desk
// ═══════════════════════════════════════════════════════════════

const ACADEMIC_PHRASES = {
  'Introducing an Argument': [
    'This essay will argue that',
    'This report aims to demonstrate that',
    'The central argument of this essay is that',
    'This paper will critically examine',
    'It will be argued throughout this essay that',
    'The primary purpose of this essay is to',
    'This essay seeks to explore the extent to which',
    'The key aim of this report is to analyse',
    'This essay contends that',
    'The following argument will seek to establish that',
    'This paper will evaluate the claim that',
    'This essay will consider whether',
  ],
  'Stating a Position': [
    'It is argued here that',
    'This essay takes the position that',
    'The present author contends that',
    'It is the contention of this essay that',
    'This analysis supports the view that',
    'The evidence presented here suggests that',
    'It will be shown that',
    'This essay maintains that',
    'A key argument to be made here is that',
    'This report takes the view that',
  ],
  'Introducing Evidence': [
    'According to',
    'As noted by',
    'As highlighted by',
    'As argued by',
    'As stated by',
    'As demonstrated by',
    'As evidenced by',
    'Research conducted by',
    'A study by',
    'Findings from',
    'Data from',
    'Evidence from',
    'In a study conducted by',
    'A survey carried out by',
    'Research published by',
    'Statistical evidence from',
    'Empirical evidence suggests that',
    'The research of',
    'The findings of',
    'The work of',
  ],
  'Referring to Sources': [
    'As cited in',
    'As discussed by',
    'As outlined by',
    'As explored by',
    'As described by',
    'As theorised by',
    'As proposed by',
    'As suggested by',
    'As defined by',
    'As identified by',
    'As noted by several scholars',
    'A number of authors have argued that',
    'Several studies have found that',
    'A growing body of literature suggests',
    'Scholars such as',
    'Researchers including',
    'Theorists such as',
    'Academic literature suggests that',
    'The literature indicates that',
    'Existing research demonstrates that',
    'Previous studies have shown that',
    'There is a broad consensus that',
  ],
  'Adding a Point': [
    'Furthermore,',
    'Moreover,',
    'In addition,',
    'Additionally,',
    'It should also be noted that',
    'It is also worth noting that',
    'A further point to consider is',
    'This is further supported by',
    'Building on this point,',
    'Alongside this,',
    'Equally important is the fact that',
    'Another significant factor is',
    'A further consideration is',
    'On a related note,',
    'This point is reinforced by',
    'Crucially,',
    'Significantly,',
    'Of particular relevance here is',
    'It is particularly noteworthy that',
  ],
  'Contrasting and Conceding': [
    'However,',
    'Nevertheless,',
    'Nonetheless,',
    'In contrast,',
    'On the other hand,',
    'Conversely,',
    'Despite this,',
    'Despite the fact that',
    'Although this may be the case,',
    'While it is true that',
    'Whereas',
    'Yet it must be acknowledged that',
    'Notwithstanding this,',
    'Even so,',
    'That said,',
    'It should be acknowledged that',
    'While there is some merit in this view,',
    'Although this argument has some validity,',
    'Whilst acknowledging that',
    'It could be counter-argued that',
    'A counterargument to this is that',
    'Critics of this view argue that',
    'Opponents of this position suggest that',
    'Some scholars dispute this, arguing that',
  ],
  'Cause and Effect': [
    'As a result,',
    'As a consequence,',
    'Consequently,',
    'Therefore,',
    'Thus,',
    'Hence,',
    'This leads to',
    'This results in',
    'This contributes to',
    'This gives rise to',
    'This has implications for',
    'This has a significant impact on',
    'One consequence of this is',
    'A direct result of this is',
    'This can be attributed to',
    'This stems from',
    'This is largely due to',
    'The primary cause of this is',
    'A significant factor contributing to this is',
    'This is compounded by the fact that',
  ],
  'Explaining and Clarifying': [
    'In other words,',
    'That is to say,',
    'To put it another way,',
    'To clarify,',
    'More specifically,',
    'To elaborate,',
    'This means that',
    'This suggests that',
    'This implies that',
    'This indicates that',
    'This demonstrates that',
    'This illustrates that',
    'This can be understood as',
    'This can be interpreted as',
    'This highlights the fact that',
    'This underlines the importance of',
    'This reflects the notion that',
    'Put simply,',
    'In essence,',
    'At its core,',
  ],
  'Giving Examples': [
    'For example,',
    'For instance,',
    'To illustrate,',
    'As an illustration,',
    'By way of example,',
    'A clear example of this is',
    'A notable example is',
    'This is exemplified by',
    'This can be seen in the case of',
    'This is evident in',
    'This is demonstrated by',
    'Consider, for example,',
    'One such example is',
    'A prime example of this is',
    'This is particularly evident in',
    'This is reflected in',
    'To provide a concrete example,',
  ],
  'Comparing': [
    'Similarly,',
    'Likewise,',
    'In the same way,',
    'In a similar vein,',
    'By comparison,',
    'Compared to',
    'In comparison with',
    'This is comparable to',
    'This mirrors',
    'This parallels',
    'Much like',
    'Just as',
    'Both',
    'A similar pattern can be observed in',
    'This is consistent with the findings of',
    'This aligns with the view that',
    'This is in line with',
    'This corroborates the argument that',
    'This supports the position that',
  ],
  'Hedging Language': [
    'It could be argued that',
    'It might be suggested that',
    'It would appear that',
    'It seems likely that',
    'It is possible that',
    'It is plausible that',
    'It is reasonable to suggest that',
    'There is some evidence to suggest that',
    'This may suggest that',
    'This might indicate that',
    'To some extent,',
    'In some respects,',
    'It could be contended that',
    'One could argue that',
    'There is reason to believe that',
    'It appears that',
    'The evidence tentatively suggests that',
    'It is broadly accepted that',
    'It is widely acknowledged that',
    'It is generally agreed that',
    'It is commonly understood that',
  ],
  'Critical Analysis': [
    'A critical analysis of this reveals',
    'A closer examination of this suggests',
    'Upon closer inspection,',
    'It is important to critically evaluate',
    'This raises the question of whether',
    'This challenges the assumption that',
    'This calls into question the notion that',
    'This problematises the idea that',
    'The limitations of this argument are',
    'A weakness of this approach is',
    'A key criticism of this view is',
    'This argument fails to account for',
    'This overlooks the significance of',
    'This does not fully address',
    'Whilst compelling, this argument',
    'This perspective is limited in that',
    'This analysis is constrained by',
    'It is necessary to interrogate',
    'This warrants further investigation',
    'This requires more nuanced consideration',
  ],
  'Signposting': [
    'This section will examine',
    'This section will explore',
    'This section will consider',
    'The following section will discuss',
    'Having established that',
    'Having considered',
    'As previously discussed,',
    'As outlined above,',
    'As mentioned earlier,',
    'Returning to the central argument,',
    'Building on the above discussion,',
    'Turning now to',
    'With this in mind,',
    'In light of this,',
    'Against this backdrop,',
    'In the context of',
    'With regard to',
    'With respect to',
    'In relation to',
    'In terms of',
  ],
  'Concluding': [
    'In conclusion,',
    'To conclude,',
    'In summary,',
    'To summarise,',
    'Overall,',
    'On balance,',
    'Taking everything into consideration,',
    'Having examined the evidence,',
    'The evidence presented in this essay suggests that',
    'This essay has argued that',
    'This essay has demonstrated that',
    'This essay has sought to show that',
    'The analysis above has shown that',
    'The foregoing analysis has demonstrated that',
    'It can therefore be concluded that',
    'It is clear from the above that',
    'The weight of evidence suggests that',
    'The findings of this essay indicate that',
    'Ultimately,',
    'This essay has critically examined',
    'As this essay has shown,',
    'In light of the evidence presented,',
  ],
  'Recommendations': [
    'It is recommended that',
    'It is suggested that',
    'It would be beneficial to',
    'Future research should consider',
    'Further investigation is needed into',
    'It would be worth exploring',
    'There is scope for further research into',
    'Policy makers should consider',
    'Organisations should seek to',
    'A more effective approach would be to',
    'Steps should be taken to',
    'It is essential that',
    'It is imperative that',
    'Greater attention should be paid to',
    'It is advisable to',
  ],
  'Defining Terms': [
    'For the purposes of this essay,',
    'As defined by',
    'The term',
    'The concept of',
    'The notion of',
    'According to the Oxford English Dictionary,',
    'can be defined as',
    'is broadly understood to mean',
    'is commonly defined as',
    'refers to',
    'encompasses',
    'is characterised by',
    'is understood in this essay to mean',
    'is a contested term that',
    'has been variously defined as',
  ],
  'Referencing in Text': [
    'cited in',
    'as cited by',
    'quoted in',
    'as quoted in',
    'paraphrased from',
    'drawing on the work of',
    'following the framework of',
    'using the model proposed by',
    'applying the theory of',
    'building on the concept developed by',
  ],
};

class RichEditor {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    this.editorDiv = null;
    this.toolbar = null;
    this.statusBar = null;
    this.init();
  }

  init() {
    try {
      const container = document.createElement('div');
      container.className = 'editor-wrapper';
      this.element.appendChild(container);

      this.toolbar = this.createToolbar();
      container.appendChild(this.toolbar);

      const editorContainer = document.createElement('div');
      editorContainer.className = 'editor-content-wrapper';
      container.appendChild(editorContainer);

      this.editorDiv = document.createElement('div');
      this.editorDiv.className = 'simple-editor';
      this.editorDiv.contentEditable = 'true';
      this.editorDiv.setAttribute('spellcheck', 'true');
      this.editorDiv.style.cssText = `
        min-height: 400px;
        padding: 20px;
        outline: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: var(--text-primary);
      `;

      if (this.options.placeholder) {
        this.editorDiv.dataset.placeholder = this.options.placeholder;
      }
      if (this.options.content) {
        this.editorDiv.innerHTML = this.options.content;
      }

      editorContainer.appendChild(this.editorDiv);

      this.statusBar = this.createStatusBar();
      container.appendChild(this.statusBar);

      this.attachToolbarHandlers();

      this.editorDiv.addEventListener('input', () => {
        this.updateStatusBar();
        if (this.options.onUpdate) {
          this.options.onUpdate(this.getHTML(), this.getText());
        }
      });

      this.updateStatusBar();

      // ── Init features AFTER editorDiv is in the DOM ──
      this.setupAutocorrect();
      this.setupAutocomplete();

      console.log('Rich Editor initialized successfully!');
    } catch (error) {
      console.error('Editor initialization error:', error);
      this.element.innerHTML = `<p style="color:red;padding:20px">Error: ${error.message}</p>`;
    }
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
        <button class="toolbar-btn" data-cmd="italic" title="Italic (Ctrl+I)"><em>I</em></button>
        <button class="toolbar-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
        <button class="toolbar-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="formatBlock" data-value="h1" title="Heading 1">H1</button>
        <button class="toolbar-btn" data-cmd="formatBlock" data-value="h2" title="Heading 2">H2</button>
        <button class="toolbar-btn" data-cmd="formatBlock" data-value="h3" title="Heading 3">H3</button>
        <button class="toolbar-btn" data-cmd="formatBlock" data-value="p" title="Paragraph">P</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="insertUnorderedList" title="Bullet List">• List</button>
        <button class="toolbar-btn" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="justifyLeft" title="Align Left">&#8676;</button>
        <button class="toolbar-btn" data-cmd="justifyCenter" title="Align Center">&#8596;</button>
        <button class="toolbar-btn" data-cmd="justifyRight" title="Align Right">&#8677;</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="formatBlock" data-value="blockquote" title="Quote">"</button>
        <button class="toolbar-btn" data-cmd="insertHorizontalRule" title="Horizontal Line">&#8212;</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="undo" title="Undo (Ctrl+Z)">&#8630;</button>
        <button class="toolbar-btn" data-cmd="redo" title="Redo (Ctrl+Y)">&#8631;</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="removeFormat" title="Clear Formatting">&#x2715; Clear</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-cmd="grammarCheck" title="AI Grammar Check">&#10003; Check</button>
      </div>
    `;
    return toolbar;
  }

  createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'editor-status-bar';
    statusBar.innerHTML = `
      <span class="status-item status-word-count">0 words</span>
      <span class="status-divider"></span>
      <span class="status-item status-char-count">0 characters</span>
      <span class="status-divider"></span>
      <span class="status-item status-reading-time">0 min read</span>
    `;
    return statusBar;
  }

  attachToolbarHandlers() {
    this.toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const value = btn.dataset.value || null;

        if (cmd === 'grammarCheck') {
          this.runGrammarCheck(btn);
          return;
        }
        if (cmd === 'undo' || cmd === 'redo') {
          document.execCommand(cmd, false, null);
        } else if (value) {
          document.execCommand(cmd, false, value);
        } else {
          document.execCommand(cmd, false, null);
        }
        this.editorDiv.focus();
      });
    });
  }

  updateStatusBar() {
    if (!this.editorDiv || !this.statusBar) return;
    try {
      const text = this.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;
      const readingTime = Math.ceil(words / 200) || 0;
      const wordCount = this.statusBar.querySelector('.status-word-count');
      const charCount = this.statusBar.querySelector('.status-char-count');
      const readTime = this.statusBar.querySelector('.status-reading-time');
      if (wordCount) wordCount.textContent = `${words.toLocaleString()} words`;
      if (charCount) charCount.textContent = `${characters.toLocaleString()} characters`;
      if (readTime) readTime.textContent = `${readingTime} min read`;
    } catch (error) {
      console.error('Error updating status bar:', error);
    }
  }

  getHTML() { return this.editorDiv ? this.editorDiv.innerHTML : ''; }
  getText() { return this.editorDiv ? this.editorDiv.textContent : ''; }
  getWordCount() { const t = this.getText().trim(); return t ? t.split(/\s+/).length : 0; }

  setContent(html) {
    if (this.editorDiv) {
      this.editorDiv.innerHTML = html;
      this.updateStatusBar();
    }
  }

  // ─── Grammar Check ────────────────────────────────────────────

  async runGrammarCheck(btn) {
    const text = this.getText().trim();
    if (!text) return;
    const orig = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;

    let availableModels = [];
    try {
      if (window.api?.ollamaFetch) {
        const tagsRes = await window.api.ollamaFetch('/api/tags', null);
        if (tagsRes.ok) {
          const tagsData = JSON.parse(tagsRes.text);
          availableModels = (tagsData.models || []).map(m => m.name);
        }
      }
    } catch (e) {}

    const model = (window._lastGrammarModel && availableModels.includes(window._lastGrammarModel))
      ? window._lastGrammarModel
      : (availableModels[0] || 'llama3.2');
    window._lastGrammarModel = model;

    try {
      if (window.api?.ollamaFetch && availableModels.length > 0) {
        const prompt = `You are a spelling and grammar checker. Check this text for ALL errors including spelling mistakes, grammar errors, punctuation errors and typos.
Return ONLY a raw JSON array. No markdown, no code blocks, no explanation.
Format: [{"original":"wrong word","suggestion":"correct word","reason":"what is wrong"}]
If no errors, return exactly: []
TEXT: """${text.substring(0, 2000)}"""`;

        const res = await window.api.ollamaFetch('/api/generate', { model, prompt, stream: false });
        if (res.ok) {
          const data = JSON.parse(res.text);
          const match = (data.response || '').match(/\[[\s\S]*?\]/);
          try {
            const suggestions = match ? JSON.parse(match[0]) : [];
            this.showGrammarPopup(suggestions, btn, availableModels);
          } catch (e) {
            this.showGrammarPopup(this.basicGrammarCheck(text), btn, availableModels);
          }
        } else {
          this.showGrammarPopup(this.basicGrammarCheck(text), btn, availableModels);
        }
      } else {
        this.showGrammarPopup(this.basicGrammarCheck(text), btn, []);
      }
    } catch (e) {
      console.error('Grammar check error:', e);
      this.showGrammarPopup(this.basicGrammarCheck(text), btn, []);
    }

    btn.textContent = orig;
    btn.disabled = false;
  }

  basicGrammarCheck(text) {
    const found = [];
    const rules = [
      [/\b(a)\s+([aeiouAEIOU])/g, (m, a, b) => `an ${b}`, 'Use "an" before vowel sounds'],
      [/([.!?])\s+([a-z])/g, (m, p, l) => `${p} ${l.toUpperCase()}`, 'Start sentence with capital'],
      [/\b(dont|cant|wont|isnt|wasnt|arent|doesnt|didnt|couldnt|shouldnt|wouldnt)\b/gi,
        m => m.replace(/nt$/i, "n't"), 'Missing apostrophe'],
      [/\s{2,}/g, ' ', 'Extra whitespace'],
      [/ ,/g, ',', 'Space before comma'],
    ];
    rules.forEach(([pattern, fix, reason]) => {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null && found.length < 10) {
        const original = match[0];
        const suggestion = typeof fix === 'string' ? fix : fix(...match);
        if (original !== suggestion) found.push({ original, suggestion, reason });
      }
    });
    return found;
  }

  showGrammarPopup(suggestions, anchorBtn, availableModels = []) {
    document.getElementById('grammar-popup')?.remove();
    const popup = document.createElement('div');
    popup.id = 'grammar-popup';
    popup.style.cssText = `
      position:fixed;z-index:99999;
      background:var(--surface2,#1e1e2e);
      border:1px solid var(--border,#45475a);
      border-radius:10px;padding:14px;
      min-width:340px;max-width:440px;max-height:70vh;overflow-y:auto;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
      font-size:0.85rem;color:var(--text,#cdd6f4);
    `;

    if (!suggestions.length) {
      popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--green,#a6e3a1)">&#10003; No grammar issues found!</span>
          <button id="grammar-close" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:1rem">&#x2715;</button>
        </div>`;
    } else {
      const modelOpts = availableModels.length
        ? availableModels.map(m => `<option value="${m}" ${m === (window._lastGrammarModel||'') ? 'selected':''}>${m}</option>`).join('')
        : `<option value="">No models</option>`;
      popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <strong>&#128221; ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}</strong>
          <div style="display:flex;gap:6px;align-items:center">
            <select id="grammar-model-sel" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.75rem">${modelOpts}</select>
            <button id="grammar-close" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem">&#x2715;</button>
          </div>
        </div>
        <div id="grammar-list"></div>
        <button id="grammar-apply-all" style="width:100%;margin-top:10px;background:var(--accent,#89b4fa);border:none;color:#1e1e2e;padding:8px;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem">Apply All Suggestions</button>`;

      const list = popup.querySelector('#grammar-list');
      suggestions.forEach((s, i) => {
        const item = document.createElement('div');
        item.dataset.idx = i;
        item.style.cssText = 'border:1px solid var(--border);border-radius:6px;padding:10px;margin-bottom:8px';
        item.innerHTML = `
          <div style="margin-bottom:4px;line-height:1.4">
            <span style="text-decoration:line-through;color:var(--rose,#f38ba8)">${s.original}</span>
            <span style="color:var(--muted)"> → </span>
            <span style="color:var(--green,#a6e3a1);font-weight:500">${s.suggestion}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">${s.reason}</div>
          <button class="grammar-apply-one" style="background:var(--accent,#89b4fa);border:none;color:#1e1e2e;padding:3px 12px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Apply</button>`;
        list.appendChild(item);
      });

      popup.querySelector('#grammar-model-sel')?.addEventListener('change', e => {
        window._lastGrammarModel = e.target.value;
      });
      popup.querySelector('#grammar-apply-all').addEventListener('click', () => {
        let html = this.getHTML();
        suggestions.forEach(s => { html = html.split(s.original).join(s.suggestion); });
        this.setContent(html);
        popup.remove();
      });
      popup.querySelectorAll('.grammar-apply-one').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = suggestions[+btn.closest('[data-idx]').dataset.idx];
          let html = this.getHTML();
          html = html.replace(s.original, s.suggestion);
          this.setContent(html);
          btn.closest('[data-idx]').remove();
          if (!popup.querySelectorAll('.grammar-apply-one').length) popup.remove();
        });
      });
    }

    popup.querySelector('#grammar-close')?.addEventListener('click', () => popup.remove());
    const rect = anchorBtn.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 6}px`;
    popup.style.left = `${Math.max(10, Math.min(rect.left, window.innerWidth - 460))}px`;
    document.body.appendChild(popup);
    setTimeout(() => {
      document.addEventListener('click', function h(e) {
        if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', h); }
      });
    }, 100);
  }

  // ─── Autocorrect ──────────────────────────────────────────────

  setupAutocorrect() {
    this._corrections = {
      'teh':'the','hte':'the','thier':'their','recieve':'receive',
      'beleive':'believe','seperate':'separate','occured':'occurred',
      'occurance':'occurrence','accomodate':'accommodate','neccessary':'necessary',
      'necesary':'necessary','begining':'beginning','definately':'definitely',
      'defenitely':'definitely','existance':'existence','independant':'independent',
      'knowlege':'knowledge','maintainance':'maintenance','mispell':'misspell',
      'occassion':'occasion','persue':'pursue','proffesional':'professional',
      'reccomend':'recommend','refered':'referred','relevent':'relevant',
      'remeber':'remember','responsability':'responsibility','sentance':'sentence',
      'succesful':'successful','tommorow':'tomorrow','tomorrrow':'tomorrow',
      'untill':'until','wether':'whether','writting':'writing','arguement':'argument',
      'calender':'calendar','carribean':'caribbean','cemetary':'cemetery',
      'collossal':'colossal','commitee':'committee','concious':'conscious',
      'consciencious':'conscientious','enviroment':'environment','excercise':'exercise',
      'febuary':'february','goverment':'government','grammer':'grammar',
      'harrase':'harass','imaginery':'imaginary','innoculate':'inoculate',
      'liason':'liaison','medival':'medieval','milennium':'millennium',
      'noticable':'noticeable','occurence':'occurrence','pavillion':'pavilion',
      'persistant':'persistent','phenomenom':'phenomenon','plateua':'plateau',
      'priviledge':'privilege','publically':'publicly','questionaire':'questionnaire',
      'restaraunt':'restaurant','rythm':'rhythm','sieze':'seize','speach':'speech',
      'supercede':'supersede','therefor':'therefore','threshhold':'threshold',
      'tounge':'tongue','truely':'truly','tyrany':'tyranny','vaccuum':'vacuum',
      'visious':'vicious','wierd':'weird','wellcome':'welcome','woud':'would',
      'coudl':'could','shoudl':'should','cna':'can','nad':'and','adn':'and',
      'taht':'that','waht':'what','aprorpiate':'appropriate',
      'approriate':'appropriate','becuase':'because','beacuse':'because',
      'becasue':'because','alot':'a lot','infact':'in fact',
    };
    this._autocorrectChip = null;
    this._chipTimer = null;

    this.editorDiv.addEventListener('keyup', e => {
      const triggers = [' ', 'Enter', '.', ',', '!', '?', ';', ':'];
      if (!triggers.includes(e.key)) return;
      this._checkLastWord();
    });

    document.addEventListener('click', e => {
      if (this._autocorrectChip && !this._autocorrectChip.contains(e.target)) {
        this._dismissChip();
      }
    });
  }

  _checkLastWord() {
    const text = this.editorDiv.innerText || '';
    const words = text.trimEnd().split(/\s+/);
    const lastWord = words[words.length - 1]?.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (!lastWord || lastWord.length < 3) { this._dismissChip(); return; }
    const correction = this._corrections[lastWord];
    if (!correction) { this._dismissChip(); return; }
    this._showAutocorrectChip(lastWord, correction);
  }

  _showAutocorrectChip(original, correction) {
    this._dismissChip();
    const chip = document.createElement('div');
    chip.id = 'autocorrect-chip';
    chip.style.cssText = `
      position:fixed;z-index:99998;
      background:var(--surface2,#313244);
      border:1px solid var(--accent,#89b4fa);
      border-radius:20px;padding:5px 14px;
      font-size:0.8rem;color:var(--text,#cdd6f4);
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
      display:flex;align-items:center;gap:10px;
      cursor:default;user-select:none;
    `;
    chip.innerHTML = `
      <span style="color:var(--muted);text-decoration:line-through;font-size:0.75rem">${original}</span>
      <span style="color:var(--accent,#89b4fa)">→</span>
      <span id="chip-suggestion" style="font-weight:600;cursor:pointer" title="Click to apply">${correction}</span>
      <span id="chip-dismiss" style="color:var(--muted);cursor:pointer;font-size:1rem;line-height:1" title="Dismiss">&#x2715;</span>
    `;
    const rect = this.editorDiv.getBoundingClientRect();
    chip.style.bottom = `${window.innerHeight - rect.bottom + 10}px`;
    chip.style.left = `${rect.left + 16}px`;
    chip.querySelector('#chip-suggestion').addEventListener('click', () => this._applyCorrection(original, correction));
    chip.querySelector('#chip-dismiss').addEventListener('click', () => this._dismissChip());
    document.body.appendChild(chip);
    this._autocorrectChip = chip;
    this._chipTimer = setTimeout(() => this._dismissChip(), 6000);
  }

  _applyCorrection(original, correction) {
    const html = this.getHTML();
    const regex = new RegExp(`\\b${original}\\b`, 'i');
    const corrected = html.replace(regex, match =>
      match[0] === match[0].toUpperCase()
        ? correction.charAt(0).toUpperCase() + correction.slice(1)
        : correction
    );
    this.setContent(corrected);
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(this.editorDiv);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    this._dismissChip();
  }

  _dismissChip() {
    clearTimeout(this._chipTimer);
    this._autocorrectChip?.remove();
    this._autocorrectChip = null;
  }

  // ─── Academic Phrase Autocomplete ────────────────────────────

  setupAutocomplete() {
    this._acPopup       = null;
    this._acSuggestions = [];
    this._acIndex       = 0;
    this._acTypedText   = '';
    this._acTimer       = null;
    this._acBlurTimer   = null;
    this._acNode        = null;
    this._acNodeOffset  = -1;
    this._allPhrases    = Object.values(ACADEMIC_PHRASES).flat();

    // Input: schedule phrase check
    this.editorDiv.addEventListener('input', () => {
      clearTimeout(this._acTimer);
      this._acTimer = setTimeout(() => this._acCheck(), 150);
    });

    // Use DOCUMENT-level capture so Tab is caught before Electron/browser steals it
    this._docKeyHandler = (e) => {
      if (!this._acPopup) return;
      // Only act if our editor is the active element
      const active = document.activeElement;
      if (active !== this.editorDiv && !this.editorDiv.contains(active)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._acIndex = (this._acIndex + 1) % this._acSuggestions.length;
        this._acHighlight(); return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._acIndex = (this._acIndex - 1 + this._acSuggestions.length) % this._acSuggestions.length;
        this._acHighlight(); return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const phrase = this._acSuggestions[this._acIndex];
        const typed  = this._acTypedText;
        const node   = this._acNode;
        const offset = this._acNodeOffset;
        this._acClose();
        if (phrase && typed) this._acInsert(phrase, typed, node, offset);
        return;
      }
      if (e.key === 'Escape') { this._acClose(); return; }
    };
    document.addEventListener('keydown', this._docKeyHandler, true);

    // Blur: cancel if editor refocused quickly (e.g. clicking popup item)
    this.editorDiv.addEventListener('focus', () => clearTimeout(this._acBlurTimer));
    this.editorDiv.addEventListener('blur',  () => {
      this._acBlurTimer = setTimeout(() => this._acClose(), 300);
    });

    document.addEventListener('click', e => {
      if (this._acPopup && !this._acPopup.contains(e.target)) this._acClose();
    });
  }

  _acGetTyped() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return { text: '', node: null, offset: -1 };

    const range = sel.getRangeAt(0);
    let node   = range.startContainer;
    let offset = range.startOffset;

    // If cursor is at element level, dig into the nearest text node
    if (node.nodeType !== Node.TEXT_NODE) {
      // Try the child just before cursor
      const prev = node.childNodes[offset - 1];
      if (prev?.nodeType === Node.TEXT_NODE) {
        node = prev; offset = node.textContent.length;
      } else {
        // Walk backwards through all text nodes in editor to find last one
        const walker = document.createTreeWalker(this.editorDiv, NodeFilter.SHOW_TEXT, null);
        let last = null, n;
        while ((n = walker.nextNode())) last = n;
        if (!last) return { text: '', node: null, offset: -1 };
        node = last; offset = node.textContent.length;
      }
    }

    if (!this.editorDiv.contains(node)) return { text: '', node: null, offset: -1 };

    const textBefore = node.textContent.substring(0, offset);
    const match      = textBefore.match(/([A-Za-z][A-Za-z ,'`\-]{2,})$/);
    return { text: match ? match[0] : '', node, offset };
  }

  _acCheck() {
    const { text, node, offset } = this._acGetTyped();
    if (!text || text.trim().length < 3) { this._acClose(); return; }

    const lower   = text.toLowerCase();
    const primary = this._allPhrases.filter(p =>
      p.toLowerCase().startsWith(lower) && p.toLowerCase().trim() !== lower.trim()
    );
    const secondary = lower.length >= 5
      ? this._allPhrases.filter(p =>
          !p.toLowerCase().startsWith(lower) && p.toLowerCase().includes(lower))
      : [];

    const all = [...primary, ...secondary].slice(0, 8);
    if (!all.length) { this._acClose(); return; }

    this._acNode        = node;
    this._acNodeOffset  = offset;
    this._acSuggestions = all;
    this._acIndex       = 0;
    this._acTypedText   = text;
    this._acShowPopup(all);
  }

  _acShowPopup(suggestions) {
    // Only remove old popup DOM — do NOT call _acClose() as that wipes _acTypedText/_acNode
    this._acPopup?.remove();
    this._acPopup = null;
    const popup = document.createElement('div');
    popup.id = 'ac-popup';
    popup.style.cssText = `
      position:fixed;z-index:99997;
      background:var(--surface2,#1e1e2e);
      border:1px solid var(--accent,#89b4fa);
      border-radius:8px;
      box-shadow:0 8px 24px rgba(0,0,0,0.5);
      min-width:280px;max-width:520px;max-height:260px;overflow-y:auto;
      padding:4px;font-size:0.82rem;
    `;

    suggestions.forEach((phrase, i) => {
      const item = document.createElement('div');
      item.className   = 'ac-item';
      item.dataset.idx = String(i);
      const tl = this._acTypedText.trimStart().length;
      item.style.cssText = `
        padding:7px 10px;cursor:pointer;border-radius:5px;
        color:var(--text,#cdd6f4);white-space:nowrap;
        overflow:hidden;text-overflow:ellipsis;
        display:flex;align-items:center;gap:6px;
        ${i === 0 ? 'background:var(--surface3,rgba(137,180,250,0.1))' : ''}
      `;
      item.innerHTML = `
        <span style="color:var(--muted,#6c7086);font-size:0.7rem;flex-shrink:0">&#182;</span>
        <span><strong style="color:var(--accent,#89b4fa)">${phrase.substring(0,tl)}</strong>${phrase.substring(tl)}</span>`;

      item.addEventListener('mousedown', e => {
        e.preventDefault(); // keep editor focused
        const p2 = suggestions[i];
        const t2 = this._acTypedText;
        const n2 = this._acNode;
        const o2 = this._acNodeOffset;
        this._acClose();
        if (p2 && t2) this._acInsert(p2, t2, n2, o2);
      });
      popup.appendChild(item);
    });

    const hint = document.createElement('div');
    hint.style.cssText = `padding:4px 10px;font-size:0.7rem;color:var(--muted,#6c7086);border-top:1px solid var(--border,#313244);margin-top:4px`;
    hint.innerHTML = `<kbd style="background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px">Tab</kbd> / <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px">&#8629;</kbd> accept &nbsp;&middot;&nbsp; <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px">&#8593;&#8595;</kbd> navigate &nbsp;&middot;&nbsp; <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px">Esc</kbd> dismiss`;
    popup.appendChild(hint);

    // Position below cursor
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const top  = rect.bottom + 4;
      const left = Math.max(10, Math.min(rect.left, window.innerWidth - 540));
      popup.style.top  = `${top + 280 > window.innerHeight ? rect.top - 280 : top}px`;
      popup.style.left = `${left}px`;
    }

    document.body.appendChild(popup);
    this._acPopup = popup;
  }

  _acHighlight() {
    if (!this._acPopup) return;
    this._acPopup.querySelectorAll('.ac-item').forEach((el, i) => {
      el.style.background = i === this._acIndex
        ? 'var(--surface3,rgba(137,180,250,0.1))' : 'transparent';
    });
    this._acPopup.querySelector(`[data-idx="${this._acIndex}"]`)?.scrollIntoView({ block:'nearest' });
  }

  _acInsert(phrase, typedText, savedNode, savedOffset) {
    // ── Tier 1: saved text node (no selection needed) ──
    if (savedNode && savedNode.parentNode && this.editorDiv.contains(savedNode)) {
      const startOff = savedOffset - typedText.length;
      if (startOff >= 0) {
        const actual = savedNode.textContent.substring(startOff, savedOffset);
        if (actual.toLowerCase() === typedText.toLowerCase()) {
          savedNode.textContent =
            savedNode.textContent.substring(0, startOff) +
            phrase + ' ' +
            savedNode.textContent.substring(savedOffset);
          try {
            const newOff = startOff + phrase.length + 1;
            const r = document.createRange();
            r.setStart(savedNode, Math.min(newOff, savedNode.textContent.length));
            r.collapse(true);
            const s = window.getSelection();
            s.removeAllRanges(); s.addRange(r);
          } catch(_) {}
          this.editorDiv.focus();
          this.editorDiv.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }

    // ── Tier 2: HTML replacement (same pattern as applyCorrection) ──
    const html       = this.getHTML();
    const lowerHtml  = html.toLowerCase();
    const lastIdx    = lowerHtml.lastIndexOf(typedText.toLowerCase());
    if (lastIdx !== -1) {
      const before    = html.substring(0, lastIdx);
      const after     = html.substring(lastIdx + typedText.length);
      const lastOpen  = before.lastIndexOf('<');
      const lastClose = before.lastIndexOf('>');
      if (lastOpen === -1 || lastClose >= lastOpen) {
        this.setContent(before + phrase + ' ' + after);
        this.editorDiv.focus();
        const r = document.createRange();
        r.selectNodeContents(this.editorDiv);
        r.collapse(false);
        const s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
        this.editorDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    // ── Tier 3: execCommand fallback ──
    this.editorDiv.focus();
    document.execCommand('insertText', false, phrase + ' ');
    this.editorDiv.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _acClose() {
    this._acPopup?.remove();
    this._acPopup       = null;
    this._acSuggestions = [];
    this._acIndex       = 0;
    this._acTypedText   = '';
    this._acNode        = null;
    this._acNodeOffset  = -1;
  }

  // ─── Destroy ─────────────────────────────────────────────────

  destroy() {
  // Clean up document-level keyboard listener for autocomplete
  if (this._docKeyHandler) {
    document.removeEventListener('keydown', this._docKeyHandler, true);
    this._docKeyHandler = null;
  }
  
  // Clean up any pending timers
  if (this._acTimer) {
    clearTimeout(this._acTimer);
    this._acTimer = null;
  }
  
  if (this._acBlurTimer) {
    clearTimeout(this._acBlurTimer);
    this._acBlurTimer = null;
  }
  
  // Close autocomplete popup
  this._acClose();
  
  // Remove editor elements
  if (this.editorDiv) {
    this.editorDiv.remove();
    this.editorDiv = null;
  }
  
  if (this.toolbar) {
    this.toolbar = null;
  }
  
  if (this.statusBar) {
    this.statusBar = null;
  }
  
  if (this.element) {
    this.element.innerHTML = '';
  }
  
  // Clear autocomplete state
  this._acPopup = null;
  this._acSuggestions = [];
  this._acIndex = -1;
  this._acTypedText = '';
  this._acNode = null;
  this._acNodeOffset = -1;
}
}

if (typeof window !== 'undefined') {
  window.RichEditor = RichEditor;
}
console.log('RichEditor loaded successfully!');
