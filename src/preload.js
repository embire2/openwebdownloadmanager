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
  
  // File operations
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  openDownloadFolder: (filePath) => ipcRenderer.invoke('open-download-folder', filePath),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Event listeners
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', (event, downloadId) => callback(downloadId)),
  onDownloadError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
  onDownloadAdded: (callback) => ipcRenderer.on('download-added', (event, download) => callback(download)),
  onShowAddUrl: (callback) => ipcRenderer.on('show-add-url', callback),
  onShowBatchDownload: (callback) => ipcRenderer.on('show-batch-download', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  onShowChangelog: (callback) => ipcRenderer.on('show-changelog', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onAddUrlFromClipboard: (callback) => ipcRenderer.on('add-url-from-clipboard', (event, url) => callback(url)),
  onClipboardUrlDetected: (callback) => ipcRenderer.on('clipboard-url-detected', (event, url) => callback(url)),
  onHandleProtocolUrl: (callback) => ipcRenderer.on('handle-protocol-url', (event, url) => callback(url))
});
