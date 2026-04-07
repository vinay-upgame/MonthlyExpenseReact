import { useState, useEffect } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as driveService from '../services/driveService.js';
import * as syncService from '../services/syncService.js';
import { formatDate } from '../utils/dateUtils.js';
import { handleAuthError } from '../utils/auth.js';

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
      if (error?.authFailed) {
        handleAuthError();
        return;
      }
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
      if (error?.authFailed) {
        handleAuthError();
        return;
      }
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
      <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-800">
        {type === 'expense' ? 'Daily Expenses' : 'Weekly Payments'}
      </h2>
      
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-100"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">
                  {type === 'expense' ? formatDate(new Date(transaction.date)) : formatDate(new Date(transaction.weekEndDate))}
                </p>
                <p className="font-semibold text-gray-900 mb-2">{transaction.description}</p>
                <p className="text-lg font-bold text-blue-600">
                  ₹{Number(transaction.amount).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex gap-3">
                {type === 'expense' && transaction.attachmentUrl && (
                  <a
                    href={transaction.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    📎 View
                  </a>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingId(transaction.id)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-all touch-target"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(transaction.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all touch-target"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                {type === 'expense' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Attachment
                  </th>
                )}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {type === 'expense' ? formatDate(new Date(transaction.date)) : formatDate(new Date(transaction.weekEndDate))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{Number(transaction.amount).toFixed(2)}
                  </td>
                  {type === 'expense' && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.attachmentUrl ? (
                        <a
                          href={transaction.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingId(transaction.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(transaction.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {type === 'expense' ? 'expense' : 'payment'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all touch-target"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold shadow-lg hover:shadow-xl transition-all touch-target"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Mobile Full Screen, Desktop Centered */}
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
      if (error?.authFailed) {
        handleAuthError();
        return;
      }
      console.error('Error updating transaction:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update transaction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">Edit {type === 'expense' ? 'Expense' : 'Payment'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {type === 'expense' ? (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
                required
              />
            </div>
          ) : (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Week End Date</label>
              <input
                type="date"
                value={formData.weekEndDate}
                onChange={(e) => setFormData({ ...formData, weekEndDate: e.target.value })}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
                required
              />
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              step="0.01"
              min="0"
              required
            />
          </div>

          {type === 'expense' && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Attachment (Optional) - Leave empty to keep existing
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                accept="image/*,.pdf"
                className="w-full px-4 py-3 text-base border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              />
              {transaction.attachmentUrl && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Current attachment: <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold">📎 View</a>
                  </p>
                </div>
              )}
            </div>
          )}

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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all touch-target"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold shadow-lg hover:shadow-xl transition-all touch-target"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Updating...
                </span>
              ) : (
                '💾 Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

