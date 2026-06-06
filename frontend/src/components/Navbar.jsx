import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStoreCart } from '../context/StoreCartContext';
import {
  Search, ShoppingCart, Plus, Minus, X, Pill, Lock, ShieldCheck,
  AlertTriangle, PackageX, Loader2, ChevronRight, Trash2, Info,
  Stethoscope, MessageSquare, Filter, Check, Clock,
} from 'lucide-react';

const API = 'http://localhost:5000/api/store';

const Pharmacy = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, itemCount, subtotal } = useStoreCart();

  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [otcOnly, setOtcOnly] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [permissionModal, setPermissionModal] = useState(null); // product needing permission

  const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (sort) params.set('sort', sort);
      if (otcOnly) params.set('otc_only', 'true');
      const { data } = await axios.get(`${API}/catalog?${params.toString()}`, config);
      setCatalog(data.items || []);
    } catch (e) {
      console.error('catalog error', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory, sort, otcOnly]);

  useEffect(() => {
    axios.get(`${API}/categories`, config).then(({ data }) => setCategories(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchCatalog, 250); // debounce search
    return () => clearTimeout(t);
  }, [fetchCatalog]);

  const handleAdd = (product) => {
    if (product.stock_state === 'out_of_stock') return;
    if (product.is_special) {
      // Needs doctor permission — open the request flow
      setPermissionModal(product);
      return;
    }
    addToCart(product, 1);
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ===== HERO / HEADER ===== */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Umbrella Pharmacy</h1>
              <p className="text-indigo-100 mt-2 max-w-lg">
                Everyday health essentials, delivered. Prescription-restricted items require doctor approval.
              </p>
            </div>
            <button onClick={() => setCartOpen(true)}
              className="relative bg-white/15 hover:bg-white/25 backdrop-blur p-4 rounded-2xl transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-black h-6 w-6 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines, brands, symptoms…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-900 outline-none shadow-lg focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ===== FILTER BAR ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto flex-1 pb-1">
            <CategoryChip label="All" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
            {categories.map((c) => (
              <CategoryChip key={c.category} label={`${c.category} (${c.count})`}
                active={activeCategory === c.category} onClick={() => setActiveCategory(c.category)} />
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setOtcOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                otcOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'
              }`}>
              <ShieldCheck className="h-3.5 w-3.5" /> No prescription only
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none cursor-pointer">
              <option value="name">Name A–Z</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ===== PRODUCT GRID ===== */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : catalog.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <PackageX className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            No products match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {catalog.map((p) => (
              <ProductCard key={p.id} product={p} money={money}
                onAdd={() => handleAdd(p)}
                onView={() => navigate(`/pharmacy/product/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* ===== CART DRAWER ===== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Your Cart ({itemCount})
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  Your cart is empty.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.medicine_id} className="flex gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                    <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{money(item.price)} each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                          className="h-6 w-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                          className="h-6 w-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.medicine_id)}
                          className="ml-auto text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 dark:text-white">{money(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-black text-lg text-gray-900 dark:text-white">{money(subtotal)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); navigate('/pharmacy/checkout'); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30">
                  Proceed to Checkout <ChevronRight className="h-5 w-5" />
                </button>
                <button onClick={clearCart} className="w-full text-xs text-gray-400 hover:text-red-500">
                  Clear cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SPECIAL-PERMISSION REQUEST MODAL ===== */}
      {permissionModal && (
        <PermissionRequestModal
          product={permissionModal}
          config={config}
          onClose={() => setPermissionModal(null)}
          onChat={(doctorId) => {
            setPermissionModal(null);
            // Open your existing chat with this doctor
            navigate(`/encounter/${doctorId}`);
          }}
        />
      )}
    </div>
  );
};

/* ===================== PRODUCT CARD ===================== */
const ProductCard = ({ product, money, onAdd, onView }) => {
  const out = product.stock_state === 'out_of_stock';
  const low = product.stock_state === 'low_stock';

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col group">
      <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center cursor-pointer"
        onClick={onView}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Pill className="h-16 w-16 text-indigo-300 dark:text-indigo-700 group-hover:scale-110 transition-transform" />
        )}
        {/* Tier badge */}
        {product.is_special ? (
          <span className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
            <Lock className="h-3 w-3" /> Needs approval
          </span>
        ) : (
          <span className="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> No prescription
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{product.category || 'General'}</p>
        <h3 className="font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-indigo-600" onClick={onView}>
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{product.dosage} · {product.type}</p>

        {/* Stock state */}
        <div className="mt-2 mb-3">
          {out ? (
            <span className="text-xs font-bold text-red-600 flex items-center gap-1"><PackageX className="h-3.5 w-3.5" /> Out of stock</span>
          ) : low ? (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Only {product.stock_quantity} left</span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> In stock</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-black text-gray-900 dark:text-white">{money(product.price)}</span>
          <button onClick={onAdd} disabled={out}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
              out
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : product.is_special
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            {product.is_special ? <><Lock className="h-3.5 w-3.5" /> Request</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===================== CATEGORY CHIP ===================== */
const CategoryChip = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-300'
    }`}>
    {label}
  </button>
);

/* ===================== PERMISSION REQUEST MODAL ===================== */
const PermissionRequestModal = ({ product, config, onClose, onChat }) => {
  const [step, setStep] = useState('intro'); // intro | doctors | sent
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentDoctorId, setSentDoctorId] = useState(null);

  const loadDoctors = async () => {
    setStep('doctors');
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/permission/doctors`, config);
      setDoctors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/permission/request`, {
        medicine_id: product.id,
        doctor_id: selectedDoctor,
        patient_note: note,
      }, config);
      setSentDoctorId(data.doctor_id || selectedDoctor);
      setStep('sent');
    } catch (e) {
      alert(e.response?.data?.message || 'Could not send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6" />
            <h2 className="text-lg font-bold">Doctor Approval Required</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl p-4">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{product.name}</strong> needs a doctor's approval before purchase. A doctor will
                  review your needs over chat, then approve or decline. Once approved, you can buy it normally.
                </p>
              </div>
              <ol className="space-y-3 text-sm">
                <Step n="1" text="Choose a doctor (one you're connected with, or a specialist)." />
                <Step n="2" text="Chat with them about why you need this medicine." />
                <Step n="3" text="Once they approve, the item unlocks for checkout." />
              </ol>
              <button onClick={loadDoctors}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
                Choose a Doctor <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 'doctors' && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Select a doctor to review your request:</p>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
              ) : doctors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No doctors available right now.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {doctors.map((d) => (
                    <button key={d.id} onClick={() => setSelectedDoctor(d.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${
                        selectedDoctor === d.id
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300'
                      }`}>
                      <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Dr. {d.full_name}</p>
                        <p className="text-[11px] text-gray-500">
                          {d.source === 'connected' ? 'Your doctor' : d.source === 'specialist' ? 'Specialist' : 'Available'} · {d.clinic_id || '—'}
                        </p>
                      </div>
                      {selectedDoctor === d.id && <Check className="h-5 w-5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              )}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Briefly, why do you need this? (optional)"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              <button onClick={submit} disabled={!selectedDoctor || loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Request'}
              </button>
            </div>
          )}

          {step === 'sent' && (
            <div className="text-center space-y-5 py-2">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Request Sent!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Now chat with the doctor so they can review your request. You'll be able to buy
                  <strong> {product.name}</strong> once they approve.
                </p>
              </div>
              <button onClick={() => onChat(sentDoctorId)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" /> Chat with Doctor Now
              </button>
              <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">I'll do it later</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Step = ({ n, text }) => (
  <li className="flex items-start gap-3">
    <span className="h-6 w-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">{n}</span>
    <span className="text-gray-600 dark:text-gray-400">{text}</span>
  </li>
);

export default Pharmacy;