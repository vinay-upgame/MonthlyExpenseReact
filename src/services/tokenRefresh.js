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
        const timeoutMs = 15000; // 15 second timeout
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('Silent token refresh timed out'));
        }, timeoutMs);

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
          callback: (tokenResponse) => {
            if (settled) return;
            clearTimeout(timeoutId);
            settled = true;
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error));
              return;
            }
            storage.saveToken(tokenResponse);
            if (window.gapi?.client) {
              window.gapi.client.setToken(tokenResponse);
            }
            console.log('✓ Token refreshed using Google Identity Services');
            resolve(tokenResponse);
          },
        });
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
 * Check if token needs refresh and refresh if needed.
 * Returns a valid token object, or null if fully unauthenticated.
 * On refresh failure for an expired token, returns the expired token so gapi
 * can still be set — actual API calls handle 401s via executeWithTokenRetry.
 */
export const ensureValidToken = async () => {
  try {
    const token = storage.getToken();

    if (!token) {
      // No token stored at all — cannot continue without login
      return null;
    }

    // Token is still valid and not expiring soon
    if (!token.needsRefresh) {
      return token;
    }

    // Token is expired or expiring — attempt background refresh
    console.log(token.isExpired ? 'Token expired, attempting silent refresh...' : 'Token expiring soon, refreshing proactively...');
    try {
      return await refreshAccessToken();
    } catch (error) {
      console.warn('Token refresh failed:', error);
      // On failure: return expired token so gapi.client stays set.
      // The next real API call will get a 401 and executeWithTokenRetry will handle it.
      return token;
    }
  } catch (error) {
    console.error('Error ensuring valid token:', error);
    return null;
  }
};

/**
 * Run an API request; on 401/token error refresh token and retry once.
 * Use this to wrap gapi calls so expired tokens don't force re-login.
 */
export const executeWithTokenRetry = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    const status = error?.status ?? error?.result?.error?.code;
    const msg = (error?.message || error?.result?.error?.message || '').toLowerCase();
    const isAuthError = status === 401 || status === 403 || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('credential');
    if (!isAuthError) throw error;
    try {
      const token = await refreshAccessToken();
      if (token && window.gapi?.client) {
        window.gapi.client.setToken(token);
      }
      return await requestFn();
    } catch (refreshErr) {
      console.warn('Token refresh then retry failed:', refreshErr);
      throw error;
    }
  }
};

/**
 * Initialize automatic token refresh.
 * Runs every 25 minutes so we refresh before 1h expiry. Keeps user always logged in.
 */
export const initTokenRefresh = () => {
  const REFRESH_INTERVAL_MS = 25 * 60 * 1000; // 25 minutes

  setInterval(async () => {
    if (!storage.getIsAuthenticated()) return;
    try {
      const token = await ensureValidToken();
      if (token && window.gapi?.client) {
        window.gapi.client.setToken(token);
      }
    } catch (error) {
      console.error('Automatic token refresh failed:', error);
    }
  }, REFRESH_INTERVAL_MS);

  // Run immediately
  ensureValidToken().then((token) => {
    if (token && window.gapi?.client) {
      window.gapi.client.setToken(token);
    }
  });
};

