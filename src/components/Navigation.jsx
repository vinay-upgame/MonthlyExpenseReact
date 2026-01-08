import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../utils/signOut.js';

export default function Navigation({ onSignOut }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600';
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out? This will clear all local data.')) {
      try {
        await signOut();
        if (onSignOut) {
          onSignOut();
        }
        // Reload the page to reset app state
        window.location.href = '/';
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
      }
    }
  };

  return (
    <nav className="bg-blue-500 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            Expense Tracker
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/monthly-balance"
              className={`px-4 py-2 rounded transition ${isActive('/monthly-balance')}`}
            >
              Monthly Balance
            </Link>
            <Link
              to="/daily-expense"
              className={`px-4 py-2 rounded transition ${isActive('/daily-expense')}`}
            >
              Daily Expense
            </Link>
            <Link
              to="/weekly-payment"
              className={`px-4 py-2 rounded transition ${isActive('/weekly-payment')}`}
            >
              Weekly Payment
            </Link>
            <Link
              to="/report"
              className={`px-4 py-2 rounded transition ${isActive('/report')}`}
            >
              Report
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

