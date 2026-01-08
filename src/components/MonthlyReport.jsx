import { useState, useEffect } from 'react';
import * as sheetsService from '../services/sheetsService.js';
import * as csvExport from '../services/csvExport.js';
import { getCurrentMonthKey, getMonthName } from '../utils/dateUtils.js';

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Monthly Report</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
          >
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      {isOffline && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="font-semibold">⚠️ Offline Mode</p>
          <p className="text-sm">Showing cached data. Connect to the internet and click "Sync Data" to get the latest information.</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </label>
        <input
          type="month"
          id="reportMonth"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Initial Balance:</span>
              <span className="font-semibold">₹{report.initialBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reimbursements:</span>
              <span className="font-semibold text-green-600">+₹{report.reimbursements.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Expenses:</span>
              <span className="font-semibold text-red-600">-₹{report.monthExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Payments:</span>
              <span className="font-semibold text-red-600">-₹{report.totalPayments.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-800">Remaining Balance:</span>
              <span className={`text-lg font-bold ${report.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{report.remainingBalance.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-600">Carry Forward:</span>
              <span className={`font-semibold ${report.carryForward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{report.carryForward.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold">{monthExpenses.length + monthPayments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Expenses Count:</span>
              <span className="font-semibold">{monthExpenses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Payments Count:</span>
              <span className="font-semibold">{monthPayments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-semibold text-red-600">₹{report.totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Transactions</h2>
        <div className="space-y-4">
          {monthExpenses.length === 0 && monthPayments.length === 0 ? (
            <p className="text-gray-500">No transactions for this month.</p>
          ) : (
            <>
              {monthExpenses.map((expense) => (
                <div key={expense.id} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.date}</p>
                      {expense.attachmentUrl && (
                        <a
                          href={expense.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View Attachment
                        </a>
                      )}
                    </div>
                    <span className="font-semibold text-red-600">-₹{expense.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {monthPayments.map((payment) => (
                <div key={payment.id} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{payment.description}</p>
                      <p className="text-sm text-gray-500">Week ending: {payment.weekEndDate}</p>
                    </div>
                    <span className="font-semibold text-red-600">-₹{payment.amount.toFixed(2)}</span>
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

