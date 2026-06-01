import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Pill, CreditCard, ShieldCheck, MapPin, Truck, CheckCircle, AlertTriangle, Minus, Plus } from 'lucide-react';
import axios from 'axios';

const PharmacyCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [buyQuantities, setBuyQuantities] = useState({}); // Tracks how much the user wants to buy of each
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState('123 Health Ave, Medical District, NY');
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/pharmacy/my-cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Initialize default buy quantities to the MAX allowed remaining
        const initialQuantities = {};
        response.data.forEach(item => {
            initialQuantities[item.prescription_id] = item.total_quantity - item.purchased_quantity;
        });
        
        setBuyQuantities(initialQuantities);
        setCartItems(response.data);
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchCart();
  }, [token]);

  const updateQuantity = (id, newAmount, maxAllowed) => {
    if (newAmount < 1 || newAmount > maxAllowed) return;
    setBuyQuantities(prev => ({ ...prev, [id]: newAmount }));
  };

  // Calculate dynamic totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * buyQuantities[item.prescription_id]), 0);
  const deliveryFee = cartItems.length > 0 ? 5.99 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    const itemsToBuy = cartItems.map(item => ({
        prescription_id: item.prescription_id,
        buy_quantity: buyQuantities[item.prescription_id]
    }));

    try {
      await axios.post('http://localhost:5000/api/pharmacy/checkout', {
        items: itemsToBuy,
        total_paid: total,
        delivery_address: address
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
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
          <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your payment of ${total.toFixed(2)} was successful.</p>
          <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-blue-600 h-6 w-6" /> E-Pharmacy Cart</h1>
            <p className="text-sm text-gray-500">Manage partial fulfillments and secure checkout.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <p className="text-center text-gray-500 py-10">Loading your prescriptions...</p>
            ) : cartItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center shadow-sm">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Active Prescriptions</h3>
                <p className="text-gray-500">You don't have any pending or remaining prescriptions.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 flex items-center gap-3 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-semibold">You may purchase all of your medicine now, or buy a smaller amount and save the rest for later.</p>
                </div>

                {cartItems.map((item, idx) => {
                  const maxAllowed = item.total_quantity - item.purchased_quantity;
                  const currentBuy = buyQuantities[item.prescription_id] || 1;
                  const daysLeft = Math.ceil((new Date(item.valid_until) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.medicine_name}</h3>
                          <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-2 py-1 rounded-md flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3"/> Expires in {daysLeft} Days
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-3">Authorized by Dr. {item.doctor_name}</p>
                        
                        <div className="flex gap-4 text-sm font-semibold bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-fit">
                           <div className="text-gray-500">Total Rx: <span className="text-gray-900 dark:text-white">{item.total_quantity}</span></div>
                           <div className="text-emerald-600">Already Bought: <span>{item.purchased_quantity}</span></div>
                           <div className="text-blue-600">Remaining Limit: <span>{maxAllowed}</span></div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
                        <div className="text-2xl font-black mb-4">${(parseFloat(item.price) * currentBuy).toFixed(2)}</div>
                        
                        <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                          <button onClick={() => updateQuantity(item.prescription_id, currentBuy - 1, maxAllowed)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Minus className="h-4 w-4"/></button>
                          <span className="font-bold text-blue-600 dark:text-blue-400 w-6 text-center">{currentBuy}</span>
                          <button onClick={() => updateQuantity(item.prescription_id, currentBuy + 1, maxAllowed)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Plus className="h-4 w-4"/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="w-full lg:w-[400px]">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Medicine Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={cartItems.length === 0 || isCheckingOut} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg">
                {isCheckingOut ? 'Processing Payment...' : <><CreditCard className="h-5 w-5" /> Secure Checkout</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyCart;