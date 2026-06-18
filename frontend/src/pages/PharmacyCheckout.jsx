import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useStoreCart } from '../context/StoreCartContext';
import {
  ShoppingBag, Truck, CreditCard, Lock, Loader2, Check, ChevronLeft,
  Pill, Home, ChevronRight,
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api/store`;

const PharmacyCheckout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { cart, subtotal, clearCart, itemCount } = useStoreCart();

  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('card');
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(null);

  const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 4.99;
  const total = subtotal + shipping;

  const placeOrder = async () => {
    if (!address.trim()) return alert('Please enter a delivery address.');
    setPlacing(true);
    try {
      const { data } = await axios.post(`${API}/checkout`, {
        cart: cart.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
        shipping_address: address.trim(),
      }, config);
      clearCart();
      setDone(data);
    } catch (e) {
      alert(e.response?.data?.message || 'Checkout failed.');
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 max-w-md w-full rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5"><Check className="h-8 w-8" /></div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-1">{done.message}</p>
          <p className="text-sm font-mono text-gray-400 mb-6">Order #{String(done.order_id).split('-')[0]}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/pharmacy/orders')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full">Track Order</button>
            <button onClick={() => navigate('/pharmacy')} className="flex-1 border border-gray-200 dark:border-gray-700 font-bold py-3 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Keep Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-4">Your cart is empty.</p>
          <button onClick={() => navigate('/pharmacy')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full">Browse Pharmacy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <Link to="/" className="hover:text-blue-600 flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/pharmacy" className="hover:text-blue-600">Pharmacy</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-600 dark:text-gray-300 font-semibold">Checkout</span>
      </div>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-blue-600" /> Delivery Address</h2>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Full delivery address, including postal code…"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </section>

          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" /> Payment Method</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['card', 'paypal', 'applepay'].map((m) => (
                <button key={m} onClick={() => setPayment(m)}
                  className={`py-3 rounded-xl text-xs font-bold border capitalize transition-colors ${payment === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {m === 'applepay' ? 'Apple Pay' : m}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" /> Payment is simulated in this demo. For production, integrate Stripe so card data never touches your server.
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm sticky top-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cart.map((i) => (
                <div key={i.medicine_id} className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center shrink-0"><Pill className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 dark:text-white truncate">{i.name}</p><p className="text-xs text-gray-500">Qty {i.quantity}</p></div>
                  <span className="text-sm font-bold">{money(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : money(shipping)}</span></div>
              <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800"><span>Total</span><span>{money(total)}</span></div>
            </div>
            <button onClick={placeOrder} disabled={placing}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
              {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              {placing ? 'Placing Order…' : `Pay ${money(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyCheckout;