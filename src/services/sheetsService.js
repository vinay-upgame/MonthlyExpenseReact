/**
 * Google Sheets API service for data storage and retrieval
 */

import { storage } from '../utils/storage.js';
import { openDB } from 'idb';

const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SPREADSHEET_NAME = 'UpgameExpenseDBSheet'; // Hardcoded spreadsheet name

let gapiLoaded = false;

// IndexedDB setup for offline cache
const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('months')) {
        db.createObjectStore('months', { keyPath: 'monthKey' });
      }
      if (!db.objectStoreNames.contains('dailyExpenses')) {
        db.createObjectStore('dailyExpenses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('weeklyPayments')) {
        db.createObjectStore('weeklyPayments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
};

/**
 * Load Google Sheets API
 */
export const loadSheetsAPI = () => {
  return new Promise((resolve, reject) => {
    if (gapiLoaded && window.gapi?.client?.sheets) {
      resolve();
      return;
    }

    if (!window.gapi) {
      reject(new Error('gapi not loaded. Load Drive API first.'));
      return;
    }

    // Check if already initialized
    if (window.gapi.client.sheets) {
      gapiLoaded = true;
      resolve();
      return;
    }

    // Initialize gapi client if not already initialized
    // Check if client is already initialized (has any discovery docs loaded)
    if (window.gapi.client.getToken || window.gapi.client.drive) {
      // Client is initialized, just need to load sheets
      window.gapi.client.load('sheets', 'v4', () => {
        gapiLoaded = true;
        resolve();
      });
    } else {
      // Initialize with discovery docs
      window.gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
      }).then(() => {
        gapiLoaded = true;
        resolve();
      }).catch((error) => {
        // If init fails, try loading sheets directly
        if (window.gapi.client.load) {
          window.gapi.client.load('sheets', 'v4', () => {
            gapiLoaded = true;
            resolve();
          });
        } else {
          reject(error);
        }
      });
    }
  });
};

/**
 * Initialize Google Sheets API with OAuth
 */
export const initializeSheetsAPI = (clientId) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.gapi) {
      reject(new Error('Google APIs not loaded'));
      return;
    }

    // Initialize token client (not used here, but needed for token management)
    // The actual token request happens in the GoogleAuth component
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {
        // Callback not used here - token requests happen in components
      },
    });

    resolve();
  });
};

/**
 * Store spreadsheet ID in Settings sheet
 */
const storeSpreadsheetIdInSettings = async (spreadsheetId) => {
  try {
    // Check if spreadsheet ID is already stored
    const settingsData = await readSheetData(spreadsheetId, 'Settings');
    const hasId = settingsData.some(row => row && row[0] === 'spreadsheet_id');
    
    if (!hasId) {
      // Store the spreadsheet ID in Settings sheet
      await appendRow(spreadsheetId, 'Settings', ['spreadsheet_id', spreadsheetId]);
    }
  } catch (error) {
    console.warn('Could not store spreadsheet ID in Settings:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Search for existing spreadsheet by name
 */
const searchExistingSpreadsheet = async (searchTitle = SPREADSHEET_NAME) => {
  try {
    // Check if Drive API is available
    if (!window.gapi?.client?.drive) {
      console.log('Drive API not available for search');
      return null;
    }

    // Search in Google Drive for spreadsheets with the app name
    const response = await window.gapi.client.drive.files.list({
      q: `name='${searchTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 10,
    });

    if (response.result.files && response.result.files.length > 0) {
      // Get the most recently modified spreadsheet
      const spreadsheet = response.result.files[0];
      const spreadsheetId = spreadsheet.id;
      
      // Verify it has the required sheets
      try {
        const sheetResponse = await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
        });
        
        const sheetTitles = sheetResponse.result.sheets.map(s => s.properties.title);
        const requiredSheets = ['Months', 'DailyExpenses', 'WeeklyPayments', 'Settings'];
        const hasAllSheets = requiredSheets.every(sheet => sheetTitles.includes(sheet));
        
        if (hasAllSheets) {
          console.log('✓ Found existing spreadsheet:', spreadsheetId);
          
          // Try to get the stored ID from Settings (in case spreadsheet was renamed)
          const storedId = await getSpreadsheetIdFromSettings(spreadsheetId);
          if (storedId && storedId !== spreadsheetId) {
            // If there's a different ID stored, verify that one exists
            try {
              await window.gapi.client.sheets.spreadsheets.get({
                spreadsheetId: storedId,
              });
              console.log('✓ Using stored spreadsheet ID from Settings:', storedId);
              return storedId;
            } catch {
              console.log('Stored ID not accessible, using found spreadsheet');
            }
          }
          
          return spreadsheetId;
        } else {
          console.log('Found spreadsheet but missing required sheets');
        }
      } catch (error) {
        console.log('Error verifying found spreadsheet:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for existing spreadsheet:', error);
    return null;
  }
};

/**
 * Get spreadsheet ID from Settings sheet (if stored there)
 */
const getSpreadsheetIdFromSettings = async (spreadsheetId) => {
  try {
    const settingsData = await readSheetData(spreadsheetId, 'Settings');
    const idRow = settingsData.find(row => row && row[0] === 'spreadsheet_id');
    if (idRow && idRow[1]) {
      return idRow[1];
    }
  } catch (error) {
    console.log('Could not read spreadsheet ID from Settings:', error);
  }
  return null;
};

/**
 * Create new spreadsheet
 */
export const createSpreadsheet = async (title = SPREADSHEET_NAME) => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: {
          title: title,
        },
        sheets: [
          { properties: { title: 'Months' } },
          { properties: { title: 'DailyExpenses' } },
          { properties: { title: 'WeeklyPayments' } },
          { properties: { title: 'Settings' } },
        ],
      },
    });

    const spreadsheetId = response.result.spreadsheetId;

    // Set headers for each sheet
    await setSheetHeaders(spreadsheetId);

    // Store the spreadsheet ID in the Settings sheet itself
    await storeSpreadsheetIdInSettings(spreadsheetId);

    // Also store in localStorage
    storage.setSpreadsheetId(spreadsheetId);
    return spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
};

/**
 * Set headers for all sheets
 */
const setSheetHeaders = async (spreadsheetId) => {
  try {
    // Months sheet headers
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Months!A1:D1',
      valueInputOption: 'RAW',
      resource: {
        values: [['monthKey', 'initialBalance', 'reimbursements', 'carryForward']],
      },
    });

    // DailyExpenses sheet headers
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'DailyExpenses!A1:G1',
      valueInputOption: 'RAW',
      resource: {
        values: [['id', 'monthKey', 'date', 'description', 'amount', 'attachmentUrl', 'driveFileId']],
      },
    });

    // WeeklyPayments sheet headers
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'WeeklyPayments!A1:E1',
      valueInputOption: 'RAW',
      resource: {
        values: [['id', 'monthKey', 'weekEndDate', 'amount', 'description']],
      },
    });

    // Settings sheet headers
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Settings!A1:B1',
      valueInputOption: 'RAW',
      resource: {
        values: [['key', 'value']],
      },
    });
  } catch (error) {
    console.error('Error setting sheet headers:', error);
    throw error;
  }
};

/**
 * Get or create spreadsheet
 */
export const getOrCreateSpreadsheet = async () => {
  // Check if API is available
  if (!isAPIAvailable()) {
    throw new Error('Google API not available');
  }

  let spreadsheetId = storage.getSpreadsheetId();

  if (spreadsheetId) {
    // Verify spreadsheet exists and is accessible
    try {
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });
      
      // If we get here, spreadsheet exists and is accessible
      // Verify it has the correct name
      if (response.result && response.result.spreadsheetId) {
        const spreadsheetTitle = response.result.properties?.title || '';
        if (spreadsheetTitle === SPREADSHEET_NAME) {
          console.log(`✓ Using existing spreadsheet: ${SPREADSHEET_NAME} (${spreadsheetId})`);
          return spreadsheetId;
        } else {
          console.warn(`Spreadsheet found but has wrong name: "${spreadsheetTitle}". Expected: "${SPREADSHEET_NAME}". Will search for correct one.`);
          // Clear this ID and search for the correct one
          storage.setSpreadsheetId('');
          spreadsheetId = null;
        }
      }
    } catch (error) {
      // Parse error to determine if spreadsheet doesn't exist
      const errorCode = error.status || (error.result && error.result.error && error.result.error.code);
      const errorMessage = error.message || (error.result && error.result.error && error.result.error.message) || '';
      
      console.log('Error verifying spreadsheet:', {
        code: errorCode,
        message: errorMessage,
        spreadsheetId: spreadsheetId
      });

      // Only create new one if it's actually a 404 (not found)
      if (errorCode === 404 || errorMessage.includes('Unable to parse range') || errorMessage.includes('not found')) {
        console.warn('Spreadsheet not found (404), will create new one');
        // Clear the invalid spreadsheet ID
        storage.setSpreadsheetId('');
        spreadsheetId = null;
      } else if (errorCode === 403) {
        // Permission denied - spreadsheet exists but we don't have access
        console.error('Permission denied to access spreadsheet. Please check permissions.');
        throw new Error('Permission denied to access spreadsheet. Please sign in again.');
      } else {
        // Other error (network, API not ready, etc.) - keep existing ID and try to use it
        console.warn('Error verifying spreadsheet (might be temporary), keeping existing ID:', errorCode);
        // Don't create new one, return existing ID - it might work on retry
        return spreadsheetId;
      }
    }
  }

  // If no spreadsheet ID found locally, search for existing one
  if (!spreadsheetId) {
    console.log(`No spreadsheet ID in local storage, searching for existing spreadsheet: ${SPREADSHEET_NAME}...`);
    
    // Search for existing spreadsheet by name
    const foundSpreadsheetId = await searchExistingSpreadsheet(SPREADSHEET_NAME);
    
    if (foundSpreadsheetId) {
      spreadsheetId = foundSpreadsheetId;
      // Store it locally for future use
      storage.setSpreadsheetId(spreadsheetId);
      console.log(`✓ Using found spreadsheet: ${SPREADSHEET_NAME} (${spreadsheetId})`);
    } else {
      // No existing spreadsheet found, create new one with the hardcoded name
      console.log(`No existing spreadsheet found, creating new one: ${SPREADSHEET_NAME}...`);
      spreadsheetId = await createSpreadsheet(SPREADSHEET_NAME);
      console.log(`✓ New spreadsheet created: ${SPREADSHEET_NAME} (${spreadsheetId})`);
      // createSpreadsheet already sets it in storage
    }
  } else {
    // We have a spreadsheet ID, ensure it's stored in Settings sheet
    try {
      await storeSpreadsheetIdInSettings(spreadsheetId);
    } catch (error) {
      console.warn('Could not store spreadsheet ID in Settings:', error);
    }
  }

  return spreadsheetId;
};

/**
 * Read all data from spreadsheet
 */
export const loadAllData = async () => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      // No spreadsheet ID, try to get cached data
      const db = await initDB();
      return await getCachedData(db);
    }

    // Check if Google API is available before trying to read from Sheets
    if (!isAPIAvailable()) {
      // This is normal - API might still be initializing or user is offline
      // Silently fall back to cache
      console.log('****************** API not available ******************');
      const db = await initDB();
      return await getCachedData(db);
    }

    const [monthsData, expensesData, paymentsData] = await Promise.all([
      readSheetData(spreadsheetId, 'Months'),
      readSheetData(spreadsheetId, 'DailyExpenses'),
      readSheetData(spreadsheetId, 'WeeklyPayments'),
    ]);

    // Parse data
    const months = parseMonthsData(monthsData);
    const dailyExpenses = parseExpensesData(expensesData);
    const weeklyPayments = parsePaymentsData(paymentsData);

    // Cache in IndexedDB
    const db = await initDB();
    await cacheData(db, months, dailyExpenses, weeklyPayments);

    return { months, dailyExpenses, weeklyPayments };
  } catch (error) {
    console.error('Error loading data:', error);
    // Return cached data if available
    try {
      const db = await initDB();
      return await getCachedData(db);
    } catch (cacheError) {
      console.error('Error loading cached data:', cacheError);
      return { months: [], dailyExpenses: [], weeklyPayments: [] };
    }
  }
};

/**
 * Read data from a sheet
 */
const readSheetData = async (spreadsheetId, sheetName) => {
  try {
    // Check if gapi is available
    if (!isAPIAvailable()) {
      console.warn('Google API not available, returning empty data');
      return [];
    }

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    return response.result.values || [];
  } catch (error) {
    console.error(`Error reading ${sheetName}:`, error);
    return [];
  }
};

/**
 * Parse months data
 */
const parseMonthsData = (rows) => {
  if (!rows || rows.length < 2) return [];
  
  const months = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[0]) {
      months.push({
        monthKey: row[0],
        initialBalance: parseFloat(row[1] || 0),
        reimbursements: row[2] ? JSON.parse(row[2]) : [],
        carryForward: parseFloat(row[3] || 0),
      });
    }
  }
  return months;
};

/**
 * Parse expenses data
 */
const parseExpensesData = (rows) => {
  if (!rows || rows.length < 2) return [];
  
  const expenses = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[0]) {
      expenses.push({
        id: row[0],
        monthKey: row[1],
        date: row[2],
        description: row[3],
        amount: parseFloat(row[4] || 0),
        attachmentUrl: row[5] || '',
        driveFileId: row[6] || '',
      });
    }
  }
  return expenses;
};

/**
 * Parse payments data
 */
const parsePaymentsData = (rows) => {
  if (!rows || rows.length < 2) return [];
  
  const payments = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[0]) {
      payments.push({
        id: row[0],
        monthKey: row[1],
        weekEndDate: row[2],
        amount: parseFloat(row[3] || 0),
        description: row[4] || '',
      });
    }
  }
  return payments;
};

/**
 * Cache data in IndexedDB
 */
const cacheData = async (db, months, dailyExpenses, weeklyPayments) => {
  const tx = db.transaction(['months', 'dailyExpenses', 'weeklyPayments'], 'readwrite');
  
  // Clear existing data
  await tx.objectStore('months').clear();
  await tx.objectStore('dailyExpenses').clear();
  await tx.objectStore('weeklyPayments').clear();

  // Add new data
  for (const month of months) {
    await tx.objectStore('months').put(month);
  }
  for (const expense of dailyExpenses) {
    await tx.objectStore('dailyExpenses').put(expense);
  }
  for (const payment of weeklyPayments) {
    await tx.objectStore('weeklyPayments').put(payment);
  }

  await tx.done;
  storage.setLastSync(Date.now());
};

/**
 * Get cached data from IndexedDB
 */
const getCachedData = async (db) => {
  const months = await db.getAll('months');
  const dailyExpenses = await db.getAll('dailyExpenses');
  const weeklyPayments = await db.getAll('weeklyPayments');
  return { months, dailyExpenses, weeklyPayments };
};

/**
 * Append row to sheet
 */
const appendRow = async (spreadsheetId, sheetName, values) => {
  try {
    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
    throw error;
  }
};

/**
 * Save month data
 */
export const saveMonth = async (monthData) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    // Check if month exists, update or append
    const monthsData = await readSheetData(spreadsheetId, 'Months');
    const existingIndex = monthsData.findIndex(row => row && row[0] === monthData.monthKey);

    const values = [
      monthData.monthKey,
      monthData.initialBalance,
      JSON.stringify(monthData.reimbursements || []),
      monthData.carryForward || 0,
    ];

    if (existingIndex > 0) {
      // Update existing row
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `Months!A${existingIndex + 1}:D${existingIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [values] },
      });
    } else {
      // Append new row
      await appendRow(spreadsheetId, 'Months', values);
    }

    // Update cache
    const db = await initDB();
    await db.put('months', monthData);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error saving month:', error);
    throw error;
  }
};

/**
 * Save daily expense
 */
export const saveDailyExpense = async (expense) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const values = [
      expense.id,
      expense.monthKey,
      expense.date,
      expense.description,
      expense.amount,
      expense.attachmentUrl || '',
      expense.driveFileId || '',
    ];

    await appendRow(spreadsheetId, 'DailyExpenses', values);

    // Update cache
    const db = await initDB();
    await db.put('dailyExpenses', expense);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

/**
 * Save weekly payment
 */
export const saveWeeklyPayment = async (payment) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const values = [
      payment.id,
      payment.monthKey,
      payment.weekEndDate,
      payment.amount,
      payment.description || '',
    ];

    await appendRow(spreadsheetId, 'WeeklyPayments', values);

    // Update cache
    const db = await initDB();
    await db.put('weeklyPayments', payment);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error saving payment:', error);
    throw error;
  }
};

/**
 * Find row index by ID in a sheet
 */
const findRowIndexById = async (spreadsheetId, sheetName, id) => {
  try {
    const data = await readSheetData(spreadsheetId, sheetName);
    // First row is header, so start from index 1
    for (let i = 1; i < data.length; i++) {
      if (data[i] && data[i][0] === id) {
        return i + 1; // Google Sheets uses 1-based indexing
      }
    }
    return null;
  } catch (error) {
    console.error(`Error finding row index for ${sheetName}:`, error);
    throw error;
  }
};

/**
 * Update daily expense
 */
export const updateDailyExpense = async (expense) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const rowIndex = await findRowIndexById(spreadsheetId, 'DailyExpenses', expense.id);
    if (!rowIndex) {
      throw new Error('Expense not found');
    }

    const values = [
      expense.id,
      expense.monthKey,
      expense.date,
      expense.description,
      expense.amount,
      expense.attachmentUrl || '',
      expense.driveFileId || '',
    ];

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `DailyExpenses!A${rowIndex}:G${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    // Update cache
    const db = await initDB();
    await db.put('dailyExpenses', expense);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

/**
 * Delete daily expense
 */
export const deleteDailyExpense = async (expenseId) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const rowIndex = await findRowIndexById(spreadsheetId, 'DailyExpenses', expenseId);
    if (!rowIndex) {
      throw new Error('Expense not found');
    }

    // Delete the row
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await getSheetId(spreadsheetId, 'DailyExpenses'),
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    // Update cache
    const db = await initDB();
    await db.delete('dailyExpenses', expenseId);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Update weekly payment
 */
export const updateWeeklyPayment = async (payment) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const rowIndex = await findRowIndexById(spreadsheetId, 'WeeklyPayments', payment.id);
    if (!rowIndex) {
      throw new Error('Payment not found');
    }

    const values = [
      payment.id,
      payment.monthKey,
      payment.weekEndDate,
      payment.amount,
      payment.description || '',
    ];

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `WeeklyPayments!A${rowIndex}:E${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    // Update cache
    const db = await initDB();
    await db.put('weeklyPayments', payment);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

/**
 * Delete weekly payment
 */
export const deleteWeeklyPayment = async (paymentId) => {
  try {
    const spreadsheetId = storage.getSpreadsheetId();
    if (!spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    if (!isAPIAvailable()) {
      throw new Error('Google API not available');
    }

    const rowIndex = await findRowIndexById(spreadsheetId, 'WeeklyPayments', paymentId);
    if (!rowIndex) {
      throw new Error('Payment not found');
    }

    // Delete the row
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await getSheetId(spreadsheetId, 'WeeklyPayments'),
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    // Update cache
    const db = await initDB();
    await db.delete('weeklyPayments', paymentId);
    storage.setLastSync(Date.now());
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

/**
 * Get sheet ID by name
 */
const getSheetId = async (spreadsheetId, sheetName) => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties(sheetId,title)',
    });
    
    const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : null;
  } catch (error) {
    console.error(`Error getting sheet ID for ${sheetName}:`, error);
    throw error;
  }
};

/**
 * Check if Google API is available and initialized
 */
const isAPIAvailable = () => {
  console.log('isAPIAvailable**********', window.gapi, window.gapi.client, window.gapi.client.sheets);
  return !!(window.gapi && window.gapi.client && window.gapi.client.sheets);
};

/**
 * Check if online
 */
export const isOnline = () => {
  return navigator.onLine;
};

