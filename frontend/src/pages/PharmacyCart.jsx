import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Pill, AlertTriangle, Minus, Plus, Archive, ArrowRight, Loader2, Trash2, Calendar, UserCheck, Activity } from 'lucide-react';
import axios from 'axios';

const PharmacyCart = () => {
  const navigate = useNavigate();
  
  const [vaultItems, setVaultItems] = useState([]); 
  const [cart, setCart] = useState([]); 
  const [stagingQuantities, setStagingQuantities] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/pharmacy/my-cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!Array.isArray(response.data)) return;

        const initialStaging = {};
        response.data.forEach(item => {
            const maxAllowed = (item.total_quantity || 1) - (item.purchased_quantity || 0);
            initialStaging[item.prescription_id] = maxAllowed > 0 ? 1 : 0; 
        });
        
        setStagingQuantities(initialStaging);
        setVaultItems(response.data);
      } catch (error) {
        console.error("Error fetching vault:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchVault();
  }, [token]);

  const updateStagingQuantity = (id, newAmount, maxAllowed) => {
    if (newAmount < 1 || newAmount > maxAllowed) return;
    setStagingQuantities(prev => ({ ...prev, [id]: newAmount }));
  };

  const addToCart = (vaultItem) => {
    const buyQty = stagingQuantities[vaultItem.prescription_id] || 1;
    const existingCartItem = cart.find(c => c.prescription_id === vaultItem.prescription_id);
    if (existingCartItem) {
      setCart(cart.map(c => c.prescription_id === vaultItem.prescription_id ? { ...c, buy_quantity: buyQty } : c));
    } else {
      setCart([...cart, { ...vaultItem, buy_quantity: buyQty }]);
    }
  };

  const removeFromCart = (prescription_id) => {
    setCart(cart.filter(c => c.prescription_id !== prescription_id));
  };

  const subtotal = (cart || []).reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.buy_quantity || 1)), 0);
  const deliveryFee = cart.length > 0 ? 5.99 : 0;
  const total = subtotal + deliveryFee;

  // 🚨 NEW: Proceed to Checkout Navigation
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    // Pass the cart data to the checkout page securely
    navigate('/checkout', { state: { cart, subtotal, deliveryFee, total } });
  };

  const vaultByTurn = vaultItems.reduce((groups, item) => {
    const groupKey = item.consultation_id || `${item.doctor_name}-${item.prescribed_on}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        turnId: groupKey,
        doctor_name: item.doctor_name,
        prescribed_on: item.prescribed_on,
        diagnosis: item.diagnosis || 'General Treatment',
        medicines: []
      };
    }
    groups[groupKey].medicines.push(item);
    return groups;
  }, {});
  const vaultChannels = Object.values(vaultByTurn);

  const cartByTurn = cart.reduce((groups, item) => {
    const groupKey = item.consultation_id || `${item.doctor_name}-${item.prescribed_on}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        turnId: groupKey,
        doctor_name: item.doctor_name,
        prescribed_on: item.prescribed_on,
        diagnosis: item.diagnosis || 'General Treatment',
        medicines: []
      };
    }
    groups[groupKey].medicines.push(item);
    return groups;
  }, {});
  const cartChannels = Object.values(cartByTurn);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Pharmacy Center</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Manage your pending refills and active orders.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE: The Prescription Vault */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              <Archive className="h-6 w-6" />
              <div>
                <h3 className="font-bold">My Prescription Vault</h3>
                <p className="text-xs">Your medications are neatly categorized by visit dates and attending physicians.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
            ) : vaultChannels.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-sm">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Vault is Empty</h3>
                <p className="text-gray-500 text-sm">You have no remaining prescriptions available to purchase.</p>
              </div>
            ) : (
              vaultChannels.map((channel) => (
                <div key={channel.turnId} className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-600" /> {new Date(channel.prescribed_on).toLocaleDateString()}</div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5"><UserCheck className="h-4 w-4 text-emerald-600" /> Dr. {channel.doctor_name}</div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5"/> {channel.diagnosis}
                    </span>
                  </div>

                  <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-indigo-500/20">
                    {channel.medicines.map((item) => {
                      const maxAllowed = (item.total_quantity || 1) - (item.purchased_quantity || 0);
                      const currentStaged = stagingQuantities[item.prescription_id] || 1;
                      const isInCart = cart.some(c => c.prescription_id === item.prescription_id);
                      
                      const expireDate = new Date(item.valid_until);
                      const daysLeft = isNaN(expireDate.getTime()) ? 'N/A' : Math.ceil((expireDate - new Date()) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={item.prescription_id} className={`bg-white dark:bg-gray-900 border-2 rounded-3xl p-5 shadow-sm transition-all ${isInCart ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-800'}`}>
                          <div className="flex flex-col sm:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{item.medicine_name}</h4>
                                {isInCart && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Staged</span>}
                              </div>
                              
                              <div className="flex items-center gap-3 mb-3">
                                {daysLeft !== 'N/A' && daysLeft > 0 ? (
                                   <span className="text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1">
                                     <AlertTriangle className="h-3.5 w-3.5"/> Auth Expires in {daysLeft} Days
                                   </span>
                                ) : (
                                   <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1">
                                     <AlertTriangle className="h-3.5 w-3.5"/> Token Expired
                                   </span>
                                )}
                              </div>
                              
                              <div className="flex gap-4 text-[11px] font-bold bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 w-fit mb-3">
                                <div className="text-gray-500">Allowed: <span>{item.total_quantity || 1}</span></div>
                                <div className="text-blue-600">Purchased: <span>{item.purchased_quantity || 0}</span></div>
                                <div className="text-emerald-600 text-sm">Remaining Balance: <span>{maxAllowed}</span></div>
                              </div>
                              <p className="text-xs text-gray-500 italic bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">Instructions: "{item.instructions}"</p>
                            </div>

                            <div className="flex flex-col items-end justify-between bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 w-full sm:w-48">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Buy Today</p>
                              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-2">${(currentStaged * parseFloat(item.price || 0)).toFixed(2)}</div>
                              
                              <div className="flex items-center justify-between w-full bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 mb-4 shadow-sm">
                                <button onClick={() => updateStagingQuantity(item.prescription_id, currentStaged - 1, maxAllowed)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Minus className="h-3.5 w-3.5 text-gray-500"/></button>
                                <span className="font-black text-gray-900 dark:text-white text-lg w-8 text-center">{currentStaged}</span>
                                <button onClick={() => updateStagingQuantity(item.prescription_id, currentStaged + 1, maxAllowed)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Plus className="h-3.5 w-3.5 text-gray-500"/></button>
                              </div>

                              <button 
                                onClick={() => addToCart(item)}
                                disabled={daysLeft !== 'N/A' && daysLeft <= 0}
                                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${isInCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'}`}
                              >
                                {isInCart ? 'Update Cart' : 'Add to Cart'} <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT SIDE: Cart Summary */}
          <div className="w-full">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl sticky top-6">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <ShoppingCart className="text-indigo-600 h-6 w-6" />
                <h3 className="font-bold text-xl">My Cart</h3>
              </div>
              
              {cartChannels.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 mb-6">
                  <p className="text-gray-500 font-semibold text-sm">Cart is empty.</p>
                  <p className="text-xs text-gray-400 mt-1">Stage items from your prescription channels.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                  {cartChannels.map((channel) => (
                    <div key={channel.turnId} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 border-b border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1"><UserCheck className="h-3 w-3"/> Dr. {channel.doctor_name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Dx: {channel.diagnosis}</span>
                      </div>
                      <div className="p-3 space-y-3">
                        {channel.medicines.map((c, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 relative group">
                            <p className="font-bold text-gray-900 dark:text-white pr-8 text-sm leading-tight">{c.medicine_name}</p>
                            <div className="flex justify-between items-end mt-2">
                              <span className="text-[11px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-bold">Qty: {c.buy_quantity}</span>
                              <span className="text-sm font-black text-gray-900 dark:text-white">${(c.buy_quantity * parseFloat(c.price || 0)).toFixed(2)}</span>
                            </div>
                            <button onClick={() => removeFromCart(c.prescription_id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors bg-white dark:bg-gray-900 rounded-full">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <span>Medicine Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Estimated Total</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* 🚨 NEW: Redirects to the Checkout Page */}
              <button 
                onClick={handleProceedToCheckout} 
                disabled={cart.length === 0} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                Proceed to Checkout <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyCart;