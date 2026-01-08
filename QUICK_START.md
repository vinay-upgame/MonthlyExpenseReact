# Quick Start Guide

## Prerequisites

1. **Node.js**: Version 20.19+ or 22.12+ (currently using 18.18.0 which may cause warnings)
2. **Google Cloud Console Account**: For OAuth credentials

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Google Drive API** and **Google Sheets API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized origins:
   - `http://localhost:5173` (development)
   - Your production domain
6. Copy the Client ID

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your Client ID:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. First Time Use

1. Click "Sign in with Google"
2. Grant permissions for Drive and Sheets
3. App will automatically create:
   - A Google Spreadsheet for data storage
   - A Drive folder structure: `ExpenseTracker/YYYY-MM/`

## Building for Production

```bash
npm run build
```

Deploy the `dist` folder to your hosting provider.

**Important**: Update OAuth redirect URIs in Google Cloud Console with your production domain.

## PWA Icons (Optional)

Generate PWA icons and place them in `public/icons/` directory. See `public/icons/README.md` for details.

The app works without custom icons but they improve the installation experience.

## Features

✅ Monthly balance and reimbursement tracking  
✅ Daily expense entry with file attachments  
✅ Weekly vendor payment logging  
✅ Monthly reports with automatic carry-forward  
✅ CSV export with Google Drive links  
✅ Offline support with auto-sync  
✅ Cross-device synchronization via Google Sheets  

## Troubleshooting

- **Build errors**: Ensure Node.js version is 20.19+ or 22.12+
- **Authentication issues**: Verify Client ID is correct and APIs are enabled
- **Sync issues**: Check internet connection and click "Sync Data" in Reports

