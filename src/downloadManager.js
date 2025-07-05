const { EventEmitter } = require('events');
const { DownloaderHelper } = require('node-downloader-helper');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');

const store = new Store();

class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.downloads = new Map();
    this.settings = store.get('settings', {
      maxConnections: 10,
      downloadPath: require('electron').app.getPath('downloads'),
      monitoredFileTypes: {
        documents: true,
        compressed: true,
        programs: true,
        videos: true,
        music: true,
        images: true
      }
    });
  }

  updateMonitoredTypes(monitoredFileTypes) {
    this.settings.monitoredFileTypes = monitoredFileTypes;
  }

  shouldHandleFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const fileCategories = {
      documents: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'],
      compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
      programs: ['exe', 'msi', 'dmg', 'deb', 'rpm', 'appimage'],
      videos: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
      music: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico']
    };

    for (const [category, extensions] of Object.entries(fileCategories)) {
      if (this.settings.monitoredFileTypes[category] && extensions.includes(ext)) {
        return true;
      }
    }
    return false;
  }

  async addDownload(downloadInfo) {
    try {
      const downloadId = uuidv4();
      const { url, fileName, connections = 10, downloadPath = this.settings.downloadPath } = downloadInfo;
      
      // Extract filename from URL if not provided
      const finalFileName = fileName || path.basename(new URL(url).pathname) || 'download';
      
      // Check if we should handle this file type
      if (!this.shouldHandleFileType(finalFileName)) {
        return {
          success: false,
          error: 'File type not monitored'
        };
      }
      
      const dl = new DownloaderHelper(url, downloadPath, {
        fileName: finalFileName,
        retry: { maxRetries: 5, delay: 3000 },
        removeOnStop: true,
        removeOnFail: true,
        override: true,
        httpRequestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      });

      const downloadItem = {
        id: downloadId,
        url,
        fileName: finalFileName,
        filePath: path.join(downloadPath, finalFileName),
        size: 0,
        downloaded: 0,
        progress: 0,
        speed: 0,
        status: 'downloading',
        connections,
        startTime: Date.now(),
        downloader: dl
      };

      this.downloads.set(downloadId, downloadItem);

      // Set up event handlers
      dl.on('download', (downloadInfo) => {
        downloadItem.size = parseInt(downloadInfo.totalSize) || 0;
      });

      dl.on('progress', (stats) => {
        downloadItem.downloaded = stats.downloaded;
        downloadItem.progress = stats.progress;
        downloadItem.speed = stats.speed;
        this.emit('progress', downloadId, {
          downloaded: stats.downloaded,
          progress: stats.progress,
          speed: stats.speed,
          size: downloadItem.size
        });
      });

      dl.on('end', () => {
        downloadItem.status = 'completed';
        downloadItem.progress = 100;
        this.emit('completed', downloadId);
      });

      dl.on('error', (err) => {
        downloadItem.status = 'error';
        downloadItem.error = err.message;
        this.emit('error', downloadId, err.message);
      });

      // Start download
      dl.start().catch(err => {
        downloadItem.status = 'error';
        downloadItem.error = err.message;
        this.emit('error', downloadId, err.message);
      });

      return {
        success: true,
        downloadId,
        download: {
          id: downloadId,
          url,
          fileName: finalFileName,
          size: 0,
          downloaded: 0,
          progress: 0,
          speed: 0,
          status: 'downloading',
          connections
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.downloader) {
      await download.downloader.pause();
      download.status = 'paused';
      return true;
    }
    return false;
  }

  async resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.downloader) {
      await download.downloader.resume();
      download.status = 'downloading';
      return true;
    }
    return false;
  }

  async cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.downloader) {
      await download.downloader.stop();
      this.downloads.delete(downloadId);
      return true;
    }
    return false;
  }

  getDownloads() {
    const downloads = [];
    for (const [id, download] of this.downloads) {
      downloads.push({
        id,
        url: download.url,
        fileName: download.fileName,
        filePath: download.filePath,
        size: download.size,
        downloaded: download.downloaded,
        progress: download.progress,
        speed: download.speed,
        status: download.status,
        connections: download.connections,
        error: download.error
      });
    }
    return downloads;
  }
}

module.exports = { DownloadManager };
