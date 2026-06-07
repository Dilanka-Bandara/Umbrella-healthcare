import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Pill, ShieldAlert, ArrowRight, ShoppingBag, Loader2, Star, CheckCircle } from 'lucide-react';

const Shop = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Safely check if the user is authenticated
  const userStr = localStorage.getItem('user');
  let currentUser = null;
  try {
    currentUser = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (e) {
    currentUser = null;
  }

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/pharmacy/inventory');
        setInventory(res.data);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // 🚨 NEW LOGIC: Require Login to add items to cart!
  const handleAddToCart = (med) => {
    if (!currentUser) {
      alert("Please log in or create an account to purchase medications securely.");
      navigate('/login');
      return;
    }
    // If logged in, proceed with cart logic
    alert(`${med.name} added to your cart!`);
  };

  // 🚨 NEW LOGIC: Require Login to request telehealth prescriptions!
  const handleConsultDoctor = () => {
    if (!currentUser) {
      alert("Please log in to consult a doctor for this prescription medication.");
      navigate('/login');
      return;
    }
    navigate('/connect');
  };

  const filteredMeds = inventory.filter(med => 
    med.name.toLowerCase().includes(search.toLowerCase()) || 
    med.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      
      {/* Storefront Hero Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Digital <span className="text-blue-600">Pharmacy</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Order over-the-counter essentials directly, or request a fast telehealth consultation for prescription medications.
          </p>
          
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for medications, conditions, or vitamins..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-gray-800 border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-600" /> All Products
          </h2>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Filter className="h-4 w-4" /> Filter Catalog
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMeds.map((med) => {
              const isRx = med.name.toLowerCase().includes('antibiotic') || med.name.toLowerCase().includes('pressure');

              return (
                <div key={med.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                  
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden">
                    <Pill className="h-16 w-16 text-gray-300 dark:text-gray-700 group-hover:scale-110 transition-transform duration-500" />
                    {isRx ? (
                      <span className="absolute top-4 left-4 bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="h-3 w-3" /> Rx Required
                      </span>
                    ) : (
                      <span className="absolute top-4 left-4 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle className="h-3 w-3" /> OTC Available
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight pr-2">{med.name}</h3>
                      <span className="font-black text-blue-600 text-lg">${parseFloat(med.price).toFixed(2)}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{med.type}</p>
                    
                    <div className="flex items-center gap-1 mb-6 mt-auto">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <Star className="h-4 w-4 text-gray-300" />
                      <span className="text-xs font-bold text-gray-400 ml-1">(128)</span>
                    </div>

                    {/* Action Buttons */}
                    {isRx ? (
                      <button 
                        onClick={handleConsultDoctor}
                        className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        Consult Doctor <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddToCart(med)}
                        className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                      >
                        <ShoppingBag className="h-4 w-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!isLoading && filteredMeds.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No medications found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;