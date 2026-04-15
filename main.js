const {
  app, BrowserWindow, ipcMain, Menu, dialog
} = require('electron');
const path = require('path');
const fs   = require('fs');
const http = require('http');

let mainWindow;

// ─── Storage ──────────────────────────────────────────────────────────────────
const DATA_PATH = path.join(app.getPath('userData'), 'assignment-desk-data.json');
function loadData() {
  try { if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); } catch (e) {}
  return null;
}
function saveData(data) {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 780, minWidth: 960, minHeight: 640, frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  mainWindow.loadFile('index.html');
  Menu.setApplicationMenu(null);
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev'))
    mainWindow.webContents.openDevTools();
}

// ─── IPC — window controls ────────────────────────────────────────────────────
ipcMain.handle('load-data',  () => loadData());
ipcMain.on('save-data',      (e, data) => saveData(data));
ipcMain.handle('state-save', (e, data) => {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8'); return { success: true }; }
  catch (err) { return { error: err.message }; }
});
ipcMain.on('win-minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('win-maximize', e => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on('win-close', e => BrowserWindow.fromWebContents(e.sender)?.close());

// ─── IPC — Ollama proxy ───────────────────────────────────────────────────────
// Simple fetch (for tags/ping)
ipcMain.handle('ollama-fetch', async (e, { path: urlPath, body }) => {
  return new Promise(resolve => {
    const postData = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 11434, path: urlPath,
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}
    };
    let data = '';
    const req = http.request(opts, res => {
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end',  () => resolve({ ok: true, status: res.statusCode, text: data }));
    });
    req.on('error', err => resolve({ ok: false, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
});

// Streaming — uses a streamId so renderer can match events to the right section
ipcMain.handle('ollama-stream-start', async (e, { model, prompt, streamId }) => {
  const win      = BrowserWindow.fromWebContents(e.sender);
  const postData = JSON.stringify({ model, prompt, stream: true });
  const opts = {
    hostname: '127.0.0.1', port: 11434, path: '/api/generate', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  };
  return new Promise(resolve => {
    let doneSent = false;   // ← prevents double-done
    const req = http.request(opts, res => {
      res.setEncoding('utf8');
      let buffer = '';
      res.on('data', raw => {
        buffer += raw;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.response) win.webContents.send('ollama-chunk', { streamId, text: json.response });
            if (json.done && !doneSent) {
              doneSent = true;
              win.webContents.send('ollama-done-' + streamId);
            }
          } catch { /* skip malformed */ }
        }
      });
      res.on('end', () => {
        if (!doneSent) {
          doneSent = true;
          win.webContents.send('ollama-done-' + streamId);
        }
        resolve({ ok: true });
      });
    });
    req.on('error', err => {
      win.webContents.send('ollama-error-' + streamId, err.message);
      resolve({ ok: false, error: err.message });
    });
    req.write(postData);
    req.end();
  });
});

// ─── IPC — PDF export ─────────────────────────────────────────────────────────
ipcMain.handle('export-pdf', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const savePath = await dialog.showSaveDialog(win, {
    title: 'Export Assignment as PDF', defaultPath: 'assignment.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (savePath.canceled || !savePath.filePath) return { canceled: true };
  try {
    const printWin = new BrowserWindow({ show: false, webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false
    }});
    await printWin.loadFile(path.join(__dirname, 'print.html'));
    await printWin.webContents.executeJavaScript(`
      window.__PRINT_DATA__ = ${JSON.stringify(await win.webContents.executeJavaScript('JSON.stringify(state)'))};
      if (typeof renderPrint === 'function') renderPrint();
    `);
    await new Promise(r => setTimeout(r, 800));
    const pdfBuffer = await printWin.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top:1, bottom:1, left:1, right:1 } });
    printWin.close();
    fs.writeFileSync(savePath.filePath, pdfBuffer);
    return { success: true, path: savePath.filePath };
  } catch (err) { return { error: err.message }; }
});

// ─── IPC — DOCX export ───────────────────────────────────────────────────────
ipcMain.handle('export-docx', async (e, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Assignment as DOCX', defaultPath: 'assignment.docx',
    filters: [{ name: 'Word Document', extensions: ['docx'] }]
  });
  if (!filePath) return { canceled: true };
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    const sections = [];
    if (data.title) sections.push(new Paragraph({ text: data.title, heading: HeadingLevel.TITLE }));
    (data.outline || []).forEach(s => {
      sections.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
      const notes = data.notes?.[s.id]?.content;
      if (notes) sections.push(new Paragraph({ children: [new TextRun(notes)] }));
    });
    const doc    = new Document({ sections: [{ children: sections }] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  } catch (err) { return { error: err.message }; }
});

// ─── IPC — file upload ────────────────────────────────────────────────────────
ipcMain.handle('open-brief-file', async (e) => {
  const win    = BrowserWindow.fromWebContents(e.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Assignment Brief',
    filters: [{ name: 'Documents', extensions: ['pdf', 'docx'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const ext      = filePath.split('.').pop().toLowerCase();
  try {
    if (ext === 'pdf') {
      const data = await require('pdf-parse')(fs.readFileSync(filePath));
      return { text: data.text, filename: filePath.split(/[\\/]/).pop() };
    }
    if (ext === 'docx') {
      const data = await require('mammoth').extractRawText({ path: filePath });
      return { text: data.value, filename: filePath.split(/[\\/]/).pop() };
    }
    return null;
  } catch (err) { return { error: 'Could not read file: ' + err.message }; }
});

// ─── IPC — state export / import ─────────────────────────────────────────────
ipcMain.handle('state-export', async (e, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Assignment', defaultPath: 'assignment.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (filePath) { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return filePath; }
  return null;
});
ipcMain.handle('state-import', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import Assignment',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (filePaths?.[0]) return JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
  return null;
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
