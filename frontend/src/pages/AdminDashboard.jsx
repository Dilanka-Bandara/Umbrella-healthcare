import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Activity, Settings, DollarSign, 
  ShieldAlert, CheckCircle, Ban, Loader2, Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState({ total_sales: 0, platform_revenue: 0, commission_percent: 15, doctors: { pending_docs: 0, active_docs: 0, suspended_docs: 0 }});
  const [doctors, setDoctors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Settings State
  const [newCommission, setNewCommission] = useState(15);
  const [isSavingComm, setIsSavingComm] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, docsRes, transRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', config),
        axios.get('http://localhost:5000/api/admin/doctors', config),
        axios.get('http://localhost:5000/api/admin/transactions', config)
      ]);
      
      setStats(statsRes.data);
      setNewCommission(statsRes.data.commission_percent);
      setDoctors(docsRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      console.error("Admin fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleUpdateStatus = async (doctorId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this doctor to ${newStatus}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/admin/doctors/${doctorId}/status`, { status: newStatus }, config);
      fetchData(); // Refresh data
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleSaveCommission = async () => {
    setIsSavingComm(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/admin/settings/commission', { percentage: newCommission }, config);
      alert("Platform Commission Rate Updated Successfully!");
      fetchData();
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setIsSavingComm(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col md:min-h-screen shadow-2xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-indigo-400 mb-1">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-black text-lg tracking-widest uppercase">Admin Ops</span>
          </div>
          <p className="text-xs text-slate-400">Command Center</p>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className="h-5 w-5" /> Overview
          </button>
          <button onClick={() => setActiveTab('doctors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'doctors' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Users className="h-5 w-5" /> Doctor Moderation
            {stats.doctors.pending_docs > 0 && <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.doctors.pending_docs}</span>}
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Activity className="h-5 w-5" /> Sales & Orders
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Settings className="h-5 w-5" /> Commission Engine
          </button>
        </div>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => navigate('/login')} className="text-xs text-slate-500 hover:text-white transition-colors">Sign Out Securely</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Platform Overview</h1>
              <p className="text-gray-500 mt-1">High-level metrics and financial tracking.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><DollarSign className="h-6 w-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Gross Pharmacy Sales</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">${stats.total_sales.toFixed(2)}</h3>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-500/30 text-white">
                <div className="h-12 w-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4"><Activity className="h-6 w-6"/></div>
                <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-1">Net Platform Revenue</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-black">${stats.platform_revenue.toFixed(2)}</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-lg mb-1">@{stats.commission_percent}% Cut</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><CheckCircle className="h-6 w-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Active Doctors</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.doctors.active_docs}</h3>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><ShieldAlert className="h-6 w-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Action Required</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.doctors.pending_docs}</h3>
                  <span className="text-xs font-bold text-amber-600">Pending Approvals</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR MODERATION */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Doctor Compliance</h1>
              <p className="text-gray-500 mt-1">Review credentials and moderate access to the telehealth portal.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 font-bold">Doctor Details</th>
                    <th className="p-4 font-bold">Clinic ID</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white">{doc.full_name}</p>
                        <p className="text-xs text-gray-500">{doc.email} | {doc.phone_number}</p>
                      </td>
                      <td className="p-4 font-mono text-gray-600 dark:text-gray-400">{doc.clinic_id || 'N/A'}</td>
                      <td className="p-4">
                        {doc.status === 'active' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3"/> Active</span>}
                        {doc.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><ShieldAlert className="h-3 w-3"/> Pending Review</span>}
                        {doc.status === 'suspended' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Ban className="h-3 w-3"/> Suspended</span>}
                      </td>
                      <td className="p-4 flex gap-2 justify-end">
                        {doc.status === 'pending' && (
                          // 🚨 NEW: Navigates to the completely separate Review Page securely!
                          <button 
                            onClick={() => navigate('/admin/review', { state: { doctor: doc } })} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5"/> Review Application
                          </button>
                        )}
                        {doc.status === 'active' && (
                          <button onClick={() => handleUpdateStatus(doc.id, 'suspended')} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-colors">Suspend</button>
                        )}
                        {doc.status === 'suspended' && (
                          <button onClick={() => handleUpdateStatus(doc.id, 'active')} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-colors">Restore</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-10 text-gray-500">No doctors registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SALES & TRANSACTIONS */}
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Transaction Ledger</h1>
              <p className="text-gray-500 mt-1">Live monitoring of all e-pharmacy orders.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 font-bold">Order ID</th>
                    <th className="p-4 font-bold">Patient Name</th>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Amount</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {transactions.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-4 font-mono text-xs text-gray-500">#{order.id.split('-')[0]}</td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{order.patient_name}</td>
                      <td className="p-4 text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="p-4 font-black text-indigo-600">${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="p-4">
                         <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{order.status}</span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-10 text-gray-500">No transactions recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: COMMISSION ENGINE */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Commission Engine</h1>
              <p className="text-gray-500 mt-1">Configure automated platform fee deductions.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Settings className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Global Platform Fee</h3>
                  <p className="text-sm text-gray-500">Percentage automatically deducted from all pharmacy sales.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Set Commission Rate (%)</label>
                    <span className="text-2xl font-black text-indigo-600">{newCommission}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="1"
                    value={newCommission}
                    onChange={(e) => setNewCommission(e.target.value)}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold">
                    <span>0% (Free)</span>
                    <span>25%</span>
                    <span>50% (Max)</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                  <p><strong>Impact Simulation:</strong> On a $100.00 pharmacy order, the platform will retain <strong>${(100 * (newCommission / 100)).toFixed(2)}</strong> as revenue.</p>
                </div>

                <button 
                  onClick={handleSaveCommission}
                  disabled={isSavingComm}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isSavingComm ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  {isSavingComm ? 'Applying Changes...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;