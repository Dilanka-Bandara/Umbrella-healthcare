import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Pill, ShieldAlert, ArrowRight, ShoppingBag, Loader2, CheckCircle } from 'lucide-react';
// 🚨 NEW: Import the Global Cart Engine
import { useCart } from '../context/CartContext';

const Shop = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // 🚨 UI State to show the green "Added!" checkmark
  const [addedItems, setAddedItems] = useState({});

  // 🚨 Connect to the Cart Engine
  const { addToCart } = useCart();

  // Safely check authentication
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

  const handleAddToCart = (med) => {
    if (!currentUser) {
      alert("Please log in or create an account to purchase medications securely.");
      navigate('/login');
      return;
    }

    // 🚨 THE FIX: Ensure the item always has a valid ID, regardless of how the database names it.
    const safeMed = { ...med, id: med.id || med.medicine_id || med.name };
    
    // Add to Global Cart Context
    addToCart(safeMed);

    // Give visual feedback by turning the button green for 2 seconds
    setAddedItems(prev => ({ ...prev, [safeMed.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [safeMed.id]: false }));
    }, 2000);
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans py-8">
      
      {/* Clean, Minimalist Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <ShoppingBag className="h-6 w-6 text-blue-600 hidden sm:block" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for medications (e.g., Panadol, Amoxicillin)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMeds.map((med) => {
              const isRx = med.name.toLowerCase().includes('antibiotic') || med.name.toLowerCase().includes('pressure');
              
              // Define the safe ID for rendering the correct button state
              const safeId = med.id || med.medicine_id || med.name;

              return (
                <div key={safeId} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all flex flex-col">
                  
                  {/* Image Placeholder */}
                  <div className="h-40 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center relative">
                    <Pill className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    {isRx ? (
                      <span className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Rx Required
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> OTC
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{med.name}</h3>
                      <span className="font-black text-blue-600">${parseFloat(med.price).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{med.type}</p>
                    
                    {/* Action Buttons */}
                    <div className="mt-auto">
                      {isRx ? (
                        <button 
                          onClick={handleConsultDoctor}
                          className="w-full bg-white dark:bg-gray-800 border border-blue-200 hover:bg-blue-50 text-blue-600 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          Consult Doctor <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAddToCart(med)}
                          // 🚨 THE FIX: Dynamic button styling that turns green when clicked
                          className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            addedItems[safeId] 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white shadow-sm'
                          }`}
                        >
                          {addedItems[safeId] ? (
                            <><CheckCircle className="h-4 w-4" /> Added!</>
                          ) : (
                            'Add to Cart'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;