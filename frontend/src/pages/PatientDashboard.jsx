import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare, User, FileText, QrCode, Activity, Pill, Clock, Loader2, FileImage, ArrowRight } from 'lucide-react';
import axios from 'axios';
import ChatPopup from '../components/ChatPopup';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [myCareTeam, setMyCareTeam] = useState([]); 
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!currentUser || !token) return;

    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const teamRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/patients/my-doctors`, config);
        setMyCareTeam(teamRes.data);
        const historyRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/patients/my-history`, config);
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
      
      {/* Welcome Banner */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome, {currentUser.full_name.split(' ')[0]}!</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your active health services and medical records.</p>
        </div>
        <button onClick={() => navigate('/profile')} className="h-14 w-14 bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
           <User className="h-7 w-7" />
        </button>
      </div>

      {/* 🚨 REDESIGN: MASSIVE CORE SERVICES HIGHLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <button onClick={() => navigate('/connect')} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 text-white/20 group-hover:scale-110 transition-transform"><QrCode className="h-32 w-32" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-sm"><QrCode className="h-6 w-6 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-1">Link with Doctor</h2>
          <p className="text-emerald-50 text-sm">Enter a Clinic ID to start a live session.</p>
          <div className="mt-6 flex items-center gap-2 text-white font-bold text-sm">Connect Now <ArrowRight className="h-4 w-4" /></div>
        </button>

        <button onClick={() => navigate('/prescription-cart')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg shadow-indigo-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 text-white/20 group-hover:scale-110 transition-transform"><ShoppingBag className="h-32 w-32" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-sm"><ShoppingBag className="h-6 w-6 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-1">My Prescriptions</h2>
          <p className="text-indigo-50 text-sm">Buy pending prescriptions & check limits.</p>
          <div className="mt-6 flex items-center gap-2 text-white font-bold text-sm">Open Cart <ArrowRight className="h-4 w-4" /></div>
        </button>

        <button onClick={() => navigate('/pharmacy')} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 text-white/20 group-hover:scale-110 transition-transform"><ShoppingBag className="h-32 w-32" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-sm"><ShoppingBag className="h-6 w-6 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-1">Shop Pharmacy</h2>
          <p className="text-emerald-50 text-sm">Browse & buy medicines, creams & health items.</p>
          <div className="mt-6 flex items-center gap-2 text-white font-bold text-sm">Open Store <ArrowRight className="h-4 w-4" /></div>
        </button>

        <button onClick={() => setIsChatOpen(true)} className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl shadow-lg shadow-cyan-500/20 text-left relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 text-white/20 group-hover:scale-110 transition-transform"><MessageSquare className="h-32 w-32" /></div>
          <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-sm"><MessageSquare className="h-6 w-6 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-1">Telehealth Chat</h2>
          <p className="text-cyan-50 text-sm">Message your assigned Care Team 24/7.</p>
          <div className="mt-6 flex items-center gap-2 text-white font-bold text-sm">Open Chat <ArrowRight className="h-4 w-4" /></div>
        </button>

      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm min-h-[400px]">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
          <Activity className="text-blue-600 h-6 w-6" />
          <h2 className="text-2xl font-bold">My Medical History</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : (!medicalHistory || medicalHistory.length === 0) ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Your medical vault is currently empty.</p>
            <p className="text-sm text-gray-400 mt-1">Past diagnoses and prescriptions will securely appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {medicalHistory.map((record) => (
              <div key={record.id} className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-shadow">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{record.diagnosis}</h3>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                       <User className="h-4 w-4"/> Dr. {record.doctor_name}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 flex items-center gap-2 shadow-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {new Date(record.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{record.symptoms_notes}</p>
                </div>

                {(record.prescriptions || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Pill className="h-3 w-3" /> Medication Log</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {record.prescriptions.map((rx, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex gap-4 relative overflow-hidden">
                          <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase text-white tracking-widest ${rx.status === 'pending' || rx.status === 'partial' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            {rx.status}
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 self-start">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div className="pr-10">
                            <p className="font-bold text-base text-gray-900 dark:text-white mb-1">{rx.medicine_name}</p>
                            <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mb-3">"{rx.instructions}"</p>
                            <div className="flex gap-4 text-[10px] font-bold">
                              <span className="text-gray-500">Max Limit: {rx.total_quantity || 1}</span>
                              <span className="text-emerald-600">Purchased: {rx.purchased_quantity || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(record.attachments || []).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><FileImage className="h-3 w-3" /> Digital Scans & Files</p>
                    <div className="flex flex-wrap gap-3">
                      {record.attachments.map((doc, idx) => (
                        <a key={idx} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-5 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 transition-colors shadow-sm group">
                          <div className="bg-white dark:bg-emerald-900 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><FileText className="h-4 w-4" /></div>
                          <span className="text-sm font-bold">View Document {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} careTeam={myCareTeam} />
    </div>
  );
};

export default PatientDashboard;