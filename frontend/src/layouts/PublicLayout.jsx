import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Pill } from 'lucide-react';

/* PUBLIC SECTION LAYOUT
 * Minimal top bar for the landing page, login and register.
 * No dashboard navigation, no cart — this is the "front door". */
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-gray-900 dark:text-white text-lg">Umbrella Health</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-bold px-4 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Sign In</Link>
            <Link to="/register" className="text-sm font-bold px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/30">Register</Link>
          </div>
        </div>
      </header>

      <main><Outlet /></main>
    </div>
  );
};

export default PublicLayout;