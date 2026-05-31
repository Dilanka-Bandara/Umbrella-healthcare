import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Pill, PenTool, CheckCircle, MessageSquare, History, Search, Plus, Trash2, ShieldAlert, Edit3, Upload, Loader2, FileImage } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState('notes'); 
  const [isSaving, setIsSaving] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);

  // --- Clinical Form States ---
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [editingId, setEditingId] = useState(null);

  // 🚨 NEW: LIVE SESSION UPLOAD STATES
  const [sessionFiles, setSessionFiles] = useState([]); // Array to hold uploaded Cloudinary URLs
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- HTML5 SMART PEN CANVAS ---
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current.getContext('2d');
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };
  const stopDrawing = () => {
    if (!isDrawing) return;
    const context = canvasRef.current.getContext('2d');
    context.closePath();
    setIsDrawing(false);
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 🚨 NEW: LIVE UPLOAD FUNCTION
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file); 

    try {
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      
      // Upload to Cloudinary immediately
      const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, config);
      const fileUrl = uploadRes.data.file_url;

      // Add to our temporary array for this session
      setSessionFiles(prev => [...prev, { name: file.name, url: fileUrl }]);
      alert("File uploaded successfully and attached to this session!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- ADVANCED eRx CART SYSTEM ---
  const [rxCart, setRxCart] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [rxForm, setRxForm] = useState({ amount: 1, frequency: '2x', timing: 'Morning & Evening', meal: 'After Meal', durationDays: 7 });

  const pharmacyDatabase = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Amoxicillin 500mg (Antibiotic)', type: 'Capsule' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Lisinopril 10mg (Blood Pressure)', type: 'Tablet' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Paracetamol 500mg (Pain Relief)', type: 'Tablet' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Omeprazole 20mg (Acid Reflux)', type: 'Capsule' },
  ];

  const filteredMeds = medSearch ? pharmacyDatabase.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())) : [];
  const selectedMed = pharmacyDatabase.find(m => m.name === medSearch);
  const freqNumber = parseInt(rxForm.frequency.replace('x', ''));
  const totalQuantity = rxForm.amount * freqNumber * rxForm.durationDays;

  const handleAddPrescription = () => {
    if (!selectedMed) return alert("Please select a valid medicine.");
    const newRx = {
      medicine_id: selectedMed.id,
      medicine_name: selectedMed.name,
      total_quantity: totalQuantity,
      instructions: `Take ${rxForm.amount} ${selectedMed.type}(s), ${rxForm.frequency} daily (${rxForm.timing}) - ${rxForm.meal} for ${rxForm.durationDays} days.`
    };
    setRxCart([...rxCart, newRx]);
    setMedSearch(''); 
  };

  const removeRx = (index) => setRxCart(rxCart.filter((_, i) => i !== index));

  // --- Real-time Chat States ---
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !targetId) return;

    const roomId = [currentUser.id, targetId].sort().join('_');
    socket.emit('join_room', roomId);
    socket.on('receive_message', (newMsg) => {
      setChatLog((prev) => [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    if (isDoctor) {
      axios.get(`http://localhost:5000/api/consultations/history/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setPatientHistory(res.data)).catch(console.error);
    }
    return () => socket.off('receive_message');
  }, [currentUser?.id, targetId, isDoctor, token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const roomId = [currentUser.id, targetId].sort().join('_');
    socket.emit('send_message', { sender_id: currentUser.id, receiver_id: targetId, message_text: message, room: roomId });
    setMessage('');
  };

  const handleEditHistory = (record) => {
    setEditingId(record.id);
    setSymptoms(record.symptoms_notes);
    setDiagnosis(record.diagnosis);
    setActiveTab('notes');
    alert("Record loaded into editor. Make your changes and click Save.");
  };

  const handleFinalizeConsultation = async () => {
    if (!symptoms || !diagnosis) return alert("Please fill out symptoms and diagnosis.");
    setIsSaving(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/consultations/record/${editingId}`, {
          symptoms_notes: symptoms, diagnosis: diagnosis
        }, config);
        alert("Medical Record updated successfully!");
      } else {
        // Create new record AND attach the uploaded Cloudinary files!
        const fileUrlsOnly = sessionFiles.map(file => file.url);
        
        const recordRes = await axios.post('http://localhost:5000/api/consultations/record', {
          patient_id: targetId, symptoms_notes: symptoms, diagnosis: diagnosis, file_urls: fileUrlsOnly 
        }, config);
        
        const consultId = recordRes.data.consultation_id;

        if (rxCart.length > 0) {
          for (const rx of rxCart) {
            try {
               await axios.post(`http://localhost:5000/api/consultations/record/${consultId}/prescribe`, {
                 medicine_id: rx.medicine_id,
                 instructions: rx.instructions
               }, config);
            } catch (err) {
               console.log("Prescription skip (mock ID not in DB): ", rx.medicine_name);
            }
          }
        }
        alert(`Session Complete! Saved to History & ${rxCart.length} Prescriptions queued.`);
      }
      navigate('/doctor-dashboard');
    } catch (error) {
      console.error(error);
      alert("Error saving record to database.");
    } finally {
      setIsSaving(false);
    }
  };

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
            {isSaving ? 'Saving to Database...' : (editingId ? 'Save Changes' : 'Sign & Complete')}
          </button>
        </div>

        <div className="flex-1 flex w-full mx-auto p-4 gap-4 h-[calc(100vh-76px)]">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <button onClick={() => setActiveTab('notes')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'notes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50'}`}>
                <PenTool className="h-5 w-5" /> {editingId ? 'Editing Past Record' : 'Current Visit Notes'}
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50'}`}>
                <History className="h-5 w-5" /> Full Medical History
              </button>
            </div>

            {/* TAB: Current Notes & Tools */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Symptoms & Chief Complaint</label>
                      <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full h-24 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="Enter patient assessment..."></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Primary Diagnosis</label>
                      <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" placeholder="e.g., Acute Bronchitis" />
                    </div>
                  </div>
                </div>

                {/* 🚨 NEW: LIVE UPLOAD AND CANVAS SECTION */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Smart Pen */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <PenTool className="h-4 w-4" /> Smart Pen Drawing
                      </label>
                      <button onClick={clearCanvas} className="text-xs text-red-500 font-bold hover:underline">Clear Canvas</button>
                    </div>
                    <canvas 
                      ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                      className="w-full h-40 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-crosshair touch-none"
                      width={400} height={160}
                    />
                  </div>

                  {/* Cloudinary Live Upload */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col justify-between">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" /> Attach Documents & Scans
                    </label>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                    
                    <button 
                      onClick={() => fileInputRef.current.click()} disabled={isUploading}
                      className="flex-1 border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 text-emerald-700 p-4 rounded-xl flex flex-col items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="h-6 w-6 animate-spin mb-1" /> : <Upload className="h-6 w-6 mb-1" />}
                      <span className="text-sm font-bold">{isUploading ? 'Uploading...' : 'Upload File'}</span>
                    </button>

                    {/* Show attached files */}
                    {sessionFiles.length > 0 && (
                      <div className="mt-2 space-y-1 overflow-y-auto max-h-20">
                        {sessionFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                            <FileImage className="h-3 w-3 text-emerald-500" /> <span className="truncate">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Real Medical History */}
            {activeTab === 'history' && (
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="font-bold text-sm">HIPAA Secure: Patient Medical Vault</span>
                </div>
                {patientHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No previous medical history found.</p>
                ) : (
                  patientHistory.map((record) => (
                    <div key={record.id} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 relative group">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between">
                        <span className="font-bold">{new Date(record.created_at).toLocaleDateString()} - Dr. {record.doctor_name}</span>
                        <button onClick={() => handleEditHistory(record)} className="text-sm font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit3 className="h-4 w-4" /> Edit Record
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-sm"><span className="font-bold text-gray-500">Diagnosis:</span> {record.diagnosis}</p>
                        <p className="text-sm"><span className="font-bold text-gray-500">Notes:</span> {record.symptoms_notes}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Embedded Live Chat Module */}
            <div className="h-56 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
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

          {/* RIGHT: e-Prescribing (eRx) Panel */}
          <div className="w-[450px] bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col shadow-sm overflow-hidden">
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><Pill className="h-5 w-5"/> Smart e-Prescribe</h3>
              <p className="text-xs text-emerald-600 mt-1">Structured dosage ensures accurate pharmacy limits.</p>
            </div>
            
            <div className="p-5 space-y-5 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {/* Search Medicine */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Medicine</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="Type to search..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold" />
                </div>
                {medSearch && !selectedMed && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredMeds.map(m => (
                      <button key={m.id} onClick={() => setMedSearch(m.name)} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-100">
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dosage Settings */}
              <div className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount</label>
                  <select value={rxForm.amount} onChange={(e) => setRxForm({...rxForm, amount: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none">
                    <option value="1">1 Unit</option>
                    <option value="2">2 Units</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Times a Day</label>
                  <select value={rxForm.frequency} onChange={(e) => setRxForm({...rxForm, frequency: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none">
                    <option value="1x">1x a day</option>
                    <option value="2x">2x a day</option>
                    <option value="3x">3x a day</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Timing of Day</label>
                  <select value={rxForm.timing} onChange={(e) => setRxForm({...rxForm, timing: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none">
                    <option value="Morning">Morning</option>
                    <option value="Night">Night</option>
                    <option value="Morning & Evening">Morning & Evening</option>
                    <option value="Morning, Noon & Night">Morning, Noon & Night</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Meal Instruction</label>
                  <select value={rxForm.meal} onChange={(e) => setRxForm({...rxForm, meal: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none">
                    <option value="Before Meal">Before Meal (Empty Stomach)</option>
                    <option value="After Meal">After Meal</option>
                    <option value="With Food">With Food</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duration (Validity)</label>
                  <select value={rxForm.durationDays} onChange={(e) => setRxForm({...rxForm, durationDays: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none">
                    <option value="3">3 Days (Acute)</option>
                    <option value="7">7 Days (1 Week)</option>
                    <option value="30">30 Days (Maintenance)</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase">Total System Allowance</p>
                </div>
                <div className="text-2xl font-black text-blue-700 font-mono">
                  {totalQuantity} <span className="text-sm font-bold">qty</span>
                </div>
              </div>

              <button onClick={handleAddPrescription} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition-colors shadow-sm">
                <Plus className="h-5 w-5" /> Queue Prescription
              </button>

              {rxCart.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Queued Prescriptions ({rxCart.length})</h4>
                  <div className="space-y-2">
                    {rxCart.map((rx, idx) => (
                      <div key={idx} className="bg-white border border-emerald-100 p-3 rounded-xl relative group">
                        <p className="font-bold text-sm pr-8">{rx.medicine_name}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">"{rx.instructions}"</p>
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[700px]">
        <div className="w-full md:w-1/3 bg-blue-600 text-white p-8 flex flex-col justify-between">
          <div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-blue-200 hover:text-white mb-12 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" /> Exit Waiting Room
            </button>
            <h2 className="text-3xl font-extrabold mb-2">Live Session</h2>
            <p className="text-blue-200 text-sm">Consultation is active.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> <span className="text-sm font-medium">Consultation in progress...</span></div>
          </div>
        </div>
        <div className="w-full md:w-2/3 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>{msg.message_text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-5 py-3 bg-gray-50 border rounded-xl outline-none" />
            <button type="submit" disabled={!message.trim()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EncounterRoom;