import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, LogOut, LayoutDashboard } from 'lucide-react';
import { getCurrentUser } from './auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">Umbrella Medical</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:block text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Welcome, {user.full_name?.split(' ')[0]}
                </span>
                <button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-dashboard' : '/dashboard')} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </button>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-xl transition-colors">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="text-sm font-bold px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-md">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;