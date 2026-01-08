# Monthly Expense Tracker PWA

A Progressive Web App (PWA) for managing monthly company expenses, tracking daily tea expenses, handling reimbursements, and exporting data as CSV. Built with React and integrated with Google Sheets and Google Drive for cloud storage.

## Features

- **Monthly Balance Management**: Set initial balance and log reimbursements at the start of each month
- **Daily Expense Tracking**: Record daily expenses with date, description, amount, and optional attachments (screenshots/invoices)
- **Weekly Vendor Payments**: Log weekly payments to vendors
- **Monthly Reports**: View comprehensive monthly reports with balance calculations and automatic carry-forward
- **CSV Export**: Export monthly transactions as CSV with attachment links
- **Google Drive Integration**: Upload attachments to Google Drive with automatic folder organization by month
- **Google Sheets Storage**: All data stored in Google Sheets for cross-device synchronization
- **Offline Support**: Works offline with automatic sync when connection is restored
- **PWA**: Installable on mobile devices and works offline

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Google Cloud Console account
- Google Drive API and Google Sheets API enabled

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
8. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain
9. Copy the **Client ID**

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Client ID:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**📖 Need help getting your Google Client ID?** See [SETUP_GOOGLE_CLIENT_ID.md](./SETUP_GOOGLE_CLIENT_ID.md) for detailed step-by-step instructions.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### 6. Deploy

Deploy the `dist` directory to your hosting provider (Netlify, Vercel, etc.).

**Important**: After deployment, update your Google Cloud Console OAuth credentials with your production domain.

## Usage

### First Time Setup

1. Open the app in your browser
2. Click "Sign in with Google"
3. Grant permissions for Google Drive and Google Sheets
4. The app will automatically create a Google Spreadsheet and Drive folder structure

### Adding Monthly Balance

1. Navigate to "Monthly Balance"
2. Select the month
3. Enter initial balance
4. Add reimbursements (if any)
5. Click "Save Balance"

### Adding Daily Expenses

1. Navigate to "Daily Expense"
2. Select date
3. Enter description and amount
4. Optionally upload a screenshot or invoice
5. Click "Save Expense"

The attachment will be uploaded to Google Drive in a monthly folder structure: `ExpenseTracker/YYYY-MM/`

### Adding Weekly Payments

1. Navigate to "Weekly Payment"
2. Enter week end date (Sunday)
3. Enter payment amount and description
4. Click "Save Payment"

### Viewing Reports

1. Navigate to "Report"
2. Select the month to view
3. View summary, statistics, and all transactions
4. Click "Export CSV" to download monthly report

## PWA Installation

### On Mobile (Android/iOS)

1. Open the app in your mobile browser
2. Look for the "Add to Home Screen" prompt or use browser menu
3. Tap "Add to Home Screen"
4. The app will be installed and can be used offline

### On Desktop

1. Open the app in Chrome/Edge
2. Look for the install icon in the address bar
3. Click "Install"
4. The app will open in a standalone window

## Offline Support

- The app works offline after initial load
- Data entered offline is queued and synced when connection is restored
- Cached data is available for viewing offline
- File uploads are queued and processed when online

## Data Storage

- **Primary Storage**: Google Sheets (syncs across all devices)
- **File Storage**: Google Drive (organized by month)
- **Local Cache**: IndexedDB and localStorage (for offline access)

## CSV Export Format

The exported CSV includes:
- Date
- Description
- Amount
- Attachment URL (Google Drive link)

## Troubleshooting

### Authentication Issues

- Ensure Google Client ID is correctly set in `.env`
- Check that OAuth redirect URIs match your domain
- Clear browser cache and try again

### Sync Issues

- Check internet connection
- Click "Sync Data" button in the Report page
- Check browser console for errors

### File Upload Issues

- Ensure Google Drive API is enabled
- Check that you granted Drive permissions during sign-in
- Verify file size is within limits

## License

MIT

## Support

For issues and questions, please check the console for error messages and ensure all APIs are properly configured in Google Cloud Console.
