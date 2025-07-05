# OpenWeb Download Manager

A powerful, multi-connection download manager for Windows built with Electron. OpenWeb Download Manager accelerates your downloads by splitting files into multiple segments and downloading them simultaneously.

## Features

- **Multi-Connection Downloads**: Split downloads into up to 32 simultaneous connections
- **Download Acceleration**: Significantly faster downloads compared to browser downloads
- **Resume Support**: Pause and resume downloads anytime
- **File Categorization**: Automatic organization by file type (Documents, Videos, Music, etc.)
- **Browser Integration**: Chrome and Firefox extensions for seamless download capture
- **Modern UI**: Beautiful, dark-themed interface with smooth animations
- **System Tray**: Minimize to system tray and continue downloading in background

## Installation

### From Source

1. **Prerequisites**:
   - Node.js 18 or higher
   - npm (comes with Node.js)
   - Windows 10 or higher

2. **Clone and Setup**:
   ```bash
   git clone https://github.com/yourusername/openweb-download-manager.git
   cd openweb-download-manager
   ```

3. **Run Setup**:
   ```bash
   setup.bat
   ```
   This will install dependencies and build the Windows installer.

4. **Install**: 
   - Navigate to the `dist` folder
   - Run the generated installer

### Development

To run in development mode:
```bash
npm start
```

To build a new installer:
```bash
npm run build-win
```

## Browser Extensions

### Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extensions/chrome` folder

### Firefox Extension
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `browser-extensions/firefox` folder

## Usage

1. **Add Downloads**:
   - Click "Add URL" or press Ctrl+N
   - Paste the download URL
   - Adjust number of connections (default: 10)
   - Click "Start Download"

2. **Manage Downloads**:
   - Pause/Resume individual downloads
   - View download progress and speed
   - Open downloaded files or their folders
   - Filter by file type using category tabs

3. **Settings**:
   - Configure default download path
   - Set maximum connections per download
   - Enable/disable sound notifications
   - Manage browser integration

## Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, ODT, RTF, XLS, XLSX, PPT, PPTX
- **Compressed**: ZIP, RAR, 7Z, TAR, GZ, BZ2, XZ
- **Programs**: EXE, MSI, DMG, DEB, RPM, APPIMAGE
- **Videos**: MP4, AVI, MKV, MOV, WMV, FLV, WEBM
- **Music**: MP3, WAV, FLAC, AAC, OGG, WMA, M4A

## Technical Details

- Built with Electron 28
- Multi-threaded downloading using Node.js streams
- Supports HTTP range requests for parallel downloading
- Automatic retry on connection failures
- Efficient chunk merging algorithm

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the GitHub issue tracker.
