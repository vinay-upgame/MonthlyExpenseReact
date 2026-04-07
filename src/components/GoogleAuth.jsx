import { useState, useEffect } from 'react';
import * as driveService from '../services/driveService.js';
import * as sheetsService from '../services/sheetsService.js';
import * as tokenRefresh from '../services/tokenRefresh.js';
import { storage } from '../utils/storage.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function GoogleAuth({ onAuthenticated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await driveService.loadGoogleAPIs();
      
      // Initialize gapi client with discovery docs
      if (window.gapi && !window.gapi.client.sheets) {
        await window.gapi.client.init({
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://sheets.googleapis.com/$discovery/rest?version=v4'
          ],
        });
      }
      
      await sheetsService.loadSheetsAPI();
      
      if (GOOGLE_CLIENT_ID) {
        await driveService.initializeDriveAPI(GOOGLE_CLIENT_ID);
        await sheetsService.initializeSheetsAPI(GOOGLE_CLIENT_ID);
      }

      const authenticated = driveService.isAuthenticated() && storage.getIsAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated && onAuthenticated) {
        // Ensure API is properly initialized before initializing app
        if (window.gapi && !window.gapi.client.sheets) {
          await window.gapi.client.init({
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              'https://sheets.googleapis.com/$discovery/rest?version=v4'
            ],
          });
        }
        await initializeApp();
        onAuthenticated();
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  const initializeApp = async () => {
    try {
      // Wait a moment to ensure API is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify API is ready
      if (!window.gapi?.client?.sheets) {
        throw new Error('Google Sheets API not ready');
      }
      
      // Get or create spreadsheet
      const spreadsheetId = await sheetsService.getOrCreateSpreadsheet();
      
      if (!spreadsheetId) {
        throw new Error('Failed to get or create spreadsheet');
      }
      
      // Load initial data
      await sheetsService.loadAllData();
      
      console.log('✓ App initialized with spreadsheet:', spreadsheetId);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError(err.message || 'Failed to initialize app. Please try again.');
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env file.');
      }

      // Load APIs
      await driveService.loadGoogleAPIs();
      
      // Initialize gapi client with discovery docs for both Drive and Sheets
      if (!window.gapi.client.sheets) {
        await window.gapi.client.init({
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://sheets.googleapis.com/$discovery/rest?version=v4'
          ],
        });
      }
      
      await sheetsService.loadSheetsAPI();

      // Request access token for both Drive and Sheets in one request
      // drive.readonly is needed to search for existing spreadsheets
      // access_type: 'offline' ensures we get a refresh token for long-term access
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error);
            setIsLoading(false);
            return;
          }
          
          // Ensure gapi client is initialized before setting token
          if (!window.gapi.client.sheets) {
            await window.gapi.client.init({
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                'https://sheets.googleapis.com/$discovery/rest?version=v4'
              ],
            });
          }
          
          // Set token for gapi client
          window.gapi.client.setToken(tokenResponse);
          
          // Log token response to verify refresh_token is received
          console.log('Token response:', {
            hasAccessToken: !!tokenResponse.access_token,
            hasRefreshToken: !!tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          });

          // IMPORTANT: On first login with access_type: 'offline', Google returns a refresh_token
          // On subsequent logins, Google may NOT return refresh_token again (this is normal)
          // The refresh_token is only returned once per grant unless the user revokes access
          
          // Save token to localStorage for persistence (including refresh token if available)
          storage.saveToken(tokenResponse);
          
          // Initialize automatic token refresh
          tokenRefresh.initTokenRefresh();
          
          storage.setIsAuthenticated(true);
          setIsAuthenticated(true);
          
          await initializeApp();
          
          if (onAuthenticated) {
            onAuthenticated();
          }
          setIsLoading(false);
        },
      });

      // Request token with consent and offline access to get refresh token
      // access_type: 'offline' is required to receive a refresh_token
      tokenClient.requestAccessToken({
        prompt: 'consent',
        access_type: 'offline'
      });
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('../utils/signOut.js');
      await signOut();
      setIsAuthenticated(false);
      // Reload to reset app state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-green-600">✓ Authenticated</span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 lg:p-8 mx-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Monthly Expense Tracker</h1>
        <p className="text-gray-600 mb-6">
          Sign in with Google to access your expense data stored in Google Sheets and Drive.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 touch-target disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Signing in...
            </span>
          ) : (
            '🔐 Sign in with Google'
          )}
        </button>

        {!GOOGLE_CLIENT_ID && (
          <p className="mt-4 text-sm text-red-600">
            ⚠️ Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
          </p>
        )}
      </div>
    </div>
  );
}

