const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.downloads = new Map();
    this.activeConnections = new Map();
  }

  async addDownload(downloadInfo) {
    const downloadId = uuidv4();
    
    try {
      // Get file info
      const response = await axios.head(downloadInfo.url);
      const contentLength = parseInt(response.headers['content-length'] || 0);
      const acceptRanges = response.headers['accept-ranges'] === 'bytes';
      
      const download = {
        id: downloadId,
        url: downloadInfo.url,
        fileName: downloadInfo.fileName || this.extractFileName(downloadInfo.url),
        filePath: path.join(downloadInfo.downloadPath, downloadInfo.fileName || this.extractFileName(downloadInfo.url)),
        size: contentLength,
        downloaded: 0,
        status: 'pending',
        speed: 0,
        progress: 0,
        connections: downloadInfo.connections || 10,
        supportsRange: acceptRanges,
        startTime: Date.now(),
        chunks: []
      };

      this.downloads.set(downloadId, download);
      
      // Start download immediately
      this.startDownload(downloadId);
      
      return { success: true, downloadId, download };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async startDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) return;

    download.status = 'downloading';
    download.startTime = Date.now();

    if (download.supportsRange && download.size > 0) {
      // Multi-connection download
      await this.startMultiConnectionDownload(downloadId);
    } else {
      // Single connection download
      await this.startSingleConnectionDownload(downloadId);
    }
  }

  async startMultiConnectionDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    const chunkSize = Math.ceil(download.size / download.connections);
    const chunks = [];
    const connections = [];

    // Create temporary directory for chunks
    const tempDir = path.join(path.dirname(download.filePath), `.${download.id}_temp`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (let i = 0; i < download.connections; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, download.size - 1);
      
      chunks.push({
        index: i,
        start,
        end,
        downloaded: 0,
        filePath: path.join(tempDir, `chunk_${i}`)
      });
    }

    download.chunks = chunks;

    // Start all connections
    for (const chunk of chunks) {
      connections.push(this.downloadChunk(downloadId, chunk));
    }

    this.activeConnections.set(downloadId, connections);

    try {
      await Promise.all(connections);
      await this.mergeChunks(downloadId);
      download.status = 'completed';
      this.emit('completed', downloadId);
    } catch (error) {
      download.status = 'error';
      download.error = error.message;
      this.emit('error', downloadId, error.message);
    }
  }

  async downloadChunk(downloadId, chunk) {
    const download = this.downloads.get(downloadId);
    
    const response = await axios({
      method: 'GET',
      url: download.url,
      headers: {
        'Range': `bytes=${chunk.start + chunk.downloaded}-${chunk.end}`
      },
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(chunk.filePath, { flags: 'a' });
    
    return new Promise((resolve, reject) => {
      let downloaded = chunk.downloaded;
      
      response.data.on('data', (data) => {
        downloaded += data.length;
        chunk.downloaded = downloaded;
        
        // Update total progress
        const totalDownloaded = download.chunks.reduce((sum, c) => sum + c.downloaded, 0);
        download.downloaded = totalDownloaded;
        download.progress = (totalDownloaded / download.size) * 100;
        
        // Calculate speed
        const elapsedTime = (Date.now() - download.startTime) / 1000;
        download.speed = totalDownloaded / elapsedTime;
        
        this.emit('progress', downloadId, {
          downloaded: totalDownloaded,
          total: download.size,
          progress: download.progress,
          speed: download.speed
        });
      });

      response.data.on('end', () => {
        writer.end();
        resolve();
      });

      response.data.on('error', (error) => {
        writer.end();
        reject(error);
      });

      writer.on('error', reject);
      
      response.data.pipe(writer);
    });
  }

  async mergeChunks(downloadId) {
    const download = this.downloads.get(downloadId);
    const writeStream = fs.createWriteStream(download.filePath);

    for (const chunk of download.chunks) {
      const chunkData = fs.readFileSync(chunk.filePath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunk.filePath); // Clean up chunk file
    }

    writeStream.end();

    // Clean up temp directory
    const tempDir = path.join(path.dirname(download.filePath), `.${download.id}_temp`);
    fs.rmdirSync(tempDir);
  }

  async startSingleConnectionDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    
    const response = await axios({
      method: 'GET',
      url: download.url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(download.filePath);
    
    let downloaded = 0;
    
    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      download.downloaded = downloaded;
      download.progress = download.size ? (downloaded / download.size) * 100 : 0;
      
      const elapsedTime = (Date.now() - download.startTime) / 1000;
      download.speed = downloaded / elapsedTime;
      
      this.emit('progress', downloadId, {
        downloaded,
        total: download.size,
        progress: download.progress,
        speed: download.speed
      });
    });

    response.data.on('end', () => {
      download.status = 'completed';
      this.emit('completed', downloadId);
    });

    response.data.on('error', (error) => {
      download.status = 'error';
      download.error = error.message;
      this.emit('error', downloadId, error.message);
    });

    response.data.pipe(writer);
  }

  pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'downloading') {
      download.status = 'paused';
      // Cancel active connections
      const connections = this.activeConnections.get(downloadId);
      if (connections) {
        // Implementation for canceling axios requests
      }
      return true;
    }
    return false;
  }

  resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'paused') {
      this.startDownload(downloadId);
      return true;
    }
    return false;
  }

  cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'cancelled';
      // Clean up files
      if (fs.existsSync(download.filePath)) {
        fs.unlinkSync(download.filePath);
      }
      // Clean up chunks
      const tempDir = path.join(path.dirname(download.filePath), `.${download.id}_temp`);
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
      this.downloads.delete(downloadId);
      return true;
    }
    return false;
  }

  getDownloads() {
    return Array.from(this.downloads.values());
  }

  extractFileName(url) {
    const urlPath = new URL(url).pathname;
    const fileName = path.basename(urlPath);
    return fileName || `download_${Date.now()}`;
  }
}

module.exports = { DownloadManager };
