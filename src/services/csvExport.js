/**
 * CSV export utility for monthly expense reports
 */

/**
 * Generate CSV content from transactions
 */
const generateCSV = (transactions) => {
  const headers = ['Date', 'Description', 'Amount', 'Attachment URL'];
  const rows = transactions.map(t => [
    t.date,
    t.description,
    t.amount.toString(),
    t.attachmentUrl || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in cell content
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export monthly expenses to CSV
 */
export const exportMonthlyExpenses = (monthKey, dailyExpenses, weeklyPayments, monthName) => {
  // Combine daily expenses and weekly payments
  const transactions = [
    ...dailyExpenses
      .filter(e => e.monthKey === monthKey)
      .map(e => ({
        date: e.date,
        description: e.description,
        amount: e.amount,
        attachmentUrl: e.attachmentUrl,
      })),
    ...weeklyPayments
      .filter(p => p.monthKey === monthKey)
      .map(p => ({
        date: p.weekEndDate,
        description: p.description || `Weekly Payment - ${p.weekEndDate}`,
        amount: p.amount,
        attachmentUrl: '',
      })),
  ];

  // Sort by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate CSV
  const csvContent = generateCSV(transactions);
  const filename = `ExpenseReport_${monthKey}_${monthName || monthKey}.csv`;

  // Download
  downloadCSV(csvContent, filename);
};

