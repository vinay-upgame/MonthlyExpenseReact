import { useState, useEffect } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as syncService from '../services/syncService.js';
import { getCurrentMonthKey } from '../utils/dateUtils.js';

export default function MonthlyBalance() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [initialBalance, setInitialBalance] = useState('');
  const [reimbursements, setReimbursements] = useState([]);
  const [newReimbursement, setNewReimbursement] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingMonth, setExistingMonth] = useState(null);

  useEffect(() => {
    loadMonthData();
  }, [monthKey]);

  const loadMonthData = async () => {
    try {
      const data = await sheetsService.loadAllData();
      const month = data.months.find(m => m.monthKey === monthKey);
      if (month) {
        setExistingMonth(month);
        setInitialBalance(month.initialBalance.toString());
        setReimbursements(month.reimbursements || []);
      } else {
        setExistingMonth(null);
        setInitialBalance('');
        setReimbursements([]);
      }
    } catch (error) {
      console.error('Error loading month data:', error);
      setMessage({ type: 'error', text: 'Failed to load month data' });
    }
  };

  const handleAddReimbursement = () => {
    const amount = parseFloat(newReimbursement);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid reimbursement amount' });
      return;
    }
    setReimbursements([...reimbursements, amount]);
    setNewReimbursement('');
  };

  const handleRemoveReimbursement = (index) => {
    setReimbursements(reimbursements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const balance = parseFloat(initialBalance);
      if (isNaN(balance)) {
        throw new Error('Please enter a valid initial balance');
      }

      const monthData = {
        monthKey,
        initialBalance: balance,
        reimbursements,
        carryForward: existingMonth?.carryForward || 0,
      };

      if (sheetsService.isOnline()) {
        await sheetsService.saveMonth(monthData);
        setMessage({ type: 'success', text: 'Monthly balance saved successfully!' });
      } else {
        syncService.queueOperation('saveMonth', monthData);
        setMessage({ type: 'warning', text: 'Saved offline. Will sync when online.' });
      }

      setExistingMonth(monthData);
    } catch (error) {
      console.error('Error saving month:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save monthly balance' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Monthly Balance & Reimbursements</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <input
              type="month"
              id="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Balance
            </label>
            <input
              type="number"
              id="initialBalance"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reimbursements
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={newReimbursement}
                onChange={(e) => setNewReimbursement(e.target.value)}
                placeholder="Enter reimbursement amount"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
              <button
                type="button"
                onClick={handleAddReimbursement}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
            </div>
            {reimbursements.length > 0 && (
              <div className="space-y-2">
                {reimbursements.map((amount, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>₹{amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReimbursement(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="font-semibold pt-2 border-t">
                  Total Reimbursements: ₹{reimbursements.reduce((sum, r) => sum + r, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

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
            {loading ? 'Saving...' : existingMonth ? 'Update Balance' : 'Save Balance'}
          </button>
        </form>
      </div>
    </div>
  );
}

