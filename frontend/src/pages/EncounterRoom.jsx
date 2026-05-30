import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Pill, Clock, PenTool, Upload, CheckCircle, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const EncounterRoom = () => {
  const { targetId } = useParams(); // The ID of the person we are connecting to
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isDoctor = currentUser?.role === 'doctor';

  // --- Clinical Form States (Doctor Only) ---
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicine, setMedicine] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationDays, setDurationDays] = useState('7'); // Default 1 week validity
  const [isSaving, setIsSaving] = useState(false);

  // --- Real-time Chat States (Shared) ---
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !targetId) return;

    // 1. Join the secure live session room
    const roomId = [currentUser.id, targetId].sort().join('_');
    socket.emit('join_room', roomId);

    // 2. Listen for live chat
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

  // --- Doctor Action: Finalize Consultation ---
  const handleFinalizeConsultation = async () => {
    setIsSaving(true);
    try {
      // 1. Save the main record
      const recordRes = await axios.post('http://localhost:5000/api/consultations/record', {
        patient_id: targetId,
        symptoms_notes: symptoms,
        diagnosis: diagnosis,
        file_urls: [] // Here we would pass the smart-pen/upload URLs
      }, { headers: { Authorization: `Bearer ${token}` } });

      // In a full implementation, we would extract the specific consultation_id here to attach the prescription
      alert("Consultation and prescriptions saved successfully! Patient requires authorization for refills after " + durationDays + " days.");
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
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="font-bold text-lg tracking-wider uppercase">Live Clinical Encounter</h1>
          </div>
          <button onClick={handleFinalizeConsultation} disabled={isSaving} className="bg-white text-emerald-700 px-6 py-2 rounded-full font-bold hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? 'Signing...' : 'Sign & Complete'}
          </button>
        </div>

        {/* 3-Panel Workspace */}
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 gap-4 h-[calc(100vh-76px)]">
          
          {/* LEFT: Patient History */}
          <div className="w-1/4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><User className="h-6 w-6"/></div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">Patient Data</h2>
                  <p className="text-xs text-gray-500">ID: #{targetId}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-1">Previous Diagnosis</h4>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Stress-induced Migraines</p>
                <p className="text-xs text-gray-500 mt-1">May 25, 2026</p>
              </div>
            </div>
          </div>

          {/* CENTER: Clinical Notes & Chat */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PenTool className="h-5 w-5 text-emerald-600"/> Clinical Assessment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Symptoms & Chief Complaint</label>
                  <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" placeholder="Enter patient symptoms..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Primary Diagnosis</label>
                  <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g., Acute Bronchitis" />
                </div>
                
                {/* File Upload / Smart Pen Placeholder */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <Upload className="h-8 w-8 mb-2 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-sm font-semibold">Upload X-Rays or Smart-Pen Notes</p>
                  <p className="text-xs mt-1">Syncs securely to patient vault</p>
                </div>
              </div>
            </div>
            
            {/* Embedded Live Chat Module */}
            <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl font-bold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600"/> Patient Communication
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-2.5 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                      {msg.message_text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a secure message..." className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </form>
            </div>
          </div>

          {/* RIGHT: e-Prescribing (eRx) */}
          <div className="w-1/4 bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-6 flex flex-col shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><Pill className="h-5 w-5"/> Digital Rx</h3>
            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Medication</label>
                <select value={medicine} onChange={(e) => setMedicine(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold">
                  <option value="">Select from inventory...</option>
                  <option value="1">Amoxicillin 500mg</option>
                  <option value="2">Lisinopril 250mg</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Dosage Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" placeholder="e.g., Take 2x daily after meals."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Clock className="h-3 w-3"/> Rx Validity Period</label>
                <select value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                  <option value="3">3 Days (Acute)</option>
                  <option value="7">1 Week</option>
                  <option value="30">30 Days (Maintenance)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">Patient cannot order refills from the pharmacy after this period without new authorization.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
               <button className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-emerald-50 text-emerald-700 dark:bg-gray-800 dark:text-emerald-400 p-3 rounded-xl font-bold transition-colors">
                  <CheckCircle className="h-5 w-5" /> Queue Prescription
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // UI RENDER: PATIENT'S LIVE SESSION VIEW
  // ============================================================================
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