import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";

const AUTH_API_URL = "https://hxr7qp46qicsvrlnale5v7z34m0crgjm.lambda-url.us-east-1.on.aws";

function statusClass(status) {
  if (status === "confirmed" || status === "captured") return "bg-green-100 text-green-800";
  if (status === "pending") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

export default function OrdersPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const unarUser = JSON.parse(localStorage.getItem("unarUser") || "{}");
        if (!unarUser.cognito_user_id) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);
        const res = await fetch(`${AUTH_API_URL}/user-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: unarUser.cognito_user_id }),
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        } else {
          setError("Failed to load orders.");
        }
      } catch {
        setError("Something went wrong. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <>
      <Head>
        <title>My Orders - Unar</title>
        <meta name="description" content="Track and view your Unar order history" />
      </Head>

      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="max-w-[900px] mx-auto mt-[120px] mb-16 px-5">
        <Link href="/" className="inline-flex items-center gap-2 text-[#295c47] hover:text-[#475f50] text-sm font-medium mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#295c47] mb-2">My Orders</h1>
          <p className="text-[#636e72]">Track and view your order history</p>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-3 border-[#e8e4df] border-t-[#295c47] rounded-full mx-auto mb-5 processing-ring" />
            <p className="text-[#636e72]">Loading your orders...</p>
          </div>
        )}

        {!loading && !isLoggedIn && (
          <div className="bg-white rounded-2xl shadow-md p-16 text-center">
            <Package size={64} className="mx-auto text-[#295c47]/30 mb-5" />
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#295c47] mb-3">Please Log In</h2>
            <p className="text-[#636e72] mb-6">You need to be logged in to view your order history.</p>
            <Link href="/login" className="inline-block px-8 py-3 rounded-full bg-[#295c47] text-white font-medium hover:bg-[#475f50] transition-all">
              Log In
            </Link>
          </div>
        )}

        {!loading && isLoggedIn && error && (
          <div className="bg-white rounded-2xl shadow-md p-16 text-center">
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#295c47] mb-3">Error Loading Orders</h2>
            <p className="text-[#636e72] mb-6">{error}</p>
            <Link href="/" className="inline-block px-8 py-3 rounded-full bg-[#295c47] text-white font-medium hover:bg-[#475f50] transition-all">
              Go Home
            </Link>
          </div>
        )}

        {!loading && isLoggedIn && !error && orders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-16 text-center">
            <ShoppingBag size={64} className="mx-auto text-[#295c47]/30 mb-5" />
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#295c47] mb-3">No Orders Yet</h2>
            <p className="text-[#636e72] mb-6">You haven&apos;t placed any orders yet. Start shopping to see your orders here!</p>
            <Link href="/#collections" className="inline-block px-8 py-3 rounded-full bg-[#295c47] text-white font-medium hover:bg-[#475f50] transition-all">
              Shop Now
            </Link>
          </div>
        )}

        {!loading && isLoggedIn && orders.length > 0 && (
          <div className="flex flex-col gap-5">
            {orders.map((order) => {
              const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
              const status = order.payment_status || "pending";
              return (
                <div key={order.order_id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#e8e4df]">
                  {/* Header */}
                  <div className="bg-[#fdfbf7] px-5 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-[#e8e4df]">
                    <div>
                      <div className="font-['Cormorant_Garamond'] text-[#295c47] text-lg font-semibold">
                        Order #{(order.order_id || "").slice(-8).toUpperCase()}
                      </div>
                      <div className="text-[#636e72] text-sm">{dateStr}</div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[13px] font-medium capitalize ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {order.items && order.items.length > 0 && (
                      <div className="mb-5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className={`flex items-center gap-4 py-3 ${idx < order.items.length - 1 ? "border-b border-[#fdfbf7]" : ""}`}>
                            <img src={item.image || "/assets/website_assets/logo-circle.png"} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-[#fdfbf7] flex-shrink-0" onError={(e) => { e.target.src = "/assets/website_assets/logo-circle.png"; }} />
                            <div className="flex-1">
                              <div className="font-medium text-[#2d3436]">{item.name}</div>
                              <div className="text-[#636e72] text-sm">Qty: {item.quantity || 1}</div>
                            </div>
                            <div className="font-semibold text-[#295c47]">₹{(item.price || 0) * (item.quantity || 1)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t-2 border-[#fdfbf7]">
                      <span className="text-[#636e72] text-sm">Total Amount</span>
                      <span className="text-[#295c47] font-bold text-xl">₹{order.amount || 0}</span>
                    </div>

                    {order.address && (
                      <div className="mt-4 bg-[#fdfbf7] rounded-lg p-4">
                        <div className="text-[11px] text-[#636e72] uppercase tracking-widest mb-2 font-semibold">Delivery Address</div>
                        <div className="text-[#2d3436] text-sm leading-relaxed">
                          {order.customer_name && <>{order.customer_name}<br /></>}
                          {order.address}<br />
                          {order.pincode && <>Pincode: {order.pincode}</>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
