/**
 * Local storage utilities for caching spreadsheet ID and sync status
 */

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'expense_spreadsheet_id',
  DRIVE_FOLDER_ID: 'expense_drive_folder_id',
  LAST_SYNC: 'expense_last_sync',
  OFFLINE_QUEUE: 'expense_offline_queue',
  IS_AUTHENTICATED: 'expense_is_authenticated',
  ACCESS_TOKEN: 'expense_access_token',
  TOKEN_EXPIRY: 'expense_token_expiry',
  REFRESH_TOKEN: 'expense_refresh_token',
  TOKEN_DATA: 'expense_token_data', // Store full token response
};

const storage = {
  getSpreadsheetId: () => {
    return localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
  },

  setSpreadsheetId: (id) => {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
  },

  getDriveFolderId: () => {
    return localStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
  },

  setDriveFolderId: (id) => {
    localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, id);
  },

  getLastSync: () => {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  setLastSync: (timestamp) => {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(timestamp));
  },

  getOfflineQueue: () => {
    const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ? JSON.parse(queue) : [];
  },

  addToOfflineQueue: (operation) => {
    const queue = storage.getOfflineQueue();
    queue.push({
      ...operation,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  clearOfflineQueue: () => {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  setIsAuthenticated: (isAuthenticated) => {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, String(isAuthenticated));
  },

  getIsAuthenticated: () => {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  },

  saveToken: (tokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
      // Calculate expiry time (tokens typically expire in 1 hour)
      const expiryTime = Date.now() + (tokenResponse.expires_in * 1000 || 3600000);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
      
      // Save refresh token if available
      if (tokenResponse.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token);
      }
      
      // Save full token data for refresh
      localStorage.setItem(STORAGE_KEYS.TOKEN_DATA, JSON.stringify(tokenResponse));
    }
  },

  getToken: () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token) {
      return null;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const expiryTime = expiry ? parseInt(expiry, 10) : 0;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    
    if (expiryTime > 0 && Date.now() > expiryTime) {
      // Token expired
      return null;
    }

    return {
      access_token: token,
      expires_in: expiry ? Math.floor((expiryTime - Date.now()) / 1000) : 3600,
      needsRefresh: expiryTime > 0 && fiveMinutesFromNow > expiryTime, // Refresh if expires in < 5 min
    };
  },

  getRefreshToken: () => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getTokenData: () => {
    const data = localStorage.getItem(STORAGE_KEYS.TOKEN_DATA);
    return data ? JSON.parse(data) : null;
  },

  clearToken: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA);
  },
};

export { storage };

