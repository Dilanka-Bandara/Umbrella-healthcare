import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      <Navbar />
      
      {/* 🚨 Removed the rogue <Shop /> component from here! */}
      
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;