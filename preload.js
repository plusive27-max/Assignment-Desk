const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData:      () => ipcRenderer.invoke('load-data'),
  minimize:      () => ipcRenderer.send('win-minimize'),
  maximize:      () => ipcRenderer.send('win-maximize'),
  close:         () => ipcRenderer.send('win-close'),
  openBriefFile: () => ipcRenderer.invoke('open-brief-file'),
  exportPdf:     () => ipcRenderer.invoke('export-pdf'),
  onSaveError: (cb) => ipcRenderer.on('save-error', (_e, msg) => cb(msg)),

  // ── Auto-save ──
  stateLoad:   ()       => ipcRenderer.invoke('state-load'),
  stateSave:   (data)   => ipcRenderer.invoke('state-save', data),
  stateExport: (data)   => ipcRenderer.invoke('state-export', data),
  stateImport: ()       => ipcRenderer.invoke('state-import'),
  printReady: () => ipcRenderer.send('print-ready'),
});
