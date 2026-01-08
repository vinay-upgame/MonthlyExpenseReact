/**
 * Token refresh service for automatic token renewal
 */

import { storage } from '../utils/storage.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Refresh access token using refresh token or Google Identity Services
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = storage.getRefreshToken();
    
    // If we have a refresh token, use OAuth 2.0 endpoint
    if (refreshToken) {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token refresh failed');
      }

      const tokenData = await response.json();
      
      // Update stored token
      storage.saveToken({
        ...tokenData,
        refresh_token: refreshToken, // Keep the same refresh token
      });

      // Update gapi client token
      if (window.gapi?.client) {
        window.gapi.client.setToken(tokenData);
      }

      console.log('✓ Token refreshed successfully using refresh token');
      return tokenData;
    }
    
    // If no refresh token, try to use Google Identity Services silent refresh
    // This works if user is still logged into Google account
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      return new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
          callback: (tokenResponse) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error));
              return;
            }
            
            // Save the new token
            storage.saveToken(tokenResponse);
            
            // Update gapi client
            if (window.gapi?.client) {
              window.gapi.client.setToken(tokenResponse);
            }
            
            console.log('✓ Token refreshed using Google Identity Services');
            resolve(tokenResponse);
          },
        });
        
        // Request token silently
        tokenClient.requestAccessToken({ prompt: 'none' });
      });
    }
    
    throw new Error('No refresh token available and silent refresh not possible');
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Check if token needs refresh and refresh if needed
 */
export const ensureValidToken = async () => {
  try {
    const token = storage.getToken();
    
    if (!token) {
      // No token, check if we have refresh token
      const refreshToken = storage.getRefreshToken();
      if (refreshToken) {
        console.log('No access token, refreshing...');
        return await refreshAccessToken();
      }
      return null;
    }

    // If token expires soon (within 5 minutes), refresh it
    if (token.needsRefresh) {
      console.log('Token expires soon, refreshing...');
      try {
        return await refreshAccessToken();
      } catch (error) {
        console.warn('Token refresh failed, using existing token:', error);
        return token;
      }
    }

    return token;
  } catch (error) {
    console.error('Error ensuring valid token:', error);
    return null;
  }
};

/**
 * Initialize automatic token refresh
 * Checks token every 10 minutes and refreshes if needed
 */
export const initTokenRefresh = () => {
  // Check token every 10 minutes
  setInterval(async () => {
    try {
      await ensureValidToken();
    } catch (error) {
      console.error('Automatic token refresh failed:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Also check immediately
  ensureValidToken();
};

