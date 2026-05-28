import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PatientDashboard from './pages/PatientDashboard';
import MedicalRecords from './pages/MedicalRecords'; 

// The Upgraded Hero Homepage
const Home = () => (
  <div className="flex flex-col items-center justify-center py-24 px-4 sm:px-6">
    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        🚀 24/7 Digital Pharmacy & Telehealth
      </span>
    </div>
    
    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 text-center tracking-tight max-w-4xl">
      Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Delivered.</span>
    </h1>
    
    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 text-center max-w-2xl leading-relaxed">
      Get your prescriptions and daily medical needs delivered to your door in hours. Consult with top-tier verified doctors instantly.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
      <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-blue-500/30">
        Shop Medicines
      </button>
      <button className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold py-3.5 px-8 rounded-full transition-all shadow-sm">
        Book a Doctor
      </button>
    </div>
  </div>
);

// Placeholders for the next sprints
const Shop = () => <div className="p-8 text-center text-gray-900 dark:text-white text-2xl font-bold mt-10">Medicine Catalog 💊</div>;
const Login = () => <div className="p-8 text-center text-gray-900 dark:text-white text-2xl font-bold mt-10">Login Screen 🔐</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        <Navbar />
        
        {/* Page Content Routing */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}

export default App;