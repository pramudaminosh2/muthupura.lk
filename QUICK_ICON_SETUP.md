# Quick PWA Setup - Icon Generator

This directory contains helper scripts for PWA setup.

## Generate Icons

### Option 1: Automated (Recommended)
```bash
npm install sharp
node generate-pwa-icons.js
```

This will automatically:
- Resize logo.PNG to 192x192 and 512x512
- Create maskable variants for adaptive design
- Place all icons in Frontend/icons/

### Option 2: Online Tool
Visit: https://progressiveapp.design/pwaassetgenerator
- Upload your logo
- Select all icon sizes
- Download ZIP
- Extract to Frontend/icons/

### Option 3: ImageMagick
```bash
# If ImageMagick is installed
convert Frontend/logo.PNG -resize 192x192 Frontend/icons/icon-192.png
convert Frontend/logo.PNG -resize 512x512 Frontend/icons/icon-512.png
```

---

## Verify Setup

After generating icons, verify:

```bash
# Check all files exist
ls -la Frontend/icons/
# Should show: icon-192.png, icon-512.png, and maskable variants

# Run lighthouse audit
npm install -g lighthouse
lighthouse https://your-pwa-url --view
```

---

## What's Included

- ✅ manifest.json - App metadata
- ✅ service-worker.js - Offline support
- ✅ offline.html - Offline fallback
- ✅ pwa-install.js - Installation handling
- ✅ Updated HTML files - PWA links

---

See PWA_SETUP_GUIDE.md for full documentation.
