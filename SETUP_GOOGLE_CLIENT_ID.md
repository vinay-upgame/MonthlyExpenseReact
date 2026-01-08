# How to Get Your Google Client ID (VITE_GOOGLE_CLIENT_ID)

Follow these step-by-step instructions to obtain your Google OAuth 2.0 Client ID for the Monthly Expense Tracker app.

## Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

## Step 2: Create or Select a Project

1. Click on the project dropdown at the top of the page
2. Either:
   - **Create a new project**: Click "New Project", enter a name (e.g., "Expense Tracker"), and click "Create"
   - **Select an existing project**: Choose from the list

## Step 3: Enable Required APIs

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for and enable the following APIs:
   - **Google Drive API**
     - Click on it, then click "Enable"
   - **Google Sheets API**
     - Click on it, then click "Enable"

## Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace account)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Monthly Expense Tracker (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** page, click **Save and Continue** (we'll add scopes via the API)
7. On the **Test users** page (if in testing mode), you can add your email, then click **Save and Continue**
8. Review and click **Back to Dashboard**

## Step 5: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**
4. If prompted, choose **Web application** as the application type
5. Fill in the details:
   - **Name**: Expense Tracker Web Client (or any name you prefer)
   - **Authorized JavaScript origins**:
     - For development: `http://localhost:5173`
     - For production: `https://yourdomain.com` (replace with your actual domain)
   - **Authorized redirect URIs**:
     - For development: `http://localhost:5173`
     - For production: `https://yourdomain.com` (replace with your actual domain)
6. Click **Create**

## Step 6: Copy Your Client ID

1. A popup will appear showing your **Client ID** and **Client secret**
2. **Copy the Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
3. **Important**: You only need the Client ID for this app, not the Client secret

## Step 7: Add Client ID to Your App

1. In your project root, create a `.env` file (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and replace the placeholder with your actual Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```
   (Replace with your actual Client ID from Step 6)

3. Save the file

## Step 8: Restart Development Server

If your development server is running, restart it to load the new environment variable:
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## Important Notes

### For Development (localhost)
- Use `http://localhost:5173` in authorized origins and redirect URIs
- The app will work immediately after adding the Client ID

### For Production
- Before deploying, update the OAuth credentials in Google Cloud Console:
  1. Go to **APIs & Services** > **Credentials**
  2. Click on your OAuth 2.0 Client ID
  3. Add your production domain to:
     - **Authorized JavaScript origins**: `https://yourdomain.com`
     - **Authorized redirect URIs**: `https://yourdomain.com`
  4. Click **Save**

### Testing Mode vs Published
- Initially, your app will be in **Testing** mode
- Only users you add as "Test users" can sign in
- To make it available to anyone:
  1. Go to **OAuth consent screen**
  2. Click **PUBLISH APP**
  3. Confirm the action

### Security Best Practices
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Keep your Client ID secure
- Regularly review authorized domains in Google Cloud Console
- Remove unused domains for security

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches your app URL
- Check for trailing slashes or protocol mismatches (http vs https)

### "Error 403: access_denied"
- Your app might be in Testing mode
- Add your email as a test user in OAuth consent screen
- Or publish your app (if ready for production)

### "Google Client ID not configured"
- Check that `.env` file exists in the project root
- Verify the variable name is exactly `VITE_GOOGLE_CLIENT_ID`
- Restart the development server after creating/updating `.env`

## Quick Reference

**Where to find your Client ID later:**
- Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs

**Required APIs:**
- Google Drive API
- Google Sheets API

**Required Scopes (automatically requested):**
- `https://www.googleapis.com/auth/drive.file` (for file uploads)
- `https://www.googleapis.com/auth/spreadsheets` (for spreadsheet access)

