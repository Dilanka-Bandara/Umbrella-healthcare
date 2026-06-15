import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, LogOut, LayoutDashboard, ShoppingCart, Sun, Moon } from 'lucide-react';
// 🚨 NEW: Import the Cart Engine so the Navbar knows how many items you have!
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  
  // Safely get the logged-in user
  const userStr = localStorage.getItem('user');
  const user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

  // Calculate total items in the cart
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  // --- DARK MODE LOGIC ---
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage to remember the user's preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Side: Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">Umbrella Medical</span>
          </Link>

          {/* Right Side: Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* 🌙 Dark Mode Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* 🛒 Smart Cart Icon */}
            <button 
              onClick={() => navigate('/prescription-cart')}
              className="relative p-2.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2"
              title="View Pharmacy Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-black h-4.5 w-4.5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-dashboard' : user.role === 'pharmacist' ? '/pharmacist-dashboard' : '/dashboard')} className="..."></button>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {user ? (
              <>
                <span className="hidden sm:block text-sm font-semibold text-gray-600 dark:text-gray-300 ml-2">
                  Hello, {user.full_name?.split(' ')[0]}
                </span>
                <button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-dashboard' : '/dashboard')} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                  <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-xl transition-colors">
                  <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="text-sm font-bold px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-md ml-2">
                Sign In
              </button>
            )}

            // You can add a specific button for staff:
              {(user?.role === 'admin' || user?.role === 'pharmacist') && (
                <button onClick={() => navigate('/fulfillment')} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-bold text-sm transition-colors hidden sm:block">
                  Fulfillment
                </button>
              )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;