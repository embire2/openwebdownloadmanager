const { app } = require('electron');
const https = require('https');
const EventEmitter = require('events');

class AutoUpdater extends EventEmitter {
  constructor() {
    super();
    this.updateUrl = 'https://software.openweb.co.za/odm/';
    this.currentVersion = '1.0.0-beta';
  }

  async checkForUpdates(manual = false) {
    try {
      const latestVersion = await this.fetchLatestVersion();
      
      if (this.isNewerVersion(latestVersion.version, this.currentVersion)) {
        this.emit('update-available', {
          version: latestVersion.version,
          releaseNotes: latestVersion.releaseNotes,
          downloadUrl: latestVersion.downloadUrl
        });
      } else if (manual) {
        this.emit('update-not-available');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      if (manual) {
        this.emit('error', error);
      }
    }
  }

  fetchLatestVersion() {
    return new Promise((resolve, reject) => {
      https.get(`${this.updateUrl}latest.json`, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const versionInfo = JSON.parse(data);
            resolve(versionInfo);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  isNewerVersion(latest, current) {
    const latestParts = latest.replace('-beta', '').split('.').map(Number);
    const currentParts = current.replace('-beta', '').split('.').map(Number);
    
    for (let i = 0; i < latestParts.length; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }
    
    // Check if latest is not beta while current is
    return !latest.includes('beta') && current.includes('beta');
  }
}

module.exports = {
  autoUpdater: new AutoUpdater()
};
