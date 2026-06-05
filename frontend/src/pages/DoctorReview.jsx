import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Ban, FileText, FileImage, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';

const DoctorReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Securely retrieve the doctor data passed from the Admin Dashboard
  const { doctor } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);

  // If someone navigates to this URL directly without selecting a doctor, send them back
  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <ShieldAlert className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Application Selected</h2>
        <button onClick={() => navigate('/admin')} className="text-indigo-600 font-bold hover:underline">Return to Admin Dashboard</button>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus) => {
    const confirmMessage = newStatus === 'active' 
      ? 'Are you sure you want to APPROVE this doctor and grant them access to the platform?' 
      : 'Are you sure you want to REJECT this application?';
      
    if (!window.confirm(confirmMessage)) return;
    
    setIsProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/admin/doctors/${doctor.id}/status`, { status: newStatus }, config);
      alert(`Success! Doctor application has been ${newStatus === 'active' ? 'approved' : 'rejected'}.`);
      navigate('/admin'); // Return to command center
    } catch (error) {
      alert("Failed to update status. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/admin')} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors shadow-sm text-gray-500">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Review Credentialing Application</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Verify identity and medical license before granting platform access.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          
          {/* Left Column: Doctor Profile Info & Actions */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
              <div className="h-24 w-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 border-4 border-indigo-100 shadow-inner">
                <UserCheck className="h-12 w-12"/>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{doctor.full_name}</h2>
              <p className="text-sm text-gray-500 font-mono mb-8">Applicant ID: #{doctor.id.split('-')[0]}</p>
              
              <div className="space-y-5">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-bold text-gray-900 dark:text-white">{doctor.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-bold text-gray-900 dark:text-white">{doctor.phone_number}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinic Identification</p>
                  <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{doctor.clinic_id || 'Not Provided'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submission Date</p>
                  <p className="font-bold text-gray-900 dark:text-white">{new Date(doctor.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Final Decision</p>
              
              <button 
                onClick={() => handleUpdateStatus('active')} 
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                Approve & Grant Access
              </button>
              
              <button 
                onClick={() => handleUpdateStatus('suspended')} 
                disabled={isProcessing}
                className="w-full bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />}
                Reject Application
              </button>
            </div>
          </div>

          {/* Right Column: Secure Document Viewer */}
          <div className="w-full lg:w-2/3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[600px]">
            
            <div className="bg-slate-900 p-5 border-b border-slate-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-400" />
                <span className="font-bold text-sm uppercase tracking-widest">Medical License / Certificate</span>
              </div>
              <span className="text-[10px] font-bold tracking-widest bg-slate-800 border border-slate-700 px-3 py-1.5 rounded text-emerald-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> SECURE VIEWER
              </span>
            </div>
            
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
              {doctor.medical_license_url ? (
                <div className="w-full h-full max-h-[800px] border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner bg-white">
                  {doctor.medical_license_url.endsWith('.pdf') ? (
                    <iframe src={doctor.medical_license_url} className="w-full h-full min-h-[600px]" title="Medical License" />
                  ) : (
                    <img src={doctor.medical_license_url} alt="Medical License" className="w-full h-full object-contain p-2" />
                  )}
                </div>
              ) : (
                <div className="text-center max-w-sm bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                  <FileImage className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Document Provided</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">This applicant did not upload a medical license or board certification during the registration process.</p>
                  <p className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    ⚠ Proceed with extreme caution. Verification of external credentials is required before approval.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorReview;