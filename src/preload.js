const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Download operations
  addDownload: (downloadInfo) => ipcRenderer.invoke('add-download', downloadInfo),
  pauseDownload: (downloadId) => ipcRenderer.invoke('pause-download', downloadId),
  resumeDownload: (downloadId) => ipcRenderer.invoke('resume-download', downloadId),
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  openDownloadFolder: (filePath) => ipcRenderer.invoke('open-download-folder', filePath),
  
  // Event listeners
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadCompleted: (callback) => {
    ipcRenderer.on('download-completed', (event, downloadId) => callback(downloadId));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => callback(data));
  },
  onShowAddUrl: (callback) => {
    ipcRenderer.on('show-add-url', () => callback());
  },
  onShowBatchDownload: (callback) => {
    ipcRenderer.on('show-batch-download', () => callback());
  }
});
