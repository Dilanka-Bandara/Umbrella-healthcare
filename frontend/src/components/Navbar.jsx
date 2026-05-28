import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, ShoppingCart, User, Menu, Sun, Moon, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  
  // Read the user from local storage
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (localStorage.theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    // Clear the security keys from memory
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Refresh the page to reset the state
    window.location.href = '/'; 
  };

  // Smart routing for the Dashboard button
  const goToDashboard = () => {
    if (currentUser?.role === 'doctor') {
      navigate('/doctor-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
              Umbrella Health
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="w-full relative">
              <input 
                type="text" 
                placeholder="Search for medicines, doctors, or symptoms..." 
                className="w-full px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link to="/cart" className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-gray-900">
                0
              </span>
            </Link>
            
            {/* DYNAMIC AUTH SECTION */}
            {currentUser ? (
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={goToDashboard}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="text-sm">Dashboard</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">
                <User className="h-4 w-4" />
                <span className="text-sm">Sign In</span>
              </Link>
            )}

            <button className="md:hidden p-2 text-gray-500 dark:text-gray-400">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;