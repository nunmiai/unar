import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { useCart } from "@/lib/CartContext";
import { PRODUCTS } from "@/config/products";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  MapPin,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  CreditCard,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const AUTH_API_URL = "https://hxr7qp46qicsvrlnale5v7z34m0crgjm.lambda-url.us-east-1.on.aws";

function getStatusBadge(statusRaw = "") {
  const status = String(statusRaw).toLowerCase();
  if (["captured", "confirmed", "paid", "delivered", "success"].includes(status)) {
    return {
      label: status === "captured" ? "Captured" : status === "confirmed" ? "Confirmed" : "Paid",
      type: "success",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      icon: <CheckCircle2 size={13} className="text-emerald-600" />,
      dotClass: "bg-emerald-500 animate-pulse",
    };
  }
  if (["pending", "processing", "created"].includes(status)) {
    return {
      label: "Pending",
      type: "pending",
      className: "bg-amber-50 text-amber-700 border-amber-200/80",
      icon: <Clock size={13} className="text-amber-600" />,
      dotClass: "bg-amber-500 animate-pulse",
    };
  }
  return {
    label: status || "Failed",
    type: "failed",
    className: "bg-rose-50 text-rose-700 border-rose-200/80",
    icon: <XCircle size={13} className="text-rose-600" />,
    dotClass: "bg-rose-500",
  };
}

// Helper to resolve order item image URL directly from order JSON item.image
function resolveItemImage(imageStr, item) {
  if (!imageStr) {
    const itemSlug = (item?.slug || item?.id || "").toLowerCase().trim();
    const itemName = (item?.name || "").toLowerCase().trim();
    const found = PRODUCTS.find(
      (p) =>
        (p.slug && itemSlug && p.slug.toLowerCase().trim() === itemSlug) ||
        (p.name && itemName && p.name.toLowerCase().trim() === itemName)
    );
    return `/assets/website_assets/mockups/${item.imageStr}`;
  }

  // Handle absolute web URLs
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return imageStr;
  }

  // Handle absolute paths starting with /
  if (imageStr.startsWith("/")) {
    return imageStr;
  }

  // Handle relative folder paths like "assets/new_assets/champa2.png"
  if (imageStr.includes("/")) {
    return `/${imageStr}`;
  }

  // Handle plain filenames like "champa2.png", "jasmine1.png", "cha.jpg"
  return `/assets/website_assets/mockups/${imageStr}`;
}

// Helper to resolve the LATEST updated price from PRODUCTS catalog
function getLatestProductDetails(item) {
  const itemSlug = (item.slug || item.id || "").toLowerCase().trim();
  const itemName = (item.name || "").toLowerCase().trim();

  const found = PRODUCTS.find((p) => {
    if (p.slug && itemSlug && p.slug.toLowerCase().trim() === itemSlug) return true;
    if (p.name && itemName && p.name.toLowerCase().trim() === itemName) return true;
    return false;
  });

  const cartImg = found?.image || resolveItemImage(item.image, item);

  if (found) {
    return {
      id: found.slug || item.slug || item.id || item.name,
      slug: found.slug || item.slug,
      name: found.name || item.name,
      price: found.price, // Latest updated cost from catalog
      image: cartImg,
    };
  }

  // Fallback if item is not found in static PRODUCTS list
  return {
    id: item.id || item.slug || item.name,
    slug: item.slug,
    name: item.name,
    price: parseFloat(item.price) || 0,
    image: cartImg,
  };
}

export default function OrdersPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Expanded order states (which orders are showing full details)
  // Store map: { [orderId]: boolean }
  const [expandedOrders, setExpandedOrders] = useState({});

  // Deletion & Retry state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const cartContext = useCart();
  const addToCart = cartContext?.addToCart;
  const clearCart = cartContext?.clearCart;

  // Listen for checkout event from CartSidebar
  useEffect(() => {
    const handleOpenCheckout = () => {
      setCartOpen(false);
      setCheckoutOpen(true);
    };
    document.addEventListener("openCheckout", handleOpenCheckout);
    return () => document.removeEventListener("openCheckout", handleOpenCheckout);
  }, []);

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
          setError("Failed to load orders. Please refresh or try again.");
        }
      } catch {
        setError("Something went wrong while connecting to the server.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCopyId = (orderId, e) => {
    e?.stopPropagation();
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    toast.success(`Order ID copied: #${orderId.slice(-8).toUpperCase()}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleExpand = (orderId, e) => {
    e?.stopPropagation();
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // ── Buy Again / Retry Payment Action ─────────────────────────────────────
  // Clears existing cart items and adds items with the LATEST updated catalog prices
  const handleReorderOrRetry = (order, isRetry = false, e) => {
    e?.stopPropagation();
    if (!order.items || order.items.length === 0) {
      toast.error("Order items unavailable");
      return;
    }

    // 1. Clear existing cart items
    if (clearCart) {
      clearCart();
    } else {
      localStorage.removeItem("unarCart");
    }

    // 2. Add each item with latest updated price
    if (addToCart) {
      order.items.forEach((item) => {
        const productToAdd = getLatestProductDetails(item);
        addToCart(productToAdd, item.quantity || 1);
      });
    }

    const shortId = (order.order_id || "").slice(-8).toUpperCase();
    if (isRetry) {
      toast.success(`Cart cleared & loaded Order #${shortId} with latest prices.`);
    } else {
      toast.success(`Cart cleared & loaded items from Order #${shortId} with latest prices.`);
    }

    setCartOpen(true);
  };

  // ── Delete Order ─────────────────────────────────────────────────────────────
  const handleDeleteOrder = async (orderId, e) => {
    e?.stopPropagation();
    setDeletingId(orderId);
    try {
      const unarUser = JSON.parse(localStorage.getItem("unarUser") || "{}");
      const res = await fetch(`${AUTH_API_URL}/delete-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          user_id: unarUser.cognito_user_id || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => (o.order_id || o.id) !== orderId));
        toast.success("Order record deleted successfully.");
      } else {
        // Fallback: Remove locally if backend delete returns route not found or error
        setOrders((prev) => prev.filter((o) => (o.order_id || o.id) !== orderId));
        toast.success("Order removed from your history.");
      }
    } catch {
      setOrders((prev) => prev.filter((o) => (o.order_id || o.id) !== orderId));
      toast.success("Order removed from your history.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const badge = getStatusBadge(order.payment_status);
      const statusMatch =
        statusFilter === "all"
          ? true
          : statusFilter === "confirmed"
            ? badge.type === "success"
            : statusFilter === "pending"
              ? badge.type === "pending"
              : badge.type === "failed";

      const query = searchQuery.trim().toLowerCase();
      if (!query) return statusMatch;

      const idMatch = (order.order_id || "").toLowerCase().includes(query);
      const nameMatch = (order.customer_name || "").toLowerCase().includes(query);
      const itemMatch = (order.items || []).some((i) =>
        (i.name || "").toLowerCase().includes(query)
      );

      return statusMatch && (idMatch || nameMatch || itemMatch);
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <>
      <Head>
        <title>My Orders | Unar - Natural Solid Perfumes</title>
        <meta name="description" content="Track and view your Unar order history" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="min-h-screen bg-[#faf8f5] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[880px] mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#295c47] hover:text-[#1c4536] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <div className="text-xs text-[#8a8a8a]">
              <span>Home</span> <span className="mx-1">/</span>{" "}
              <span className="text-[#295c47] font-medium">My Orders</span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center mb-10">
            <h1 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-medium text-[#2c2c2c] tracking-tight mb-2">
              My Orders
            </h1>
            <p className="text-[#5a5a5a] text-sm max-w-md mx-auto">
              Track and view your order history
            </p>
          </div>

          {/* ── 1. LOADING SKELETON STATE ────────────────────────────────────── */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#e8e4df] p-5 shadow-sm animate-pulse flex items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-8 w-28 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* ── 2. LOGGED OUT STATE ──────────────────────────────────────────── */}
          {!loading && !isLoggedIn && (
            <div className="bg-white rounded-2xl border border-[#e8e4df] p-10 sm:p-14 text-center shadow-sm max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#295c47]/10 flex items-center justify-center mx-auto mb-5 text-[#295c47]">
                <Package size={30} />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-medium text-[#2c2c2c] mb-2">
                Please Sign In
              </h2>
              <p className="text-[#5a5a5a] text-sm mb-6 leading-relaxed">
                You need to be logged in to view your order history and track active shipments.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#295c47] text-white text-sm font-semibold hover:bg-[#1c4536] transition-all shadow-sm"
              >
                Sign In to Account
              </Link>
            </div>
          )}

          {/* ── 3. ERROR STATE ────────────────────────────────────────────────── */}
          {!loading && isLoggedIn && error && (
            <div className="bg-white rounded-2xl border border-[#e8e4df] p-10 text-center shadow-sm max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-600">
                <XCircle size={28} />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-2xl font-medium text-[#2c2c2c] mb-2">
                Unable to Load Orders
              </h2>
              <p className="text-[#5a5a5a] text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#295c47] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1c4536] transition-all"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* ── 4. EMPTY ORDERS STATE ─────────────────────────────────────────── */}
          {!loading && isLoggedIn && !error && orders.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e4df] p-10 sm:p-14 text-center shadow-sm max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#295c47]/10 flex items-center justify-center mx-auto mb-5 text-[#295c47]">
                <ShoppingBag size={30} />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-medium text-[#2c2c2c] mb-2">
                No Orders Yet
              </h2>
              <p className="text-[#5a5a5a] text-sm mb-6 leading-relaxed">
                You haven&apos;t placed any orders yet. Discover our handcrafted botanical solid perfumes and start your sensory journey!
              </p>
              <Link
                href="/#collections"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#295c47] text-white text-sm font-semibold hover:bg-[#1c4536] transition-all shadow-sm"
              >
                Explore Collections
              </Link>
            </div>
          )}

          {/* ── 5. ORDERS LIST ────────────────────────────────────────────────── */}
          {!loading && isLoggedIn && !error && orders.length > 0 && (
            <div className="space-y-4">
              {/* Search & Filter Control Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e8e4df] shadow-sm mb-6">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by order ID or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#faf8f5] border border-gray-200 rounded-xl text-[#2c2c2c] placeholder:text-gray-400 focus:outline-none focus:border-[#295c47]"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex bg-[#faf8f5] rounded-xl p-1 border border-gray-200 text-xs">
                  {[
                    { key: "all", label: `All (${orders.length})` },
                    { key: "confirmed", label: "Confirmed" },
                    { key: "pending", label: "Pending" },
                    { key: "failed", label: "Failed" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === tab.key
                        ? "bg-white text-[#295c47] shadow-sm font-semibold"
                        : "text-[#5a5a5a] hover:text-[#295c47]"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List Iteration */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e8e4df] p-10 text-center text-sm text-[#5a5a5a]">
                  No orders match your search criteria.
                </div>
              ) : (
                filteredOrders.map((order, index) => {
                  const rawId = order.order_id || `order-${index}`;
                  const shortId = rawId.length > 8 ? rawId.slice(-8).toUpperCase() : rawId.toUpperCase();
                  const formattedDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "3 May 2026";

                  const statusBadge = getStatusBadge(order.payment_status);
                  const isExpanded = !!expandedOrders[rawId];
                  const isPendingOrFailed = statusBadge.type === "pending" || statusBadge.type === "failed";

                  // Summary items preview & quantity count
                  const firstItem = order.items && order.items[0];
                  const otherItemsCount = (order.items?.length || 1) - 1;
                  const totalItemQty = (order.items || []).reduce(
                    (sum, item) => sum + parseInt(item.quantity || 1, 10),
                    0
                  );

                  const mainProductName = firstItem?.name || "Solid Perfume";
                  const displayTitle = otherItemsCount > 0
                    ? `${mainProductName} +${otherItemsCount} more`
                    : mainProductName;

                  return (
                    <div
                      key={rawId}
                      className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Compact List Row */}
                      <div
                        onClick={(e) => toggleExpand(rawId, e)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#faf8f5]/60 transition-colors"
                      >
                        {/* Product Thumbnail Preview & Product Name / Count */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Thumbnail */}
                          {firstItem && (
                            <img
                              src={resolveItemImage(firstItem.image, firstItem)}
                              alt={firstItem.name || "Order thumbnail"}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0 bg-[#faf8f5]"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/website_assets/logo-circle.png";
                              }}
                            />
                          )}

                          <div className="min-w-0">
                            {/* Product Name Title */}
                            <div className="font-['Cormorant_Garamond'] text-[#295c47] text-lg font-semibold tracking-wide truncate max-w-[280px]">
                              {displayTitle}
                            </div>
                            {/* Date and Product Count Subtitle */}
                            <div className="text-xs text-[#8a8a8a] mt-0.5 flex items-center gap-2">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="font-medium text-[#5a5a5a]">
                                {totalItemQty} {totalItemQty === 1 ? "Item" : "Items"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status, Amount & View Details Toggle */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                            {statusBadge.label}
                          </span>

                          {/* Total Amount */}
                          <div className="font-bold text-[#295c47] text-lg min-w-[70px] text-right">
                            ₹{order.amount || 0}
                          </div>

                          {/* View Details Toggle Button */}
                          <button
                            onClick={(e) => toggleExpand(rawId, e)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#faf8f5] border border-[#e8e4df] text-xs font-semibold text-[#295c47] hover:bg-[#295c47] hover:text-white transition-all ml-1"
                          >
                            <Eye size={14} />
                            {isExpanded ? "Hide Details" : "View Details"}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* ── EXPANDABLE DETAILS PANEL ───────────────────────── */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-4 border-t border-[#e8e4df]/80 bg-[#faf8f5]/40 space-y-5">
                          {/* Order ID & Reference Bar inside Details */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-gray-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[#8a8a8a] font-medium">Order ID:</span>
                              <span className="font-mono font-bold text-[#295c47] text-sm">#{shortId}</span>
                              <button
                                onClick={(e) => handleCopyId(rawId, e)}
                                title="Copy Order ID"
                                className="p-1 text-gray-400 hover:text-[#295c47] transition-colors rounded hover:bg-[#faf8f5]"
                              >
                                {copiedId === rawId ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                            <div className="text-[#8a8a8a] text-[11px]">
                              Total Quantity: <strong className="text-[#2c2c2c]">{totalItemQty} {totalItemQty === 1 ? "Item" : "Items"}</strong>
                            </div>
                          </div>

                          {/* Detailed Items List */}
                          {order.items && order.items.length > 0 && (
                            <div className="bg-white rounded-xl p-4 border border-gray-100 divide-y divide-gray-100">
                              <div className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider mb-3">
                                Items in Order ({order.items.length})
                              </div>
                              {order.items.map((item, itemIdx) => {
                                const itemPrice = parseFloat(item.price || 0);
                                const itemQty = parseInt(item.quantity || 1, 10);
                                return (
                                  <div
                                    key={itemIdx}
                                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-4"
                                  >
                                    <img
                                      src={resolveItemImage(item.image, item)}
                                      alt={item.name || "Product"}
                                      className="w-14 h-14 rounded-xl object-cover bg-[#faf8f5] border border-gray-100 flex-shrink-0"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/assets/website_assets/logo-circle.png";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-[#2c2c2c] text-sm truncate">
                                        {item.name || "Botanical Solid Perfume"}
                                      </div>
                                      <div className="text-xs text-[#8a8a8a] mt-0.5">
                                        Qty: {itemQty}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-[#295c47] text-base">
                                        ₹{itemPrice * itemQty}
                                      </div>
                                      {itemQty > 1 && (
                                        <div className="text-[11px] text-[#8a8a8a]">
                                          ₹{itemPrice} each
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Address & Summary Box */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Delivery Address */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider mb-2">
                                <MapPin size={13} className="text-[#295c47]" /> Delivery Address
                              </div>
                              <div className="text-xs text-[#2c2c2c] leading-relaxed">
                                {order.customer_name && (
                                  <div className="font-semibold text-[#295c47] mb-0.5">
                                    {order.customer_name}
                                  </div>
                                )}
                                <div>{order.address || "Standard Express Delivery"}</div>
                                {order.pincode && (
                                  <div className="text-[#5a5a5a] mt-0.5">
                                    Pincode: <strong>{order.pincode}</strong>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-[#5a5a5a]">
                                  <span>Subtotal</span>
                                  <span>₹{order.amount || 0}</span>
                                </div>
                                <div className="flex justify-between text-[#5a5a5a]">
                                  <span>Shipping</span>
                                  <span className="text-emerald-700 font-medium">FREE</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-[#295c47] pt-2 border-t border-gray-100">
                                  <span>Total Amount</span>
                                  <span className="text-base">₹{order.amount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar: Retry, Reorder, Delete */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200/80">
                            {/* Delete Order Button */}
                            {confirmDeleteId === rawId ? (
                              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs">
                                <AlertTriangle size={14} className="text-rose-600" />
                                <span className="text-rose-700 font-medium">Confirm Delete?</span>
                                <button
                                  onClick={(e) => handleDeleteOrder(rawId, e)}
                                  disabled={deletingId === rawId}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors text-xs flex items-center gap-1"
                                >
                                  {deletingId === rawId ? <Loader2 size={12} className="animate-spin" /> : "Yes, Delete"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e?.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  setConfirmDeleteId(rawId);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 size={14} /> Delete Order
                              </button>
                            )}

                            {/* Right Action Buttons: Retry Payment & Reorder */}
                            <div className="flex items-center gap-2">
                              {/* Retry Payment Button for Pending/Failed Orders */}
                              {isPendingOrFailed && (
                                <button
                                  onClick={(e) => handleReorderOrRetry(order, true, e)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all"
                                >
                                  <CreditCard size={14} /> Retry Payment
                                </button>
                              )}

                              {/* Reorder Button */}
                              {order.items && order.items.length > 0 && !isPendingOrFailed && (
                                <button
                                  onClick={(e) => handleReorderOrRetry(order, false, e)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#295c47] hover:bg-[#1c4536] text-white text-xs font-semibold shadow-xs transition-all"
                                >
                                  <RotateCcw size={14} /> Buy Again
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
