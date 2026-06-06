import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, Truck, CheckCircle, Clock, X, Loader2, Pill, ChevronLeft, MapPin,
} from 'lucide-react';

const API = 'http://localhost:5000/api/store';

const STATUS_STEPS = ['processing', 'verified', 'shipped', 'delivered'];

const PharmacyOrders = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  useEffect(() => {
    axios.get(`${API}/orders`, config)
      .then(({ data }) => setOrders(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusIndex = (s) => {
    const i = STATUS_STEPS.indexOf((s || '').toLowerCase());
    return i === -1 ? 0 : i;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/pharmacy')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-bold">
          <ChevronLeft className="h-4 w-4" /> Back to Pharmacy
        </button>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
            <Package className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <button onClick={() => navigate('/pharmacy')} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl">Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((o) => {
              const cancelled = (o.status || '').toLowerCase() === 'cancelled';
              const idx = statusIndex(o.status);
              return (
                <div key={o.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-xs text-gray-400">Order #{String(o.id).split('-')[0]}</p>
                      <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <span className="font-black text-lg text-gray-900 dark:text-white">{money(o.total_amount)}</span>
                  </div>

                  {/* Tracking progress */}
                  {cancelled ? (
                    <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2 mb-4">
                      <X className="h-4 w-4" /> This order was cancelled.
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-5 px-2">
                      {STATUS_STEPS.map((step, i) => {
                        const reached = i <= idx;
                        const Icon = [Clock, CheckCircle, Truck, Package][i];
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1">
                              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${reached ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className={`text-[10px] font-bold capitalize ${reached ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-1 mx-1 rounded ${i < idx ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-800'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center"><Pill className="h-4 w-4" /></div>
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{it.medicine_name || 'Item'}</span>
                        <span className="text-xs text-gray-400">×{it.quantity}</span>
                        <span className="text-sm font-bold">{money(it.price_at_purchase * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {o.courier_tracking_id && (
                    <p className="mt-4 text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Tracking: <span className="font-mono font-bold">{o.courier_tracking_id}</span></p>
                  )}
                  <p className="mt-3 text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {o.shipping_address}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyOrders;