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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Daily Expense Entry</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Tea expense, Lunch, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Screenshot/Invoice) - Optional
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
            )}
          </div>

          {uploadProgress && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
              {uploadProgress}
            </div>
          )}

          {message.text && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Expense'}
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

