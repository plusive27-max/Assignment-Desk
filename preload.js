const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData:      () =>          ipcRenderer.invoke('load-data'),
  saveData:      (data) =>      ipcRenderer.send('save-data', data),
  minimize:      () =>          ipcRenderer.send('win-minimize'),
  maximize:      () =>          ipcRenderer.send('win-maximize'),
  close:         () =>          ipcRenderer.send('win-close'),
  openBriefFile: () =>          ipcRenderer.invoke('open-brief-file'),
  exportPdf:     () =>          ipcRenderer.invoke('export-pdf'),
  exportDocx:    (data) =>      ipcRenderer.invoke('export-docx', data),
  stateLoad:     () =>          ipcRenderer.invoke('load-data'),
  stateSave:     (data) =>      ipcRenderer.invoke('state-save', data),
  stateExport:   (data) =>      ipcRenderer.invoke('state-export', data),
  stateImport:   () =>          ipcRenderer.invoke('state-import'),
  onSaveError:   (cb) =>        ipcRenderer.on('save-error', (_e, msg) => cb(msg)),

  // ── Ollama proxy ─────────────────────────────────────────────────────────────
  ollamaFetch:   (path, body) => ipcRenderer.invoke('ollama-fetch', { path, body }),

  // streamId isolates each section's events — prevents cross-section bleed
  ollamaStream: (model, prompt, streamId) =>
    ipcRenderer.invoke('ollama-stream-start', { model, prompt, streamId }),

  onOllamaChunk: (streamId, cb) =>
    ipcRenderer.on('ollama-chunk', (_e, data) => { if (data.streamId === streamId) cb(data.text); }),

  onOllamaDone: (streamId, cb) =>
    ipcRenderer.once('ollama-done-' + streamId, () => cb()),

  onOllamaError: (streamId, cb) =>
    ipcRenderer.once('ollama-error-' + streamId, (_e, data) => cb(data.message)),

  removeStreamListeners: (streamId) => {
    ipcRenderer.removeAllListeners('ollama-done-'  + streamId);
    ipcRenderer.removeAllListeners('ollama-error-' + streamId);
  },
  removeAllOllamaListeners: () => {
    ipcRenderer.removeAllListeners('ollama-chunk');
  },
});
