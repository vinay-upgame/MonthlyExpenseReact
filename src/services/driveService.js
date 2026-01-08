/**
 * Google Drive API service for file uploads and folder management
 */

import { storage } from '../utils/storage.js';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient = null;

/**
 * Load Google API scripts
 */
export const loadGoogleAPIs = () => {
  return new Promise((resolve, reject) => {
    if (gapiLoaded && gisLoaded) {
      resolve();
      return;
    }

    let gapiLoadedCount = 0;
    let gisLoadedCount = 0;

    const checkLoaded = () => {
      if (gapiLoadedCount === 1 && gisLoadedCount === 1) {
        resolve();
      }
    };

    // Load gapi
    if (!window.gapi) {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        window.gapi.load('client', () => {
          window.gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
          }).then(() => {
            gapiLoaded = true;
            gapiLoadedCount = 1;
            checkLoaded();
          }).catch(reject);
        });
      };
      gapiScript.onerror = reject;
      document.head.appendChild(gapiScript);
    } else {
      gapiLoaded = true;
      gapiLoadedCount = 1;
      checkLoaded();
    }

    // Load gis
    if (!window.google) {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        gisLoaded = true;
        gisLoadedCount = 1;
        checkLoaded();
      };
      gisScript.onerror = reject;
      document.head.appendChild(gisScript);
    } else {
      gisLoaded = true;
      gisLoadedCount = 1;
      checkLoaded();
    }
  });
};

/**
 * Initialize Google API client with OAuth
 */
export const initializeDriveAPI = (clientId) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.gapi) {
      reject(new Error('Google APIs not loaded'));
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }
        window.gapi.client.setToken(tokenResponse);
        resolve(tokenResponse);
      },
    });

    resolve();
  });
};

/**
 * Request access token
 */
export const requestAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Drive API not initialized'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
    
    // The callback will be called by the tokenClient
    // We need to handle this differently
    const originalCallback = tokenClient.callback;
    tokenClient.callback = (tokenResponse) => {
      if (tokenResponse.error) {
        reject(new Error(tokenResponse.error));
        return;
      }
      window.gapi.client.setToken(tokenResponse);
      resolve(tokenResponse);
    };
  });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return window.gapi?.client?.getToken() !== null;
};

/**
 * Get access token
 */
export const getAccessToken = () => {
  const token = window.gapi?.client?.getToken();
  return token?.access_token || null;
};

/**
 * Create or get folder in Drive
 */
export const createOrGetFolder = async (folderName, parentFolderId = null) => {
  try {
    // First, try to find existing folder
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    } else {
      query += ` and 'root' in parents`;
    }

    const response = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    // Create new folder if not found
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const createResponse = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return createResponse.result.id;
  } catch (error) {
    console.error('Error creating/getting folder:', error);
    throw error;
  }
};

/**
 * Upload file to Drive
 */
export const uploadFile = async (file, folderId, fileName = null) => {
  try {
    const metadata = {
      name: fileName || file.name,
      parents: folderId ? [folderId] : [],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Make file publicly accessible and get shareable link
 */
export const makeFilePublic = async (fileId) => {
  try {
    // Set permission to anyone with link
    await window.gapi.client.drive.permissions.create({
      fileId: fileId,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get file metadata to construct public link
    const fileResponse = await window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });

    return fileResponse.result.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  } catch (error) {
    console.error('Error making file public:', error);
    throw error;
  }
};

/**
 * Upload file and get public link
 */
export const uploadFileAndGetLink = async (file, folderId, fileName = null) => {
  try {
    const fileId = await uploadFile(file, folderId, fileName);
    const publicLink = await makeFilePublic(fileId);
    return { fileId, publicLink };
  } catch (error) {
    console.error('Error uploading file and getting link:', error);
    throw error;
  }
};

/**
 * Get or create monthly folder structure
 */
export const getMonthlyFolder = async (monthKey) => {
  try {
    // Get or create ExpenseTracker root folder
    let rootFolderId = storage.getDriveFolderId();
    if (!rootFolderId) {
      rootFolderId = await createOrGetFolder('ExpenseTracker');
      storage.setDriveFolderId(rootFolderId);
    }

    // Get or create month folder
    const monthFolderId = await createOrGetFolder(monthKey, rootFolderId);
    return monthFolderId;
  } catch (error) {
    console.error('Error getting monthly folder:', error);
    throw error;
  }
};

