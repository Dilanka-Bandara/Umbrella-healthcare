import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Truck, CheckCircle, Clock, ArrowLeft, Loader2, MapPin } from 'lucide-react';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:5000/api/orders/my-orders', config);
        setOrders(res.data);
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchOrders();
    else navigate('/login');
  }, [token, navigate]);

  // Helper function to render the correct status badge
  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3"/> Delivered</span>;
      case 'shipped':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck className="h-3 w-3"/> Shipped</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">Cancelled</span>;
      default: // pending or processing
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="h-3 w-3"/> Processing</span>;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-600" /> Order History
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Track your pharmacy purchases and shipments.</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center border border-gray-200 dark:border-gray-800 shadow-sm">
              <Package className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Orders Found</h2>
              <p className="text-gray-500 mb-6">You haven't placed any pharmacy orders yet.</p>
              <button onClick={() => navigate('/shop')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">Browse Pharmacy</button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 border-b border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Order Placed</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="font-semibold text-gray-900 dark:text-white">${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Order ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">#{order.id.split('-')[0]}</p>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    {renderStatusBadge(order.status)}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">Pharmacy Delivery</h3>
                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      <p>{order.delivery_address || 'Standard Delivery Address'}</p>
                    </div>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 rounded-xl font-bold text-sm transition-colors">
                    View Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;