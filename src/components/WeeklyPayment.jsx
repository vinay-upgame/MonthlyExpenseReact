import { useState } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as syncService from '../services/syncService.js';
import { getCurrentMonthKey, getWeekEndDate, formatDate } from '../utils/dateUtils.js';
import TransactionList from './TransactionList.jsx';

export default function WeeklyPayment() {
  const [weekEndDate, setWeekEndDate] = useState(getWeekEndDate(new Date()));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const monthKey = getCurrentMonthKey();
      const paymentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const payment = {
        id: paymentId,
        monthKey,
        weekEndDate,
        amount: paymentAmount,
        description: description || `Weekly Payment - ${weekEndDate}`,
      };

      if (sheetsService.isOnline()) {
        await sheetsService.saveWeeklyPayment(payment);
        setMessage({ type: 'success', text: 'Weekly payment saved successfully!' });
      } else {
        syncService.queueOperation('saveWeeklyPayment', payment);
        setMessage({ type: 'warning', text: 'Saved offline. Will sync when online.' });
      }

      // Reset form
      setAmount('');
      setDescription('');
      
      // Trigger refresh of transaction list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving payment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save weekly payment' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 lg:py-8 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-gray-800">Weekly Vendor Payment</h1>

      <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="weekEndDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Week End Date (Sunday)
            </label>
            <input
              type="date"
              id="weekEndDate"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the Sunday date that ends the week
            </p>
          </div>

          <div className="mb-5">
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Amount (₹)
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
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Tea vendor payment"
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
            />
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
              '💳 Save Payment'
            )}
          </button>
        </form>
      </div>

      {/* Transaction List */}
      <TransactionList 
        key={refreshKey}
        type="payment" 
        monthKey={getCurrentMonthKey()} 
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

