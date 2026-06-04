import { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, X, Minus, Plus, Trash2 } from "lucide-react";

const LAMBDA_API_URL =
  "https://vfl2536p7nvialuiwcgt22s6iu0noirr.lambda-url.us-east-1.on.aws";

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, cartSubtotal, cartShipping, cartTotal, clearCart, updateQuantity, removeFromCart } =
    useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const unarUser = JSON.parse(localStorage.getItem("unarUser") || "{}");
      const userId = unarUser.cognito_user_id || null;

      const orderRes = await fetch(`${LAMBDA_API_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          currency: "INR",
          receipt: `unar_${Date.now()}`,
          customer: form,
          items: cart,
          user_id: userId,
          notes: {
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
            address: form.address,
            pincode: form.pincode,
            items: cart.map((i) => `${i.name} x${i.quantity}`).join(", "),
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: "Unar",
        description: "Natural Solid Perfumes",
        image: "/assets/logo.png",
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${LAMBDA_API_URL}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_details: {
                  customer: form,
                  items: cart,
                  subtotal: cartSubtotal,
                  shipping: cartShipping,
                  total: cartTotal,
                },
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              onClose();
              toast.success("Payment successful! Order confirmed.");
              setForm({ name: "", email: "", phone: "", address: "", pincode: "" });
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#5a7c65" },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },
      };

      if (typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          toast.error("Payment failed. Please try again.");
          setLoading(false);
        });
        rzp.open();
      } else {
        toast.error("Payment gateway not loaded. Please refresh.");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto checkout-modal-content">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left – Shipping */}
          <div className="p-8 border-r border-[#e8e4df]">
            <h2 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#2d3436] mb-2">
              Checkout
            </h2>
            <h3 className="font-semibold text-[#636e72] text-sm uppercase tracking-wider mb-6">
              Shipping Information
            </h3>

            <form id="checkoutForm" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="co-name" className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-1.5 block">
                    Full Name *
                  </Label>
                  <Input
                    id="co-name"
                    name="name"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    className="border-[#e8e4df] focus:border-[#5a7c65] focus:ring-[#5a7c65]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="co-email" className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-1.5 block">
                    Email *
                  </Label>
                  <Input
                    id="co-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className="border-[#e8e4df] focus:border-[#5a7c65]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="co-phone" className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-1.5 block">
                  Phone Number *
                </Label>
                <Input
                  id="co-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  className="border-[#e8e4df] focus:border-[#5a7c65]"
                />
              </div>

              <div>
                <Label htmlFor="co-address" className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-1.5 block">
                  Delivery Address *
                </Label>
                <Textarea
                  id="co-address"
                  name="address"
                  required
                  placeholder="House no, Street, Area, City"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  className="border-[#e8e4df] focus:border-[#5a7c65] resize-none"
                />
              </div>

              <div>
                <Label htmlFor="co-pincode" className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-1.5 block">
                  Pincode *
                </Label>
                <Input
                  id="co-pincode"
                  name="pincode"
                  type="text"
                  required
                  placeholder="6-digit pincode"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={handleChange}
                  className="border-[#e8e4df] focus:border-[#5a7c65]"
                />
              </div>
            </form>
          </div>

          {/* Right – Order Review */}
          <div className="p-8 bg-[#fdfbf7]">
            <h3 className="font-semibold text-[#636e72] text-sm uppercase tracking-wider mb-6">
              Review Your Cart
            </h3>

            <div className="flex flex-col gap-3 mb-6">
              {cart.map((item) => (
                <div key={item.name} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <img
                    src={`/assets/new_assets/${item.image}`}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => { e.target.src = "/assets/logo.png"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2d3436] truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => updateQuantity(item.name, -1)}
                        className="w-5 h-5 rounded-full border flex items-center justify-center text-xs hover:bg-[#5a7c65] hover:text-white hover:border-[#5a7c65] transition-all"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.name, 1)}
                        className="w-5 h-5 rounded-full border flex items-center justify-center text-xs hover:bg-[#5a7c65] hover:text-white hover:border-[#5a7c65] transition-all"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#5a7c65] text-sm">₹{item.price * item.quantity}</p>
                    <button
                      onClick={() => removeFromCart(item.name)}
                      className="text-red-400 hover:text-red-600 mt-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-[#e8e4df] pt-4 space-y-2">
              <div className="flex justify-between text-sm text-[#636e72]">
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-[#636e72]">
                <span>Shipping</span>
                <span>{cartShipping === 0 ? "FREE" : `₹${cartShipping}`}</span>
              </div>
              <div className="flex justify-between font-bold text-[#2d3436] text-lg border-t border-[#e8e4df] pt-2 mt-2">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkoutForm"
              disabled={loading || cart.length === 0}
              className="mt-6 w-full py-3.5 rounded-full bg-[#5a7c65] text-white font-semibold text-base hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#636e72]">
              <Shield size={12} />
              Secure Checkout — SSL Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
