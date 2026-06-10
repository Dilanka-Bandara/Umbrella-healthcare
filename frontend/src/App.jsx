import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- The Enterprise Layouts ---
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import PharmacyLayout from './layouts/PharmacyLayout';

// --- Public Pages ---
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';

// --- Pharmacy Pages ---
import Shop from './pages/Shop';
import PharmacyCart from './pages/PharmacyCart';
import Checkout from './pages/Checkout';

// --- Secure App Pages ---
import PatientDashboard from './pages/PatientDashboard';
import MedicalRecords from './pages/MedicalRecords'; 
import UserProfile from './pages/UserProfile';
import ConnectDoctor from './pages/ConnectDoctor';
import MessageHub from './pages/MessageHub';

// --- Doctor Pages ---
import DoctorDashboard from './pages/DoctorDashboard';
import EncounterRoom from './pages/EncounterRoom';

// --- Admin Pages ---
import AdminDashboard from './pages/AdminDashboard';
import DoctorReview from './pages/DoctorReview';

import MyOrders from './pages/MyOrders';

function App() {
  return (
    <Router>
      <Routes>
        
        {/* 🌐 TIER 1: PUBLIC FRONT-DOOR */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* 🛒 TIER 2: PUBLIC PHARMACY STOREFRONT */}
        <Route element={<PharmacyLayout />}>
          <Route path="/shop" element={<Shop />} />
          <Route path="/pharmacy" element={<Shop />} />
        </Route>

        {/* 🏥 TIER 3: SECURE MEDICAL PORTAL */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/records" element={<MedicalRecords />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/connect" element={<ConnectDoctor />} />
          <Route path="/message-hub" element={<MessageHub />} />
          
          {/* 🚨 THE FIX: Reconnected the Prescription Cart to the Dashboard button! */}
          <Route path="/prescription-cart" element={<PharmacyCart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* 🚨 THE FIX: Reconnected the missing Orders Page! */}
          <Route path="/my-orders" element={<MyOrders />} />
          
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/encounter/:targetId" element={<EncounterRoom />} />
          
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/review" element={<DoctorReview />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;