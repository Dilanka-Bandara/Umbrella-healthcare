import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Pill, CreditCard, ShieldCheck, MapPin, Truck, CheckCircle } from 'lucide-react';
import axios from 'axios';

const PharmacyCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
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
        setCartItems(response.data);
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchCart();
  }, [token]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const deliveryFee = cartItems.length > 0 ? 5.99 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    const prescription_ids = cartItems.map(item => item.prescription_id);

    try {
      await axios.post('http://localhost:5000/api/pharmacy/checkout', {
        prescription_ids,
        total_paid: total,
        delivery_address: address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error("Checkout failed", error);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your payment of ${total.toFixed(2)} was successful. Our pharmacy is preparing your medications for delivery.</p>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-blue-600 h-6 w-6" /> E-Pharmacy Checkout
              </h1>
              <p className="text-sm text-gray-500">Securely purchase your prescribed medications.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Cart Items */}
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <p className="text-center text-gray-500 py-10">Loading your prescriptions...</p>
            ) : cartItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center shadow-sm">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Your Cart is Empty</h3>
                <p className="text-gray-500">You don't have any pending prescriptions from your doctor right now.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 flex items-center gap-3 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-semibold">These medications require authorization. Your doctor's prescription has been automatically applied.</p>
                </div>

                {cartItems.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.medicine_name}</h3>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Authorized by Dr. {item.doctor_name}</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">"{item.instructions}"</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end">
                      <span className="text-2xl font-black">${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right: Checkout Panel */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Prescriptions ({cartItems.length})</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Standard Delivery</span>
                  <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><MapPin className="h-3 w-3"/> Delivery Address</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"></textarea>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Truck className="h-5 w-5" />
                  <span className="text-xs font-bold">Estimated Delivery: Tomorrow by 8:00 PM</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={cartItems.length === 0 || isCheckingOut}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                {isCheckingOut ? 'Processing Payment...' : <><CreditCard className="h-5 w-5" /> Pay & Order Now</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyCart;