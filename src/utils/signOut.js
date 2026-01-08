/**
 * Comprehensive sign out utility that clears all local data
 */

import { storage } from './storage.js';
import { openDB } from 'idb';

const DB_NAME = 'ExpenseTrackerDB';

/**
 * Clear all IndexedDB data
 */
const clearIndexedDB = async () => {
  try {
    const db = await openDB(DB_NAME, 1);
    const tx = db.transaction(['months', 'dailyExpenses', 'weeklyPayments', 'settings'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('months').clear(),
      tx.objectStore('dailyExpenses').clear(),
      tx.objectStore('weeklyPayments').clear(),
      tx.objectStore('settings').clear(),
    ]);
    
    await tx.done;
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
};

/**
 * Clear all localStorage data related to the app
 * Note: We preserve spreadsheet_id and drive_folder_id so the same sheet/folder is reused
 */
const clearLocalStorage = () => {
  const keys = [
    // Preserve these so user can reuse same sheet/folder
    // 'expense_spreadsheet_id',
    // 'expense_drive_folder_id',
    'expense_last_sync',
    'expense_offline_queue',
    'expense_is_authenticated',
    'expense_access_token',
    'expense_token_expiry',
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Revoke Google OAuth token
 */
const revokeGoogleToken = () => {
  try {
    if (window.gapi?.client?.getToken) {
      const token = window.gapi.client.getToken();
      if (token?.access_token) {
        window.google?.accounts?.oauth2?.revoke(token.access_token);
        window.gapi.client.setToken('');
      }
    }
    // Also clear token from localStorage
    storage.clearToken();
  } catch (error) {
    console.error('Error revoking token:', error);
  }
};

/**
 * Complete sign out - clears all data and revokes tokens
 */
export const signOut = async () => {
  try {
    // Revoke Google token
    revokeGoogleToken();
    
    // Clear localStorage
    clearLocalStorage();
    
    // Clear IndexedDB
    await clearIndexedDB();
    
    console.log('Sign out completed - all data cleared');
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

