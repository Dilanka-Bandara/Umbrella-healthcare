import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Keyboard, ArrowLeft, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

const ConnectDoctor = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('scan');
  const [doctorId, setDoctorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Get the patient's security token
      const token = localStorage.getItem('token');

      // 2. Send the actual connection request to the backend
      const response = await axios.post('http://localhost:5000/api/patients/connect-doctor', 
        { doctor_clinic_id: doctorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. SECURE THE DOCTOR ID: Save the real doctor's UUID so the ChatPopup knows who to talk to!
      localStorage.setItem('connectedDoctorId', response.data.doctor_id);

      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => navigate(`/encounter/${response.data.doctor_id}`), 2000);

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to connect to Doctor. Please check the ID.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-xl mx-auto w-full">
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
          
          {/* SECURE HEADER WITH EMBEDDED BACK BUTTON */}
          <div className="bg-blue-600 p-6 sm:p-8 text-center text-white relative">
            
            {/* The Back Button is now locked to the top-left of this blue box */}
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              Back
            </button>

            <h1 className="text-2xl font-bold mb-2 mt-8 sm:mt-4">Connect to Your Doctor</h1>
            <p className="text-blue-100 text-sm">Scan the QR code on the doctor's desk or enter their clinic ID to share your medical vault securely.</p>
          </div>

          <div className="p-8">
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connected Successfully!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Returning to your dashboard...</p>
              </div>
            ) : (
              <>
                <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
                  <button
                    onClick={() => setActiveMode('scan')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
                      activeMode === 'scan' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <QrCode className="h-4 w-4" /> Scan QR
                  </button>
                  <button
                    onClick={() => setActiveMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
                      activeMode === 'manual' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Keyboard className="h-4 w-4" /> Enter ID
                  </button>
                </div>

                {activeMode === 'scan' && (
                  <div className="flex flex-col items-center animate-in fade-in">
                    <div className="relative w-64 h-64 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-gray-200 dark:border-gray-800 shadow-inner mb-6">
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                      <Camera className="h-12 w-12 text-gray-700" />
                      <p className="absolute bottom-4 text-xs text-gray-500 font-medium">Camera starting...</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Point your phone's camera at the doctor's screen. It will connect automatically.
                    </p>
                  </div>
                )}

                {activeMode === 'manual' && (
                  <form onSubmit={handleConnect} className="animate-in fade-in">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Doctor's Clinic ID
                    </label>
                    <input 
                      type="text" 
                      required
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      placeholder="e.g. DOC-9942" 
                      className="w-full px-5 py-4 text-lg text-center tracking-widest font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white mb-6 uppercase" 
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
                    >
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Connect Now'}
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectDoctor;