import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, CheckCircle, Ban, FileText, FileImage, UserCheck,
  ShieldAlert, Loader2, Mail, Phone, Hash, Calendar, ExternalLink,
  Files, Clock,
} from 'lucide-react';

const API = 'http://localhost:5000/api/verification';

const DoctorReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Doctor may arrive via navigation state (from the dashboard) or by URL id.
  const passed = location.state?.doctor || null;
  const doctorId = passed?.id || params.id;

  const [applicant, setApplicant] = useState(passed);
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null); // currently previewed doc url
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rejection reason modal
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!doctorId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(`${API}/${doctorId}`, config);
        setApplicant(data);

        // Build the full document list: primary license + any extra credentials
        const docs = [];
        if (data.medical_license_url) {
          docs.push({
            id: 'primary',
            doc_type: 'Medical License (registration)',
            file_url: data.medical_license_url,
            file_name: 'Registration document',
          });
        }
        (data.documents || []).forEach((d) => docs.push(d));
        setDocuments(docs);
        setActiveDoc(docs[0]?.file_url || null);
      } catch (e) {
        console.error('Load applicant failed', e);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const decide = async (decision, notes) => {
    setIsProcessing(true);
    try {
      await axios.put(`${API}/${doctorId}/decision`, { decision, notes }, config);
      alert(
        decision === 'approve'
          ? 'Approved — the doctor can now access the platform.'
          : 'Application rejected.'
      );
      navigate('/admin');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to record decision.');
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    if (window.confirm('Approve this doctor and grant them access to the platform?')) {
      decide('approve', '');
    }
  };

  const submitReject = () => {
    if (!reason.trim()) {
      alert('Please give a reason — the applicant and audit log will see this.');
      return;
    }
    setShowReject(false);
    decide('reject', reason.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ShieldAlert className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No Application Selected</h2>
        <button onClick={() => navigate('/admin')} className="text-indigo-600 font-bold hover:underline">
          Return to Admin Dashboard
        </button>
      </div>
    );
  }

  const statusPill = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }[applicant.verification_status] || 'bg-gray-100 text-gray-600';

  const isPdf = (url) => url && url.toLowerCase().split('?')[0].endsWith('.pdf');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in slide-in-from-right-8 duration-300">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/admin')}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors shadow-sm text-gray-500">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Doctor Verification</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              Verify identity and medical credentials before granting platform access.
            </p>
          </div>
          <span className={`${statusPill} text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide`}>
            {applicant.verification_status}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">

          {/* LEFT: profile + actions */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
              <div className="h-24 w-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 border-4 border-indigo-100 shadow-inner">
                <UserCheck className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{applicant.full_name}</h2>
              <p className="text-sm text-gray-500 font-mono mb-8">
                Applicant ID: #{String(applicant.id).split('-')[0]}
              </p>

              <div className="space-y-4">
                <InfoRow icon={Mail} label="Email" value={applicant.email} />
                <InfoRow icon={Phone} label="Phone" value={applicant.phone_number || '—'} />
                <InfoRow icon={Hash} label="Clinic ID" value={applicant.clinic_id || 'Not provided'} mono />
                <InfoRow icon={Calendar} label="Registered"
                  value={applicant.created_at ? new Date(applicant.created_at).toLocaleString() : '—'} />
                {applicant.reviewed_at && (
                  <InfoRow icon={Clock} label="Last reviewed"
                    value={new Date(applicant.reviewed_at).toLocaleString()} />
                )}
              </div>

              {applicant.verification_notes && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Review notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{applicant.verification_notes}</p>
                </div>
              )}
            </div>

            {/* Decision panel */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Final Decision</p>

              {documents.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold p-3 rounded-xl text-center mb-1">
                  ⚠ No documents uploaded. Verify credentials externally before approving.
                </div>
              )}

              <button onClick={handleApprove} disabled={isProcessing || applicant.verification_status === 'approved'}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30">
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {applicant.verification_status === 'approved' ? 'Already Approved' : 'Approve & Grant Access'}
              </button>

              <button onClick={() => setShowReject(true)} disabled={isProcessing}
                className="w-full bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                <Ban className="h-5 w-5" /> Reject Application
              </button>
            </div>
          </div>

          {/* RIGHT: document viewer with tabs */}
          <div className="w-full lg:w-2/3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[600px]">
            <div className="bg-slate-900 p-5 border-b border-slate-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Files className="h-6 w-6 text-indigo-400" />
                <span className="font-bold text-sm uppercase tracking-widest">
                  Credentials ({documents.length})
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-widest bg-slate-800 border border-slate-700 px-3 py-1.5 rounded text-emerald-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> SECURE VIEWER
              </span>
            </div>

            {/* Document tabs */}
            {documents.length > 0 && (
              <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                {documents.map((d) => (
                  <button key={d.id} onClick={() => setActiveDoc(d.file_url)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      activeDoc === d.file_url
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}>
                    <FileText className="h-3.5 w-3.5" /> {d.doc_type}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
              {activeDoc ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 max-h-[760px] border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner bg-white">
                    {isPdf(activeDoc) ? (
                      <iframe src={activeDoc} className="w-full h-full min-h-[560px]" title="Credential document" />
                    ) : (
                      <img src={activeDoc} alt="Credential document" className="w-full h-full object-contain p-2" />
                    )}
                  </div>
                  <a href={activeDoc} target="_blank" rel="noreferrer"
                    className="mt-3 self-center text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" /> Open full size in new tab
                  </a>
                </div>
              ) : (
                <div className="text-center max-w-sm bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                  <FileImage className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Document Provided</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    This applicant did not upload a medical license or board certification at registration.
                  </p>
                  <p className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    ⚠ Proceed with extreme caution. External verification is required before approval.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject reason modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-6 flex items-center gap-3">
              <Ban className="h-6 w-6" />
              <h2 className="text-lg font-bold">Reject Application</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tell <strong>{applicant.full_name}</strong> why their application can't be approved.
                This is recorded in the audit log.
              </p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                placeholder="e.g. License document is unreadable / expired. Please re-upload a clear copy."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowReject(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button onClick={submitReject}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30">
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
      <Icon className="h-3 w-3" /> {label}
    </p>
    <p className={`font-bold text-gray-900 dark:text-white ${mono ? 'font-mono text-sm text-indigo-600 dark:text-indigo-400' : ''}`}>
      {value}
    </p>
  </div>
);

export default DoctorReview;