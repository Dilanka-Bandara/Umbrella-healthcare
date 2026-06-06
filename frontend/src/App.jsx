import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

// Layouts (each section has its own top bar)
import PublicLayout from './layouts/PublicLayout';
import PharmacyLayout from './layouts/PharmacyLayout';
import AppLayout from './layouts/AppLayout';

// Guards
import { RequireAuth } from './components/auth';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Telehealth / app pages
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorReview from './pages/DoctorReview';
import MedicalRecords from './pages/MedicalRecords';
import UserProfile from './pages/UserProfile';
import ConnectDoctor from './pages/ConnectDoctor';
import MessageHub from './pages/MessageHub';
import EncounterRoom from './pages/EncounterRoom';
import PharmacyCart from './pages/PharmacyCart';
import Checkout from './pages/Checkout';

// Pharmacy (e-commerce) pages
import Pharmacy from './pages/Pharmacy';
import PharmacyProduct from './pages/PharmacyProduct';
import PharmacyCheckout from './pages/PharmacyCheckout';
import PharmacyOrders from './pages/PharmacyOrders';

import { Link } from 'react-router-dom';

/* Reset scroll to top on every route change */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const NotFound = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
    <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-3">404</h1>
    <p className="text-gray-500 mb-6">This page doesn't exist.</p>
    <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full">Go Home</Link>
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>

        {/* ============ PUBLIC SECTION (front door) ============ */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ============ PHARMACY SECTION (guest can browse) ============ */}
        <Route element={<PharmacyLayout />}>
          <Route path="/shop" element={<Pharmacy />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/pharmacy/product/:id" element={<PharmacyProduct />} />
          <Route path="/pharmacy/orders" element={<PharmacyOrders />} />
          {/* Checkout requires login */}
          <Route path="/pharmacy/checkout" element={<RequireAuth roles={['patient']}><PharmacyCheckout /></RequireAuth>} />
        </Route>

        {/* ============ TELEHEALTH / APP SECTION (login required) ============ */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/review" element={<DoctorReview />} />
          <Route path="/records" element={<MedicalRecords />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/connect" element={<ConnectDoctor />} />
          <Route path="/message-hub" element={<MessageHub />} />
          <Route path="/encounter/:targetId" element={<EncounterRoom />} />
          <Route path="/prescription-cart" element={<PharmacyCart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* ============ 404 ============ */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;