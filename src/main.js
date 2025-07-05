const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { DownloadManager } = require('./downloadManager');

const store = new Store();
const downloadManager = new DownloadManager();

let mainWindow;
let tray;

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
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
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
            app.isQuiting = true;
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
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
    browserIntegration: true
  });
});

ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Prevent app from quitting when window is closed
app.on('before-quit', () => {
  app.isQuiting = true;
});
