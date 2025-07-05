const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, protocol, clipboard, globalShortcut, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { DownloadManager } = require('./downloadManager');
const { autoUpdater } = require('./autoUpdater');
const { SystemIntegration } = require('./systemIntegration');

const store = new Store();
const downloadManager = new DownloadManager();
const systemIntegration = new SystemIntegration();

let mainWindow;
let tray;
let isQuitting = false;

// Enable live reload for Electron
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    frame: false,
    backgroundColor: '#171717'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Create system tray
  createTray();

  // Set up menu
  createMenu();

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.hide();
  });

  // Check for first run or update
  checkFirstRunOrUpdate();
  
  // Check for updates
  autoUpdater.checkForUpdates();
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'assets', 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OpenWeb Download Manager',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Enable/Disable Download Capture',
      type: 'checkbox',
      checked: store.get('captureEnabled', true),
      click: (menuItem) => {
        store.set('captureEnabled', menuItem.checked);
        if (menuItem.checked) {
          systemIntegration.enableCapture();
        } else {
          systemIntegration.disableCapture();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('OpenWeb Download Manager');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Add URL',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('show-add-url');
          }
        },
        {
          label: 'Add from Clipboard',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            const clipboardText = clipboard.readText();
            if (clipboardText && (clipboardText.startsWith('http://') || clipboardText.startsWith('https://'))) {
              mainWindow.webContents.send('add-url-from-clipboard', clipboardText);
            }
          }
        },
        {
          label: 'Add Batch Download',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('show-batch-download');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Downloads',
      submenu: [
        {
          label: 'Resume All',
          click: () => {
            mainWindow.webContents.send('resume-all');
          }
        },
        {
          label: 'Pause All',
          click: () => {
            mainWindow.webContents.send('pause-all');
          }
        },
        {
          label: 'Stop All',
          click: () => {
            mainWindow.webContents.send('stop-all');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdates(true);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function checkFirstRunOrUpdate() {
  const currentVersion = app.getVersion();
  const lastVersion = store.get('lastVersion');
  
  if (!lastVersion || lastVersion !== currentVersion) {
    // First run or update
    setTimeout(() => {
      mainWindow.webContents.send('show-changelog');
    }, 1000);
    store.set('lastVersion', currentVersion);
  }
}

// Set up download interception
function setupDownloadInterception() {
  // Intercept all download requests from all webContents
  app.on('web-contents-created', (event, contents) => {
    contents.session.on('will-download', (event, item, webContents) => {
      // Prevent default download behavior
      event.preventDefault();
      
      const url = item.getURL();
      const fileName = item.getFilename();
      
      // Check if we should handle this download
      if (store.get('captureEnabled', true) && downloadManager.shouldHandleFileType(fileName)) {
        // Add to our download manager
        downloadManager.addDownload({
          url: url,
          fileName: fileName,
          downloadPath: store.get('settings.downloadPath', app.getPath('downloads'))
        }).then(result => {
          if (result.success) {
            mainWindow.show();
            mainWindow.webContents.send('download-added', result.download);
          }
        });
      } else {
        // Let the system handle it
        item.savePath = path.join(app.getPath('downloads'), fileName);
      }
    });
  });

  // Monitor clipboard for URLs
  let lastClipboard = '';
  setInterval(() => {
    const currentClipboard = clipboard.readText();
    if (currentClipboard !== lastClipboard && 
        (currentClipboard.startsWith('http://') || currentClipboard.startsWith('https://'))) {
      lastClipboard = currentClipboard;
      
      // Check if it's a downloadable file
      const urlParts = currentClipboard.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName && fileName.includes('.') && 
          store.get('captureEnabled', true) && 
          downloadManager.shouldHandleFileType(fileName)) {
        // Show notification or add to queue
        mainWindow.webContents.send('clipboard-url-detected', currentClipboard);
      }
    }
  }, 1000);
}

// IPC Handlers
ipcMain.handle('add-download', async (event, downloadInfo) => {
  return downloadManager.addDownload(downloadInfo);
});

ipcMain.handle('pause-download', async (event, downloadId) => {
  return downloadManager.pauseDownload(downloadId);
});

ipcMain.handle('resume-download', async (event, downloadId) => {
  return downloadManager.resumeDownload(downloadId);
});

ipcMain.handle('cancel-download', async (event, downloadId) => {
  return downloadManager.cancelDownload(downloadId);
});

ipcMain.handle('get-downloads', async () => {
  return downloadManager.getDownloads();
});

ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    maxConnections: 10,
    downloadPath: app.getPath('downloads'),
    autoStart: true,
    soundNotification: true,
    browserIntegration: true,
    captureEnabled: true,
    monitorClipboard: true,
    monitoredFileTypes: {
      documents: true,
      compressed: true,
      programs: true,
      videos: true,
      music: true,
      images: true
    }
  });
});

ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  // Update download manager with new settings
  downloadManager.updateMonitoredTypes(settings.monitoredFileTypes);
  return true;
});

ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-download-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Download progress updates
downloadManager.on('progress', (downloadId, progress) => {
  mainWindow.webContents.send('download-progress', { downloadId, progress });
});

downloadManager.on('completed', (downloadId) => {
  mainWindow.webContents.send('download-completed', downloadId);
});

downloadManager.on('error', (downloadId, error) => {
  mainWindow.webContents.send('download-error', { downloadId, error });
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', info);
});

// Set as default protocol handlers
app.setAsDefaultProtocolClient('http');
app.setAsDefaultProtocolClient('https');
app.setAsDefaultProtocolClient('ftp');
app.setAsDefaultProtocolClient('magnet');
app.setAsDefaultProtocolClient('thunder');

// Handle protocol launches
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.webContents.send('handle-protocol-url', url);
  }
});

app.whenReady().then(async () => {
  // Set up system integration
  await systemIntegration.setup();
  
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Alt+D', () => {
    mainWindow.show();
    const clipboardText = clipboard.readText();
    if (clipboardText && (clipboardText.startsWith('http://') || clipboardText.startsWith('https://'))) {
      mainWindow.webContents.send('add-url-from-clipboard', clipboardText);
    }
  });
  
  createWindow();
  setupDownloadInterception();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// Prevent app from quitting when window is closed
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  // Clean up system integration
  systemIntegration.cleanup();
});
