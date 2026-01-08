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
    <div className="container mx-auto px-4 py-4 lg:py-8 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-gray-800">Monthly Balance & Reimbursements</h1>

      <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="month" className="block text-sm font-semibold text-gray-700 mb-2">
              Month
            </label>
            <input
              type="month"
              id="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="initialBalance" className="block text-sm font-semibold text-gray-700 mb-2">
              Initial Balance
            </label>
            <input
              type="number"
              id="initialBalance"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              step="0.01"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reimbursements
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={newReimbursement}
                onChange={(e) => setNewReimbursement(e.target.value)}
                placeholder="Enter reimbursement amount"
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
                step="0.01"
              />
              <button
                type="button"
                onClick={handleAddReimbursement}
                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 shadow-md hover:shadow-lg transition-all touch-target"
              >
                Add
              </button>
            </div>
            {reimbursements.length > 0 && (
              <div className="space-y-2">
                {reimbursements.map((amount, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="font-medium text-gray-800">₹{amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReimbursement(index)}
                      className="text-red-600 hover:text-red-700 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition-all touch-target"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="font-bold pt-3 border-t-2 border-gray-200 text-lg">
                  Total Reimbursements: ₹{reimbursements.reduce((sum, r) => sum + r, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

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
              existingMonth ? '💾 Update Balance' : '💾 Save Balance'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

