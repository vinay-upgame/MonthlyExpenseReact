/**
 * Get current month key in YYYY-MM format
 */
export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get month key for a given date
 */
export const getMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get week end date (Sunday) for a given date
 */
export const getWeekEndDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Get Sunday of the week
  const sunday = new Date(d.setDate(diff));
  return formatDate(sunday);
};

/**
 * Get month name from month key
 */
export const getMonthName = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

