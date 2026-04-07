import { useState, useEffect } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as csvExport from '../services/csvExport.js';
import { getCurrentMonthKey, getMonthName } from '../utils/dateUtils.js';
import { handleAuthError } from '../utils/auth.js';

export default function MonthlyReport() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [data, setData] = useState({ months: [], dailyExpenses: [], weeklyPayments: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const loadData = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const allData = await sheetsService.loadAllData();
      setData(allData);

      // Check if we're using cached data (offline mode)
      // If Google API is not available, we're likely offline or API not loaded
      const isAPIAvailable = !!(window.gapi && window.gapi.client && window.gapi.client.sheets);
      if (!sheetsService.isOnline() || !isAPIAvailable) {
        setIsOffline(true);
      }
    } catch (error) {
      if (error?.authFailed) {
        handleAuthError();
        return;
      }
      console.error('Error loading data:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const monthName = getMonthName(monthKey);
    csvExport.exportMonthlyExpenses(
      monthKey,
      data.dailyExpenses,
      data.weeklyPayments,
      monthName
    );
  };

  const calculateReport = () => {
    const month = data.months.find(m => m.monthKey === monthKey);
    if (!month) {
      return {
        initialBalance: 0,
        reimbursements: 0,
        totalExpenses: 0,
        totalPayments: 0,
        monthExpenses: 0,
        remainingBalance: 0,
        carryForward: 0,
      };
    }

    const monthExpenses = data.dailyExpenses
      .filter(e => e.monthKey === monthKey)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const monthPayments = data.weeklyPayments
      .filter(p => p.monthKey === monthKey)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalReimbursements = (month.reimbursements || []).reduce((sum, r) => sum + (Number(r) || 0), 0);
    const initialBalance = Number(month.initialBalance) || 0;
    const totalExpenses = monthExpenses + monthPayments;
    const remainingBalance = initialBalance + totalReimbursements - totalExpenses;
    const carryForward = remainingBalance;

    return {
      initialBalance,
      reimbursements: totalReimbursements,
      totalExpenses,
      totalPayments: monthPayments,
      monthExpenses,
      remainingBalance,
      carryForward,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const report = calculateReport();
  const monthExpenses = data.dailyExpenses.filter(e => e.monthKey === monthKey);
  const monthPayments = data.weeklyPayments.filter(p => p.monthKey === monthKey);

  return (
    <div className="container mx-auto px-4 py-4 lg:py-8 max-w-4xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Monthly Report</h1>
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 lg:flex-none px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:bg-gray-400 font-semibold shadow-md hover:shadow-lg transition-all touch-target"
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Syncing...
              </span>
            ) : (
              '🔄 Sync Data'
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 lg:flex-none px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold shadow-md hover:shadow-lg transition-all touch-target"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {isOffline && (
        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 text-yellow-700 rounded-xl">
          <p className="font-bold mb-1">⚠️ Offline Mode</p>
          <p className="text-sm">Showing cached data. Connect to the internet and click "Sync Data" to get the latest information.</p>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="reportMonth" className="block text-sm font-semibold text-gray-700 mb-2">
          Select Month
        </label>
        <input
          type="month"
          id="reportMonth"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          className="w-full lg:w-auto px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-target"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 lg:p-6">
          <h2 className="text-xl lg:text-2xl font-bold mb-5 text-gray-800 border-b border-gray-200 pb-3">Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Initial Balance:</span>
              <span className="font-bold text-lg">₹{report.initialBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
              <span className="text-gray-700 font-medium">Reimbursements:</span>
              <span className="font-bold text-lg text-green-600">+₹{report.reimbursements.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-red-50 rounded-lg px-3">
              <span className="text-gray-700 font-medium">Daily Expenses:</span>
              <span className="font-bold text-lg text-red-600">-₹{report.monthExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-red-50 rounded-lg px-3">
              <span className="text-gray-700 font-medium">Weekly Payments:</span>
              <span className="font-bold text-lg text-red-600">-₹{report.totalPayments.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Remaining Balance:</span>
              <span className={`text-xl font-bold ${report.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{report.remainingBalance.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Carry Forward:</span>
              <span className={`text-lg font-bold ${report.carryForward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{report.carryForward.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 lg:p-6">
          <h2 className="text-xl lg:text-2xl font-bold mb-5 text-gray-800 border-b border-gray-200 pb-3">Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
              <span className="text-gray-700 font-medium">Total Transactions:</span>
              <span className="font-bold text-lg">{monthExpenses.length + monthPayments.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Daily Expenses Count:</span>
              <span className="font-semibold">{monthExpenses.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Weekly Payments Count:</span>
              <span className="font-semibold">{monthPayments.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-red-50 rounded-lg px-3">
              <span className="text-gray-700 font-medium">Total Expenses:</span>
              <span className="font-bold text-lg text-red-600">₹{report.totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-5 text-gray-800 border-b border-gray-200 pb-3">Transactions</h2>
        <div className="space-y-4">
          {monthExpenses.length === 0 && monthPayments.length === 0 ? (
            <p className="text-gray-500">No transactions for this month.</p>
          ) : (
            <>
              {monthExpenses.map((expense) => (
                <div key={expense.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">{expense.description}</p>
                      <p className="text-sm text-gray-500 mb-2">{expense.date}</p>
                      {expense.attachmentUrl && (
                        <a
                          href={expense.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          📎 View Attachment
                        </a>
                      )}
                    </div>
                    <span className="font-bold text-lg text-red-600 whitespace-nowrap">-₹{expense.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {monthPayments.map((payment) => (
                <div key={payment.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">{payment.description}</p>
                      <p className="text-sm text-gray-500">Week ending: {payment.weekEndDate}</p>
                    </div>
                    <span className="font-bold text-lg text-red-600 whitespace-nowrap">-₹{payment.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

