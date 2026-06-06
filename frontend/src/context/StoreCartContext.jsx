import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* =========================================================================
 *  STORE CART CONTEXT
 *  Holds the OTC / special-permission shopping cart, separate from the
 *  prescription cart. Persists to localStorage so it survives refreshes.
 * ======================================================================= */

const StoreCartContext = createContext(null);
const STORAGE_KEY = 'umbrella_store_cart';

export const StoreCartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* ignore quota errors */
    }
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicine_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.medicine_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_quantity) }
            : i
        );
      }
      return [
        ...prev,
        {
          medicine_id: product.id,
          name: product.name,
          price: product.price,
          type: product.type,
          dosage: product.dosage,
          image_url: product.image_url,
          max_stock: product.stock_quantity,
          is_special: product.is_special,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((medicine_id, quantity) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.medicine_id === medicine_id
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.max_stock || 99)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((medicine_id) => {
    setCart((prev) => prev.filter((i) => i.medicine_id !== medicine_id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <StoreCartContext.Provider
      value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, itemCount, subtotal }}
    >
      {children}
    </StoreCartContext.Provider>
  );
};

export const useStoreCart = () => {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error('useStoreCart must be used within StoreCartProvider');
  return ctx;
};