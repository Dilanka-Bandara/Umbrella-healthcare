import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// --- E-Commerce & Public Pages ---
import Home from './pages/Home';
import Shop from './pages/Shop';
import Register from './pages/Register';
import Login from './pages/Login';

// --- Secure Medical Portal Pages ---
import PatientDashboard from './pages/PatientDashboard';
import MedicalRecords from './pages/MedicalRecords'; 
import UserProfile from './pages/UserProfile';
import ConnectDoctor from './pages/ConnectDoctor';
import MessageHub from './pages/MessageHub';
import PharmacyCart from './pages/PharmacyCart';
import Checkout from './pages/Checkout';

// --- Doctor Pages ---
import DoctorDashboard from './pages/DoctorDashboard';
import EncounterRoom from './pages/EncounterRoom';

// --- Admin Pages ---
import AdminDashboard from './pages/AdminDashboard';
import DoctorReview from './pages/DoctorReview';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        <Navbar />
        
        {/* ONLY dynamic page routes go in here. No stray tags allowed! */}
        <main>
          <Routes>
            {/* 🌐 Tier 1: Public E-Commerce & Auth */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* 🏥 Tier 2: Secure Patient Telehealth Portal */}
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/connect" element={<ConnectDoctor />} />
            <Route path="/message-hub" element={<MessageHub />} />
            <Route path="/pharmacy" element={<PharmacyCart />} />
            <Route path="/checkout" element={<Checkout />} />
            
            {/* 🩺 Tier 3: Doctor Clinical Workspace */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/encounter/:targetId" element={<EncounterRoom />} />
            
            {/* 🛡️ Tier 4: Admin Command Center */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review" element={<DoctorReview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;