const { app } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const Store = require('electron-store');

const store = new Store();

class SystemIntegration {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  async setup() {
    if (this.isWindows) {
      await this.setupWindowsIntegration();
    }
  }

  async setupWindowsIntegration() {
    try {
      // Register as default download handler in Windows Registry
      const appPath = process.execPath;
      const commands = [
        // Register application
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\OpenWebDM" /ve /d "URL:OpenWeb Download Manager Protocol" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\OpenWebDM" /v "URL Protocol" /d "" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\OpenWebDM\\DefaultIcon" /ve /d "${appPath},0" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\OpenWebDM\\shell\\open\\command" /ve /d "\\"${appPath}\\" \\"%1\\"" /f`,
        
        // Register for HTTP/HTTPS protocols with higher priority
        `reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v "ProgId" /d "OpenWebDM" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice" /v "ProgId" /d "OpenWebDM" /f`,
        
        // Register file associations for common download types
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\.exe\\OpenWithProgids" /v "OpenWebDM" /d "" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\.zip\\OpenWithProgids" /v "OpenWebDM" /d "" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\.rar\\OpenWithProgids" /v "OpenWebDM" /d "" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\.pdf\\OpenWithProgids" /v "OpenWebDM" /d "" /f`,
        `reg add "HKEY_CURRENT_USER\\Software\\Classes\\.mp4\\OpenWithProgids" /v "OpenWebDM" /d "" /f`,
        
        // Set download manager priority
        `reg add "HKEY_CURRENT_USER\\Software\\DownloadManagers\\OpenWebDM" /v "Priority" /t REG_DWORD /d 1 /f`
      ];

      // Execute registry commands
      for (const cmd of commands) {
        await this.executeCommand(cmd);
      }

      // Disable IDM integration temporarily when our app is running
      await this.adjustIDMPriority();
      
    } catch (error) {
      console.error('Failed to set up Windows integration:', error);
    }
  }

  async adjustIDMPriority() {
    try {
      // Check if IDM is installed
      const idmCommands = [
        // Temporarily lower IDM's priority in registry
        `reg add "HKEY_CURRENT_USER\\Software\\DownloadManager\\IDM\\Settings" /v "CaptureEnabled" /t REG_DWORD /d 0 /f`,
        // Backup original IDM settings
        `reg export "HKEY_CURRENT_USER\\Software\\DownloadManager" "%TEMP%\\idm_backup.reg" /y`
      ];

      for (const cmd of idmCommands) {
        await this.executeCommand(cmd).catch(() => {
          // IDM might not be installed, ignore errors
        });
      }
    } catch (error) {
      // Ignore errors if IDM is not installed
    }
  }

  async enableCapture() {
    store.set('captureEnabled', true);
    if (this.isWindows) {
      await this.adjustIDMPriority();
    }
  }

  async disableCapture() {
    store.set('captureEnabled', false);
    if (this.isWindows) {
      // Restore IDM settings
      await this.restoreIDMSettings();
    }
  }

  async restoreIDMSettings() {
    try {
      await this.executeCommand(`reg import "%TEMP%\\idm_backup.reg"`);
    } catch (error) {
      // Ignore if backup doesn't exist
    }
  }

  async cleanup() {
    if (this.isWindows) {
      // Restore IDM settings on app exit
      await this.restoreIDMSettings();
    }
  }

  executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

module.exports = { SystemIntegration };
