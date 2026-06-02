import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Pill, CreditCard, ShieldCheck, MapPin, Truck, CheckCircle, AlertTriangle, Minus, Plus, Archive, ArrowRight } from 'lucide-react';
import axios from 'axios';

const PharmacyCart = () => {
  const navigate = useNavigate();
  
  // States
  const [vaultItems, setVaultItems] = useState([]); 
  const [cart, setCart] = useState([]); 
  const [stagingQuantities, setStagingQuantities] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/pharmacy/my-cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Safety check to prevent white screens
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    const itemsToBuy = cart.map(item => ({
        prescription_id: item.prescription_id,
        buy_quantity: item.buy_quantity
    }));

    try {
      await axios.post('http://localhost:5000/api/pharmacy/checkout', {
        items: itemsToBuy,
        total_paid: total,
        delivery_address: '123 Health Ave, Medical District, NY'
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3500);
    } catch (error) {
      alert("Payment failed. Please try again.");
      setIsCheckingOut(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in duration-300">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Prescription Ordered!</h2>
          <p className="text-gray-500 mb-6">Your payment of ${total.toFixed(2)} was successful. The pharmacy is preparing your medicine.</p>
          <p className="text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl mb-4">Remaining limits updated in your Vault.</p>
          <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              <Archive className="h-6 w-6" />
              <div>
                <h3 className="font-bold">My Prescription Vault</h3>
                <p className="text-xs">Medicines prescribed by your doctors. Choose exactly how much you want to buy today.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
            ) : vaultItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-sm">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Vault is Empty</h3>
                <p className="text-gray-500 text-sm">You have no remaining prescriptions available to purchase.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vaultItems.map((item) => {
                  const maxAllowed = (item.total_quantity || 1) - (item.purchased_quantity || 0);
                  const currentStaged = stagingQuantities[item.prescription_id] || 1;
                  const isInCart = cart.some(c => c.prescription_id === item.prescription_id);
                  
                  // Safe Date calculation
                  const expireDate = new Date(item.valid_until);
                  const daysLeft = isNaN(expireDate) ? 'N/A' : Math.ceil((expireDate - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={item.prescription_id} className={`bg-white dark:bg-gray-900 border-2 rounded-3xl p-6 shadow-sm transition-all ${isInCart ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-800'}`}>
                      <div className="flex flex-col sm:flex-row justify-between gap-6">
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{item.medicine_name}</h3>
                            {isInCart && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">In Cart</span>}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Dr. {item.doctor_name}</span>
                            {daysLeft !== 'N/A' && daysLeft > 0 && (
                               <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-md flex items-center gap-1">
                                 <AlertTriangle className="h-3 w-3"/> Expires in {daysLeft} Days
                               </span>
                            )}
                          </div>
                          
                          <div className="flex gap-4 text-xs font-bold bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-fit mb-4">
                            <div className="text-gray-500">Doctor Limit: <span className="text-gray-900 dark:text-white text-sm">{item.total_quantity || 1}</span></div>
                            <div className="text-blue-600">Already Bought: <span className="text-sm">{item.purchased_quantity || 0}</span></div>
                            <div className="text-emerald-600">Remaining Balance: <span className="text-sm">{maxAllowed}</span></div>
                          </div>
                          <p className="text-xs text-gray-500 italic">"{item.instructions}"</p>
                        </div>

                        <div className="flex flex-col items-end justify-between bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 w-full sm:w-48">
                          <p className="text-sm font-bold text-gray-500 mb-2">Amount to buy today:</p>
                          
                          <div className="flex items-center justify-between w-full bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 mb-4 shadow-sm">
                            <button onClick={() => updateStagingQuantity(item.prescription_id, currentStaged - 1, maxAllowed)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Minus className="h-4 w-4 text-gray-600 dark:text-gray-300"/></button>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg w-8 text-center">{currentStaged}</span>
                            <button onClick={() => updateStagingQuantity(item.prescription_id, currentStaged + 1, maxAllowed)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Plus className="h-4 w-4 text-gray-600 dark:text-gray-300"/></button>
                          </div>

                          <button 
                            onClick={() => addToCart(item)}
                            className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${isInCart ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                          >
                            {isInCart ? 'Update Cart' : 'Add to Cart'} <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDE: The Shopping Cart */}
          <div className="w-full">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-black/50 sticky top-6">
              
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <ShoppingCart className="text-indigo-600 h-6 w-6" />
                <h3 className="font-bold text-xl">Today's Checkout</h3>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 mb-6">
                  <p className="text-gray-500 font-semibold text-sm">Cart is empty.</p>
                  <p className="text-xs text-gray-400 mt-1">Add items from your vault.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                      <p className="font-bold text-gray-900 dark:text-white pr-8">{c.medicine_name}</p>
                      <p className="text-xs text-indigo-600 font-bold mt-1">Qty: {c.buy_quantity} unit(s)</p>
                      <p className="text-sm font-black mt-2">${(c.buy_quantity * parseFloat(c.price || 0)).toFixed(2)}</p>
                      
                      <button onClick={() => removeFromCart(c.prescription_id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <span>Medicine Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl flex gap-3 text-xs mb-6 border border-emerald-100 dark:border-emerald-800/50">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p><strong>HIPAA Secure.</strong> Your remaining prescription limits will be securely saved in your Vault.</p>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || isCheckingOut} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
              >
                {isCheckingOut ? 'Processing Payment...' : <><CreditCard className="h-5 w-5" /> Pay Securely</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyCart;