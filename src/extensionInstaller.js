const { app, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function installBrowserExtensions() {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      await installWindowsExtensions();
    } else if (platform === 'darwin') {
      await installMacExtensions();
    } else if (platform === 'linux') {
      await installLinuxExtensions();
    }
  } catch (error) {
    console.error('Error installing browser extensions:', error);
  }
}

async function installWindowsExtensions() {
  // Chrome extension installation
  const chromeExtensionPath = path.join(app.getPath('userData'), 'extensions', 'chrome');
  const chromeManifestPath = path.join(chromeExtensionPath, 'com.openweb.downloadmanager.json');
  
  await fs.mkdir(path.dirname(chromeManifestPath), { recursive: true });
  
  const chromeManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_origins: ['chrome-extension://YOUR_EXTENSION_ID/']
  };
  
  await fs.writeFile(chromeManifestPath, JSON.stringify(chromeManifest, null, 2));
  
  // Register with Chrome
  try {
    await execPromise(`reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.openweb.downloadmanager" /ve /t REG_SZ /d "${chromeManifestPath}" /f`);
  } catch (error) {
    console.error('Error registering Chrome extension:', error);
  }
  
  // Firefox extension installation
  const firefoxExtensionPath = path.join(app.getPath('userData'), 'extensions', 'firefox');
  const firefoxManifestPath = path.join(firefoxExtensionPath, 'com.openweb.downloadmanager.json');
  
  await fs.mkdir(path.dirname(firefoxManifestPath), { recursive: true });
  
  const firefoxManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_extensions: ['openweb-download-manager@openweb.co.za']
  };
  
  await fs.writeFile(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2));
  
  // Register with Firefox
  try {
    await execPromise(`reg add "HKCU\\Software\\Mozilla\\NativeMessagingHosts\\com.openweb.downloadmanager" /ve /t REG_SZ /d "${firefoxManifestPath}" /f`);
  } catch (error) {
    console.error('Error registering Firefox extension:', error);
  }
}

async function installMacExtensions() {
  // Chrome
  const chromeNativeHostPath = path.join(process.env.HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  await fs.mkdir(chromeNativeHostPath, { recursive: true });
  
  const chromeManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_origins: ['chrome-extension://YOUR_EXTENSION_ID/']
  };
  
  await fs.writeFile(
    path.join(chromeNativeHostPath, 'com.openweb.downloadmanager.json'),
    JSON.stringify(chromeManifest, null, 2)
  );
  
  // Firefox
  const firefoxNativeHostPath = path.join(process.env.HOME, 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts');
  await fs.mkdir(firefoxNativeHostPath, { recursive: true });
  
  const firefoxManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_extensions: ['openweb-download-manager@openweb.co.za']
  };
  
  await fs.writeFile(
    path.join(firefoxNativeHostPath, 'com.openweb.downloadmanager.json'),
    JSON.stringify(firefoxManifest, null, 2)
  );
}

async function installLinuxExtensions() {
  // Chrome
  const chromeNativeHostPath = path.join(process.env.HOME, '.config', 'google-chrome', 'NativeMessagingHosts');
  await fs.mkdir(chromeNativeHostPath, { recursive: true });
  
  const chromeManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_origins: ['chrome-extension://YOUR_EXTENSION_ID/']
  };
  
  await fs.writeFile(
    path.join(chromeNativeHostPath, 'com.openweb.downloadmanager.json'),
    JSON.stringify(chromeManifest, null, 2)
  );
  
  // Firefox
  const firefoxNativeHostPath = path.join(process.env.HOME, '.mozilla', 'native-messaging-hosts');
  await fs.mkdir(firefoxNativeHostPath, { recursive: true });
  
  const firefoxManifest = {
    name: 'com.openweb.downloadmanager',
    description: 'OpenWeb Download Manager Native Host',
    path: path.join(app.getPath('exe')),
    type: 'stdio',
    allowed_extensions: ['openweb-download-manager@openweb.co.za']
  };
  
  await fs.writeFile(
    path.join(firefoxNativeHostPath, 'com.openweb.downloadmanager.json'),
    JSON.stringify(firefoxManifest, null, 2)
  );
}

module.exports = {
  installBrowserExtensions
};
