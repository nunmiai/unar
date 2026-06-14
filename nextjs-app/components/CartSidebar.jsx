import { useEffect, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

export default function CartSidebar({ isOpen, onClose }) {
  const { cart, cartCount, cartSubtotal, cartShipping, cartTotal, removeFromCart, updateQuantity, FREE_SHIPPING_THRESHOLD } =
    useCart();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e8e4df]">
          <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#5a7c65]">
            Your Cart
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[#636e72]">
              <ShoppingCart size={64} strokeWidth={1} className="opacity-30" />
              <p className="text-lg">Your cart is empty</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-[#5a7c65] text-[#5a7c65] rounded-full font-medium hover:bg-[#5a7c65] hover:text-white transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartSubtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="bg-[#5a7c65]/10 rounded-lg p-3 text-sm text-[#5a7c65]">
                  Add ₹{FREE_SHIPPING_THRESHOLD - cartSubtotal} more for{" "}
                  <strong>FREE shipping!</strong>
                </div>
              )}
              {cart.map((item) => (
                <div key={item.name} className="flex gap-4 items-center border-b border-[#e8e4df] pb-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#fdfbf7]">
                    <img
                      src={`/assets/website_assets/mockups/${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/assets/website_assets/logo-circle.png"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#2d3436] truncate">
                      {item.name}
                    </h4>
                    <p className="text-[#5a7c65] font-semibold">₹{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.name, -1)}
                        className="w-7 h-7 rounded-full border border-[#e8e4df] flex items-center justify-center hover:bg-[#5a7c65] hover:text-white hover:border-[#5a7c65] transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.name, 1)}
                        className="w-7 h-7 rounded-full border border-[#e8e4df] flex items-center justify-center hover:bg-[#5a7c65] hover:text-white hover:border-[#5a7c65] transition-all"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#2d3436]">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#e8e4df] bg-[#fdfbf7]">
            <div className="flex justify-between items-center mb-2 text-sm text-[#636e72]">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between items-center mb-3 text-sm text-[#636e72]">
              <span>Shipping</span>
              <span>{cartShipping === 0 ? "FREE" : `₹${cartShipping}`}</span>
            </div>
            <div className="flex justify-between items-center mb-4 font-bold text-[#2d3436] text-lg border-t border-[#e8e4df] pt-3">
              <span>Total</span>
              <span>₹{cartTotal}</span>
            </div>
            <CheckoutButton onClose={onClose} />
            <p className="text-center text-xs text-[#636e72] mt-3">
              🔒 Secure checkout powered by Razorpay
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Lazy import to avoid SSR issues with checkout modal
function CheckoutButton({ onClose }) {
  return (
    <button
      onClick={() => {
        onClose();
        // The checkout dialog is managed in the parent page
        document.dispatchEvent(new CustomEvent("openCheckout"));
      }}
      className="w-full py-3.5 rounded-full bg-[#5a7c65] text-white font-semibold text-base hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      Proceed to Checkout
    </button>
  );
}
