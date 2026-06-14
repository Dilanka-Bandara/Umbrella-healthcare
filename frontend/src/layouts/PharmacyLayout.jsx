import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
// 🚨 NEW: Import the correct Global Cart Engine
import { useCart } from '../context/CartContext';
import { getCurrentUser } from '../components/auth';
// 🚨 NEW: Import Sun and Moon icons for Dark Mode
import { Pill, ShoppingCart, Package, Stethoscope, LogIn, LayoutDashboard, Sun, Moon } from 'lucide-react';

const PharmacyLayout = () => {
  const navigate = useNavigate();
  // 🚨 Hooked up to the new Unified Cart Engine!
  const { cartItems } = useCart(); 
  const user = getCurrentUser();

  // Safely count the total number of items
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  // --- DARK MODE LOGIC ---
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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

  const navClass = ({ isActive }) =>
    `text-sm font-bold px-3 py-2 rounded-lg transition-colors ${
      isActive ?
        'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      {/* Pharmacy top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <Link to="/shop" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-black text-gray-900 dark:text-white">Umbrella</span>
              <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest -mt-0.5">Pharmacy</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/shop" end className={navClass}>Shop Catalog</NavLink>
            <NavLink to="/pharmacy/orders" className={navClass}>My Orders</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            
            {/* 🌙 🚨 NEW: Dark Mode Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-1"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Switch to telehealth */}
            <button onClick={() => navigate(user ? (user.role === 'doctor' ? '/doctor-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard') : '/login')}
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              {user ? <LayoutDashboard className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
              {user ? 'Dashboard' : 'Telehealth'}
            </button>

            {!user && (
              <button onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-colors">
                <LogIn className="h-4 w-4" /> Sign In
              </button>
            )}

            <Link to="/pharmacy/orders" className="hidden sm:flex p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" title="My Orders">
              <Package className="h-5 w-5" />
            </Link>

            {/* 🛒 🚨 UPGRADED: Smart Cart Icon linked to the Unified Cart */}
            <button 
              onClick={() => navigate('/prescription-cart')}
              className="relative p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-lg shadow-blue-500/30 ml-1" 
              title="View Cart"
            >

              <button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-dashboard' : user.role === 'pharmacist' ? '/pharmacist-dashboard' : '/dashboard')} className="..."></button>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white border-2 border-white dark:border-gray-900 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      <main><Outlet /></main>
    </div>
  );
};

export default PharmacyLayout;