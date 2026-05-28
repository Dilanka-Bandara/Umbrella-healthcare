import React, { useState } from 'react';
import { X, Send, User } from 'lucide-react';

const ChatPopup = ({ isOpen, onClose, doctorName }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    { id: 1, sender: 'doctor', text: 'Hello John, how are you feeling today after taking the Paracetamol?' },
    { id: 2, sender: 'patient', text: 'Hi Doctor, I am feeling much better now, thank you!' }
  ]);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Append the user's message locally for the visual layer
    setChatLog([...chatLog, { id: Date.now(), sender: 'patient', text: message }]);
    setMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Bar */}
      <div className="bg-blue-600 dark:bg-blue-700 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-full">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{doctorName || "Your Consultation"}</h3>
            <span className="text-[10px] bg-green-400 text-gray-900 px-1.5 py-0.5 rounded-full font-bold">Online</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message Logs Window */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950/50">
        {chatLog.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
              msg.sender === 'patient' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
            }`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Action Tray */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your medical query..." 
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
};

export default ChatPopup;