# OpenWeb Download Manager

## App Icon and Logo Requirements

To properly brand OpenWeb Download Manager, you need to provide the following icon files:

### Windows Icons
1. **icon.ico** - Windows icon file containing multiple resolutions:
   - 16x16 pixels
   - 32x32 pixels
   - 48x48 pixels
   - 256x256 pixels

### PNG Icons (for all platforms)
Place these in the `assets` folder:

1. **icon.png** - Main icon (512x512 pixels) - Used as the base icon
2. **icon@2x.png** - Retina display icon (1024x1024 pixels)
3. **icon-16.png** - Small icon (16x16 pixels)
4. **icon-32.png** - Medium icon (32x32 pixels)
5. **icon-64.png** - Large icon (64x64 pixels)
6. **icon-128.png** - Extra large icon (128x128 pixels)
7. **icon-256.png** - Extra extra large icon (256x256 pixels)

### Browser Extension Icons
Place these in the respective browser extension folders:

For Chrome (`browser-extensions/chrome/`):
- **icon16.png** - 16x16 pixels
- **icon48.png** - 48x48 pixels
- **icon128.png** - 128x128 pixels

For Firefox (`browser-extensions/firefox/`):
- **icon16.png** - 16x16 pixels
- **icon48.png** - 48x48 pixels
- **icon128.png** - 128x128 pixels

### Icon Design Guidelines
- Use a clean, modern design that represents downloading/file transfer
- Include the OpenWeb branding if applicable
- Ensure the icon is recognizable at small sizes
- Use the color scheme: Primary #9E7FFF (purple) with accents
- Transparent background for PNG files
- High contrast for visibility on different backgrounds

### Additional Assets Needed
1. **chrome.png** - Chrome browser logo (32x32 pixels)
2. **firefox.png** - Firefox browser logo (32x32 pixels)
3. **complete.mp3** - Notification sound for completed downloads (1-2 seconds)

## Features Implemented

- ✅ Automatic browser extension installation during setup
- ✅ File type monitoring settings with popular file types
- ✅ About page with company information
- ✅ Auto-update feature monitoring OpenWeb Software Solutions
- ✅ Changelog popup for new versions
- ✅ System tray minimize on close (fixed)
- ✅ Download manager takes preference over other managers

## Building the Application

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for Windows
npm run build-win

# Build for all platforms
npm run dist
```

## Version Information
Current Version: 1.0.0-beta
Update URL: https://software.openweb.co.za/odm/
