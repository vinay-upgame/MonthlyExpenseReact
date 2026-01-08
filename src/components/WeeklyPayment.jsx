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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Weekly Vendor Payment</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="weekEndDate" className="block text-sm font-medium text-gray-700 mb-2">
              Week End Date (Sunday)
            </label>
            <input
              type="date"
              id="weekEndDate"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the Sunday date that ends the week
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount (₹)
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Tea vendor payment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            {loading ? 'Saving...' : 'Save Payment'}
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

