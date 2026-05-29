import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatPopup = ({ isOpen, onClose, doctorId, doctorName }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!isOpen || !currentUser || !doctorId) return;

    // Create the unique room ID
    const roomId = [currentUser.id, doctorId].sort().join('_');
    
    // Explicitly join the room and log it to the console!
    console.log(`[Patient] Joining Room: ${roomId}`);
    socket.emit('join_room', roomId);

    // Fetch history
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatLog(response.data);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchHistory();

    // Listen for live messages
    const receiveMessageHandler = (newMsg) => {
      console.log("[Patient] Received live message!", newMsg);
      setChatLog((prev) => [...prev, newMsg]);
      scrollToBottom();
    };

    socket.on('receive_message', receiveMessageHandler);

    return () => {
      socket.off('receive_message', receiveMessageHandler);
    };
  }, [isOpen, currentUser?.id, doctorId, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    // NEW SAFETY CHECK: Prevent sending if doctorId is missing!
    if (!message.trim() || !currentUser || !doctorId) return;

    const roomId = [currentUser.id, doctorId].sort().join('_');
    
    const messageData = {
      sender_id: currentUser.id,
      receiver_id: doctorId,
      message_text: message,
      room: roomId
    };

    console.log("[Patient] Sending message:", messageData);
    socket.emit('send_message', messageData);
    setMessage('');
  };

  if (!isOpen) return null;

  // NEW UI: If the patient hasn't linked a doctor, show an error!
  if (!doctorId) {
    return (
      <div className="fixed bottom-6 right-6 w-96 h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-red-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-semibold text-sm">Connection Required</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">No Doctor Linked</h4>
          <p className="text-sm text-gray-500">You must click "Link with Doctor" on your dashboard and enter their Clinic ID before you can use the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="bg-blue-600 dark:bg-blue-700 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-full"><User className="h-4 w-4" /></div>
          <div>
            <h3 className="font-semibold text-sm">{doctorName || "Your Doctor"}</h3>
            <span className="text-[10px] bg-green-400 text-gray-900 px-1.5 py-0.5 rounded-full font-bold">Online</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950/50">
        {chatLog.length === 0 ? (
          <p className="text-center text-xs text-gray-500 mt-4">Send a message to start the consultation.</p>
        ) : (
          chatLog.map((msg, index) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
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
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={!message.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatPopup;