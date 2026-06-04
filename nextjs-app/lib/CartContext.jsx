import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

const SHIPPING_COST = 80;
const FREE_SHIPPING_THRESHOLD = 1000;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("unarCart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
  }, []);

  const saveCart = useCallback((newCart) => {
    setCart(newCart);
    localStorage.setItem("unarCart", JSON.stringify(newCart));
  }, []);

  const addToCart = useCallback(
    (product) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.name === product.name);
        const next = existing
          ? prev.map((item) =>
              item.name === product.name
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prev, { ...product, quantity: 1 }];
        localStorage.setItem("unarCart", JSON.stringify(next));
        return next;
      });
      toast.success(`${product.name} added to cart!`);
    },
    []
  );

  const removeFromCart = useCallback((name) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.name !== name);
      localStorage.setItem("unarCart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQuantity = useCallback((name, change) => {
    setCart((prev) => {
      const item = prev.find((i) => i.name === name);
      if (!item) return prev;
      const newQty = item.quantity + change;
      const next =
        newQty <= 0
          ? prev.filter((i) => i.name !== name)
          : prev.map((i) =>
              i.name === name ? { ...i, quantity: newQty } : i
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
  const cartTotal = cartSubtotal + cartShipping;

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
