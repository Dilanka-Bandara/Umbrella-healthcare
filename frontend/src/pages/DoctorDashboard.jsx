import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// 🚨 BUG FIX 1: Added CheckCircle and MessageCircle to the imports!
import { Users, Calendar, QrCode, ClipboardList, Search, User, ArrowRight, Video, Loader2, Database, Upload, FileText, X, History, CheckCircle, MessageCircle } from 'lucide-react';
import axios from 'axios';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'database'
  const [livePatients, setLivePatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Vault Modal States ---
  const [selectedVaultPatient, setSelectedVaultPatient] = useState(null);
  const [vaultHistory, setVaultHistory] = useState([]);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const clinicId = currentUser?.clinic_id || "PENDING";

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Fetch Live Queue
      const liveRes = await axios.get('http://localhost:5000/api/doctors/my-patients', config);
      setLivePatients(liveRes.data);
      // Fetch All Patients (Database)
      const allRes = await axios.get('http://localhost:5000/api/doctors/all-patients', config);
      setAllPatients(allRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && token) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Auto-refresh live queue
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, token]);

  // --- Open Patient Vault ---
  const openVault = async (patient) => {
    setSelectedVaultPatient(patient);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Get History
      const histRes = await axios.get(`http://localhost:5000/api/consultations/history/${patient.id}`, config);
      setVaultHistory(histRes.data);
      // Get Documents
      const docRes = await axios.get(`http://localhost:5000/api/doctors/patient/${patient.id}/documents`, config);
      setVaultDocuments(docRes.data);
    } catch (error) {
      console.error("Error opening vault:", error);
    }
  };

  // --- Cloudinary Document Upload ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedVaultPatient) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file); 

    try {
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      
      const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, config);
      const fileUrl = uploadRes.data.file_url;

      await axios.post(`http://localhost:5000/api/doctors/patient/${selectedVaultPatient.id}/document`, {
        file_url: fileUrl,
        file_name: file.name
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert("Document uploaded securely to patient vault!");
      openVault(selectedVaultPatient); 
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) return null;

  // Added optional chaining (?.) just in case a user doesn't have a name yet
  const filteredDatabase = allPatients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
      
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 md:p-8 text-white shadow-md">
          <h1 className="text-3xl font-bold mb-2">Dr. {currentUser.full_name}</h1>
          <p className="text-emerald-50 max-w-xl">Manage your active sessions and securely access full patient medical histories.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-6 min-w-[300px]">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
            <QrCode className="h-10 w-10" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">Clinic ID</p>
            <h2 className="text-2xl font-black tracking-widest uppercase font-mono">{clinicId}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB NAVIGATION */}
          <div className="flex gap-4 mb-2">
            <button 
              onClick={() => setActiveTab('queue')} 
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'queue' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'}`}
            >
              <Video className="h-5 w-5" /> Live Session Queue
            </button>
            <button 
              onClick={() => setActiveTab('database')} 
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'database' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'}`}
            >
              <Database className="h-5 w-5" /> Patient Database (EHR)
            </button>
          </div>

          {/* TAB 1: LIVE QUEUE */}
          {activeTab === 'queue' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Users className="text-emerald-600 h-5 w-5" /> Patients Waiting
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
              ) : livePatients.length > 0 ? (
                <div className="space-y-4">
                  {livePatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                        </div>
                        <div>
                          <p className="font-bold text-lg">{patient.full_name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Ready for Live Consultation</p>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/encounter/${patient.id}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                        Start Session <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Queue is empty. You are all caught up!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PATIENT DATABASE */}
          {activeTab === 'database' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Database className="text-blue-600 h-5 w-5" /> Master Patient Index
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search records..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" />
                </div>
              </div>

              <div className="space-y-3">
                {filteredDatabase.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{patient.full_name}</h3>
                        <p className="text-xs text-gray-500">{patient.email} | {patient.phone_number}</p>
                      </div>
                    </div>
                    <button onClick={() => openVault(patient)} className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                      Open EHR Vault
                    </button>
                  </div>
                ))}
                {filteredDatabase.length === 0 && <p className="text-center text-gray-500 py-10">No patients found in database.</p>}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          
          {/* 🚨 BUG FIX 2: Restored the Message Hub Chat Button! */}
          <button onClick={() => navigate('/message-hub')} className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all group">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6" />
              <div className="text-left">
                <p className="font-bold">Message Hub</p>
                <p className="text-xs text-blue-100">Respond to patient queries</p>
              </div>
            </div>
            <div className="bg-red-500 text-white font-black text-xs h-6 w-6 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform shadow-md">
              !
            </div>
          </button>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Practice Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <Video className="h-5 w-5" />
                  <span className="font-semibold">Active in Queue</span>
                </div>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{livePatients.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <Database className="h-5 w-5" />
                  <span className="font-semibold">Total Patients</span>
                </div>
                <span className="text-xl font-black text-blue-700 dark:text-blue-400">{allPatients.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THE PATIENT VAULT MODAL (History & Cloud Uploads) */}
      {selectedVaultPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                  <User className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Patient Vault: {selectedVaultPatient.full_name}</h2>
                  <p className="text-slate-400 text-sm font-mono mt-1">ID: #{selectedVaultPatient.id.split('-')[0]}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVaultPatient(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-950">
              
              {/* Left: Consultation History */}
              <div className="flex-1 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <History className="h-5 w-5 text-blue-500" /> Consultation History
                </h3>
                {vaultHistory.length === 0 ? (
                  <p className="text-slate-500 text-sm bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">No past consultations found.</p>
                ) : (
                  vaultHistory.map(record => (
                    <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <span className="font-bold text-slate-900 dark:text-white">{new Date(record.created_at).toLocaleDateString()}</span>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Dr. {record.doctor_name}</span>
                      </div>
                      <p className="text-sm mb-2"><span className="font-bold text-slate-500">Diagnosis:</span> {record.diagnosis}</p>
                      <p className="text-sm"><span className="font-bold text-slate-500">Notes:</span> {record.symptoms_notes}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Right: Cloud Documents */}
              <div className="w-full md:w-1/3 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <FileText className="h-5 w-5 text-emerald-500" /> Scans & Documents
                </h3>
                
                {/* CLOUDINARY UPLOAD BUTTON */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={isUploading}
                  className="w-full border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-6 rounded-2xl flex flex-col items-center justify-center transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-8 w-8 animate-spin mb-2" /> : <Upload className="h-8 w-8 mb-2" />}
                  <span className="font-bold text-sm">{isUploading ? 'Uploading to Cloud...' : 'Upload New Document'}</span>
                  <span className="text-xs opacity-70 mt-1">Supports X-Rays, PDFs, Lab Results</span>
                </button>

                <div className="space-y-2 mt-4">
                  {vaultDocuments.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center">No documents in vault.</p>
                  ) : (
                    vaultDocuments.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:border-emerald-400 transition-colors group">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;