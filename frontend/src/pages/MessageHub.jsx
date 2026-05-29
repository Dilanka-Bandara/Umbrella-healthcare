import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Search, Loader2, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Connect to your Node.js server
const socket = io('http://localhost:5000');

const MessageHub = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Get current logged-in doctor
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // 1. Fetch the Doctor's real patients from the database
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/doctors/my-patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(response.data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser && currentUser.role === 'doctor') {
      fetchPatients();
    }
  }, [currentUser, token]);

  // 2. Handle selecting a patient to chat with
  useEffect(() => {
    if (!activeChat) return;

    // Create a unique room ID by sorting the two IDs (e.g., "5_12")
    const roomId = [currentUser.id, activeChat.id].sort().join('_');
    
    // Join the secure socket room
    socket.emit('join_room', roomId);

    // Fetch the chat history from the database
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${activeChat.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    
    fetchHistory();

    // Listen for incoming live messages
    const receiveMessageHandler = (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    };

    socket.on('receive_message', receiveMessageHandler);

    // Cleanup listener when switching chats
    return () => {
      socket.off('receive_message', receiveMessageHandler);
    };
  }, [activeChat, currentUser.id, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 3. Send a message to the database AND the live socket
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const roomId = [currentUser.id, activeChat.id].sort().join('_');
    
    const messageData = {
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      message_text: newMessage,
      room: roomId
    };

    // The backend will save this to Postgres AND broadcast it to the room
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      
      {/* Top Navbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm z-10">
        <button onClick={() => navigate('/doctor-dashboard')} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Telehealth Message Hub</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left Side: Patient List */}
        <div className="w-1/3 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search patients..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : patients.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-10">No connected patients.</p>
            ) : (
              patients.map(patient => (
                <button 
                  key={patient.id}
                  onClick={() => setActiveChat(patient)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${activeChat?.id === patient.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className={`font-semibold truncate ${activeChat?.id === patient.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{patient.full_name}</h3>
                    <p className="text-xs text-gray-500 truncate">Click to view chat history</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex flex-col">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a patient to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{activeChat.full_name}</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active Patient</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 mt-10">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                          <p>{msg.message_text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeChat.full_name}...`} 
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageHub;