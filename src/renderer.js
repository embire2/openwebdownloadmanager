// File type categories
const fileCategories = {
    documents: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'],
    compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    programs: ['exe', 'msi', 'dmg', 'deb', 'rpm', 'appimage'],
    videos: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
    music: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a']
};

// State
let downloads = new Map();
let currentCategory = 'all';
let settings = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    settings = await window.electronAPI.getSettings();
    updateSettingsUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load existing downloads
    await loadDownloads();
    
    // Set up IPC listeners
    setupIPCListeners();
});

function setupEventListeners() {
    // Title bar controls
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });
    
    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });
    
    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
    
    // Toolbar buttons
    document.getElementById('add-url-btn').addEventListener('click', showAddUrlModal);
    document.getElementById('resume-all-btn').addEventListener('click', resumeAllDownloads);
    document.getElementById('pause-all-btn').addEventListener('click', pauseAllDownloads);
    document.getElementById('stop-all-btn').addEventListener('click', stopAllDownloads);
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            renderDownloads();
        });
    });
}

function setupIPCListeners() {
    window.electronAPI.onDownloadProgress((data) => {
        const download = downloads.get(data.downloadId);
        if (download) {
            Object.assign(download, data.progress);
            updateDownloadItem(data.downloadId);
            updateStatusBar();
        }
    });
    
    window.electronAPI.onDownloadCompleted((downloadId) => {
        const download = downloads.get(downloadId);
        if (download) {
            download.status = 'completed';
            updateDownloadItem(downloadId);
            updateStatusBar();
            
            if (settings.soundNotification) {
                // Play notification sound
                new Audio('../assets/complete.mp3').play();
            }
        }
    });
    
    window.electronAPI.onDownloadError((data) => {
        const download = downloads.get(data.downloadId);
        if (download) {
            download.status = 'error';
            download.error = data.error;
            updateDownloadItem(data.downloadId);
            updateStatusBar();
        }
    });
    
    window.electronAPI.onShowAddUrl(() => {
        showAddUrlModal();
    });
    
    window.electronAPI.onShowBatchDownload(() => {
        // Show batch download modal
    });
}

async function loadDownloads() {
    const downloadsList = await window.electronAPI.getDownloads();
    downloads.clear();
    downloadsList.forEach(download => {
        downloads.set(download.id, download);
    });
    renderDownloads();
    updateStatusBar();
}

function renderDownloads() {
    const container = document.getElementById('downloads-list');
    container.innerHTML = '';
    
    const filteredDownloads = Array.from(downloads.values()).filter(download => {
        if (currentCategory === 'all') return true;
        const ext = download.fileName.split('.').pop().toLowerCase();
        return fileCategories[currentCategory]?.includes(ext);
    });
    
    if (filteredDownloads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                </svg>
                <h3>No downloads</h3>
                <p>Click "Add URL" to start downloading</p>
            </div>
        `;
        return;
    }
    
    filteredDownloads.forEach(download => {
        container.appendChild(createDownloadItem(download));
    });
}

function createDownloadItem(download) {
    const div = document.createElement('div');
    div.className = 'download-item';
    div.id = `download-${download.id}`;
    
    const statusIcon = getStatusIcon(download.status);
    const actions = getDownloadActions(download.status);
    
    div.innerHTML = `
        <div class="download-header">
            <div class="download-info">
                <div class="download-filename">${download.fileName}</div>
                <div class="download-url">${download.url}</div>
            </div>
            <div class="download-actions">
                ${actions}
            </div>
        </div>
        <div class="download-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${download.progress || 0}%"></div>
            </div>
        </div>
        <div class="download-stats">
            <div class="download-stat">
                <span>${formatBytes(download.downloaded || 0)} / ${formatBytes(download.size || 0)}</span>
            </div>
            <div class="download-stat">
                <span>${formatSpeed(download.speed || 0)}</span>
            </div>
            <div class="download-stat">
                <span>${download.connections || 0} connections</span>
            </div>
            <div class="download-stat">
                <span>${download.status}</span>
            </div>
        </div>
    `;
    
    // Add event listeners to action buttons
    div.querySelectorAll('.action-button').forEach(btn => {
        btn.addEventListener('click', () => handleDownloadAction(download.id, btn.dataset.action));
    });
    
    return div;
}

function updateDownloadItem(downloadId) {
    const download = downloads.get(downloadId);
    const element = document.getElementById(`download-${downloadId}`);
    if (!element || !download) return;
    
    // Update progress
    const progressFill = element.querySelector('.progress-fill');
    progressFill.style.width = `${download.progress || 0}%`;
    
    // Update stats
    const stats = element.querySelectorAll('.download-stat span');
    stats[0].textContent = `${formatBytes(download.downloaded || 0)} / ${formatBytes(download.size || 0)}`;
    stats[1].textContent = formatSpeed(download.speed || 0);
    stats[3].textContent = download.status;
    
    // Update actions if status changed
    const actionsContainer = element.querySelector('.download-actions');
    actionsContainer.innerHTML = getDownloadActions(download.status);
    actionsContainer.querySelectorAll('.action-button').forEach(btn => {
        btn.addEventListener('click', () => handleDownloadAction(downloadId, btn.dataset.action));
    });
}

function getStatusIcon(status) {
    const icons = {
        downloading: '<path d="M19 9h-4V3H9v6H5l7 7 7-7z" fill="currentColor"/>',
        paused: '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>',
        completed: '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>',
        error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>'
    };
    
    return `<svg viewBox="0 0 24 24">${icons[status] || ''}</svg>`;
}

function getDownloadActions(status) {
    switch (status) {
        case 'downloading':
            return `
                <button class="action-button" data-action="pause" title="Pause">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="action-button" data-action="cancel" title="Cancel">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                </button>
            `;
        case 'paused':
            return `
                <button class="action-button" data-action="resume" title="Resume">
                    <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="action-button" data-action="cancel" title="Cancel">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                </button>
            `;
        case 'completed':
            return `
                <button class="action-button" data-action="open" title="Open File">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="action-button" data-action="folder" title="Open Folder">
                    <svg viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="currentColor"/>
                    </svg>
                </button>
            `;
        case 'error':
            return `
                <button class="action-button" data-action="retry" title="Retry">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="action-button" data-action="cancel" title="Remove">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                </button>
            `;
        default:
            return '';
    }
}

async function handleDownloadAction(downloadId, action) {
    switch (action) {
        case 'pause':
            await window.electronAPI.pauseDownload(downloadId);
            break;
        case 'resume':
            await window.electronAPI.resumeDownload(downloadId);
            break;
        case 'cancel':
            await window.electronAPI.cancelDownload(downloadId);
            downloads.delete(downloadId);
            renderDownloads();
            break;
        case 'open':
            const download = downloads.get(downloadId);
            if (download) {
                window.electronAPI.openDownloadFolder(download.filePath);
            }
            break;
        case 'folder':
            const dl = downloads.get(downloadId);
            if (dl) {
                window.electronAPI.openDownloadFolder(dl.filePath);
            }
            break;
        case 'retry':
            // Retry download
            break;
    }
}

function updateStatusBar() {
    const activeDownloads = Array.from(downloads.values()).filter(d => d.status === 'downloading');
    const totalSpeed = activeDownloads.reduce((sum, d) => sum + (d.speed || 0), 0);
    
    document.getElementById('active-downloads').textContent = `${activeDownloads.length} Active Downloads`;
    document.getElementById('total-speed').textContent = formatSpeed(totalSpeed);
}

// Modal functions
function showAddUrlModal() {
    document.getElementById('add-url-modal').classList.add('show');
    document.getElementById('download-url').focus();
    document.getElementById('download-path').value = settings.downloadPath;
}

function closeAddUrlModal() {
    document.getElementById('add-url-modal').classList.remove('show');
    document.getElementById('download-url').value = '';
    document.getElementById('download-filename').value = '';
}

function showSettingsModal() {
    document.getElementById('settings-modal').classList.add('show');
    updateSettingsUI();
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('show');
}

function updateSettingsUI() {
    document.getElementById('max-connections').value = settings.maxConnections || 10;
    document.getElementById('default-download-path').value = settings.downloadPath || '';
    document.getElementById('auto-start').checked = settings.autoStart !== false;
    document.getElementById('sound-notification').checked = settings.soundNotification !== false;
    document.getElementById('browser-integration').checked = settings.browserIntegration !== false;
}

async function addDownload() {
    const url = document.getElementById('download-url').value.trim();
    const fileName = document.getElementById('download-filename').value.trim();
    const connections = parseInt(document.getElementById('download-connections').value);
    const downloadPath = document.getElementById('download-path').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    const result = await window.electronAPI.addDownload({
        url,
        fileName,
        connections,
        downloadPath
    });
    
    if (result.success) {
        downloads.set(result.downloadId, result.download);
        renderDownloads();
        closeAddUrlModal();
    } else {
        alert(`Error: ${result.error}`);
    }
}

async function selectDownloadPath() {
    const path = await window.electronAPI.selectDownloadFolder();
    if (path) {
        document.getElementById('download-path').value = path;
    }
}

async function selectDefaultPath() {
    const path = await window.electronAPI.selectDownloadFolder();
    if (path) {
        document.getElementById('default-download-path').value = path;
    }
}

async function saveSettings() {
    const newSettings = {
        maxConnections: parseInt(document.getElementById('max-connections').value),
        downloadPath: document.getElementById('default-download-path').value,
        autoStart: document.getElementById('auto-start').checked,
        soundNotification: document.getElementById('sound-notification').checked,
        browserIntegration: document.getElementById('browser-integration').checked
    };
    
    await window.electronAPI.saveSettings(newSettings);
    settings = newSettings;
    closeSettingsModal();
}

function openBrowserExtension(browser) {
    // In a real implementation, this would open the browser extension page
    alert(`Browser extension for ${browser} would be available in the respective extension store.`);
}

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
    return formatBytes(bytesPerSecond) + '/s';
}

// Batch download functions
async function resumeAllDownloads() {
    const pausedDownloads = Array.from(downloads.values()).filter(d => d.status === 'paused');
    for (const download of pausedDownloads) {
        await window.electronAPI.resumeDownload(download.id);
    }
}

async function pauseAllDownloads() {
    const activeDownloads = Array.from(downloads.values()).filter(d => d.status === 'downloading');
    for (const download of activeDownloads) {
        await window.electronAPI.pauseDownload(download.id);
    }
}

async function stopAllDownloads() {
    const activeDownloads = Array.from(downloads.values()).filter(d => 
        d.status === 'downloading' || d.status === 'paused'
    );
    
    if (activeDownloads.length > 0) {
        const confirm = window.confirm(`Are you sure you want to stop ${activeDownloads.length} downloads?`);
        if (confirm) {
            for (const download of activeDownloads) {
                await window.electronAPI.cancelDownload(download.id);
                downloads.delete(download.id);
            }
            renderDownloads();
        }
    }
}
