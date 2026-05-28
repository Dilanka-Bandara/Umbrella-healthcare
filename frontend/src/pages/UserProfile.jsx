import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CreditCard, Shield, Plus, Check, ArrowLeft } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* NEW: Universal Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
        Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button onClick={() => setActiveTab('personal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'personal' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            <User className="h-5 w-5" /> Personal Details
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSave}>
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input type="text" defaultValue="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none text-gray-900 dark:text-white" />
                  </div>
                </div>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full">
                {isSaved ? <><Check className="h-5 w-5 inline" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;