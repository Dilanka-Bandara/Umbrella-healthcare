import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare, User, FileText, QrCode, Activity, Pill, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import ChatPopup from '../components/ChatPopup';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Dynamic Data States
  const [myCareTeam, setMyCareTeam] = useState([]); 
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Real User Data from Auth
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!currentUser || !token) return;

    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 1. Fetch Care Team (For Chat)
        const teamRes = await axios.get('http://localhost:5000/api/patients/my-doctors', config);
        setMyCareTeam(teamRes.data);

        // 2. Fetch Real Medical History & Prescriptions
        const historyRes = await axios.get('http://localhost:5000/api/patients/my-history', config);
        setMedicalHistory(historyRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.id, token]);

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Dynamic Welcome Banner */}
      <div className="mb-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, {currentUser.full_name}</h1>
        <p className="text-blue-50 max-w-xl">View your medical history, manage your active prescriptions, and connect with your Care Team all in one secure place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* REAL DATA: Medical History & Past Diagnoses */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-blue-600 h-5 w-5" /> My Medical History
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : medicalHistory.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No past medical records found.</p>
                <p className="text-xs text-gray-400 mt-1">Connect with a doctor to start your telehealth journey.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {medicalHistory.map((record) => (
                  <div key={record.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                    {/* Record Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Diagnosis: {record.diagnosis}</h3>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">Attending: Dr. {record.doctor_name}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Doctor's Notes */}
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                        {record.symptoms_notes}
                      </p>
                    </div>

                    {/* Prescribed Medicines for this session */}
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Pill className="h-3 w-3" /> Prescribed Medication
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {record.prescriptions.map((rx, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/50 p-3 rounded-xl flex gap-3">
                              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 self-start">
                                <Pill className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{rx.medicine_name}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{rx.instructions}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Profile */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full mb-4 bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {/* If you add Cloudinary profile pics later, render the <img> here */}
              <User className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">{currentUser.full_name}</h2>
            <p className="text-sm text-gray-500 mb-4 font-mono">ID: #{currentUser.id.substring(0,8)}</p>
            <button onClick={() => navigate('/profile')} className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold rounded-xl text-sm">Manage Account</button>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Patient Services</h2>
            <div className="grid grid-cols-1 gap-3">
              
              <button onClick={() => navigate('/pharmacy')} className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-left transition-all border border-blue-100 dark:border-blue-800/50 group">
                <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:scale-105 transition-transform"><ShoppingBag className="h-4 w-4" /></div>
                <div>
                  <div className="font-bold text-sm text-blue-900 dark:text-blue-300">E-Pharmacy Cart</div>
                  <div className="text-xs text-blue-700/70 dark:text-blue-400/70">Order your prescriptions</div>
                </div>
              </button>

              <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-cyan-50 dark:bg-gray-800/50 dark:hover:bg-cyan-900/20 text-left transition-all group border border-transparent">
                <div className="bg-cyan-500 text-white p-2 rounded-lg"><MessageSquare className="h-4 w-4" /></div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">Telehealth Chat</div>
                  <div className="text-xs text-gray-400">Message your Care Team</div>
                </div>
              </button>

              <button onClick={() => navigate('/connect')} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/50 dark:hover:bg-emerald-900/20 text-left transition-all group border border-transparent">
                <div className="bg-emerald-600 text-white p-2 rounded-lg"><QrCode className="h-4 w-4" /></div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Link with Doctor</div>
                  <div className="text-xs text-gray-400">Enter a Clinic ID</div>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>

      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        careTeam={myCareTeam} 
      />
    </div>
  );
};

export default PatientDashboard;