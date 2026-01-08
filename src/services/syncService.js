/**
 * Sync service for handling offline queue and syncing with Google Sheets
 */

import { storage } from '../utils/storage.js';
import * as sheetsService from './sheetsService.js';

/**
 * Process offline queue when coming back online
 */
export const syncOfflineQueue = async () => {
  if (!sheetsService.isOnline()) {
    return;
  }

  const queue = storage.getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  const failed = [];

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'saveMonth':
          await sheetsService.saveMonth(operation.data);
          break;
        case 'saveDailyExpense':
          await sheetsService.saveDailyExpense(operation.data);
          break;
        case 'saveWeeklyPayment':
          await sheetsService.saveWeeklyPayment(operation.data);
          break;
        case 'updateDailyExpense':
          await sheetsService.updateDailyExpense(operation.data);
          break;
        case 'updateWeeklyPayment':
          await sheetsService.updateWeeklyPayment(operation.data);
          break;
        case 'deleteDailyExpense':
          await sheetsService.deleteDailyExpense(operation.data);
          break;
        case 'deleteWeeklyPayment':
          await sheetsService.deleteWeeklyPayment(operation.data);
          break;
        default:
          console.warn('Unknown operation type:', operation.type);
      }
    } catch (error) {
      console.error('Error syncing operation:', error);
      failed.push(operation);
    }
  }

  // Update queue with failed operations
  if (failed.length > 0) {
    storage.clearOfflineQueue();
    failed.forEach(op => storage.addToOfflineQueue(op));
  } else {
    storage.clearOfflineQueue();
  }

  // Reload data from Sheets
  await sheetsService.loadAllData();
};

/**
 * Add operation to offline queue
 */
export const queueOperation = (type, data) => {
  storage.addToOfflineQueue({ type, data });
};

/**
 * Check sync status
 */
export const getSyncStatus = () => {
  const queue = storage.getOfflineQueue();
  const lastSync = storage.getLastSync();
  const isOnline = sheetsService.isOnline();

  return {
    isOnline,
    hasPendingChanges: queue.length > 0,
    pendingCount: queue.length,
    lastSync: lastSync ? new Date(lastSync) : null,
  };
};

/**
 * Initialize sync listener
 */
export const initSyncListener = () => {
  window.addEventListener('online', () => {
    syncOfflineQueue();
  });

  // Try to sync immediately if online
  if (sheetsService.isOnline()) {
    syncOfflineQueue();
  }
};

