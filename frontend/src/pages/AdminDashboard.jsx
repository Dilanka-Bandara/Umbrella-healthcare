import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Search, CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('token');

  // Fetch pending doctors on load
  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/pending-doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDoctors(response.data);
    } catch (error) {
      console.error("Error fetching pending doctors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to approve Dr. ${doctorName} for medical practice on this platform?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/approve-doctor/${doctorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove them from the UI list instantly
      setPendingDoctors(pendingDoctors.filter(doc => doc.id !== doctorId));
      alert(`Dr. ${doctorName} has been officially approved and granted a Clinic ID.`);
    } catch (error) {
      console.error("Error approving doctor:", error);
      alert("Failed to approve doctor.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Admin Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-indigo-400" />
              <h1 className="text-3xl font-black tracking-tight">System Administration</h1>
            </div>
            <p className="text-slate-400 font-medium">Verify medical credentials and manage platform access.</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-300">Security Clearance Level</p>
            <p className="text-indigo-400 font-mono font-bold">ROOT / ADMIN</p>
          </div>
        </div>

        {/* Action Board */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> 
              Pending Medical Approvals ({pendingDoctors.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search applicants..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <p className="text-center text-slate-500 py-10">Loading applicants...</p>
            ) : pendingDoctors.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
                <p className="text-slate-500">There are no pending doctor registrations at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="pb-4 font-bold">Applicant Name</th>
                      <th className="pb-4 font-bold">Contact Email</th>
                      <th className="pb-4 font-bold">Applied On</th>
                      <th className="pb-4 font-bold">Credentials</th>
                      <th className="pb-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                              {doc.full_name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">Dr. {doc.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-300">{doc.email}</td>
                        <td className="py-4 text-sm text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                            <FileText className="h-4 w-4" /> View License
                          </button>
                        </td>
                        <td className="py-4 flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Reject Application">
                            <XCircle className="h-6 w-6" />
                          </button>
                          <button 
                            onClick={() => handleApprove(doc.id, doc.full_name)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                          >
                            <CheckCircle className="h-4 w-4" /> Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;