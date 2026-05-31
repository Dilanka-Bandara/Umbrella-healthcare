import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, MessageCircle, Search } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const MessageHub = () => {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // 1. Fetch all patient encounters
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/doctors/all-patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEncounters(response.data);
      } catch (error) {
        console.error("Error fetching patients for messages:", error);
      }
    };
    if (token) fetchPatients();
  }, [token]);

  // 2. Load Chat History when a patient is selected
  useEffect(() => {
    if (!currentUser || !activeChat) return;

    // 🚨 BUG FIX: Using activeChat.patient_id instead of activeChat.id to create the room
    const roomId = [currentUser.id, activeChat.patient_id].sort().join('_');
    socket.emit('join_room', roomId);

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${activeChat.patient_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatLog(response.data);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    
    fetchHistory();

    const receiveMessageHandler = (newMsg) => {
      setChatLog((prev) => [...prev, newMsg]);
      scrollToBottom();
    };

    socket.on('receive_message', receiveMessageHandler);

    return () => {
      socket.off('receive_message', receiveMessageHandler);
    };
  }, [currentUser?.id, activeChat, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || !activeChat) return;

    // 🚨 BUG FIX: Using activeChat.patient_id for sending messages
    const roomId = [currentUser.id, activeChat.patient_id].sort().join('_');
    const messageData = {
      sender_id: currentUser.id,
      receiver_id: activeChat.patient_id,
      message_text: message,
      room: roomId
    };

    socket.emit('send_message', messageData);
    setMessage('');
  };

  // =====================================================================
  // 🚨 CRITICAL FIX: The Deduplication Engine
  // Convert the chronological encounter log back into a unique "Contacts List"
  // so patients don't show up 5 times if they had 5 appointments.
  // =====================================================================
  const uniquePatientsMap = new Map();
  encounters.forEach(enc => {
    const pId = enc.patient_id || enc.id; // Safely grab the ID depending on the backend response
    if (pId && !uniquePatientsMap.has(pId)) {
       uniquePatientsMap.set(pId, { ...enc, patient_id: pId });
    }
  });
  const uniquePatients = Array.from(uniquePatientsMap.values());

  // Search filter
  const filteredPatients = uniquePatients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Left Sidebar: Patient Contact List */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onClick={() => navigate('/doctor-dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <MessageCircle className="h-6 w-6 text-blue-500" /> Message Hub
            </h2>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patients..." className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredPatients.map(patient => (
              <button 
                key={patient.patient_id} 
                onClick={() => setActiveChat(patient)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeChat?.patient_id === patient.patient_id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold shrink-0 ${activeChat?.patient_id === patient.patient_id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold truncate">{patient.full_name}</h3>
                  {/* 🚨 SAFE SUBSTRING: Cast to String first to guarantee no crashes */}
                  <p className={`text-xs truncate ${activeChat?.patient_id === patient.patient_id ? 'text-blue-100' : 'text-gray-500'}`}>
                    Patient ID: #{String(patient.patient_id).substring(0,8)}
                  </p>
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-center text-sm text-gray-400 mt-6">No patient contacts found.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Active Chat Workspace */}
        <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-gray-900">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center"><User className="h-6 w-6"/></div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{activeChat.full_name}</h3>
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><span className="h-2 w-2 bg-green-500 rounded-full"></span> Secure Connection</p>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
                {chatLog.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}>
                        {msg.message_text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a secure message..." className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" />
                <button type="submit" disabled={!message.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                  <Send className="h-4 w-4" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
              <MessageCircle className="h-20 w-20 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Select a Patient</h3>
              <p className="text-sm">Choose a patient from the sidebar to view your secure messaging history.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageHub;