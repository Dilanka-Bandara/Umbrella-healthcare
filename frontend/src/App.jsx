import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Dummy Pages (We will build real ones next!)
const Home = () => <div className="p-8 text-center text-2xl font-bold mt-10">Welcome to the Pharmacy 🏥</div>;
const Shop = () => <div className="p-8 text-center text-2xl font-bold mt-10">Medicine Catalog 💊</div>;
const Login = () => <div className="p-8 text-center text-2xl font-bold mt-10">Login Screen 🔐</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        
        {/* Page Content goes here */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;