import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStoreCart } from '../context/StoreCartContext';
import { getCurrentUser } from '../components/auth';
import { Pill, ShoppingCart, Package, Stethoscope, LogIn, LayoutDashboard } from 'lucide-react';

/* PHARMACY SECTION LAYOUT
 * Its own shopping-style top bar. Guest-friendly (browse without login).
 * Rendered for every /pharmacy/* and /shop route via <Outlet />. */
const PharmacyLayout = () => {
  const navigate = useNavigate();
  const { itemCount } = useStoreCart();
  const user = getCurrentUser();

  const navClass = ({ isActive }) =>
    `text-sm font-bold px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Pharmacy top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/pharmacy" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-black text-gray-900 dark:text-white">Umbrella</span>
              <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest -mt-0.5">Pharmacy</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/pharmacy" end className={navClass}>Shop</NavLink>
            <NavLink to="/pharmacy/orders" className={navClass}>My Orders</NavLink>
          </nav>

          <div className="flex items-center gap-2">
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

            <Link to="/pharmacy/orders" className="hidden sm:flex p-2 text-gray-500 hover:text-blue-600 transition-colors" title="My Orders">
              <Package className="h-5 w-5" />
            </Link>

            {/* Cart shortcut → opens storefront where the cart drawer lives */}
            <Link to="/pharmacy" className="relative p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-lg shadow-blue-500/30" title="Cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-gray-900 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main><Outlet /></main>
    </div>
  );
};

export default PharmacyLayout;