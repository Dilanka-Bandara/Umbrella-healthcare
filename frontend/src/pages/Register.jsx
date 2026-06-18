import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Stethoscope, Mail, Lock, Phone, FileText, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
  });
  
  // File state for doctors
  const [licenseFile, setLicenseFile] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let licenseUrl = '';

      // 1. If it's a doctor, we must upload the license to Cloudinary first!
      if (role === 'doctor') {
        if (!licenseFile) {
          setError('Doctors must upload a valid medical license.');
          setIsLoading(false);
          return;
        }
        
        const uploadData = new FormData();
        uploadData.append('document', licenseFile);
        
        const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, uploadData);
        licenseUrl = uploadRes.data.file_url;
      }

      // 2. Send the full registration package to the database
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        role,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        medical_license_url: licenseUrl
      });

      // 3. Success! Redirect them to the Login page
      alert(response.data.message); 
      navigate('/login');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        {/* NEW: Universal Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group absolute top-8 left-8 sm:static sm:mb-4"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create an Account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join Umbrella Health today.</p>
        </div>

        {/* Role Toggle Switch */}
        <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'patient' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <User className="h-4 w-4" /> Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'doctor' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Stethoscope className="h-4 w-4" /> Doctor
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl text-center font-medium border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input name="full_name" type="text" required onChange={handleInputChange} placeholder="Full Name" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>
            
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input name="email" type="email" required onChange={handleInputChange} placeholder="Email Address" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>

            <div className="relative">
              <Phone className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input name="phone_number" type="tel" required onChange={handleInputChange} placeholder="Phone Number" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>

            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input name="password" type="password" required onChange={handleInputChange} placeholder="Password" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>

            {/* Dynamic Doctor Field */}
            {role === 'doctor' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Medical License (Required)
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setLicenseFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 transition-all cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;