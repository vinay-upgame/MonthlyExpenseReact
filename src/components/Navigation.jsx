import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../utils/signOut.js';

export default function Navigation({ onSignOut }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out? This will clear all local data.')) {
      try {
        await signOut();
        if (onSignOut) {
          onSignOut();
        }
        window.location.href = '/';
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
      }
    }
  };

  const navItems = [
    { path: '/monthly-balance', label: 'Balance', icon: '💰', shortLabel: 'Balance' },
    { path: '/daily-expense', label: 'Daily Expense', icon: '📝', shortLabel: 'Expense' },
    { path: '/weekly-payment', label: 'Payment', icon: '💳', shortLabel: 'Payment' },
    { path: '/report', label: 'Report', icon: '📊', shortLabel: 'Report' },
  ];

  return (
    <>
      {/* Desktop Top Navigation */}
      <nav className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <span>💰</span>
              <span>Expense Tracker</span>
            </Link>
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-white text-blue-600 font-semibold shadow-md'
                      : 'hover:bg-blue-500 text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive(item.path)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive(item.path) ? 'font-semibold' : ''}`}>
                {item.shortLabel}
              </span>
              {isActive(item.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-red-600 transition-all duration-200"
            title="Sign Out"
          >
            <span className="text-2xl mb-1">🚪</span>
            <span className="text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar (Simple) */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-lg font-bold flex items-center gap-2">
            <span>💰</span>
            <span>Expense Tracker</span>
          </Link>
        </div>
      </div>
    </>
  );
}
