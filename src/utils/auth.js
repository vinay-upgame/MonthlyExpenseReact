/**
 * Authentication utilities for checking auth status and handling expiration
 */

import { storage } from './storage.js';
import { signOut } from './signOut.js';

/**
 * Check if user is currently authenticated with a valid token
 * @returns {boolean} true if authenticated with valid token
 */
export const isValidAuth = () => {
  const token = storage.getToken();
  if (!token) return false;
  if (token.isExpired) return false;
  return storage.getIsAuthenticated();
};

/**
 * Check authentication status and handle expired tokens
 * @returns {Object|null} Returns token if valid, null if needs re-authentication
 */
export const checkAuthStatus = async () => {
  const token = storage.getToken();

  if (!token) {
    return null;
  }

  // Token exists but is expired
  if (token.isExpired) {
    console.log('Token expired, user needs to re-authenticate');
    // Clear auth state silently - let App.jsx handle redirect
    storage.setIsAuthenticated(false);
    storage.clearToken();
    return null;
  }

  // Token is valid
  return token;
};

/**
 * Handle authentication error - clear state and trigger re-auth
 * This should be called when API calls fail with 401/403
 */
export const handleAuthError = async () => {
  console.warn('Authentication error - clearing session and requiring re-login');
  await signOut();
  // Reload the page to reset app state and show login screen
  window.location.reload();
};
