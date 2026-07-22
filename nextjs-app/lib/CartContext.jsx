import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

const SHIPPING_COST = 100;
const FREE_SHIPPING_THRESHOLD = 900;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  // appliedCoupon shape: { code, discountPercent, description } | null

  useEffect(() => {
    try {
      const stored = localStorage.getItem("unarCart");
      if (stored) setCart(JSON.parse(stored));
    } catch { }
  }, []);

  const saveCart = useCallback((newCart) => {
    setCart(newCart);
    localStorage.setItem("unarCart", JSON.stringify(newCart));
  }, []);

  const addToCart = useCallback(
    (product, quantityToAdd = 1) => {
      setCart((prev) => {
        const productId = product.id || product.name;
        const existing = prev.find((item) => (item.id || item.name) === productId);
        const next = existing
          ? prev.map((item) =>
            (item.id || item.name) === productId
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          )
          : [...prev, { ...product, id: productId, quantity: quantityToAdd }];
        localStorage.setItem("unarCart", JSON.stringify(next));
        return next;
      });
      toast.success(quantityToAdd > 1 ? `${quantityToAdd} x ${product.name} added to cart!` : `${product.name} added to cart!`);
    },
    []
  );

  const removeFromCart = useCallback((idOrName) => {
    setCart((prev) => {
      const next = prev.filter((item) => (item.id || item.name) !== idOrName);
      localStorage.setItem("unarCart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQuantity = useCallback((idOrName, change) => {
    setCart((prev) => {
      const item = prev.find((i) => (i.id || i.name) === idOrName);
      if (!item) return prev;
      const newQty = item.quantity + change;
      const next =
        newQty <= 0
          ? prev.filter((i) => (i.id || i.name) !== idOrName)
          : prev.map((i) =>
            (i.id || i.name) === idOrName ? { ...i, quantity: newQty } : i
          );
      localStorage.setItem("unarCart", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("unarCart");
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const cartShipping =
    cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : cart.length > 0 ? SHIPPING_COST : 0;

  // Coupon discount — applied to subtotal only (before shipping)
  const discountAmount = appliedCoupon
    ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  const discountedSubtotal = cartSubtotal - discountAmount;
  const cartTotal = discountedSubtotal + cartShipping;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        cartShipping,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        SHIPPING_COST,
        FREE_SHIPPING_THRESHOLD,
        appliedCoupon,
        setAppliedCoupon,
        discountAmount,
        discountedSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
