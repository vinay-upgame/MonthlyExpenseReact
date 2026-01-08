# Development Tips

## Code Not Updating in Browser?

If your code changes aren't showing up when you refresh the browser, try these solutions:

### 1. Hard Refresh
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R` (Mac)

### 2. Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Unregister Service Worker
The service worker is disabled in development mode, but if you have an old one registered:

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for any registered service workers
5. Refresh the page

### 4. Clear All Site Data
1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear storage** or **Clear site data**
4. Check all boxes and click **Clear site data**
5. Refresh the page

### 5. Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 6. Clear Vite Cache
```bash
# Delete node_modules/.vite folder
rm -rf node_modules/.vite
# Or on Windows:
# rmdir /s node_modules\.vite

# Then restart dev server
npm run dev
```

## Service Worker in Development

The service worker is **automatically disabled** in development mode to prevent caching issues. It will only be active in production builds.

## Browser DevTools Settings

For best development experience:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Disable cache** checkbox
4. Keep DevTools open while developing

This ensures the browser always fetches fresh files from the dev server.

