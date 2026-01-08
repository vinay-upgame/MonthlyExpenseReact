import { useState, useEffect } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as driveService from '../services/driveService.js';
import * as syncService from '../services/syncService.js';
import { formatDate } from '../utils/dateUtils.js';

export default function TransactionList({ type, monthKey, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [monthKey, type]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const allData = await sheetsService.loadAllData();
      if (type === 'expense') {
        const filtered = allData.dailyExpenses.filter(e => e.monthKey === monthKey);
        setTransactions(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        const filtered = allData.weeklyPayments.filter(p => p.monthKey === monthKey);
        setTransactions(filtered.sort((a, b) => new Date(b.weekEndDate) - new Date(a.weekEndDate)));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (sheetsService.isOnline()) {
        if (type === 'expense') {
          await sheetsService.deleteDailyExpense(id);
        } else {
          await sheetsService.deleteWeeklyPayment(id);
        }
      } else {
        // Queue delete operation for offline sync
        syncService.queueOperation(
          type === 'expense' ? 'deleteDailyExpense' : 'deleteWeeklyPayment',
          id
        );
      }
      await loadTransactions();
      if (onRefresh) onRefresh();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {type === 'expense' ? 'expenses' : 'payments'} found for this month.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {type === 'expense' ? 'Daily Expenses' : 'Weekly Payments'}
      </h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                {type === 'expense' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachment
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {type === 'expense' ? formatDate(new Date(transaction.date)) : formatDate(new Date(transaction.weekEndDate))}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{Number(transaction.amount).toFixed(2)}
                  </td>
                  {type === 'expense' && (
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {transaction.attachmentUrl ? (
                        <a
                          href={transaction.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(transaction.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {type === 'expense' ? 'expense' : 'payment'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <EditTransactionModal
          type={type}
          transaction={transactions.find(t => t.id === editingId)}
          onClose={() => {
            setEditingId(null);
            loadTransactions();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

function EditTransactionModal({ type, transaction, onClose }) {
  const [formData, setFormData] = useState({
    date: transaction.date || '',
    weekEndDate: transaction.weekEndDate || '',
    description: transaction.description || '',
    amount: transaction.amount || '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadProgress, setUploadProgress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (type === 'expense') {
        const updatedExpense = {
          ...transaction,
          date: formData.date,
          description: formData.description,
          amount: amount,
        };

        // Handle file upload if new file is provided
        if (formData.file) {
          try {
            setUploadProgress('Uploading file to Google Drive...');
            const monthKey = transaction.monthKey;
            const monthFolderId = await driveService.getMonthlyFolder(monthKey);
            const uploadResult = await driveService.uploadFileAndGetLink(formData.file, monthFolderId);
            updatedExpense.attachmentUrl = uploadResult.publicLink;
            updatedExpense.driveFileId = uploadResult.fileId;
            setUploadProgress('File uploaded successfully!');
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            setMessage({
              type: 'warning',
              text: 'Expense updated but file upload failed.',
            });
          }
        }

        if (sheetsService.isOnline()) {
          await sheetsService.updateDailyExpense(updatedExpense);
          setMessage({ type: 'success', text: 'Expense updated successfully!' });
        } else {
          syncService.queueOperation('updateDailyExpense', updatedExpense);
          setMessage({ type: 'warning', text: 'Updated offline. Will sync when online.' });
        }
      } else {
        const updatedPayment = {
          ...transaction,
          weekEndDate: formData.weekEndDate,
          description: formData.description,
          amount: amount,
        };

        if (sheetsService.isOnline()) {
          await sheetsService.updateWeeklyPayment(updatedPayment);
          setMessage({ type: 'success', text: 'Payment updated successfully!' });
        } else {
          syncService.queueOperation('updateWeeklyPayment', updatedPayment);
          setMessage({ type: 'warning', text: 'Updated offline. Will sync when online.' });
        }
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update transaction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Edit {type === 'expense' ? 'Expense' : 'Payment'}</h3>
        
        <form onSubmit={handleSubmit}>
          {type === 'expense' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Week End Date</label>
              <input
                type="date"
                value={formData.weekEndDate}
                onChange={(e) => setFormData({ ...formData, weekEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min="0"
              required
            />
          </div>

          {type === 'expense' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Attachment (Optional) - Leave empty to keep existing
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                accept="image/*,.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {transaction.attachmentUrl && (
                <p className="mt-2 text-sm text-gray-600">
                  Current attachment: <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">View</a>
                </p>
              )}
            </div>
          )}

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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

