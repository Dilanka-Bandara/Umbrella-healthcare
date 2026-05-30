import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, QrCode, ClipboardList, Search, User, ArrowRight, MessageCircle, Video } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : { full_name: "Doctor" };
  const clinicId = currentUser.clinic_id || "DOC-8392";

  useEffect(() => {
    // In the future, this will be an axios.get() to your database
    const mockPatients = [
      { id: 1, full_name: "John Doe", connected_on: "2026-05-28", status: "Active" }
    ];
    setPatients(mockPatients);
    setIsLoading(false);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Top Welcome & ID Banner */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 md:p-8 text-white shadow-md">
          <h1 className="text-3xl font-bold mb-2">Dr. {currentUser.full_name}</h1>
          <p className="text-emerald-50 max-w-xl">Welcome to your digital clinic. Manage your patients, write prescriptions, and handle telehealth appointments here.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-6 min-w-[300px]">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
            <QrCode className="h-10 w-10" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">Your Clinic ID</p>
            <h2 className="text-2xl font-black tracking-widest uppercase font-mono">{clinicId}</h2>
            <p className="text-xs text-gray-400 mt-1">Patients use this to connect.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Virtual Waiting Room */}
          <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Video className="text-emerald-600 h-5 w-5 animate-pulse" /> Virtual Waiting Room
            </h2>
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                </div>
                <div>
                  <p className="font-bold text-sm">Jane Smith <span className="text-xs font-normal text-gray-500 ml-2">Waiting for 4 mins</span></p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Ready for Video Consultation</p>
                </div>
              </div>
              
              {/* WIRED UP: Takes Doctor to the Encounter Room */}
              <button 
                onClick={() => navigate('/encounter/2')} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                Join Call
              </button>
            </div>
          </div>

          {/* Patient Roster */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-emerald-600 h-5 w-5" /> My Patient Roster
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search EHR charts..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64" />
              </div>
            </div>

            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{patient.full_name}</h3>
                      <p className="text-xs text-gray-500">Connected on {patient.connected_on}</p>
                    </div>
                  </div>
                  
                  {/* WIRED UP: Takes Doctor to the Clinical Workspace for this specific patient */}
                  <button 
                    onClick={() => navigate(`/encounter/${patient.id}`)}
                    className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Open Patient Chart <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Quick Stats & Actions */}
        <div className="space-y-6">
          
          {/* Message Hub Button */}
          <button onClick={() => navigate('/message-hub')} className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all group">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6" />
              <div className="text-left">
                <p className="font-bold">Message Hub</p>
                <p className="text-xs text-blue-100">Respond to patient queries</p>
              </div>
            </div>
            <div className="bg-red-500 text-white font-black text-xs h-6 w-6 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform shadow-md">
              5
            </div>
          </button>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Daily Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Appointments</span>
                </div>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">3</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <ClipboardList className="h-5 w-5" />
                  <span className="font-semibold">Prescriptions</span>
                </div>
                <span className="text-xl font-black text-gray-700 dark:text-gray-300">0</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;