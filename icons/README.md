# PWA Icons

This directory should contain PWA icons for the app. The following sizes are required:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a single source image (recommended: 512x512px) using:

1. Online tools like:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://favicon.io/

2. Or use ImageMagick:
   ```bash
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   # ... and so on
   ```

3. Or use a Node.js script with sharp:
   ```bash
   npm install sharp
   node generate-icons.js
   ```

For now, you can use any placeholder icons or the default Vite icon. The app will work without custom icons, but they improve the PWA installation experience.

