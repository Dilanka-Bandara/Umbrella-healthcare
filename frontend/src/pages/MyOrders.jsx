import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle, Clock, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing':
        return { icon: Clock, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'Processing' };
      case 'shipped':
        return { icon: Truck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'Shipped' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'Delivered' };
      case 'cancelled':
        return { icon: Package, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'Cancelled' };
      default:
        return { icon: Package, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', text: status || 'Pending' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8 flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Order History</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Track your prescriptions and pharmacy deliveries</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center">
            <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet!</h2>
            <p className="text-gray-500 mb-8 max-w-md">You haven't placed any orders. Visit our pharmacy storefront to browse medications and wellness products.</p>
            <button 
              onClick={() => navigate('/shop')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              Start Shopping <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusData = getStatusDisplay(order.status);
              const StatusIcon = statusData.icon;
              
              return (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="border-b border-gray-100 dark:border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order #{order.id.split('-')[0]}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-xl text-gray-900 dark:text-white">${parseFloat(order.total_amount).toFixed(2)}</span>
                      <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusData.bg} ${statusData.color}`}>
                        <StatusIcon className="h-4 w-4" /> {statusData.text}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Shipping To:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_address}</p>
                      </div>
                    </div>
                    
                    {/* Add tracking ID if it exists */}
                    {order.courier_tracking_id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Tracking ID:</span>
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md">{order.courier_tracking_id}</span>
                      </div>
                    )}
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

export default MyOrders;