import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Pill, ShieldAlert, ArrowRight, ShoppingBag, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  
  const [addedItems, setAddedItems] = useState({});
  const { addToCart } = useCart();

  const userStr = localStorage.getItem('user');
  let currentUser = null;
  try { currentUser = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null; } catch (e) { currentUser = null; }

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pharmacy/inventory`);
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
    const safeMed = { ...med, id: med.id || med.medicine_id || med.name };
    addToCart(safeMed);
    setAddedItems(prev => ({ ...prev, [safeMed.id]: true }));
    setTimeout(() => { setAddedItems(prev => ({ ...prev, [safeMed.id]: false })); }, 2000);
  };

  const handleConsultDoctor = () => {
    if (!currentUser) {
      alert("Please log in to consult a doctor for this prescription medication.");
      navigate('/login');
      return;
    }
    navigate('/connect');
  };

  // 🚨 NEW: Advanced Filtering Logic (Search + Category)
  const filteredMeds = inventory.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(search.toLowerCase()) || (med.type && med.type.toLowerCase().includes(search.toLowerCase()));
    
    // Auto-categorize based on keywords if backend category is missing
    let itemCategory = med.category || 'OTC';
    if (med.name.toLowerCase().includes('cream') || med.name.toLowerCase().includes('lotion') || med.name.toLowerCase().includes('serum')) itemCategory = 'Skincare & Cosmetics';
    if (med.name.toLowerCase().includes('vitamin')) itemCategory = 'Vitamins';
    if (med.name.toLowerCase().includes('antibiotic') || med.name.toLowerCase().includes('pressure')) itemCategory = 'Prescription';

    const matchesCategory = activeCategory === 'All' || itemCategory === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Prescription', 'OTC', 'Skincare & Cosmetics', 'Vitamins'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans py-8 transition-colors duration-200">
      
      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <ShoppingBag className="h-6 w-6 text-blue-600 hidden sm:block" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for medicines, creams, cosmetics..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 🚨 NEW: Category Navigation Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 overflow-x-auto pb-2">
        <div className="flex gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' 
                  : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
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
              const isCosmetic = med.name.toLowerCase().includes('cream') || med.name.toLowerCase().includes('serum');
              const safeId = med.id || med.medicine_id || med.name;

              return (
                <div key={safeId} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all flex flex-col">
                  
                  {/* 🚨 UPGRADED: Dynamic Image Support */}
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden group">
                    {med.image_url ? (
                      <img src={med.image_url} alt={med.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Pill className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    )}
                    
                    {/* Professional Badges */}
                    {isRx && (
                      <span className="absolute top-3 left-3 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="h-3 w-3" /> Rx Required
                      </span>
                    )}
                    {!isRx && !isCosmetic && (
                      <span className="absolute top-3 left-3 bg-emerald-100/90 backdrop-blur-sm text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <CheckCircle className="h-3 w-3" /> OTC
                      </span>
                    )}
                    {isCosmetic && (
                      <span className="absolute top-3 left-3 bg-purple-100/90 backdrop-blur-sm text-purple-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Skincare
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight pr-2">{med.name}</h3>
                      <span className="font-black text-blue-600">${parseFloat(med.price).toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                      {med.category || (isCosmetic ? 'Cosmetics' : 'Pharmacy')}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="mt-auto">
                      {isRx ? (
                        <button 
                          onClick={handleConsultDoctor}
                          className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/50 hover:border-blue-300 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          Consult Doctor <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAddToCart(med)}
                          className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            addedItems[safeId] 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white shadow-sm'
                          }`}
                        >
                          {addedItems[safeId] ? <><CheckCircle className="h-4 w-4" /> Added to Cart!</> : 'Add to Cart'}
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