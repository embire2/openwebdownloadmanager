// Chrome extension background script
chrome.downloads.onCreated.addListener((downloadItem) => {
  // Check if OpenWeb Download Manager should handle this download
  chrome.storage.sync.get(['enabled', 'fileTypes'], (result) => {
    if (result.enabled) {
      const url = downloadItem.url;
      const filename = downloadItem.filename;
      
      // Cancel Chrome's download
      chrome.downloads.cancel(downloadItem.id);
      
      // Send to OpenWeb Download Manager via native messaging
      chrome.runtime.sendNativeMessage('com.openweb.downloadmanager', {
        action: 'download',
        url: url,
        filename: filename
      });
    }
  });
});

// Handle connection to popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onMessage.addListener((msg) => {
      if (msg.action === 'getStatus') {
        chrome.storage.sync.get(['enabled'], (result) => {
          port.postMessage({ enabled: result.enabled || false });
        });
      }
    });
  }
});
