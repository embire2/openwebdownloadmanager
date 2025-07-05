# OpenWeb Download Manager

A powerful, modern download manager with multi-connection acceleration and system-level download interception.

## Version 1.0.1 Features

### 🚀 Key Features
- **No Browser Extension Required** - Works with all browsers automatically
- **System-Level Download Interception** - Captures downloads before other managers (including IDM)
- **Multi-Connection Downloads** - Accelerate downloads with up to 32 simultaneous connections
- **Smart File Management** - Automatic categorization of downloads
- **Resume Support** - Continue interrupted downloads from where they left off
- **Clipboard Monitoring** - Automatically detect download URLs from clipboard
- **Global Hotkey** - Press `Ctrl+Alt+D` to quickly add downloads

### 🎯 What's New in v1.0.1
- Standalone operation without browser extensions
- Windows Registry integration for protocol handling
- Priority handling over Internet Download Manager (IDM)
- System-wide download capture
- Enhanced clipboard monitoring
- Administrator privileges for better system integration

## System Requirements

- Windows 10/11 (64-bit)
- Administrator privileges (for system integration)
- 4GB RAM minimum
- 100MB free disk space

## Installation

1. Download the latest installer from [OpenWeb Software Solutions](https://software.openweb.co.za/odm/)
2. Run the installer with administrator privileges
3. Follow the installation wizard
4. The app will automatically configure system integration

## Usage

### Automatic Download Capture
Once installed, OpenWeb Download Manager automatically intercepts downloads from any browser. No configuration needed!

### Adding Downloads Manually
- **From Clipboard**: Press `Ctrl+Alt+D` or click "Add from Clipboard" in the menu
- **Direct URL**: Click "Add URL" button or press `Ctrl+N`
- **Batch Downloads**: Use `Ctrl+B` for multiple URLs

### Managing Downloads
- **Pause/Resume**: Control individual downloads or all at once
- **Categories**: Filter downloads by type (Documents, Videos, Music, etc.)
- **Speed Limit**: Set bandwidth limits per download
- **Scheduling**: Queue downloads for later

### Settings
Access settings to configure:
- Maximum connections per download (1-32)
- Default download location
- File type monitoring
- Sound notifications
- Clipboard monitoring
- Download capture enable/disable

## Icon and Asset Requirements

### Application Icons
Place these files in the `assets` folder:

1. **icon.ico** - Windows icon (16x16, 32x32, 48x48, 256x256)
2. **icon.png** - Main icon (512x512)
3. **icon@2x.png** - Retina display (1024x1024)
4. **icon-16.png** - Small icon (16x16)
5. **icon-32.png** - Medium icon (32x32)
6. **icon-64.png** - Large icon (64x64)
7. **icon-128.png** - Extra large icon (128x128)
8. **icon-256.png** - Extra extra large icon (256x256)

### Additional Assets
1. **complete.mp3** - Notification sound for completed downloads

### Design Guidelines
- Use OpenWeb brand colors: Primary #9E7FFF (purple)
- Clean, modern design representing download/transfer
- High contrast for visibility
- Transparent PNG backgrounds

## Building from Source

### Prerequisites
- Node.js 18+ and npm
- Windows build tools
- Administrator access

### Build Steps
```bash
# Clone the repository
git clone https://github.com/openweb/download-manager.git
cd download-manager

# Install dependencies
npm install

# Run in development
npm run dev

# Build for Windows
npm run build-win

# Create installer
npm run dist
```

## Troubleshooting

### Downloads not being captured
1. Ensure the app is running with administrator privileges
2. Check if "Enable download capture" is turned on in settings or system tray
3. Restart the app after installation

### Conflict with other download managers
- OpenWeb Download Manager automatically takes priority over IDM and other managers
- You can disable capture temporarily from the system tray menu

### Downloads failing
- Check your internet connection
- Verify the download URL is valid
- Ensure you have write permissions to the download folder

## Privacy & Security

- No data collection or tracking
- All downloads are handled locally
- No external servers except for update checks
- Open source and transparent

## Support

- **Website**: [software.openweb.co.za](https://software.openweb.co.za)
- **Email**: support@openweb.co.za
- **Documentation**: [docs.openweb.co.za/odm](https://docs.openweb.co.za/odm)

## License

© 2025 OpenWeb Software Solutions. All rights reserved.

Licensed under the MIT License. See LICENSE file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

**OpenWeb Download Manager** - Accelerate your downloads, simplify your life.
