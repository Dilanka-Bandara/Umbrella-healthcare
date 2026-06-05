import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Users, Activity, Settings, DollarSign, ShieldAlert,
  CheckCircle, Ban, Loader2, Eye, Pill, ScrollText, UserCog, Search,
  TrendingUp, ShoppingCart, Stethoscope, MessageSquare, FileSignature,
  RefreshCw, AlertTriangle, X, Percent, ChevronLeft, ChevronRight,
  UserPlus, FileText, ExternalLink, Files, Clock, Mail, Phone, Hash,
  UserCheck,
} from 'lucide-react';

const API = 'http://localhost:5000/api/admin';
const VERIFY_API = 'http://localhost:5000/api/verification';

const AdminDashboardInner = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data ---
  const [stats, setStats] = useState({
    total_sales: 0, platform_revenue: 0, commission_percent: 15,
    total_orders: 0, average_order_value: 0, total_patients: 0,
    doctors: { pending_docs: 0, active_docs: 0, suspended_docs: 0 },
  });
  const [trend, setTrend] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  // --- Doctor approvals (newly registered, pending verification) ---
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [verifyCounts, setVerifyCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [approvalsTarget, setApprovalsTarget] = useState(null); // doctor being viewed in modal
  const [approvalsDocs, setApprovalsDocs] = useState([]);
  const [activeDocUrl, setActiveDocUrl] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  // --- Settings state ---
  const [newCommission, setNewCommission] = useState(15);
  const [isSavingComm, setIsSavingComm] = useState(false);

  // --- Filters ---
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [docSearch, setDocSearch] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [userRole, setUserRole] = useState('all');

  // --- Suspension modal ---
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const config = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchData = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setIsLoading(true);
      const [statsRes, trendRes, docsRes, transRes, medsRes, usersRes, auditRes, queueRes] =
        await Promise.all([
          axios.get(`${API}/stats`, config),
          axios.get(`${API}/revenue-trend`, config),
          axios.get(`${API}/doctors`, config),
          axios.get(`${API}/transactions`, config),
          axios.get(`${API}/medicines`, config),
          axios.get(`${API}/users`, config),
          axios.get(`${API}/audit-log`, config),
          axios.get(`${VERIFY_API}/queue?filter=pending`, config),
        ]);
      setStats(statsRes.data);
      setNewCommission(statsRes.data.commission_percent);
      setTrend(trendRes.data);
      setDoctors(docsRes.data);
      setTransactions(transRes.data);
      setMedicines(medsRes.data);
      setUsers(usersRes.data);
      setAuditLog(auditRes.data);
      setPendingDoctors(queueRes.data.doctors || []);
      setVerifyCounts(queueRes.data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Admin fetch error', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert('Admin access required. Please sign in as an administrator.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- Doctor moderation actions ---
  const handleRestore = async (doctorId) => {
    if (!window.confirm('Restore this doctor to full active access?')) return;
    await axios.put(`${API}/doctors/${doctorId}/status`, { status: 'active' }, config);
    fetchData(true);
  };

  const openSuspend = (doctor) => {
    setSuspendTarget(doctor);
    setSuspendReason('');
  };

  const confirmSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason — this is recorded for the investigation audit trail.');
      return;
    }
    await axios.put(
      `${API}/doctors/${suspendTarget.id}/status`,
      { status: 'suspended', reason: suspendReason.trim() },
      config
    );
    setSuspendTarget(null);
    fetchData(true);
  };

  const togglePermission = async (doctorId, permission, value) => {
    await axios.put(
      `${API}/doctors/${doctorId}/permission`,
      { permission, value },
      config
    );
    fetchData(true);
  };

  // --- Doctor approval (verification) actions ---
  const openApplicant = async (doctor) => {
    setApprovalsTarget(doctor);
    setRejectMode(false);
    setRejectReason('');
    setApprovalsDocs([]);
    setActiveDocUrl(null);
    try {
      const { data } = await axios.get(`${VERIFY_API}/${doctor.id}`, config);
      const safe = data && typeof data === 'object' ? data : {};
      const docs = [];
      if (safe.medical_license_url) {
        docs.push({
          id: 'primary',
          doc_type: 'Medical License (registration)',
          file_url: safe.medical_license_url,
        });
      }
      if (Array.isArray(safe.documents)) {
        safe.documents.forEach((d) => {
          if (d && d.file_url) docs.push(d);
        });
      }
      setApprovalsDocs(docs);
      setActiveDocUrl(docs.length > 0 ? docs[0].file_url : null);
      setApprovalsTarget({ ...doctor, ...safe });
    } catch (e) {
      console.error('Failed to load applicant docs', e);
      // Fall back to the basic doctor object — still allow a decision,
      // and surface its registration license if present.
      const fallbackDocs = doctor.medical_license_url
        ? [{ id: 'primary', doc_type: 'Medical License (registration)', file_url: doctor.medical_license_url }]
        : [];
      setApprovalsDocs(fallbackDocs);
      setActiveDocUrl(fallbackDocs[0]?.file_url || null);
    }
  };

  const decideApplicant = async (decision, notes) => {
    setDecisionLoading(true);
    try {
      await axios.put(`${VERIFY_API}/${approvalsTarget.id}/decision`, { decision, notes }, config);
      setApprovalsTarget(null);
      fetchData(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to record decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleApprove = () => {
    if (window.confirm(`Approve ${approvalsTarget.full_name} and grant platform access?`)) {
      decideApplicant('approve', '');
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please give a reason — the applicant and audit log will see this.');
      return;
    }
    decideApplicant('reject', rejectReason.trim());
  };

  // --- Commission actions ---
  const handleSaveCommission = async () => {
    setIsSavingComm(true);
    try {
      await axios.post(`${API}/settings/commission`, { percentage: newCommission }, config);
      alert('Platform commission rate updated successfully!');
      fetchData(true);
    } catch {
      alert('Failed to save settings.');
    } finally {
      setIsSavingComm(false);
    }
  };

  const saveMedicineCommission = async (id, value) => {
    try {
      await axios.put(`${API}/medicines/${id}/commission`, { commission_percent: value }, config);
      fetchData(true);
    } catch {
      alert('Failed to update medicine commission.');
    }
  };

  // --- Derived / filtered lists ---
  const filteredDoctors = doctors.filter((d) => {
    const matchSearch =
      d.full_name?.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.email?.toLowerCase().includes(docSearch.toLowerCase());
    const matchFilter = docFilter === 'all' || d.status === docFilter;
    return matchSearch && matchFilter;
  });

  const filteredTx = transactions.filter((t) => {
    const matchSearch = t.patient_name?.toLowerCase().includes(txSearch.toLowerCase());
    const matchStatus = txStatus === 'all' || t.status === txStatus;
    return matchSearch && matchStatus;
  });

  const filteredUsers = users.filter((u) => userRole === 'all' || u.role === userRole);

  const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading command center…</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Doctor Approvals', icon: UserPlus, badge: verifyCounts.pending },
    { id: 'doctors', label: 'Doctor Compliance', icon: Users },
    { id: 'sales', label: 'Sales & Transactions', icon: Activity },
    { id: 'fees', label: 'Fee & Commission', icon: Percent },
    { id: 'users', label: 'User Directory', icon: UserCog },
    { id: 'audit', label: 'Audit Log', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row font-sans">

      {/* ================= SIDEBAR ================= */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col md:min-h-screen shadow-2xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-indigo-400 mb-1">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-black text-lg tracking-widest uppercase">Admin Ops</span>
          </div>
          <p className="text-xs text-slate-400">Umbrella Healthcare Command Center</p>
        </div>

        <div className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" /> {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={() => fetchData(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full text-xs text-slate-500 hover:text-white transition-colors"
          >
            Sign Out Securely
          </button>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">

        {/* ---------- OVERVIEW ---------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Platform Overview</h1>
              <p className="text-gray-500 mt-1">Real-time financial and operational metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon={DollarSign} color="indigo" label="Gross Pharmacy Sales" value={money(stats.total_sales)} />
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-500/30 text-white">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><TrendingUp className="h-6 w-6" /></div>
                <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-1">Net Platform Revenue</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-black">{money(stats.platform_revenue)}</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-lg mb-1">@{stats.commission_percent}%</span>
                </div>
              </div>
              <KpiCard icon={ShoppingCart} color="blue" label="Total Orders" value={stats.total_orders}
                sub={`Avg ${money(stats.average_order_value)} / order`} />
              <KpiCard icon={CheckCircle} color="emerald" label="Active Doctors" value={stats.doctors.active_docs}
                sub={`${stats.total_patients} patients registered`} />
            </div>

            {/* Action required + suspended */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><ShieldAlert className="h-6 w-6" /></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Approvals</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.doctors.pending_docs}</h3>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-red-400" />
                <div className="h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4"><Ban className="h-6 w-6" /></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Suspended Doctors</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.doctors.suspended_docs}</h3>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Users className="h-6 w-6" /></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Patients</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.total_patients}</h3>
              </div>
            </div>

            {/* Revenue trend chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
                  <p className="text-sm text-gray-500">Gross sales over the last 30 days</p>
                </div>
                <TrendingUp className="h-5 w-5 text-indigo-500" />
              </div>
              <TrendChart data={trend} />
            </div>
          </div>
        )}

        {/* ---------- DOCTOR APPROVALS (newly registered) ---------- */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Doctor Approvals</h1>
              <p className="text-gray-500 mt-1">
                Newly registered doctors awaiting verification. Review their documents, then approve or reject.
              </p>
            </div>

            {/* Mini stat strip */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div className="bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-amber-600">{verifyCounts.pending}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-black text-emerald-600">{verifyCounts.approved}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-black text-red-600">{verifyCounts.rejected}</p>
              </div>
            </div>

            {/* Pending applicant cards */}
            <div className="space-y-4">
              {pendingDoctors.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{doc.full_name}</p>
                      <p className="text-xs text-gray-500">{doc.email} · {doc.phone_number || 'no phone'}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-gray-400">
                          Registered {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          doc.medical_license_url || Number(doc.extra_doc_count) > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <FileText className="h-3 w-3" />
                          {(doc.medical_license_url ? 1 : 0) + Number(doc.extra_doc_count || 0)} document(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => openApplicant(doc)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 justify-center">
                    <Eye className="h-4 w-4" /> Review & Decide
                  </button>
                </div>
              ))}
              {pendingDoctors.length === 0 && (
                <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No pending registrations. All caught up!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- DOCTOR MODERATION ---------- */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Doctor Compliance</h1>
              <p className="text-gray-500 mt-1">Review credentials, moderate access, and control granular permissions.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search doctor name or email…"
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={docFilter} onChange={(e) => setDocFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none cursor-pointer">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{doc.full_name}</p>
                        <p className="text-xs text-gray-500">{doc.email} · {doc.phone_number}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">Clinic: {doc.clinic_id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={doc.status} />
                      {doc.status === 'pending' && (
                        <button onClick={() => navigate('/admin/review', { state: { doctor: doc } })}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                      )}
                      {doc.status === 'active' && (
                        <button onClick={() => openSuspend(doc)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs">
                          Disable Access
                        </button>
                      )}
                      {doc.status === 'suspended' && (
                        <button onClick={() => handleRestore(doc.id)}
                          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs">
                          Re-enable
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Suspension reason banner */}
                  {doc.status === 'suspended' && doc.suspension_reason && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-red-700 dark:text-red-400">Temporarily disabled: </span>
                        <span className="text-red-600 dark:text-red-300">{doc.suspension_reason}</span>
                        {doc.suspended_at && (
                          <span className="text-red-400 block mt-0.5">Since {new Date(doc.suspended_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Granular permission toggles */}
                  {doc.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <PermissionToggle label="Consultations" icon={Stethoscope}
                        enabled={doc.can_consult} disabled={doc.status === 'suspended'}
                        onToggle={(v) => togglePermission(doc.id, 'consult', v)} />
                      <PermissionToggle label="Prescribing" icon={FileSignature}
                        enabled={doc.can_prescribe} disabled={doc.status === 'suspended'}
                        onToggle={(v) => togglePermission(doc.id, 'prescribe', v)} />
                      <PermissionToggle label="Messaging" icon={MessageSquare}
                        enabled={doc.can_message} disabled={doc.status === 'suspended'}
                        onToggle={(v) => togglePermission(doc.id, 'message', v)} />
                    </div>
                  )}
                </div>
              ))}
              {filteredDoctors.length === 0 && (
                <div className="text-center p-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  No doctors match your filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- SALES & TRANSACTIONS ---------- */}
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Transaction Ledger</h1>
              <p className="text-gray-500 mt-1">Monitor every order and the platform's cut in real time.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input value={txSearch} onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search by patient name…"
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={txStatus} onChange={(e) => setTxStatus(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none cursor-pointer">
                <option value="all">All statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 font-bold">Order</th>
                    <th className="p-4 font-bold">Patient</th>
                    <th className="p-4 font-bold">Items</th>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Amount</th>
                    <th className="p-4 font-bold">Platform Cut</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {filteredTx.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-4 font-mono text-xs text-gray-500">#{String(o.id).split('-')[0]}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white">{o.patient_name}</p>
                        <p className="text-[11px] text-gray-400">{o.patient_email}</p>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{o.item_count}</td>
                      <td className="p-4 text-gray-500">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="p-4 font-black text-gray-900 dark:text-white">{money(o.total_amount)}</td>
                      <td className="p-4 font-black text-emerald-600">{money(o.platform_cut)}</td>
                      <td className="p-4"><StatusBadge status={o.status} small /></td>
                    </tr>
                  ))}
                  {filteredTx.length === 0 && (
                    <tr><td colSpan="7" className="text-center p-10 text-gray-500">No transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------- FEE & COMMISSION ---------- */}
        {activeTab === 'fees' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Fee & Commission Engine</h1>
              <p className="text-gray-500 mt-1">Decide how much the platform earns — globally and per medicine.</p>
            </div>

            {/* Global rate */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Percent className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Global Platform Fee</h3>
                  <p className="text-sm text-gray-500">Default commission deducted from every pharmacy sale.</p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Commission Rate</label>
                <span className="text-2xl font-black text-indigo-600">{newCommission}%</span>
              </div>
              <input type="range" min="0" max="50" step="1" value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold">
                <span>0%</span><span>25%</span><span>50%</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mt-6">
                On a $100.00 order, the platform retains <strong>${(100 * (newCommission / 100)).toFixed(2)}</strong>.
              </div>
              <button onClick={handleSaveCommission} disabled={isSavingComm}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                {isSavingComm ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {isSavingComm ? 'Applying…' : 'Save Global Rate'}
              </button>
            </div>

            {/* Per-medicine commission */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Per-Medicine Commission</h3>
              <p className="text-sm text-gray-500 mb-4">Override the global rate for individual products. Leave blank to use the global {stats.commission_percent}%.</p>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                      <th className="p-4 font-bold">Medicine</th>
                      <th className="p-4 font-bold">Price</th>
                      <th className="p-4 font-bold">Units Sold</th>
                      <th className="p-4 font-bold">Platform Earned</th>
                      <th className="p-4 font-bold">Commission %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                    {medicines.map((m) => (
                      <MedicineRow key={m.id} m={m} globalRate={stats.commission_percent}
                        money={money} onSave={saveMedicineCommission} />
                    ))}
                    {medicines.length === 0 && (
                      <tr><td colSpan="5" className="text-center p-10 text-gray-500">No medicines in catalog.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------- USER DIRECTORY ---------- */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Directory</h1>
              <p className="text-gray-500 mt-1">Everyone registered on the platform.</p>
            </div>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none cursor-pointer">
              <option value="all">All roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 font-bold">Name</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{u.full_name}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4"><RoleBadge role={u.role} /></td>
                      <td className="p-4"><StatusBadge status={u.status} small /></td>
                      <td className="p-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-10 text-gray-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------- AUDIT LOG ---------- */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Audit Log</h1>
              <p className="text-gray-500 mt-1">Immutable record of every administrative action.</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
              {auditLog.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4">
                  <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <ScrollText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                      {log.target_type && <span className="text-gray-400 font-normal"> · {log.target_type}</span>}
                    </p>
                    {log.details && <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                      by {log.admin_name} · {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {auditLog.length === 0 && (
                <div className="text-center p-12 text-gray-500">No actions logged yet.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ============ DOCTOR APPROVAL REVIEW MODAL ============ */}
      {approvalsTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                  <UserCheck className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{approvalsTarget.full_name}</h2>
                  <p className="text-slate-400 text-xs font-mono">Applicant #{String(approvalsTarget.id).split('-')[0]}</p>
                </div>
              </div>
              <button onClick={() => setApprovalsTarget(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">

              {/* Left: details + decision */}
              <div className="w-full lg:w-[340px] p-6 border-r border-gray-100 dark:border-gray-800 shrink-0 space-y-4">
                <ApplicantInfo icon={Mail} label="Email" value={approvalsTarget.email} />
                <ApplicantInfo icon={Phone} label="Phone" value={approvalsTarget.phone_number || '—'} />
                <ApplicantInfo icon={Hash} label="Clinic ID" value={approvalsTarget.clinic_id || 'Not provided'} mono />
                <ApplicantInfo icon={Clock} label="Registered"
                  value={approvalsTarget.created_at ? new Date(approvalsTarget.created_at).toLocaleString() : '—'} />

                {approvalsDocs.length === 0 && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold p-3 rounded-xl text-center">
                    ⚠ No documents uploaded. Verify credentials externally before approving.
                  </div>
                )}

                {!rejectMode ? (
                  <div className="space-y-3 pt-2">
                    <button onClick={handleApprove} disabled={decisionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
                      {decisionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                      Approve & Grant Access
                    </button>
                    <button onClick={() => setRejectMode(true)} disabled={decisionLoading}
                      className="w-full bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/50 hover:bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                      <Ban className="h-5 w-5" /> Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Reason for rejection</label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                      placeholder="e.g. License document is unreadable. Please re-upload a clear copy."
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
                    <div className="flex gap-2">
                      <button onClick={() => setRejectMode(false)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                        Back
                      </button>
                      <button onClick={handleReject} disabled={decisionLoading}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 text-sm flex items-center justify-center gap-1">
                        {decisionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: document viewer */}
              <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 min-h-[420px]">
                {approvalsDocs.length > 0 && (
                  <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto bg-white dark:bg-gray-900">
                    {approvalsDocs.map((d) => (
                      <button key={d.id} onClick={() => setActiveDocUrl(d.file_url)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          activeDocUrl === d.file_url
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}>
                        <FileText className="h-3.5 w-3.5" /> {d.doc_type}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 p-5 flex items-center justify-center">
                  {activeDocUrl ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 max-h-[600px] border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner bg-white">
                        {String(activeDocUrl).toLowerCase().split('?')[0].endsWith('.pdf') ? (
                          <iframe src={activeDocUrl} className="w-full h-full min-h-[440px]" title="Credential" />
                        ) : (
                          <img src={activeDocUrl} alt="Credential" className="w-full h-full object-contain p-2" />
                        )}
                      </div>
                      <a href={activeDocUrl} target="_blank" rel="noreferrer"
                        className="mt-3 self-center text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" /> Open full size
                      </a>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Files className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No documents to preview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ SUSPENSION MODAL ============ */}
      {suspendTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Ban className="h-6 w-6" />
                <h2 className="text-lg font-bold">Temporarily Disable Doctor</h2>
              </div>
              <button onClick={() => setSuspendTarget(null)} className="p-1.5 bg-red-700 hover:bg-red-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This immediately revokes <strong>{suspendTarget.full_name}</strong>'s ability to consult,
                prescribe, and message while an investigation is ongoing. Access can be restored at any time.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason (recorded for audit)</label>
                <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3} placeholder="e.g. Under review following patient complaint #4821"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSuspendTarget(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button onClick={confirmSuspend}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30">
                  Disable Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== SMALL PRESENTATIONAL COMPONENTS ===================== */

const ApplicantInfo = ({ icon: Icon, label, value, mono }) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
      <Icon className="h-3 w-3" /> {label}
    </p>
    <p className={`font-bold text-gray-900 dark:text-white text-sm ${mono ? 'font-mono text-indigo-600 dark:text-indigo-400' : ''}`}>
      {value}
    </p>
  </div>
);

const KpiCard = ({ icon: Icon, color, label, value, sub }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div className={`h-12 w-12 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

const StatusBadge = ({ status, small }) => {
  const cfg = {
    active: { c: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Active' },
    pending: { c: 'bg-amber-100 text-amber-700', icon: ShieldAlert, label: 'Pending' },
    suspended: { c: 'bg-red-100 text-red-700', icon: Ban, label: 'Suspended' },
    processing: { c: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'Processing' },
    shipped: { c: 'bg-indigo-100 text-indigo-700', icon: ShoppingCart, label: 'Shipped' },
    delivered: { c: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Delivered' },
    cancelled: { c: 'bg-gray-100 text-gray-600', icon: X, label: 'Cancelled' },
  };
  const s = cfg[status] || { c: 'bg-gray-100 text-gray-600', icon: Activity, label: status || 'Unknown' };
  const Icon = s.icon;
  return (
    <span className={`${s.c} ${small ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1'} rounded-full font-bold flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const cfg = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-emerald-100 text-emerald-700',
    patient: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`${cfg[role] || 'bg-gray-100 text-gray-600'} text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide`}>
      {role}
    </span>
  );
};

const PermissionToggle = ({ label, icon: Icon, enabled, disabled, onToggle }) => (
  <button
    onClick={() => !disabled && onToggle(!enabled)}
    disabled={disabled}
    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
      disabled
        ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
        : enabled
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}
  >
    <span className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
      <Icon className="h-4 w-4" /> {label}
    </span>
    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'}`} />
    </span>
  </button>
);

const MedicineRow = ({ m, globalRate, money, onSave }) => {
  const [value, setValue] = useState(m.is_custom_commission ? m.effective_commission : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(m.id, value === '' ? null : value);
    setSaving(false);
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><Pill className="h-4 w-4" /></div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
            <p className="text-[11px] text-gray-400">{m.type}</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-gray-600 dark:text-gray-400">{money(m.price)}</td>
      <td className="p-4 text-gray-600 dark:text-gray-400">{m.units_sold}</td>
      <td className="p-4 font-black text-emerald-600">{money(m.platform_earned)}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input type="number" min="0" max="100" value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`${globalRate}`}
              className="w-20 pl-2 pr-6 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="absolute right-2 top-1.5 text-gray-400 text-sm">%</span>
          </div>
          <button onClick={save} disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Set'}
          </button>
          {!m.is_custom_commission && <span className="text-[10px] text-gray-400">global</span>}
        </div>
      </td>
    </tr>
  );
};

/* Lightweight dependency-free SVG line/area chart for the 30-day trend */
const TrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No sales data in the last 30 days.</div>;
  }
  const W = 800, H = 200, P = 24;
  const max = Math.max(...data.map((d) => d.gross), 1);
  const stepX = data.length > 1 ? (W - P * 2) / (data.length - 1) : 0;
  const x = (i) => P + i * stepX;
  const y = (v) => H - P - (v / max) * (H - P * 2);
  const line = data.map((d, i) => `${x(i)},${y(d.gross)}`).join(' ');
  const area = `${P},${H - P} ${line} ${x(data.length - 1)},${H - P}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 min-w-[600px]">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={P} x2={W - P} y1={y(max * g)} y2={y(max * g)}
            stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeDasharray="3 4" />
        ))}
        <polygon points={area} fill="url(#grad)" />
        <polyline points={line} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.gross)} r="3" fill="#6366f1">
            <title>{d.day}: ${d.gross.toFixed(2)}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

/* Error boundary: prevents a single render error from blanking the whole page.
   Instead it shows the error so you can see exactly what went wrong. */
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }
  componentDidCatch(error, info) {
    console.error('AdminDashboard crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center shadow-sm">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">
              The dashboard hit an error while rendering. Details are in the browser console.
            </p>
            <pre className="text-xs text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto text-red-600 mb-4">
              {this.state.message}
            </pre>
            <button onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminDashboard = () => (
  <AdminErrorBoundary>
    <AdminDashboardInner />
  </AdminErrorBoundary>
);

export default AdminDashboard;