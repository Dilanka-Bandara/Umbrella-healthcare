import React, { useState } from 'react';
import { Package, PlusCircle, Image as ImageIcon, Save, CheckCircle, Loader2, Upload } from 'lucide-react';
import axios from 'axios';

const PharmacistDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State matching your Postgres Database
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    type: 'Pill',
    category: 'OTC',
    price: '',
    stock_quantity: '',
    requires_prescription: false,
    image: null
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      // Create a local preview of the uploaded image
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this sends a FormData object to your uploadController
      // For now, we simulate the network request
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      
      const token = localStorage.getItem('token');
      // Simulated API Call
      // await axios.post('http://localhost:5000/api/pharmacy/inventory', data, { headers: { Authorization: `Bearer ${token}` } });
      
      setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          setFormData({ name: '', dosage: '', type: 'Pill', category: 'OTC', price: '', stock_quantity: '', requires_prescription: false, image: null });
          setImagePreview(null);
        }, 3000);
      }, 1500);

    } catch (error) {
      console.error("Failed to add product", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between bg-emerald-600 rounded-3xl p-8 shadow-lg shadow-emerald-500/20 text-white">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Package className="h-8 w-8" /> Inventory Manager
            </h1>
            <p className="font-medium mt-2 text-emerald-100">Add and manage storefront items, cosmetics, and medications.</p>
          </div>
          <span className="bg-white/20 px-4 py-2 rounded-xl font-bold backdrop-blur-sm hidden sm:block">
            Pharmacist Portal
          </span>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-center gap-2 mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
            <PlusCircle className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Hydrating Face Serum" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Instructions / Dosage</label>
                  <input required type="text" name="dosage" value={formData.dosage} onChange={handleInputChange} placeholder="e.g. Apply 2 drops daily" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                      <option value="OTC">OTC (Over The Counter)</option>
                      <option value="Prescription">Prescription (Rx)</option>
                      <option value="Skincare & Cosmetics">Skincare & Cosmetics</option>
                      <option value="Vitamins">Vitamins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                    <input required type="text" name="type" value={formData.type} onChange={handleInputChange} placeholder="e.g. Cream, Pill, Serum" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Price ($)</label>
                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Stock Quantity</label>
                    <input required type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} placeholder="100" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl cursor-pointer">
                  <input type="checkbox" name="requires_prescription" checked={formData.requires_prescription} onChange={handleInputChange} className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-500">Requires Doctor's Prescription (Rx)</span>
                </label>
              </div>

              {/* Right Column: Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Image</label>
                <div className="h-[300px] w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="h-16 w-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold flex items-center gap-2"><Upload className="h-5 w-5"/> Change Photo</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  success ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white shadow-md'
                }`}
              >
                {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading to Cloudinary...</> : 
                 success ? <><CheckCircle className="h-5 w-5" /> Product Added to Shop!</> : 
                 <><Save className="h-5 w-5" /> Save Product to Database</>}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;