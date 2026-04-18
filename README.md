# 📚 Assignment Desk

A desktop app built with Electron to help students plan, write, and track their assignments — all in one place, offline, with no accounts required. Now with optional **local AI analysis** powered by Ollama — no data ever leaves your machine.

[![GitHub release](https://img.shields.io/github/v/release/plusive27-max/Assignment-Desk?style=for-the-badge&color=6c8ef5&label=Download)](https://github.com/plusive27-max/Assignment-Desk/releases/latest)
![Platform](https://img.shields.io/badge/platform-Windows-blue?style=for-the-badge&logo=windows)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Electron](https://img.shields.io/badge/built%20with-Electron-47848f?style=for-the-badge&logo=electron)
![AI](https://img.shields.io/badge/AI-Ollama%20local%20LLM-blueviolet?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-brightgreen?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange?style=for-the-badge)

---

## 📑 Table of Contents

- [What's New in v1.2.0](#-whats-new-in-v120)
- [Features](#-features)
- [AI Features](#-ai-features-optional)
- [Download & Install](#-download--install)
- [Requirements](#-requirements)
- [Getting Started (Developers)](#-getting-started-developers)
- [Build a Distributable](#-build-a-distributable)
- [Data & Privacy](#-data--privacy)
- [Project Structure](#-project-structure)
- [UI Tips](#-ui-tips)
- [Keyboard Shortcuts](#-keyboard-shortcuts-new)
- [Built With](#-built-with)
- [Licence](#-licence)

---

## 🎉 What's New in v1.2.0

### ⌨️ Keyboard Shortcuts
Work faster with full keyboard support:
- **Ctrl+S** / **Cmd+S** - Save assignment
- **Ctrl+N** / **Cmd+N** - New assignment
- **Ctrl+E** / **Cmd+E** - Export
- **Ctrl+P** / **Cmd+P** - Preview
- **Ctrl+K** / **Cmd+K** - Checklist
- **Ctrl+Z** / **Cmd+Z** - Undo
- **Ctrl+Shift+Z** / **Cmd+Shift+Z** - Redo
- **Escape** - Close modals

### ↶↷ Undo/Redo System
- Full undo/redo for outline and notes changes
- 50-state history
- Never lose work from accidental deletions

### 📊 Statistics Dashboard
Click the new **📊 Stats** button to view:
- Sections created
- Words written vs target
- Completion percentage
- Notes count
- References added

### 💾 Auto-Save Indicator
Visual feedback in the top-right corner:
- 💾 **Saving...** - Save in progress
- ✓ **Saved** - Auto-saved successfully
- Always know when your work is safe

### 🎨 Visual Improvements
- **40+ smooth animations** - Fade-ins, slide-ins, hover effects
- **Better loading states** - Clear feedback during AI operations
- **Enhanced focus management** - Automatic input focus after template changes
- **Improved toast notifications** - Better positioned, auto-dismiss
- **Smoother transitions** - Professional-grade UI polish

### 🐛 Bug Fixes
- Fixed AI Checker model selection
- Fixed template focus issues
- Fixed stats modal close buttons
- Fixed Brief Analysis tab switching
- Improved error handling throughout
- Better compatibility with older Electron versions

---

## ✨ Features

| Tab | What it does |
|-----|-------------|
| **Brief** | Paste or upload your assignment brief (PDF/DOCX). Detects instruction verbs (analyse, evaluate, discuss…), suggests a smart word-count split, and auto-detects word count from the brief text. |
| **Brief → ✨ AI Analyse** | Uses a local LLM via Ollama to analyse your brief. It extracts assignment type, topic, word count, format, key requirements, and a recommended structure. You can re-run it after changing models. Switch between Overview, Research Plan, Timeline, Rubric Analysis, and Key Arguments tabs. |
| **Outline** | Build your section structure. Apply essay/report/lit review/case study templates. Drag to reorder. Allocates your total word count across sections. **New: Automatic focus after template loading.** |
| **Notes** | Per-section research notes and citations. Push note word counts to Progress in one click. |
| **Progress** | Track words written per section. Paste & Count panel lets you paste a draft and live-count words, then apply the count to any section. |
| **Checklist** | 18-point submission checklist covering brief understanding, citations, proofreading, and submission readiness. |
| **Preview** | Clean preview of your full assignment — all sections, notes, and references in one view. |
| **References** | Format references in Solent Harvard, Harvard, APA 7th, MLA 9th, Vancouver, OSCOLA, or Chicago. Pulls all citations from your Notes automatically. |
| **Checker** | Paste a draft and run a rule-based analysis: quote balance, repeated phrases, sentence complexity, passive voice, and readability score. |
| **Checker → ✨ AI Check** | Uses a local LLM to give structured feedback across 6 areas: brief alignment, academic tone, argument structure, cohesion, citation gaps, and an overall grade estimate with UK grade band. **Now fully working with model selection.** |
| **Draft** | Uses your outline to generate section drafts. Starter mode writes opening paragraphs; Full Draft writes the full section text. |
| **Pomodoro** | Built-in floating Pomodoro timer (25 min focus / 5 min short break / 15 min long break). |

---

## 🤖 AI Features (Optional)

The AI features are completely optional and require [Ollama](https://ollama.com) to be installed separately. **All AI processing happens locally on your machine — no data is sent to any server.**

### Setup (one time only)

1. Download and install **Ollama** from [ollama.com](https://ollama.com).
2. Open a terminal and pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. Open Assignment Desk and use **✨ AI Analyse** or **✨ AI Check**.

### Recommended Models

| Model | Best for | Speed | Notes |
|-------|----------|-------|-------|
| `qwen2.5-coder:7b` | Best overall for this app | Fast | Strong instruction following, good with structured output |
| `llama3.2:3b` | Quick local checks | Fast | Good for lighter machines |
| `llama3.2` | Balanced use | Medium | Better quality than 3b |
| `mistral` | Academic-style text | Medium | Solid general model |
| `codellama:13b` | Only if you have enough RAM/VRAM | Slow | Can struggle with long structured prompts |

> **Tip:** If a model starts "waffling", use a smaller, cleaner prompt task. The app already does this automatically for weaker models.

### Model Tips

- Use **qwen2.5-coder:7b** for the best balance of structure and quality.
- Use **llama3.2:3b** if your PC is limited and you want faster responses.
- Avoid very large models if they keep drifting into long introductions or mixed formatting.
- The app now keeps AI output in the right place, strips stray references from draft sections, and collects them at the end of the draft.

If Ollama isn't installed or running, the app works normally — the AI buttons show inline setup guidance instead of crashing.

---

## 🖥️ Requirements

- Windows 10/11 (primary target — macOS/Linux should work but untested)
- [Node.js](https://nodejs.org/) v18 or later *(for running from source only)*
- [Ollama](https://ollama.com) *(optional — for AI features only)*

---

## 📥 Download & Install

> **Just want to use the app? No coding required.**

Head to the [Releases page](../../releases/latest) and download the latest `Assignment-Desk-Setup-x.x.x.exe` — run it and you're done. No account, no internet connection required, no data ever leaves your machine.

### 🤖 Want to use the AI features?

The AI Brief Analyser, AI Checker, and Draft assistant are optional but highly recommended. They require [Ollama](https://ollama.com) — a free, lightweight tool that runs AI models locally on your machine.

1. Download and install **Ollama** from [ollama.com](https://ollama.com).
2. Open a terminal and run:
   ```bash
   ollama pull qwen2.5-coder:7b
   ```
3. Reopen Assignment Desk and use the **✨ AI Analyse**, **✨ AI Check**, or **Draft** tools.

> **Your text never leaves your machine.** All AI processing runs locally via Ollama — no internet connection needed, no API keys, no subscriptions.

### ⚠️ Windows SmartScreen warning

When you first run the installer, Windows may show a **"Windows protected your PC"** popup. This happens with any app that isn't commercially code-signed. It is safe to proceed:

1. Click **More info**
2. Click **Run anyway**

---

## 🚀 Getting Started (Developers)

### 1. Clone the repo

```bash
git clone https://github.com/plusive27-max/Assignment-Desk.git
cd assignment-desk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development

```bash
npm start
```

---

## 📦 Build a Distributable

Produces a Windows `.exe` installer in the `dist/` folder:

```bash
npm run dist
```

Requires `electron-builder` (already listed as a dev dependency).

---

## 💾 Data & Privacy

- All data is stored **locally** on your machine — nothing is sent anywhere, ever.
- Auto-save writes to Electron's `userData` folder:
  - **Windows:** `C:\Users\<you>\AppData\Roaming\Assignment Desk\assignment-desk-data.json`
- Use **Export JSON** to back up your assignment to a file of your choice.
- Use **Export PDF** to generate a formatted PDF of your assignment.
- Use **Import** to load a previously exported JSON file.
- AI analysis runs entirely on your local machine via Ollama — your text never leaves.

---

## 📁 Project Structure

```
assignment-desk/
├── main.js          # Electron main process — IPC, PDF export, file handling
├── preload.js       # Context bridge — exposes safe API to renderer
├── renderer.js      # All UI logic — state, views, AI features, event listeners
├── index.html       # App shell and all view markup
├── print.html       # Hidden print window used for PDF generation
├── style.css        # All styles — dark/light mode, components
└── package.json
```

---

## ⌨️ Keyboard Shortcuts (New!)

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** / **Cmd+S** | Save assignment |
| **Ctrl+N** / **Cmd+N** | New assignment |
| **Ctrl+E** / **Cmd+E** | Export |
| **Ctrl+P** / **Cmd+P** | Preview |
| **Ctrl+K** / **Cmd+K** | Checklist |
| **Ctrl+Z** / **Cmd+Z** | Undo |
| **Ctrl+Shift+Z** / **Cmd+Shift+Z** | Redo |
| **Escape** | Close modals |

---

## ⌨️ UI Tips

- Switch between **dark and light mode** using the toggle button (☀️/🌙) in the top bar.
- Click the **📊 Stats** button to view your assignment statistics.
- Use **↶** and **↷** buttons for undo/redo, or use keyboard shortcuts.
- Watch the **auto-save indicator** in the top-right corner for save feedback.
- Click the **Pomodoro panel header** to minimise/expand it — it floats over all tabs.
- In **Outline**, drag the `⠿` handle to reorder sections.
- In **Notes**, use the search box to filter sections by keyword.
- In **Progress → Paste & Count**, click the panel header to expand it, paste your draft, choose a section, and click **Apply Count**.
- The **✨ AI Analyse** button in Brief and **✨ AI Check** in Checker share the same model selection — pick your model once and it carries across both features.
- For Draft, use **Starter** when you want short opening paragraphs and **Full Draft** when you want the whole section generated.
- Templates now automatically focus the first input — no more manual clicking needed!

---

## 🛠️ Built With

- [Electron](https://www.electronjs.org/)
- [electron-builder](https://www.electron.build/)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) — reads PDF briefs
- [mammoth](https://www.npmjs.com/package/mammoth) — reads DOCX briefs
- [Ollama](https://ollama.com) *(optional)* — local LLM inference for AI features
- Vanilla JavaScript, HTML, CSS — no frontend framework

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 Licence

MIT — do whatever you like with it.

Built by [plusive27-max](https://github.com/plusive27-max)

---

## 🙏 Acknowledgments

- Thanks to all students who provided feedback and feature requests
- Inspired by the need for a simple, offline, privacy-focused assignment tool
- Built with ❤️ for students everywhere
