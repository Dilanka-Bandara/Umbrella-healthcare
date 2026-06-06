import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Included every possible icon to prevent white screen crashes
import { CreditCard, Smartphone, Wallet, Lock, ShieldCheck, MapPin, Truck, AlertCircle, ArrowLeft, CheckCircle, Loader2, Plus, Pill } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve the cart data passed from PharmacyCart securely
  const { cart = [], subtotal = 0, deliveryFee = 0, total = 0 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [savedCard, setSavedCard] = useState('visa-4242');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    email: '', phone: '',
    firstName: '', lastName: '', address1: '', city: '', zip: '',
  });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Protect route if no cart data exists
  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Items in Checkout</h2>
        <p className="text-gray-500 mb-4 text-sm">Please return to the pharmacy to select medications.</p>
        <button onClick={() => navigate('/prescription-cart')} className="text-indigo-600 font-bold hover:underline">Return to Pharmacy</button>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsCheckingOut(true);

    const itemsToBuy = cart.map(item => ({
        prescription_id: item.prescription_id,
        buy_quantity: item.buy_quantity
    }));

    const fullAddress = `${formData.address1}, ${formData.city}, ${formData.zip}`;

    try {
      await axios.post('http://localhost:5000/api/pharmacy/checkout', {
        items: itemsToBuy,
        total_paid: total,
        delivery_address: fullAddress || 'Address not provided'
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3500);
    } catch (error) {
      alert("Payment failed. Please check your details and try again.");
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
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Order Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your payment of ${total.toFixed(2)} was successful. We have emailed your receipt.</p>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/prescription-cart')} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Secure Checkout</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Complete your prescription purchase.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDE: Forms */}
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6 flex-1">
            
            {/* 1. Customer Information */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">1. Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                  <input type="email" required name="email" value={formData.email} onChange={handleInputChange} placeholder={currentUser?.email || "Email"} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                  <input type="tel" required name="phone" value={formData.phone} onChange={handleInputChange} placeholder="For delivery updates" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">2. Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">First Name</label>
                  <input type="text" required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Last Name</label>
                  <input type="text" required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Address Line 1</label>
                  <input type="text" required name="address1" value={formData.address1} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">City</label>
                  <input type="text" required name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Postal Code</label>
                  <input type="text" required name="zip" value={formData.zip} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Shipping Method */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Standard Delivery</p>
                      <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">Estimated delivery: Tomorrow by 8:00 PM</p>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 3. Payment Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">3. Payment Method</h2>
              
              <div className="flex gap-2 mb-6">
                <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${paymentMethod === 'card' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <CreditCard className="h-5 w-5" /> Card
                </button>
                <button type="button" onClick={() => setPaymentMethod('digital')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${paymentMethod === 'digital' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <Smartphone className="h-5 w-5" /> Apple Pay
                </button>
                <button type="button" onClick={() => setPaymentMethod('wallet')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${paymentMethod === 'wallet' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <Wallet className="h-5 w-5" /> PayPal
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-in fade-in">
                  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${savedCard === 'visa-4242' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${savedCard === 'visa-4242' ? 'border-indigo-600' : 'border-gray-400'}`}>
                        {savedCard === 'visa-4242' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                      </div>
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                      <div>
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">Visa ending in 4242</span>
                        <span className="block text-xs text-gray-500">Expires 12/28</span>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${savedCard === 'new' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${savedCard === 'new' ? 'border-indigo-600' : 'border-gray-400'}`}>
                        {savedCard === 'new' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                      </div>
                      <Plus className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Add new card</span>
                    </div>
                  </label>

                  {savedCard === 'new' && (
                    <div className="space-y-4 pt-4 animate-in slide-in-from-top-2">
                      <div className="relative">
                        <input type="text" placeholder="Card Number (0000 0000 0000 0000)" className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Expiry (MM/YY)" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="text" placeholder="CVC" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center gap-2">
                    <input type="checkbox" id="billing" checked={sameAsShipping} onChange={() => setSameAsShipping(!sameAsShipping)} className="h-4 w-4 text-indigo-600 rounded" />
                    <label htmlFor="billing" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Billing address is same as shipping</label>
                  </div>
                </div>
              )}

              {paymentMethod === 'digital' && (
                <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl animate-in fade-in bg-gray-50 dark:bg-gray-800/30">
                  <Smartphone className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Apple Pay Selected</p>
                  <p className="text-xs text-gray-500 mt-1">Authenticate via device after clicking Place Order.</p>
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl animate-in fade-in bg-gray-50 dark:bg-gray-800/30">
                  <Wallet className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">PayPal Selected</p>
                  <p className="text-xs text-gray-500 mt-1">You will be redirected to PayPal to complete your purchase.</p>
                </div>
              )}
            </div>

          </form>

          {/* RIGHT SIDE: Order Summary & Place Order */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl sticky top-6">
              
              <h3 className="font-bold text-xl mb-4">Order Summary</h3>
              <div className="text-xs text-gray-500 mb-6 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                You are purchasing <strong>{cart.length}</strong> prescription item(s).
              </div>
              
              <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2">
                {cart.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><Pill className="h-4 w-4" /></div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{c.medicine_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase mt-0.5">Qty: {c.buy_quantity}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black">${(c.buy_quantity * parseFloat(c.price || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <span>Shipping</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400"><Lock className="h-3 w-3 text-gray-500"/> 256-bit SSL</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400"><ShieldCheck className="h-3 w-3 text-gray-500"/> PCI-DSS</div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={isCheckingOut} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 text-lg"
              >
                {isCheckingOut ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : <><Lock className="h-5 w-5" /> Place Order</>}
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-4">By placing this order, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;