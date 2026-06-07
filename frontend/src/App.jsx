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
        
        {/* ONLY Routes go in here! No <Home /> tags allowed here! */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/connect" element={<ConnectDoctor />} />
            <Route path="/message-hub" element={<MessageHub />} />
            <Route path="/pharmacy" element={<PharmacyCart />} />
            <Route path="/checkout" element={<Checkout />} />
            
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/encounter/:targetId" element={<EncounterRoom />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review" element={<DoctorReview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;