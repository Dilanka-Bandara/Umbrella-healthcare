import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Stethoscope, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '../components/auth';

/* LANDING PAGE — the front door.
 * Two clear paths: Shop Medicines (pharmacy section) or Telehealth (app section). */
const Landing = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const goTelehealth = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/dashboard' } });
    } else if (currentUser.role === 'admin') {
      navigate('/admin');
    } else if (currentUser.role === 'doctor') {
      navigate('/doctor-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col items-center text-center mb-14">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">🚀 24/7 Digital Pharmacy & Telehealth</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight max-w-4xl">
          Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Delivered.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Get your prescriptions and daily medical needs delivered to your door in hours. Consult with top-tier verified doctors instantly.
        </p>
        {currentUser && (
          <p className="mt-4 text-sm font-semibold text-gray-500">Welcome back, {currentUser.full_name?.split(' ')[0]} 👋</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button onClick={() => navigate('/pharmacy')}
          className="bg-gradient-to-br from-blue-600 to-cyan-500 p-8 rounded-3xl shadow-lg shadow-blue-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-8 -top-8 text-white/15 group-hover:scale-110 transition-transform"><ShoppingBag className="h-40 w-40" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-5 backdrop-blur-sm"><ShoppingBag className="h-7 w-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Shop Medicines</h2>
          <p className="text-blue-50 text-sm leading-relaxed mb-6">Browse and buy medicines, creams and everyday health items. No account needed to browse.</p>
          <div className="flex items-center gap-2 text-white font-bold text-sm">Enter Pharmacy <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
        </button>

        <button onClick={goTelehealth}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-lg shadow-emerald-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-8 -top-8 text-white/15 group-hover:scale-110 transition-transform"><Stethoscope className="h-40 w-40" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-5 backdrop-blur-sm"><Stethoscope className="h-7 w-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Telehealth Portal</h2>
          <p className="text-emerald-50 text-sm leading-relaxed mb-6">Consult verified doctors, manage prescriptions and your medical records. {currentUser ? 'Go to your dashboard.' : 'Sign in to continue.'}</p>
          <div className="flex items-center gap-2 text-white font-bold text-sm">{currentUser ? 'Open Dashboard' : 'Sign In to Continue'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
        </button>
      </div>
    </div>
  );
};

export default Landing;