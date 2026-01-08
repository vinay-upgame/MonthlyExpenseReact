import { useState } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as driveService from '../services/driveService.js';
import * as syncService from '../services/syncService.js';
import { getCurrentMonthKey, formatDate } from '../utils/dateUtils.js';
import TransactionList from './TransactionList.jsx';

export default function DailyExpense() {
  const [date, setDate] = useState(formatDate(new Date()));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadProgress, setUploadProgress] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setUploadProgress('');

    try {
      const expenseAmount = parseFloat(amount);
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const monthKey = getCurrentMonthKey();
      const expenseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let attachmentUrl = '';
      let driveFileId = '';

      // Upload file if provided
      if (file) {
        try {
          setUploadProgress('Uploading file to Google Drive...');
          const monthFolderId = await driveService.getMonthlyFolder(monthKey);
          const uploadResult = await driveService.uploadFileAndGetLink(file, monthFolderId);
          attachmentUrl = uploadResult.publicLink;
          driveFileId = uploadResult.fileId;
          setUploadProgress('File uploaded successfully!');
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          setMessage({
            type: 'warning',
            text: 'Expense saved but file upload failed. You can retry later.',
          });
        }
      }

      const expense = {
        id: expenseId,
        monthKey,
        date,
        description,
        amount: expenseAmount,
        attachmentUrl,
        driveFileId,
      };

      if (sheetsService.isOnline()) {
        await sheetsService.saveDailyExpense(expense);
        setMessage({ type: 'success', text: 'Daily expense saved successfully!' });
      } else {
        syncService.queueOperation('saveDailyExpense', expense);
        setMessage({ type: 'warning', text: 'Saved offline. Will sync when online.' });
      }

      // Reset form
      setDescription('');
      setAmount('');
      setFile(null);
      setUploadProgress('');
      
      // Trigger refresh of transaction list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving expense:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save daily expense' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 lg:py-8 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-gray-800">Daily Expense Entry</h1>

      <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Tea expense, Lunch, etc."
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
              Attachment (Screenshot/Invoice) - Optional
            </label>
            <div className="relative">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="w-full px-4 py-3 text-base border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              />
              {file && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">📎 Selected: {file.name}</p>
                </div>
              )}
            </div>
          </div>

          {uploadProgress && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl">
              <p className="font-medium">{uploadProgress}</p>
            </div>
          )}

          {message.text && (
            <div
              className={`mb-4 p-4 rounded-xl border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : message.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}
            >
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 touch-target"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Saving...
              </span>
            ) : (
              '💾 Save Expense'
            )}
          </button>
        </form>
      </div>

      {/* Transaction List */}
      <TransactionList 
        key={refreshKey}
        type="expense" 
        monthKey={getCurrentMonthKey()} 
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

