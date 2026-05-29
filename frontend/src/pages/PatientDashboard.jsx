import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ShoppingBag, MessageSquare, Clock, User, FileText, Camera, QrCode } from 'lucide-react';
import axios from 'axios'; // 🚨 NEW: Imported Axios to talk to our backend!
import ChatPopup from '../components/ChatPopup';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 🚨 ADD THIS MISSING LINE HERE:
  const connectedDoctorId = localStorage.getItem('connectedDoctorId');
  
  // State & Refs for Profile Picture Upload
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const mockAppointments = [
    { id: 1, doctor_name: "Dr. Sarah Jenkins", appointment_date: "2026-06-02", appointment_time: "10:30 AM", status: "approved" },
    { id: 2, doctor_name: "Dr. Alex Rivera", appointment_date: "2026-06-15", appointment_time: "02:15 PM", status: "pending" }
  ];

  const mockOrders = [
    { id: "42d08f39", medicine_name: "Paracetamol", quantity: 2, price: "5.99", status: "Processing", purchase_date: "2026-05-27" }
  ];

  // 🚨 UPGRADED: Cloud Upload Function
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Optimistic UI: Show the image locally right away so the user feels it is fast
    const tempUrl = URL.createObjectURL(file);
    setProfileImage(tempUrl);

    // 2. Prepare the payload for the backend
    const formData = new FormData();
    formData.append('document', file); // 'document' matches what your backend Multer config expects!

    try {
      // 3. Send the image to your Node.js server
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
          // Future Note: We will pass the JWT Bearer token here once the Login page is built!
        }
      });

      // 4. Success! Grab the live Cloudinary URL
      const liveCloudUrl = response.data.file_url;
      
      // Update the screen with the permanent internet URL
      setProfileImage(liveCloudUrl);
      console.log("Success! Permanent Image URL:", liveCloudUrl);

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image to the cloud. Is your backend running?");
      // Revert to null if the upload failed
      setProfileImage(null); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Welcome Banner */}
      <div className="mb-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, John Doe</h1>
        <p className="text-blue-50 max-w-xl">Manage your active prescriptions, monitor your pharmacy orders, and track your medical appointments all in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Sections (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Appointments Block */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-blue-600 h-5 w-5" /> Upcoming Consultations
              </h2>
            </div>

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
                  <span className={`mt-2 sm:mt-0 self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    appt.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* E-Commerce Order Block */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-blue-600 h-5 w-5" /> Recent Pharmacy Orders
              </h2>
            </div>

            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.medicine_name}</span>
                      <span className="text-sm text-gray-500">x{order.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-400">Ordered on {order.purchase_date} • ID: #{order.id}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <span className="font-bold">${(order.price * order.quantity).toFixed(2)}</span>
                    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      <Clock className="h-3 w-3" /> {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Action Sidebars (Right 1 Column) */}
        <div className="space-y-6">
          
          {/* Profile Summary Card with Interactive Avatar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center transition-colors">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Clickable Avatar Group */}
            <div 
              onClick={() => fileInputRef.current.click()}
              className="relative h-24 w-24 rounded-full mb-4 cursor-pointer group overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm"
              title="Click to upload profile picture"
            >
              {profileImage ? (
                <img src={profileImage} alt="User Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="h-10 w-10" />
                </div>
              )}
              
              {/* Dark Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                <Camera className="text-white h-6 w-6" />
              </div>
            </div>

            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Patient ID: #PAT-8832</p>
            
            <button 
              onClick={() => navigate('/profile')}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl transition-colors"
            >
              Manage Account & Billing
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              
              <button 
                onClick={() => navigate('/records')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group"
              >
                <div className="bg-emerald-600 text-white p-2 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">Medical Records</div>
                  <div className="text-xs text-gray-400">View prescriptions and diagnoses</div>
                </div>
              </button>

              <button 
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group"
              >
                <div className="bg-cyan-500 text-white p-2 rounded-lg">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-cyan-500 transition-colors">Telehealth Chat</div>
                  <div className="text-xs text-gray-400">Talk directly with your doctor</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/connect')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-all group shadow-sm"
              >
                <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:scale-105 transition-transform">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-blue-900 dark:text-blue-300">Link with Doctor</div>
                  <div className="text-xs text-blue-700/70 dark:text-blue-400/70">Scan QR or enter Clinic ID</div>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>

      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        doctorId={connectedDoctorId} 
        doctorName="Your Connected Doctor" 
      />
    </div>
  );
};

export default PatientDashboard;