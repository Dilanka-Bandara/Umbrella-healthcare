import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Lock, Check, X, MessageSquare, Loader2, Pill, ShieldCheck, ChevronDown, ChevronUp,
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api/store`;

const SpecialRequests = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [note, setNote] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/permission/incoming`, config);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const decide = async (id, decision) => {
    if (decision === 'reject' && !note.trim()) return alert('Please add a note explaining the decision.');
    setBusy(true);
    try {
      await axios.put(`${API}/permission/${id}/decide`, { decision, doctor_note: note, valid_days: validDays }, config);
      setExpanded(null); setNote(''); load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed.');
    } finally {
      setBusy(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"><Lock className="h-6 w-6 text-amber-500" /> Medicine Approval Requests</h2>
        <p className="text-gray-500 text-sm mt-1">Patients requesting permission for restricted medicines. Chat with them first, then decide.</p>
      </div>

      <div>
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 text-sm">
            <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-2" /> No pending requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center"><Pill className="h-6 w-6" /></div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{r.medicine_name} <span className="text-gray-400 font-normal text-sm">· {r.dosage}</span></p>
                      <p className="text-xs text-gray-500">Requested by {r.patient_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                      {r.patient_note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{r.patient_note}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/encounter/${r.patient_user_id}`)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"><MessageSquare className="h-3.5 w-3.5" /> Chat</button>
                    <button onClick={() => { setExpanded(expanded === r.id ? null : r.id); setNote(''); }} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1">Decide {expanded === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>
                  </div>
                </div>
                {expanded === r.id && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note to patient (required if rejecting)…"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-500">Approval valid for</label>
                      <select value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value))} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none">
                        <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => decide(r.id, 'approve')} disabled={busy} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve</button>
                      <button onClick={() => decide(r.id, 'reject')} disabled={busy} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1"><X className="h-4 w-4" /> Reject</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {decided.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">History</h3>
          <div className="space-y-2">
            {decided.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><Pill className="h-4 w-4 text-gray-400" /><div><p className="text-sm font-bold text-gray-900 dark:text-white">{r.medicine_name}</p><p className="text-xs text-gray-500">{r.patient_name}</p></div></div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialRequests;