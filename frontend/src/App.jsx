import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import { ShoppingBag, Stethoscope, ArrowRight } from 'lucide-react';
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
import DoctorReview from './pages/DoctorReview';
// E-commerce storefront
import Pharmacy from './pages/Pharmacy';
import PharmacyProduct from './pages/PharmacyProduct';
import PharmacyCheckout from './pages/PharmacyCheckout';
import PharmacyOrders from './pages/PharmacyOrders';


/* Scrolls to the top whenever the route path changes.
   Without this, navigating to a product page can leave you scrolled
   halfway down where the previous page was. */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};


// --- THE SMART HOME COMPONENT ---
const Home = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  let currentUser = null;

  try {
    currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to parse user data from local storage.');
    currentUser = null;
  }

  const handleTelehealthClick = () => {
    if (!currentUser) {
      navigate('/login');
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
      {/* Hero */}
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

      {/* Two clear paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button onClick={() => navigate('/pharmacy')}
          className="bg-gradient-to-br from-blue-600 to-cyan-500 p-8 rounded-3xl shadow-lg shadow-blue-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-8 -top-8 text-white/15 group-hover:scale-110 transition-transform"><ShoppingBag className="h-40 w-40" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-5 backdrop-blur-sm"><ShoppingBag className="h-7 w-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Shop Medicines</h2>
          <p className="text-blue-50 text-sm leading-relaxed mb-6">Browse and buy medicines, creams and everyday health items. No account needed to browse.</p>
          <div className="flex items-center gap-2 text-white font-bold text-sm">Enter Pharmacy <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
        </button>

        <button onClick={handleTelehealthClick}
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

// Simple 404 so unknown URLs don't render a blank or stacked page
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        <Navbar />
        <ScrollToTop />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/connect" element={<ConnectDoctor />} />
            <Route path="/message-hub" element={<MessageHub />} />
            <Route path="/encounter/:targetId" element={<EncounterRoom />} />

            {/* Prescription cart (medicines a doctor prescribed in a consultation) */}
            <Route path="/prescription-cart" element={<PharmacyCart />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review" element={<DoctorReview />} />

            {/* E-commerce Pharmacy Storefront */}
            <Route path="/shop" element={<Pharmacy />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/pharmacy/product/:id" element={<PharmacyProduct />} />
            <Route path="/pharmacy/checkout" element={<PharmacyCheckout />} />
            <Route path="/pharmacy/orders" element={<PharmacyOrders />} />

            {/* Catch-all 404 — must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;