import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  let currentUser = null;

  try {
    currentUser = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (error) {
    currentUser = null;
  }

  const handleTelehealthClick = () => {
    if (!currentUser) navigate('/login');
    else if (currentUser.role === 'admin') navigate('/admin');
    else if (currentUser.role === 'doctor') navigate('/doctor-dashboard'); 
    else navigate('/dashboard'); 
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 sm:px-6 min-h-[80vh]">
      <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          🚀 24/7 Digital Pharmacy & Telehealth
        </span>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 text-center tracking-tight max-w-4xl">
        Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Delivered.</span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 text-center max-w-2xl leading-relaxed">
        Browse our public pharmacy catalog or securely consult with top-tier verified doctors instantly.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => navigate('/shop')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-blue-500/30"
        >
          Enter Public Store
        </button>
        <button 
          onClick={handleTelehealthClick}
          className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold py-3.5 px-8 rounded-full transition-all shadow-sm"
        >
          Secure Medical Portal
        </button>
      </div>
    </div>
  );
};

export default Home;