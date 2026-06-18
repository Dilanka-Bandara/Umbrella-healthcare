import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageSearch, Truck, CheckCircle, Clock, Search, Send, Loader2 } from 'lucide-react';

const FulfillmentDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Tracking states for individual rows
  const [trackingInputs, setTrackingInputs] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackingChange = (orderId, value) => {
    setTrackingInputs(prev => ({ ...prev, [orderId]: value }));
  };

  const handleShipOrder = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('token');
      const trackingId = trackingInputs[orderId] || null;

      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, 
        { status: 'shipped', courier_tracking_id: trackingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh list to show new status
      await fetchOrders();
    } catch (error) {
      alert("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="h-3 w-3"/> Processing</span>;
      case 'shipped': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Truck className="h-3 w-3"/> Shipped</span>;
      case 'delivered': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="h-3 w-3"/> Delivered</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold w-max">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 font-sans transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between bg-blue-600 rounded-3xl p-8 shadow-lg shadow-blue-500/20 text-white">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <PackageSearch className="h-8 w-8" /> Fulfillment Center
            </h1>
            <p className="font-medium mt-2 text-blue-100">Manage incoming patient orders, print labels, and dispatch packages.</p>
          </div>
          <span className="bg-white/20 px-4 py-2 rounded-xl font-bold backdrop-blur-sm hidden sm:block">
            Admin & Pharmacist Portal
          </span>
        </div>

        {/* Order List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="p-20 text-center text-gray-500 font-medium">No orders found in the system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold">Order Details</th>
                    <th className="p-5 font-bold">Patient & Destination</th>
                    <th className="p-5 font-bold">Status</th>
                    <th className="p-5 font-bold">Fulfillment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="p-5 align-top">
                        <p className="font-mono text-xs text-gray-400 dark:text-gray-500 mb-1">#{order.id.split('-')[0]}</p>
                        <p className="font-black text-gray-900 dark:text-white text-lg">${parseFloat(order.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-5 align-top">
                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {order.patient_name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">{order.patient_email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                          <span className="font-bold block text-xs mb-1">Shipping Address:</span>
                          {order.shipping_address}
                        </p>
                      </td>
                      <td className="p-5 align-top">
                        {getStatusBadge(order.status)}
                        {order.courier_tracking_id && (
                          <div className="mt-3">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Tracking:</span>
                            <span className="font-mono text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{order.courier_tracking_id}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-5 align-top">
                        {order.status === 'processing' ? (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              placeholder="Fedex / UPS Tracking ID" 
                              value={trackingInputs[order.id] || ''}
                              onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500 dark:text-white"
                            />
                            <button 
                              onClick={() => handleShipOrder(order.id)}
                              disabled={updatingId === order.id}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Send className="h-4 w-4" /> Mark as Shipped</>}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Fulfillment Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FulfillmentDashboard;