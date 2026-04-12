# 📚 Assignment Desk

A desktop app built with Electron to help students plan, write, and track their assignments — all in one place, offline, with no accounts required.
[![GitHub release](https://img.shields.io/github/v/release/plusive27-max/Assignment-Desk?style=for-the-badge&color=6c8ef5&label=Download)](https://github.com/plusive27-max/Assignment-Desk/releases/latest)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)
---

## ✨ Features

| Tab | What it does |
|-----|-------------|
| **Brief** | Paste or upload your assignment brief (PDF/DOCX). Detects instruction verbs (analyse, evaluate, discuss…) and suggests a word-count split. |
| **Outline** | Build your section structure. Apply essay/report/lit review/case study templates. Drag to reorder. Allocates your total word count across sections. |
| **Notes** | Per-section research notes and citations. Push note word counts to Progress in one click. |
| **Progress** | Track words written per section. Paste & Count panel lets you paste a draft and live-count words, then apply the count to any section. |
| **Checklist** | 18-point submission checklist covering brief understanding, citations, proofreading, and submission readiness. |
| **Preview** | Clean preview of your full assignment — all sections, notes, and references in one view. |
| **References** | Format references in Solent Harvard, Harvard, APA 7th, MLA 9th, Vancouver, OSCOLA, or Chicago. Pulls all citations from your Notes automatically. |
| **Checker** | Paste a draft and run an analysis: quote balance, repeated phrases, sentence complexity, AI-phrase detection, passive voice, and readability score. |
| **Pomodoro** | Built-in floating Pomodoro timer (25 min focus / 5 min short break / 15 min long break). |

---

## 🖥️ Requirements

- [Node.js](https://nodejs.org/) v18 or later
- Windows 10/11 (primary target — macOS/Linux should work but untested)

---
## 📥 Download & Install

> **Just want to use the app? No coding required.**

Head to the [Releases page](../../releases/latest) and download the latest
`Assignment-Desk-Setup-x.x.x.exe` — run it and you're done. No account,
no internet connection, no data ever leaves your machine.

### ⚠️ Windows SmartScreen warning

When you first run the installer, Windows may show a
**"Windows protected your PC"** popup. This happens with any app that
isn't commercially code-signed. It is safe to proceed:

1. Click **More info**
2. Click **Run anyway**

### For developers

If you want to run from source or build it yourself, see the
[Getting Started](#-getting-started) section below. 
## 🚀 Getting Started

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

## 📦 Build a distributable

Produces a Windows `.exe` installer in the `dist/` folder:

```bash
npm run dist
```

Requires `electron-builder` (already listed as a dev dependency).

---

## 💾 Data & Privacy

- All data is stored **locally** on your machine — nothing is sent anywhere.
- Auto-save writes to Electron's `userData` folder:
  - **Windows:** `C:\Users\<you>\AppData\Roaming\Assignment Desk\assignment-desk-data.json`
- Use **Export JSON** to back up your assignment to a file of your choice.
- Use **Export PDF** to generate a formatted PDF of your assignment.
- Use **Import** to load a previously exported JSON file.

---

## 📁 Project Structure

```
assignment-desk/
├── main.js          # Electron main process — IPC, PDF export, file handling
├── preload.js       # Context bridge — exposes safe API to renderer
├── renderer.js      # All UI logic — state, views, event listeners
├── index.html       # App shell and all view markup
├── print.html       # Hidden print window used for PDF generation
├── style.css        # All styles — dark/light mode, components
└── package.json
```

---

## ⌨️ Keyboard & UI Tips

- Switch between **dark and light mode** using the toggle button (☀️/🌙) in the top bar.
- Click the **Pomodoro panel header** to minimise/expand it — it floats over all tabs.
- In **Outline**, drag the `⠿` handle to reorder sections.
- In **Notes**, use the search box to filter sections by keyword.
- In **Progress → Paste & Count**, click the panel header to expand it, paste your draft, choose a section, and click **Apply Count**.

---

## 🛠️ Built With

- [Electron](https://www.electronjs.org/)
- [electron-builder](https://www.electron.build/)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) — reads PDF briefs
- [mammoth](https://www.npmjs.com/package/mammoth) — reads DOCX briefs
- Vanilla JavaScript, HTML, CSS — no frontend framework

---

## 📄 Licence

MIT — do whatever you like with it.
Built by plusive27-max