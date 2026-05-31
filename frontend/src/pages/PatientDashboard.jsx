import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ShoppingBag, MessageSquare, Clock, User, FileText, Camera, QrCode } from 'lucide-react';
import axios from 'axios';
import ChatPopup from '../components/ChatPopup';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [myCareTeam, setMyCareTeam] = useState([]); // Array of all channelled doctors
  
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-fetch ALL connected doctors on load
  useEffect(() => {
    const fetchCareTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/api/patients/my-doctors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyCareTeam(response.data);
      } catch (error) {
        console.error("Error fetching care team:", error);
      }
    };

    fetchCareTeam();
  }, []);

  const mockAppointments = [
    { id: 1, doctor_name: "Dr. Sarah Jenkins", appointment_date: "2026-06-02", appointment_time: "10:30 AM", status: "approved" }
  ];

  const mockOrders = [
    { id: "42d08f39", medicine_name: "Paracetamol", quantity: 2, price: "5.99", status: "Processing", purchase_date: "2026-05-27" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      <div className="mb-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, John Doe</h1>
        <p className="text-blue-50 max-w-xl">Manage your active prescriptions, monitor your pharmacy orders, and track your medical appointments all in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Calendar className="text-blue-600 h-5 w-5" /> Upcoming Consultations
            </h2>
            <div className="space-y-4">
              {mockAppointments.map((appt) => (
                <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{appt.doctor_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{appt.appointment_date} @ {appt.appointment_time}</p>
                    </div>
                  </div>
                  <span className="mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            {/* 🚨 UPDATED: Header now includes the Pharmacy Cart Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-blue-600 h-5 w-5" /> Recent Pharmacy Orders
              </h2>
              <button 
                onClick={() => navigate('/pharmacy')} 
                className="w-full sm:w-auto bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Open Pharmacy Cart
              </button>
            </div>

            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{order.medicine_name} x{order.quantity}</span>
                    <p className="text-xs text-gray-400">ID: #{order.id}</p>
                  </div>
                  <span className="font-bold">${(order.price * order.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full mb-4 bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-sm text-gray-500 mb-4">Patient ID: #PAT-8832</p>
            <button onClick={() => navigate('/profile')} className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold rounded-xl text-sm">Manage Account</button>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              
              <button onClick={() => navigate('/records')} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/50 dark:hover:bg-emerald-900/20 text-left transition-all group">
                <div className="bg-emerald-600 text-white p-2 rounded-lg"><FileText className="h-4 w-4" /></div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Medical Records</div>
                  <div className="text-xs text-gray-400">View prescriptions</div>
                </div>
              </button>

              <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-cyan-50 dark:bg-gray-800/50 dark:hover:bg-cyan-900/20 text-left transition-all group">
                <div className="bg-cyan-500 text-white p-2 rounded-lg"><MessageSquare className="h-4 w-4" /></div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">Telehealth Chat</div>
                  <div className="text-xs text-gray-400">Talk to your Care Team</div>
                </div>
              </button>

              <button onClick={() => navigate('/connect')} className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-left transition-all group border border-blue-100 dark:border-blue-800/50">
                <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:scale-105 transition-transform"><QrCode className="h-4 w-4" /></div>
                <div>
                  <div className="font-bold text-sm text-blue-900 dark:text-blue-300">Link with Doctor</div>
                  <div className="text-xs text-blue-700/70 dark:text-blue-400/70">Enter Clinic ID</div>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>

      {/* Passing the entire care team into the popup */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        careTeam={myCareTeam} 
      />
    </div>
  );
};

export default PatientDashboard;