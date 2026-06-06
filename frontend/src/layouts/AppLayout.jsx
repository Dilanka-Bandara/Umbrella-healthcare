import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { RequireAuth } from '../components/auth';

/* TELEHEALTH / APP SECTION LAYOUT
 * Uses the existing dashboard Navbar. Everything inside requires login.
 * Role-specific pages still do their own role checks; this just guarantees
 * the user is authenticated before entering the telehealth area. */
const AppLayout = () => {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        <Navbar />
        <main><Outlet /></main>
      </div>
    </RequireAuth>
  );
};

export default AppLayout;