const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog
} = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a reference to the main window
let mainWindow;

// ─── Storage ──────────────────────────────────────────────────────────────────
const DATA_PATH = path.join(app.getPath('userData'), 'assignment-desk-data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  Menu.setApplicationMenu(null);

  // Auto-open DevTools when running with --dev or in dev mode
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// ─── IPC — window controls ────────────────────────────────────────────────────
ipcMain.handle('load-data', () => loadData());
ipcMain.on('save-data', (e, data) => saveData(data));

// Handle state-save (invoked from saveState() in renderer)
ipcMain.handle('state-save', (e, data) => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.on('win-minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('win-maximize', e => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on('win-close', e => BrowserWindow.fromWebContents(e.sender)?.close());

// ─── IPC — PDF export ─────────────────────────────────────────────────────────
ipcMain.handle('export-pdf', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);

  const savePath = await dialog.showSaveDialog(win, {
    title: 'Export Assignment as PDF',
    defaultPath: 'assignment.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (savePath.canceled || !savePath.filePath) return { canceled: true };

  try {
    // Create a hidden window to render the print version
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    await printWin.loadFile('print.html');

    // Pass state data to the print window
    await printWin.webContents.executeJavaScript(`
      window.__PRINT_DATA__ = ${JSON.stringify(
        await win.webContents.executeJavaScript('JSON.stringify(state)')
      )};
      if (typeof renderPrint === 'function') renderPrint();
    `);

    // Small delay to let it render
    await new Promise(r => setTimeout(r, 800));

    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 1, bottom: 1, left: 1, right: 1 }
    });

    printWin.close();
    fs.writeFileSync(savePath.filePath, pdfBuffer);
    return { success: true, path: savePath.filePath };
  } catch (err) {
    console.error('PDF export error:', err);
    return { error: err.message };
  }
});

// ─── IPC — file upload ────────────────────────────────────────────────────────
ipcMain.handle('open-brief-file', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Assignment Brief',
    filters: [
      { name: 'Documents', extensions: ['pdf', 'docx'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths.length) return null;

  const filePath = result.filePaths[0];
  const ext = filePath.split('.').pop().toLowerCase();

  try {
    if (ext === 'pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return { text: data.text, filename: filePath.split(/[\\/]/).pop() };
    }

    if (ext === 'docx') {
      const mammoth = require('mammoth');
      const data = await mammoth.extractRawText({ path: filePath });
      return { text: data.value, filename: filePath.split(/[\\/]/).pop() };
    }

    return null;
  } catch (err) {
    console.error('File parse error:', err);
    return { error: 'Could not read file. Make sure it is not password protected.' };
  }
});

// ─── IPC — state export / import ─────────────────────────────────────────────  

ipcMain.handle('state-export', async (e, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Assignment',
    defaultPath: 'assignment.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }
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