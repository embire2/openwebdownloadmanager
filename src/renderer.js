// Initialize UI components
let downloads = new Map();
let currentView = 'all';
let selectedCategory = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  // Set up window controls
  setupWindowControls();
  
  // Set up navigation
  setupNavigation();
  
  // Set up category filters
  setupCategoryFilters();
  
  // Load initial downloads
  await loadDownloads();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load settings
  await loadSettings();
  
  // Show version in UI
  const version = await window.electronAPI.getAppVersion();
  document.querySelector('.app-version').textContent = `v${version}`;
});

function setupWindowControls() {
  document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });
  
  document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
  });
  
  document.getElementById('close-btn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      const view = item.dataset.view;
      showView(view);
    });
  });
}

function setupCategoryFilters() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      selectedCategory = btn.dataset.category;
      filterDownloads();
    });
  });
}

function showView(view) {
  currentView = view;
  const views = document.querySelectorAll('.view-content');
  views.forEach(v => v.classList.remove('active'));
  
  const targetView = document.getElementById(`${view}-view`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  if (view === 'settings') {
    loadSettings();
  } else if (view === 'about') {
    showAboutView();
  }
}

async function loadDownloads() {
  const downloadList = await window.electronAPI.getDownloads();
  downloads.clear();
  
  downloadList.forEach(download => {
    downloads.set(download.id, download);
  });
  
  updateDownloadsList();
}

function updateDownloadsList() {
  const container = document.getElementById('downloads-list');
  container.innerHTML = '';
  
  const filteredDownloads = filterDownloadsByCategory();
  
  if (filteredDownloads.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📥</div>
        <h3>No downloads yet</h3>
        <p>Add URLs to start downloading</p>
        <button class="btn btn-primary" onclick="showAddUrlDialog()">
          <span class="btn-icon">➕</span>
          Add URL
        </button>
      </div>
    `;
    return;
  }
  
  filteredDownloads.forEach(download => {
    const item = createDownloadItem(download);
    container.appendChild(item);
  });
}

function filterDownloadsByCategory() {
  const downloadsArray = Array.from(downloads.values());
  
  if (selectedCategory === 'all') {
    return downloadsArray;
  }
  
  return downloadsArray.filter(download => {
    const ext = download.fileName.split('.').pop().toLowerCase();
    const categories = {
      documents: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf'],
      videos: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'],
      music: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'],
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'],
      compressed: ['zip', 'rar', '7z', 'tar', 'gz'],
      programs: ['exe', 'msi', 'dmg', 'deb', 'rpm']
    };
    
    return categories[selectedCategory]?.includes(ext);
  });
}

function createDownloadItem(download) {
  const item = document.createElement('div');
  item.className = 'download-item';
  item.dataset.downloadId = download.id;
  
  const fileIcon = getFileIcon(download.fileName);
  const progress = download.progress || 0;
  const speed = formatSpeed(download.speed || 0);
  const size = formatSize(download.size || 0);
  const downloaded = formatSize(download.downloaded || 0);
  
  item.innerHTML = `
    <div class="download-icon">${fileIcon}</div>
    <div class="download-info">
      <div class="download-name">${download.fileName}</div>
      <div class="download-details">
        <span class="download-size">${downloaded} / ${size}</span>
        <span class="download-speed">${speed}</span>
        <span class="download-status status-${download.status}">${download.status}</span>
      </div>
      <div class="download-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress.toFixed(1)}%</span>
      </div>
    </div>
    <div class="download-actions">
      ${getDownloadActions(download)}
    </div>
  `;
  
  // Add action listeners
  const actionBtns = item.querySelectorAll('.action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => handleDownloadAction(btn.dataset.action, download.id));
  });
  
  return item;
}

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄',
    doc: '📝', docx: '📝', txt: '📝',
    mp4: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
    zip: '📦', rar: '📦', '7z': '📦',
    exe: '⚙️', msi: '⚙️'
  };
  
  return icons[ext] || '📎';
}

function getDownloadActions(download) {
  switch (download.status) {
    case 'downloading':
      return `
        <button class="action-btn" data-action="pause" title="Pause">
          <span>⏸️</span>
        </button>
        <button class="action-btn" data-action="cancel" title="Cancel">
          <span>❌</span>
        </button>
      `;
    case 'paused':
      return `
        <button class="action-btn" data-action="resume" title="Resume">
          <span>▶️</span>
        </button>
        <button class="action-btn" data-action="cancel" title="Cancel">
          <span>❌</span>
        </button>
      `;
    case 'completed':
      return `
        <button class="action-btn" data-action="open" title="Open folder">
          <span>📁</span>
        </button>
        <button class="action-btn" data-action="remove" title="Remove">
          <span>🗑️</span>
        </button>
      `;
    case 'error':
      return `
        <button class="action-btn" data-action="retry" title="Retry">
          <span>🔄</span>
        </button>
        <button class="action-btn" data-action="remove" title="Remove">
          <span>🗑️</span>
        </button>
      `;
    default:
      return '';
  }
}

async function handleDownloadAction(action, downloadId) {
  const download = downloads.get(downloadId);
  if (!download) return;
  
  switch (action) {
    case 'pause':
      await window.electronAPI.pauseDownload(downloadId);
      download.status = 'paused';
      break;
    case 'resume':
      await window.electronAPI.resumeDownload(downloadId);
      download.status = 'downloading';
      break;
    case 'cancel':
    case 'remove':
      await window.electronAPI.cancelDownload(downloadId);
      downloads.delete(downloadId);
      break;
    case 'open':
      await window.electronAPI.openDownloadFolder(download.filePath);
      break;
    case 'retry':
      await window.electronAPI.addDownload({
        url: download.url,
        fileName: download.fileName
      });
      downloads.delete(downloadId);
      break;
  }
  
  updateDownloadsList();
}

function showAddUrlDialog() {
  const dialog = document.getElementById('add-url-dialog');
  dialog.style.display = 'flex';
  document.getElementById('url-input').focus();
}

function hideAddUrlDialog() {
  const dialog = document.getElementById('add-url-dialog');
  dialog.style.display = 'none';
  document.getElementById('url-input').value = '';
}

async function addDownload() {
  const urlInput = document.getElementById('url-input');
  const url = urlInput.value.trim();
  
  if (!url) return;
  
  const result = await window.electronAPI.addDownload({ url });
  
  if (result.success) {
    downloads.set(result.downloadId, result.download);
    updateDownloadsList();
    hideAddUrlDialog();
  } else {
    alert(`Failed to add download: ${result.error}`);
  }
}

// Settings functions
async function loadSettings() {
  const settings = await window.electronAPI.getSettings();
  
  // Update settings UI
  document.getElementById('max-connections').value = settings.maxConnections;
  document.getElementById('download-path').value = settings.downloadPath;
  document.getElementById('auto-start').checked = settings.autoStart;
  document.getElementById('sound-notification').checked = settings.soundNotification;
  document.getElementById('capture-enabled').checked = settings.captureEnabled;
  document.getElementById('monitor-clipboard').checked = settings.monitorClipboard;
  
  // Update file type checkboxes
  Object.keys(settings.monitoredFileTypes).forEach(type => {
    const checkbox = document.getElementById(`monitor-${type}`);
    if (checkbox) {
      checkbox.checked = settings.monitoredFileTypes[type];
    }
  });
}

async function saveSettings() {
  const settings = {
    maxConnections: parseInt(document.getElementById('max-connections').value),
    downloadPath: document.getElementById('download-path').value,
    autoStart: document.getElementById('auto-start').checked,
    soundNotification: document.getElementById('sound-notification').checked,
    captureEnabled: document.getElementById('capture-enabled').checked,
    monitorClipboard: document.getElementById('monitor-clipboard').checked,
    monitoredFileTypes: {
      documents: document.getElementById('monitor-documents').checked,
      compressed: document.getElementById('monitor-compressed').checked,
      programs: document.getElementById('monitor-programs').checked,
      videos: document.getElementById('monitor-videos').checked,
      music: document.getElementById('monitor-music').checked,
      images: document.getElementById('monitor-images').checked
    }
  };
  
  await window.electronAPI.saveSettings(settings);
  showNotification('Settings saved successfully!');
}

async function selectDownloadFolder() {
  const folder = await window.electronAPI.selectDownloadFolder();
  if (folder) {
    document.getElementById('download-path').value = folder;
  }
}

function showAboutView() {
  // About view is already in HTML
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event listeners
function setupEventListeners() {
  // Download progress updates
  window.electronAPI.onDownloadProgress((data) => {
    const download = downloads.get(data.downloadId);
    if (download) {
      Object.assign(download, data.progress);
      updateDownloadItem(data.downloadId);
    }
  });
  
  window.electronAPI.onDownloadCompleted((downloadId) => {
    const download = downloads.get(downloadId);
    if (download) {
      download.status = 'completed';
      download.progress = 100;
      updateDownloadsList();
      
      // Play notification sound if enabled
      const settings = window.electronAPI.getSettings();
      if (settings.soundNotification) {
        const audio = new Audio('../assets/complete.mp3');
        audio.play().catch(() => {});
      }
    }
  });
  
  window.electronAPI.onDownloadError((data) => {
    const download = downloads.get(data.downloadId);
    if (download) {
      download.status = 'error';
      download.error = data.error;
      updateDownloadsList();
    }
  });
  
  // Handle add URL from menu/clipboard
  window.electronAPI.onShowAddUrl(() => {
    showAddUrlDialog();
  });
  
  window.electronAPI.onAddUrlFromClipboard((url) => {
    document.getElementById('url-input').value = url;
    showAddUrlDialog();
  });
  
  window.electronAPI.onClipboardUrlDetected((url) => {
    if (confirm(`Download detected:\n${url}\n\nAdd to downloads?`)) {
      window.electronAPI.addDownload({ url });
    }
  });
  
  // Handle protocol URLs
  window.electronAPI.onHandleProtocolUrl((url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://')) {
      document.getElementById('url-input').value = url;
      showAddUrlDialog();
    }
  });
  
  // Show changelog on update
  window.electronAPI.onShowChangelog(() => {
    showChangelog();
  });
  
  // Handle update notifications
  window.electronAPI.onUpdateAvailable((info) => {
    showNotification(`Update available: v${info.version}`);
  });
}

function updateDownloadItem(downloadId) {
  const download = downloads.get(downloadId);
  if (!download) return;
  
  const item = document.querySelector(`[data-download-id="${downloadId}"]`);
  if (!item) return;
  
  // Update progress
  const progressFill = item.querySelector('.progress-fill');
  const progressText = item.querySelector('.progress-text');
  const speedText = item.querySelector('.download-speed');
  const sizeText = item.querySelector('.download-size');
  
  if (progressFill) progressFill.style.width = `${download.progress}%`;
  if (progressText) progressText.textContent = `${download.progress.toFixed(1)}%`;
  if (speedText) speedText.textContent = formatSpeed(download.speed);
  if (sizeText) sizeText.textContent = `${formatSize(download.downloaded)} / ${formatSize(download.size)}`;
}

function showChangelog() {
  const changelogDialog = document.createElement('div');
  changelogDialog.className = 'dialog-overlay';
  changelogDialog.innerHTML = `
    <div class="dialog">
      <div class="dialog-header">
        <h2>What's New in v1.0.1</h2>
        <button class="close-btn" onclick="this.closest('.dialog-overlay').remove()">×</button>
      </div>
      <div class="dialog-content">
        <div class="changelog-content">
          <h3>🎉 New Features</h3>
          <ul>
            <li>System-level download interception without browser extensions</li>
            <li>Windows registry integration for protocol handling</li>
            <li>Priority handling over other download managers (IDM)</li>
            <li>Clipboard monitoring for download URLs</li>
            <li>Global hotkey support (Ctrl+Alt+D)</li>
          </ul>
          
          <h3>🔧 Improvements</h3>
          <ul>
            <li>Removed dependency on browser extensions</li>
            <li>Enhanced download detection mechanism</li>
            <li>Better Windows integration</li>
            <li>Runs with administrator privileges for better system integration</li>
          </ul>
          
          <h3>🐛 Bug Fixes</h3>
          <ul>
            <li>Fixed download manager priority issues with IDM</li>
            <li>Resolved browser extension installation requirements</li>
          </ul>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" onclick="this.closest('.dialog-overlay').remove()">Got it!</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(changelogDialog);
}

// Utility functions
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0 B/s';
  return formatSize(bytesPerSecond) + '/s';
}

function filterDownloads() {
  updateDownloadsList();
}
