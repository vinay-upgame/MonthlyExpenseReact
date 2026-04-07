/**
 * Token refresh service for automatic token renewal
 *
 * IMPORTANT: Google Identity Services (GIS) handles token refresh internally.
 * The refresh_token is only returned once during initial consent grant.
 * For subsequent refreshes, use GIS silent refresh (prompt: 'none').
 */

import { storage } from '../utils/storage.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets';

// Store reference to token client for reuse
let _tokenClient = null;

/**
 * Get or create token client for GIS
 */
const getTokenClient = (callback) => {
  if (!_tokenClient && window.google?.accounts?.oauth2) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: callback,
    });
  }
  return _tokenClient;
};

/**
 * Refresh access token using Google Identity Services silent refresh
 *
 * Note: The old OAuth2 refresh_token endpoint requires client_secret which
 * cannot be safely stored in browser apps. GIS handles refresh internally.
 */
export const refreshAccessToken = async () => {
  return new Promise((resolve, reject) => {
    // Check if Google Identity Services is available
    if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
      reject(new Error('Google Identity Services not available'));
      return;
    }

    const timeoutMs = 20000; // 20 second timeout
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn('Token refresh timed out');
      reject(new Error('Token refresh timed out'));
    }, timeoutMs);

    const handleCallback = (tokenResponse) => {
      if (settled) return;

      clearTimeout(timeoutId);
      settled = true;

      if (tokenResponse.error || !tokenResponse.access_token) {
        console.warn('GIS token refresh failed:', tokenResponse.error || 'No access token');
        reject(new Error(tokenResponse.error || 'Token refresh failed'));
        return;
      }

      // Save the new token
      storage.saveToken(tokenResponse);

      // Update gapi client token
      if (window.gapi?.client) {
        window.gapi.client.setToken(tokenResponse);
      }

      console.log('✓ Token refreshed using Google Identity Services');
      resolve(tokenResponse);
    };

    // Use existing token client or create new one
    const tokenClient = getTokenClient(handleCallback) || window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: handleCallback,
    });

    // Request new token silently (no prompt)
    // GIS will use its internal refresh mechanism
    tokenClient.requestAccessToken({
      prompt: 'none'
    });
  });
};

/**
 * Check if token needs refresh and refresh if needed.
 * Returns a valid token object, or null if fully unauthenticated.
 * On refresh failure for an expired token, returns the expired token so gapi
 * can still be set — actual API calls handle 401s via executeWithTokenRetry.
 */
export const ensureValidToken = async (requireValidToken = false) => {
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
      const refreshedToken = await refreshAccessToken();
      return refreshedToken;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      if (requireValidToken && token.isExpired) {
        // Caller requires a valid token and refresh failed — clear auth state
        storage.setIsAuthenticated(false);
        storage.clearToken();
        return null;
      }
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
      // Refresh failed - clear auth state and throw auth error
      // Components should catch this and handle re-authentication
      throw { ...error, authFailed: true };
    }
  }
};

/**
 * Initialize automatic token refresh.
 * Runs every 25 minutes so we refresh before 1h expiry. Keeps user always logged in.
 *
 * Google Identity Services (GIS) internally manages token refresh when the user
 * is logged into Google. This interval ensures we proactively refresh before expiry.
 */
export const initTokenRefresh = () => {
  const REFRESH_INTERVAL_MS = 25 * 60 * 1000; // 25 minutes

  const doRefresh = async () => {
    if (!storage.getIsAuthenticated()) {
      console.log('Skipping token refresh - user not authenticated');
      return;
    }

    const token = storage.getToken();
    if (!token) {
      console.log('Skipping token refresh - no token stored');
      return;
    }

    // Only refresh if token is expiring or expired
    if (!token.needsRefresh) {
      console.log('Token still valid, skipping refresh');
      return;
    }

    try {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken && window.gapi?.client) {
        window.gapi.client.setToken(refreshedToken);
        console.log('✓ Automatic token refresh completed');
      }
    } catch (error) {
      console.warn('Automatic token refresh failed:', error.message);
      // Don't clear tokens here - let the next API call handle auth failure
      // This prevents logout when user is temporarily offline
    }
  };

  // Set up interval
  const intervalId = setInterval(doRefresh, REFRESH_INTERVAL_MS);

  // Run immediately after a short delay (allow APIs to fully initialize)
  setTimeout(doRefresh, 2000);

  // Store interval ID for potential cleanup (useful for HMR in dev)
  return intervalId;
};

