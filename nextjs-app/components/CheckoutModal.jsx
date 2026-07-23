import { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, X, Minus, Plus, Trash2, Tag, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const LAMBDA_API_URL =
  (process.env.NEXT_PUBLIC_LAMBDA_API_URL && process.env.NEXT_PUBLIC_LAMBDA_API_URL.trim()) ||
  "https://vfl2536p7nvialuiwcgt22s6iu0noirr.lambda-url.us-east-1.on.aws";

// Coupon Lambda URL — set NEXT_PUBLIC_COUPON_LAMBDA_URL in your .env.local
const COUPON_LAMBDA_URL =
  (process.env.NEXT_PUBLIC_COUPON_LAMBDA_URL && process.env.NEXT_PUBLIC_COUPON_LAMBDA_URL.trim()) ||
  "https://gcxezmcpoov26ggxmguzrpb25e0jzdju.lambda-url.us-east-1.on.aws";


export default function CheckoutModal({ isOpen, onClose }) {
  const {
    cart,
    cartSubtotal,
    cartShipping,
    cartTotal,
    discountAmount,
    appliedCoupon,
    setAppliedCoupon,
    clearCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);

  // ── Coupon state ────────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState(null); // null | "loading" | "success" | "error"
  const [couponMessage, setCouponMessage] = useState("");

  // Reset coupon UI whenever the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCouponInput("");
      setCouponStatus(null);
      setCouponMessage("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    // If email changes and a coupon is already applied, clear it to re-validate
    if (e.target.name === "email" && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponStatus(null);
      setCouponMessage("");
    }
  };

  // ── Coupon apply handler ────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponStatus("error");
      setCouponMessage("Please enter a coupon code");
      return;
    }

    setCouponStatus("loading");
    setCouponMessage("");

    try {
      const res = await fetch(`${COUPON_LAMBDA_URL}/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon_code: code,
          email: form.email.trim().toLowerCase(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAppliedCoupon({
          code: data.coupon_code,
          discountPercent: data.discount_percent,
          description: data.description,
        });
        setCouponStatus("success");
        setCouponMessage(
          data.description
            ? `${data.description} — ${data.discount_percent}% off applied!`
            : `${data.discount_percent}% discount applied!`
        );
      } else {
        setAppliedCoupon(null);
        setCouponStatus("error");
        setCouponMessage(data.error || "Invalid coupon code");
      }
    } catch {
      setAppliedCoupon(null);
      setCouponStatus("error");
      setCouponMessage("Unable to validate coupon. Please try again.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponStatus(null);
    setCouponMessage("");
  };

  // ── Payment submit handler ──────────────────────────────────────────────────
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
            items: cart.map((i) => `${i.name}${i.selectedScents ? ` (${i.selectedScents.join(", ")})` : ""} x${i.quantity}`).join(", "),
            ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
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
        image: "/assets/website_assets/logo-circle.png",
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${LAMBDA_API_URL}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                // Pass coupon details so payment Lambda can tag + mark-used
                coupon_code: appliedCoupon?.code || null,
                coupon_email: appliedCoupon ? form.email.trim().toLowerCase() : null,
                order_details: {
                  customer: form,
                  items: cart,
                  subtotal: cartSubtotal,
                  shipping: cartShipping,
                  discount: discountAmount,
                  total: cartTotal,
                  coupon_code: appliedCoupon?.code || null,
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
        theme: { color: "#295c47" },
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
          type="button"
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
                    className="border-[#e8e4df] focus:border-[#295c47] focus:ring-[#295c47]/20"
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
                    className="border-[#e8e4df] focus:border-[#295c47]"
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
                  className="border-[#e8e4df] focus:border-[#295c47]"
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
                  className="border-[#e8e4df] focus:border-[#295c47] resize-none"
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
                  className="border-[#e8e4df] focus:border-[#295c47]"
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
              {cart.map((item) => {
                const itemId = item.id || item.name;
                return (
                  <div key={itemId} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    <img
                      src={`/assets/website_assets/mockups/${item.image}`}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      onError={(e) => { e.target.src = "/assets/website_assets/logo-circle.png"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#2d3436] truncate">{item.name}</p>
                      {item.selectedScents && (
                        <p className="text-[10px] text-[#295c47] font-medium leading-tight mt-0.5">
                          Fragrances: {item.selectedScents.join(", ")}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, -1)}
                          className="w-5 h-5 rounded-full border flex items-center justify-center text-xs hover:bg-[#295c47] hover:text-white hover:border-[#295c47] transition-all"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, 1)}
                          className="w-5 h-5 rounded-full border flex items-center justify-center text-xs hover:bg-[#295c47] hover:text-white hover:border-[#295c47] transition-all"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#295c47] text-sm">₹{item.price * item.quantity}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemId)}
                        className="text-red-400 hover:text-red-600 mt-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Coupon Code Section ────────────────────────────────────── */}
            <div className="mb-5">
              <Label className="text-xs font-semibold text-[#636e72] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag size={12} />
                Coupon Code
              </Label>

              {appliedCoupon ? (
                /* Applied state */
                <div className="flex items-center gap-2 bg-[#295c47]/8 border border-[#295c47]/30 rounded-xl px-4 py-2.5">
                  <CheckCircle2 size={16} className="text-[#295c47] flex-shrink-0" />
                  <span className="text-sm text-[#295c47] font-semibold flex-1 truncate">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs text-[#295c47] font-bold bg-[#295c47]/10 px-2 py-0.5 rounded-full">
                    -{appliedCoupon.discountPercent}%
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="ml-1 text-[#636e72] hover:text-red-500 transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Input state */
                <div className="flex gap-2">
                  <Input
                    id="coupon-input"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponStatus) { setCouponStatus(null); setCouponMessage(""); }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                    placeholder="Enter coupon code"
                    maxLength={20}
                    className="flex-1 border-[#e8e4df] focus:border-[#295c47] uppercase tracking-widest text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "loading" || !couponInput.trim()}
                    className="px-4 py-2 rounded-lg bg-[#295c47] text-white text-sm font-semibold hover:bg-[#475f50] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {couponStatus === "loading" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : "Apply"}
                  </button>
                </div>
              )}

              {/* Status message */}
              {couponStatus === "success" && couponMessage && (
                <div className="flex items-start gap-1.5 mt-2">
                  <CheckCircle2 size={14} className="text-[#295c47] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#295c47] font-medium">{couponMessage}</p>
                </div>
              )}
              {couponStatus === "error" && couponMessage && (
                <div className="flex items-start gap-1.5 mt-2">
                  <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-500">{couponMessage}</p>
                </div>
              )}
            </div>

            {/* ── Totals ────────────────────────────────────────────────── */}
            <div className="border-t border-[#e8e4df] pt-4 space-y-2">
              <div className="flex justify-between text-sm text-[#636e72]">
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm font-medium text-[#295c47]">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Discount ({appliedCoupon?.discountPercent}%)
                  </span>
                  <span>−₹{discountAmount}</span>
                </div>
              )}
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
              className="mt-6 w-full py-3.5 rounded-full bg-[#295c47] text-white font-semibold text-base hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#636e72]">
              <Shield size={12} />
              Secure Checkout — SSL Encrypted
            </div>
            <p className="text-[10px] text-center text-[#95a5a6] mt-2 max-w-xs mx-auto leading-normal select-none">
              Note: Due to hygiene standards, solid perfumes are non-returnable. If your order is damaged, contact us within 48 hours for a replacement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
