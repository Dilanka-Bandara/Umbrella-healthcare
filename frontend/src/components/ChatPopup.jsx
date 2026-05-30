import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, ChevronLeft, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatPopup = ({ isOpen, onClose, careTeam }) => {
  // UI States
  const [activeDoctor, setActiveDoctor] = useState(null);
  
  // Chat States
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Formatting the "Channelled" date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Chat Connection Logic (Only runs when a doctor is selected!)
  useEffect(() => {
    if (!isOpen || !currentUser || !activeDoctor) return;

    const roomId = [currentUser.id, activeDoctor.id].sort().join('_');
    socket.emit('join_room', roomId);

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${activeDoctor.id}`, {
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
  }, [isOpen, currentUser?.id, activeDoctor, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || !activeDoctor) return;

    const roomId = [currentUser.id, activeDoctor.id].sort().join('_');
    
    const messageData = {
      sender_id: currentUser.id,
      receiver_id: activeDoctor.id,
      message_text: message,
      room: roomId
    };

    socket.emit('send_message', messageData);
    setMessage('');
  };

  // Close completely or go back to list
  const handleClose = () => {
    setActiveDoctor(null); // Reset view
    onClose(); // Close widget
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      
      {/* ------------------------------------------------------------------ */}
      {/* VIEW 1: THE DOCTOR LIST (If no doctor is selected yet)             */}
      {/* ------------------------------------------------------------------ */}
      {!activeDoctor ? (
        <>
          <div className="bg-blue-600 dark:bg-blue-700 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Messages</h3>
            <button onClick={handleClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950/50 p-2">
            {careTeam.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-70">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">No Doctors Connected</h4>
                <p className="text-xs text-gray-500">You haven't channelled any doctors yet. Go to "Link with Doctor" to add a physician to your care team.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-2">Your Care Team</p>
                {careTeam.map((doc) => (
                  <button 
                    key={doc.id}
                    onClick={() => setActiveDoctor(doc)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Dr. {doc.full_name}</h4>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Channelled on: {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
      
      /* ------------------------------------------------------------------ */
      /* VIEW 2: THE ACTIVE CHAT (If a doctor is selected)                  */
      /* ------------------------------------------------------------------ */
        <>
          <div className="bg-blue-600 dark:bg-blue-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveDoctor(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors -ml-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="bg-white/20 p-1.5 rounded-full"><User className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-sm">Dr. {activeDoctor.full_name}</h3>
                <span className="text-[10px] bg-green-400 text-gray-900 px-1.5 py-0.5 rounded-full font-bold">Online</span>
              </div>
            </div>
            <button onClick={handleClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950/50">
            {chatLog.length === 0 ? (
              <p className="text-center text-xs text-gray-500 mt-4">Send a message to start the consultation.</p>
            ) : (
              chatLog.map((msg, index) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
                      <p>{msg.message_text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your medical query..." 
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={!message.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPopup;