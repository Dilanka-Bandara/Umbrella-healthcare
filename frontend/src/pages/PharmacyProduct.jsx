import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStoreCart } from '../context/StoreCartContext';
import {
  ChevronLeft, Pill, Lock, ShieldCheck, AlertTriangle, PackageX, Check,
  Plus, Minus, Loader2, Info, FileText, Clock, ShoppingCart,
} from 'lucide-react';

const API = 'http://localhost:5000/api/store';

const PharmacyProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { addToCart } = useStoreCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  useEffect(() => {
    axios.get(`${API}/product/${id}`, config)
      .then(({ data }) => setProduct(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <PackageX className="h-14 w-14 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Product not found.</p>
        <button onClick={() => navigate('/pharmacy')} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl">Back to Pharmacy</button>
      </div>
    );
  }

  const out = product.stock_state === 'out_of_stock';
  const low = product.stock_state === 'low_stock';
  const canBuySpecial = product.permission?.can_buy;

  const handleAdd = () => {
    if (out) return;
    if (product.is_special && !canBuySpecial) {
      navigate('/pharmacy'); // go back to storefront to run the request flow
      return;
    }
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/pharmacy')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-bold">
          <ChevronLeft className="h-4 w-4" /> Back to Pharmacy
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden h-80 lg:h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Pill className="h-32 w-32 text-indigo-300 dark:text-indigo-700" />
            )}
          </div>

          {/* Details */}
          <div>
            {product.is_special ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full mb-3"><Lock className="h-3 w-3" /> Needs doctor approval</span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full mb-3"><ShieldCheck className="h-3 w-3" /> No prescription needed</span>
            )}

            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">{product.category || 'General'}</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">{product.name}</h1>
            <p className="text-gray-500 mt-1">{product.dosage} · {product.type}{product.brand ? ` · ${product.brand}` : ''}</p>

            <p className="text-3xl font-black text-gray-900 dark:text-white mt-4">{money(product.price)}</p>

            {/* Stock */}
            <div className="mt-3">
              {out ? <span className="text-sm font-bold text-red-600 flex items-center gap-1"><PackageX className="h-4 w-4" /> Out of stock</span>
                : low ? <span className="text-sm font-bold text-amber-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Only {product.stock_quantity} left</span>
                : <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> In stock</span>}
            </div>

            {/* Special permission state */}
            {product.is_special && (
              <div className={`mt-4 rounded-2xl p-4 border ${canBuySpecial ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                {canBuySpecial ? (
                  <p className="text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4" /> Approved — you can purchase this.</p>
                ) : (
                  <p className="text-sm flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /> This medicine requires a doctor's approval. Request it from the pharmacy page, chat with a doctor, and once approved you can buy it here.</p>
                )}
              </div>
            )}

            {/* Quantity + Add */}
            {!out && (!product.is_special || canBuySpecial) && (
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center font-bold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAdd}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30">
                  {added ? <><Check className="h-5 w-5" /> Added!</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
                </button>
              </div>
            )}
            {product.is_special && !canBuySpecial && (
              <button onClick={() => navigate('/pharmacy')}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <Lock className="h-5 w-5" /> Request Approval
              </button>
            )}

            {/* Info sections */}
            <div className="mt-8 space-y-4">
              {product.description && (
                <InfoBlock icon={FileText} title="Description" text={product.description} />
              )}
              {product.usage_instructions && (
                <InfoBlock icon={Info} title="How to use" text={product.usage_instructions} />
              )}
              {product.warnings && (
                <InfoBlock icon={AlertTriangle} title="Warnings" text={product.warnings} warning />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBlock = ({ icon: Icon, title, text, warning }) => (
  <div className={`rounded-2xl p-4 border ${warning ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
    <p className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${warning ? 'text-red-600' : 'text-gray-500'}`}>
      <Icon className="h-3.5 w-3.5" /> {title}
    </p>
    <p className={`text-sm leading-relaxed ${warning ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>{text}</p>
  </div>
);

export default PharmacyProduct;