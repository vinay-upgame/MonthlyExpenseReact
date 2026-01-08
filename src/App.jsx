import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GoogleAuth from './components/GoogleAuth';
import Navigation from './components/Navigation';
import MonthlyBalance from './components/MonthlyBalance';
import DailyExpense from './components/DailyExpense';
import WeeklyPayment from './components/WeeklyPayment';
import MonthlyReport from './components/MonthlyReport';
import * as syncService from './services/syncService.js';
import * as driveService from './services/driveService.js';
import * as sheetsService from './services/sheetsService.js';
import * as tokenRefresh from './services/tokenRefresh.js';
import { storage } from './utils/storage.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiReady, setApiReady] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setApiReady(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setApiReady(false);
  };

  useEffect(() => {
    const initializeAPI = async () => {
      try {
        const wasAuthenticated = storage.getIsAuthenticated();
        
        // Always initialize API if we have a client ID (needed for components)
        if (GOOGLE_CLIENT_ID) {
          try {
            // Load Google APIs
            await driveService.loadGoogleAPIs();
            
            // Initialize gapi client with discovery docs
            if (window.gapi) {
              // Always try to initialize, even if it seems initialized
              // This ensures the client is properly set up
              try {
                if (!window.gapi.client) {
                  await window.gapi.client.init({});
                }
                
                // Initialize with discovery docs if not already done
                if (!window.gapi.client.sheets || !window.gapi.client.drive) {
                  await window.gapi.client.init({
                    discoveryDocs: [
                      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                      'https://sheets.googleapis.com/$discovery/rest?version=v4'
                    ],
                  });
                }
                
                // Verify initialization
                if (!window.gapi.client.sheets) {
                  // Try loading sheets API explicitly
                  await window.gapi.client.load('sheets', 'v4');
                }
              } catch (initError) {
                console.warn('Error initializing gapi client, will retry:', initError);
                // Retry initialization
                await window.gapi.client.init({
                  discoveryDocs: [
                    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                    'https://sheets.googleapis.com/$discovery/rest?version=v4'
                  ],
                });
              }
            }
            
            await sheetsService.loadSheetsAPI();
            
            // Verify API is actually available
            if (!window.gapi?.client?.sheets) {
              console.warn('Sheets API not immediately available, will retry');
              // Wait a bit and try loading again
              await new Promise(resolve => setTimeout(resolve, 500));
              if (!window.gapi?.client?.sheets) {
                await window.gapi.client.load('sheets', 'v4');
              }
            }
            
            // Final verification
            if (!window.gapi?.client?.sheets) {
              console.error('Failed to initialize Google Sheets API after retries');
            } else {
              console.log('✓ Google Sheets API verified and ready');
            }
            
            // Initialize token clients (needed for token restoration)
            await driveService.initializeDriveAPI(GOOGLE_CLIENT_ID);
            await sheetsService.initializeSheetsAPI(GOOGLE_CLIENT_ID);
            
            // Mark API as ready (even without token, for cached data access)
            setApiReady(true);
            console.log('✓ Google API initialized');
            
            // If user was authenticated, restore token from localStorage
            if (wasAuthenticated) {
              // Ensure token is valid (refresh if needed)
              let token = await tokenRefresh.ensureValidToken();
              
              if (!token) {
                // Try to get token from storage
                token = storage.getToken();
              }
              
              if (token && token.access_token) {
                // Restore token to gapi client
                window.gapi.client.setToken(token);
                console.log('✓ Token restored from localStorage');
                
                // Verify token is still valid
                try {
                  const spreadsheetId = storage.getSpreadsheetId();
                  if (spreadsheetId) {
                    await window.gapi.client.sheets.spreadsheets.get({
                      spreadsheetId: spreadsheetId,
                    });
                  } else {
                    // No spreadsheet ID, but token is valid - just verify API works
                    await window.gapi.client.sheets.spreadsheets.list({
                      pageSize: 1,
                    });
                  }
                  // Token is valid
                  setIsAuthenticated(true);
                  console.log('✓ API initialized with restored token');
                  
                  // Initialize automatic token refresh
                  tokenRefresh.initTokenRefresh();
                } catch (error) {
                  // Token might be expired, try to refresh
                  console.log('Token validation failed, attempting refresh...', error);
                  try {
                    const refreshedToken = await tokenRefresh.refreshAccessToken();
                    if (refreshedToken && refreshedToken.access_token) {
                      setIsAuthenticated(true);
                      console.log('✓ Token refreshed and validated');
                      tokenRefresh.initTokenRefresh();
                    } else {
                      throw new Error('Token refresh failed');
                    }
                  } catch (refreshError) {
                    console.log('Token refresh failed, need to re-authenticate:', refreshError);
                    storage.clearToken();
                    storage.setIsAuthenticated(false);
                    if (window.gapi?.client) {
                      window.gapi.client.setToken('');
                    }
                    setIsAuthenticated(false);
                  }
                }
              } else {
                // No saved token found
                console.log('No saved token found, need to re-authenticate');
                storage.setIsAuthenticated(false);
                setIsAuthenticated(false);
              }
            } else {
              // Not authenticated, but API is ready
              console.log('API ready, user not authenticated');
            }
          } catch (error) {
            console.error('Error initializing API:', error);
            storage.setIsAuthenticated(false);
            setIsAuthenticated(false);
          }
        } else {
          // No client ID, mark as ready anyway
          setApiReady(true);
        }
      } catch (error) {
        console.error('Error in initializeAPI:', error);
      } finally {
        setIsLoading(false);
        // Initialize sync listener
        syncService.initSyncListener();
      }
    };

    initializeAPI();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GoogleAuth onAuthenticated={handleAuthenticated} />;
  }

  // Only show app when API is ready (or if no client ID configured)
  if (!apiReady && GOOGLE_CLIENT_ID) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Google API...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navigation onSignOut={handleSignOut} />
        <Routes>
          <Route path="/" element={<Navigate to="/monthly-balance" replace />} />
          <Route path="/monthly-balance" element={<MonthlyBalance />} />
          <Route path="/daily-expense" element={<DailyExpense />} />
          <Route path="/weekly-payment" element={<WeeklyPayment />} />
          <Route path="/report" element={<MonthlyReport />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
