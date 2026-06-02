import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PatientDashboard from './pages/PatientDashboard';
import MedicalRecords from './pages/MedicalRecords'; 
import UserProfile from './pages/UserProfile';
import Register from './pages/Register';
import Login from './pages/Login';
import ConnectDoctor from './pages/ConnectDoctor';
import DoctorDashboard from './pages/DoctorDashboard';
import MessageHub from './pages/MessageHub';
import AdminDashboard from './pages/AdminDashboard';
import EncounterRoom from './pages/EncounterRoom';
import PharmacyCart from './pages/PharmacyCart';
import Checkout from './pages/Checkout';

// --- THE SMART HOME COMPONENT ---
const Home = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // The Smart Routing Logic
  const handleTelehealthClick = () => {
    if (!currentUser) {
      // Guest: Must log in first
      navigate('/login');
    } else if (currentUser.role === 'doctor') {
      // Doctor: Go to their specific workspace
      navigate('/doctor-dashboard'); 
    } else {
      // Patient: Go to their medical dashboard
      navigate('/dashboard'); 
    }
  };

  return (
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
        <button 
          onClick={() => navigate('/shop')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-blue-500/30"
        >
          Shop Medicines
        </button>
        
        {/* The Smart Button */}
        <button 
          onClick={handleTelehealthClick}
          className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold py-3.5 px-8 rounded-full transition-all shadow-sm"
        >
          Telehealth Portal
        </button>
      </div>
    </div>
  );
};

// Placeholders for future sprints
const Shop = () => <div className="p-8 text-center text-gray-900 dark:text-white text-2xl font-bold mt-10">Medicine Catalog 💊</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/connect" element={<ConnectDoctor />} />
            <Route path="/message-hub" element={<MessageHub />} />
            <Route path="/encounter/:targetId" element={<EncounterRoom />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/pharmacy" element={<PharmacyCart />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}

export default App;