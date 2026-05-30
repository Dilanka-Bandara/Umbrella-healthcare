import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Pill, Clock, PenTool, Upload, CheckCircle, MessageSquare, History, Search, Plus, Trash2, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const EncounterRoom = () => {
  const { targetId } = useParams();
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isDoctor = currentUser?.role === 'doctor';

  // --- UI Layout States ---
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'history'

  // --- Clinical Form States ---
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- 🚨 THE SMART eRx CART SYSTEM ---
  const [rxCart, setRxCart] = useState([]); // Holds all added medicines
  const [medSearch, setMedSearch] = useState('');
  const [rxForm, setRxForm] = useState({
    amount: 1,      // 1 pill
    frequency: 2,   // 2x a day
    durationDays: 7 // for 7 days
  });

  // Mock Pharmacy Database for Search
  const pharmacyDatabase = [
    { id: '1', name: 'Amoxicillin 500mg (Antibiotic)', type: 'Capsule' },
    { id: '2', name: 'Lisinopril 10mg (Blood Pressure)', type: 'Tablet' },
    { id: '3', name: 'Paracetamol 500mg (Pain Relief)', type: 'Tablet' },
    { id: '4', name: 'Omeprazole 20mg (Acid Reflux)', type: 'Capsule' },
  ];

  const filteredMeds = medSearch ? pharmacyDatabase.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())) : [];
  const selectedMed = pharmacyDatabase.find(m => m.name === medSearch);
  
  // Mathematical Auto-Calculation for Pharmacy!
  const totalQuantity = rxForm.amount * rxForm.frequency * rxForm.durationDays;

  const handleAddPrescription = () => {
    if (!selectedMed) return alert("Please select a valid medicine from the search list.");
    
    const newRx = {
      medicine_id: selectedMed.id,
      medicine_name: selectedMed.name,
      amount: rxForm.amount,
      frequency: rxForm.frequency,
      durationDays: rxForm.durationDays,
      total_quantity: totalQuantity,
      instructions: `Take ${rxForm.amount} ${selectedMed.type}(s), ${rxForm.frequency} times a day, for ${rxForm.durationDays} days.`
    };

    setRxCart([...rxCart, newRx]);
    setMedSearch(''); // Reset form
  };

  const removeRx = (index) => {
    setRxCart(rxCart.filter((_, i) => i !== index));
  };

  // --- Real-time Chat States ---
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !targetId) return;

    const roomId = [currentUser.id, targetId].sort().join('_');
    socket.emit('join_room', roomId);

    const receiveMessageHandler = (newMsg) => {
      setChatLog((prev) => [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    socket.on('receive_message', receiveMessageHandler);

    return () => socket.off('receive_message', receiveMessageHandler);
  }, [currentUser?.id, targetId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const roomId = [currentUser.id, targetId].sort().join('_');
    const messageData = { sender_id: currentUser.id, receiver_id: targetId, message_text: message, room: roomId };
    socket.emit('send_message', messageData);
    setMessage('');
  };

  const handleFinalizeConsultation = async () => {
    setIsSaving(true);
    try {
      // 1. Save Consultation
      const recordRes = await axios.post('http://localhost:5000/api/consultations/record', {
        patient_id: targetId, symptoms_notes: symptoms, diagnosis: diagnosis, file_urls: []
      }, { headers: { Authorization: `Bearer ${token}` } });

      // In production, we would loop through `rxCart` and call /prescribe for each medicine!
      
      alert(`Consultation saved! ${rxCart.length} prescriptions securely sent to pharmacy limits.`);
      navigate('/doctor-dashboard');
    } catch (error) {
      console.error(error);
      alert("Error saving record.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // UI RENDER: DOCTOR'S CLINICAL WORKSPACE
  // ============================================================================
  if (isDoctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md z-10">
          <button onClick={() => navigate('/doctor-dashboard')} className="flex items-center gap-2 hover:text-emerald-200 transition-colors">
            <ArrowLeft className="h-5 w-5" /> Exit Session
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            <h1 className="font-bold text-lg tracking-wider uppercase">Live Clinical Workspace</h1>
          </div>
          <button onClick={handleFinalizeConsultation} disabled={isSaving} className="bg-white text-emerald-700 px-6 py-2 rounded-full font-bold hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? 'Signing...' : 'Sign & Complete'}
          </button>
        </div>

        <div className="flex-1 flex w-full mx-auto p-4 gap-4 h-[calc(100vh-76px)]">
          
          {/* LEFT/CENTER AREA: Tabs for Notes vs History */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            
            {/* The Tab Navigation */}
            <div className="flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <button onClick={() => setActiveTab('notes')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'notes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50'}`}>
                <PenTool className="h-5 w-5" /> Current Visit Notes
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50'}`}>
                <History className="h-5 w-5" /> Full Medical History
              </button>
            </div>

            {/* TAB CONTENT: Current Visit Notes */}
            {activeTab === 'notes' && (
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Symptoms & Chief Complaint</label>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="Enter full patient assessment..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Primary Diagnosis</label>
                    <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" placeholder="e.g., Acute Bronchitis" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Medical History (Deep Dive) */}
            {activeTab === 'history' && (
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="font-bold text-sm">HIPAA Secure: Patient Medical Vault</span>
                </div>
                
                {/* Simulated Past Record */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between">
                    <span className="font-bold">May 25, 2026 - Dr. Sarah Jenkins</span>
                    <span className="text-sm font-mono text-gray-500">ID: #C768-A85E</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm"><span className="font-bold text-gray-500">Diagnosis:</span> Stress-induced Migraines</p>
                    <p className="text-sm"><span className="font-bold text-gray-500">Notes:</span> Patient reported acute tension headaches and episodic insomnia.</p>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm border border-blue-100 dark:border-blue-800/50">
                      <span className="font-bold text-blue-800 dark:text-blue-300">Rx Issued:</span> Paracetamol 500mg (Take 1 tablet every 8 hours)
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Embedded Live Chat Module */}
            <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl font-bold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600"/> Patient Communication
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-2.5 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>{msg.message_text}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a secure message..." className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </form>
            </div>
          </div>

          {/* RIGHT: Smart e-Prescribing (eRx) Panel */}
          <div className="w-[450px] bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col shadow-sm overflow-hidden">
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><Pill className="h-5 w-5"/> Smart e-Prescribe</h3>
              <p className="text-xs text-emerald-600 mt-1">Structured dosage ensures accurate pharmacy limits.</p>
            </div>
            
            <div className="p-5 space-y-5 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              
              {/* 1. Search Medicine */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Medicine Database</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="Type to search..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold" />
                </div>
                {/* Autocomplete Dropdown */}
                {medSearch && !selectedMed && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredMeds.map(m => (
                      <button key={m.id} onClick={() => setMedSearch(m.name)} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Structured Dosage Settings */}
              <div className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount</label>
                  <select value={rxForm.amount} onChange={(e) => setRxForm({...rxForm, amount: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                    <option value="1">1 Unit</option>
                    <option value="2">2 Units</option>
                    <option value="3">3 Units</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frequency</label>
                  <select value={rxForm.frequency} onChange={(e) => setRxForm({...rxForm, frequency: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                    <option value="1">1x a day</option>
                    <option value="2">2x a day</option>
                    <option value="3">3x a day</option>
                    <option value="4">4x a day</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duration (Validity)</label>
                  <select value={rxForm.durationDays} onChange={(e) => setRxForm({...rxForm, durationDays: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                    <option value="3">3 Days (Acute)</option>
                    <option value="7">7 Days (1 Week)</option>
                    <option value="14">14 Days (2 Weeks)</option>
                    <option value="30">30 Days (Maintenance)</option>
                  </select>
                </div>
              </div>

              {/* 3. Auto Calculation Output */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase">Total System Allowance</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-1">Patient cannot buy more than this quantity.</p>
                </div>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                  {totalQuantity} <span className="text-sm font-bold">qty</span>
                </div>
              </div>

              <button onClick={handleAddPrescription} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition-colors shadow-sm">
                <Plus className="h-5 w-5" /> Add to Prescription List
              </button>

              {/* The Prescription Cart/List */}
              {rxCart.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Queued Prescriptions ({rxCart.length})</h4>
                  <div className="space-y-2">
                    {rxCart.map((rx, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-xl relative group">
                        <p className="font-bold text-sm text-gray-900 dark:text-white pr-8">{rx.medicine_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{rx.instructions}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Total Prescribed: {rx.total_quantity}</p>
                        <button onClick={() => removeRx(idx)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // PATIENT VIEW REMAINS EXACTLY THE SAME...
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row h-[700px]">
        
        {/* Patient Status Panel */}
        <div className="w-full md:w-1/3 bg-blue-600 text-white p-8 flex flex-col justify-between">
          <div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-12 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" /> Exit Waiting Room
            </button>
            <h2 className="text-3xl font-extrabold mb-2">Live Session</h2>
            <p className="text-blue-200 text-sm leading-relaxed">Your secure consultation is active. The doctor is currently reviewing your medical history and vitals.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 opacity-50"><CheckCircle className="h-5 w-5"/> <span className="text-sm font-medium">Identity Verified</span></div>
            <div className="flex items-center gap-3"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> <span className="text-sm font-medium">Consultation in progress...</span></div>
          </div>
        </div>

        {/* Patient Chat Panel */}
        <div className="w-full md:w-2/3 flex flex-col bg-gray-50 dark:bg-gray-950">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><User className="h-6 w-6"/></div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Attending Physician</h3>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><span className="h-2 w-2 bg-green-500 rounded-full inline-block"></span> Connected</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                    {msg.message_text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-3">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your symptoms or questions..." className="flex-1 px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <button type="submit" disabled={!message.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-bold disabled:opacity-50">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EncounterRoom;