import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useCart } from "@/lib/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { PRODUCTS } from "@/config/products";
import { Star, ShoppingCart, Check, ChevronDown, ChevronUp, Shield, Truck, Sparkles, AlertCircle, HelpCircle, Sparkle } from "lucide-react";

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("box");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // General Accordion states
  const [accordions, setAccordions] = useState({
    about: true,
    benefits: false,
    use: false,
    ingredients: false,
    safety: false
  });

  // FAQs Accordion states
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  const toggleAccordion = (section) => {
    setAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFaq = (index) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  useEffect(() => {
    if (slug) {
      const found = PRODUCTS.find((p) => p.slug === slug);
      if (found) {
        setProduct(found);
        // Default packaging choice based on categories
        setSelectedPackage(found.category === "solid-perfume" ? "box" : "tin");
      }
    }
  }, [slug]);

  // Set up global checkout listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.__unarCheckoutListenerSet) {
        window.__unarCheckoutListenerSet = true;
        const openCheckoutHandler = () => setCheckoutOpen(true);
        document.addEventListener("openCheckout", openCheckoutHandler);
        return () => document.removeEventListener("openCheckout", openCheckoutHandler);
      }
    }
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center py-20 px-6">
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="text-center max-w-md animate-fade-in-up">
          <AlertCircle className="w-16 h-16 text-[#d4a574] mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-semibold text-[#285b46] mb-2">Product Not Found</h2>
          <p className="text-[#636e72] mb-8">We couldn&apos;t find the product details you were looking for. It might be currently unavailable.</p>
          <Link href="/" className="px-8 py-3 rounded-full bg-[#5a7c65] text-white font-semibold hover:bg-[#475f50] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    price,
    originalPrice,
    badge,
    image,
    benefits,
    outOfStock,
    tagline,
    highlights,
    rating,
    reviewCount,
    scentProfile,
    scentNotes,
    specialTitle,
    specialText,
    specialPoints,
    resultsTitle,
    results,
    aboutText,
    howToUseText,
    ingredientsText,
    safetyText,
    faqs,
    reviews,
    category
  } = product;

  // Resolve active image depending on selected packaging type
  const boxImage = `/assets/website_assets/mockups/${image}`;
  const tinImage = `/assets/website_assets/round_tin/${image === "rose.jpg" ? "rose.jpg" : `${image}-r.jpg`}`;
  const currentImage = (selectedPackage === "tin" && category === "solid-perfume") ? tinImage : boxImage;

  const inCart = cart.find((i) => i.name === name);

  const handleAddToCart = () => {
    if (!outOfStock) {
      addToCart({ name, price, image });
    }
  };

  const handleBuyNow = () => {
    if (!outOfStock) {
      if (!inCart) {
        addToCart({ name, price, image });
      }
      setCheckoutOpen(true);
    }
  };

  // Get related products (excluding current one)
  const relatedProducts = PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3);

  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  // Map category slugs to pretty display titles
  const categoryTitles = {
    "solid-perfume": "Solid Perfumes",
    "car-fragrance": "Car Fragrances",
    "discovery-set": "Discovery Sets"
  };

  return (
    <>
      <Head>
        <title>{`${name} | Unar Conscious Living`}</title>
        <meta name="description" content={`${name} - ${tagline}. Handcrafted with pure beeswax and natural essential oils.`} />
        <meta name="keywords" content={`${name}, natural perfume, car fragrance, discovery set, clean beauty`} />
        <link rel="icon" href="/assets/website_assets/logo-circle.png" />
      </Head>
      
      {/* Razorpay dynamic script load using next/script component to fix warning */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main className="bg-[#fdfbf7] pt-[120px] pb-24 font-sans">
        
        {/* Breadcrumb */}
        <div className="max-w-[1300px] mx-auto px-6 mb-8">
          <nav className="text-xs font-bold tracking-widest text-[#636e72] flex items-center gap-2 uppercase">
            <Link href="/" className="hover:text-[#5a7c65] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/#collections" className="hover:text-[#5a7c65] transition-colors">Collections</Link>
            <span>/</span>
            <span className="hover:text-[#5a7c65] transition-colors">{categoryTitles[category] || "Products"}</span>
            <span>/</span>
            <span className="text-[#2d3436] font-extrabold">{name}</span>
          </nav>
        </div>

        {/* HERO SECTION: Gallery and Header Details */}
        <div className="max-w-[1300px] mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-start">
            
            {/* Left Image Showcase */}
            <div className="sticky top-[120px] flex flex-col gap-4">
              <div className="aspect-square w-full relative bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] rounded-3xl overflow-hidden border border-[#e8e4df] shadow-md group">
                <img
                  src={currentImage}
                  alt={`${name} Product Detail Image`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-[#285b46] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-sm">
                    {badge}
                  </span>
                </div>
                {outOfStock && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <span className="bg-black/90 text-white text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full border border-white/10">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Variant thumbnails - only for solid perfumes that have box/tin variants */}
              {category === "solid-perfume" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedPackage("box")}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] transition-all hover:scale-105 ${
                      selectedPackage === "box" ? "border-[#5a7c65] shadow-md ring-2 ring-[#5a7c65]/20" : "border-[#e8e4df] opacity-70"
                    }`}
                  >
                    <img src={boxImage} alt="Premium Box mockup view" className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => setSelectedPackage("tin")}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] transition-all hover:scale-105 ${
                      selectedPackage === "tin" ? "border-[#5a7c65] shadow-md ring-2 ring-[#5a7c65]/20" : "border-[#e8e4df] opacity-70"
                    }`}
                  >
                    <img src={tinImage} alt="Round Tin mockup view" className="w-full h-full object-cover" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Product Options Details */}
            <div className="flex flex-col">
              
              {/* Product Header */}
              <div className="border-b border-[#e8e4df] pb-6 mb-6">
                <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#285b46] leading-tight mb-2">
                  {name}
                </h1>
                
                {/* Scent tagline */}
                <p className="text-lg italic font-serif text-[#d4a574] leading-relaxed mb-3">
                  {tagline}
                </p>

                {/* Subtitle key highlights - matching Be Minimalist style */}
                <div className="text-sm font-bold text-[#5a7c65] bg-[#5a7c65]/5 border border-[#5a7c65]/10 rounded-xl py-2.5 px-4 mb-4 flex items-center gap-2">
                  <Sparkle size={14} className="text-[#d4a574] flex-shrink-0 animate-pulse" />
                  <span>{highlights}</span>
                </div>

                {/* Ratings */}
                <div className="flex items-center gap-2">
                  <div className="flex text-[#d4a574]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" stroke="none" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#2d3436]">{rating}</span>
                  <span className="text-sm text-[#636e72]">({reviewCount} verified reviews)</span>
                </div>
              </div>

              {/* Price block */}
              <div className="border-b border-[#e8e4df] pb-6 mb-6">
                <div className="flex items-baseline gap-4 mb-1">
                  <span className="font-serif text-4xl font-extrabold text-[#285b46]">₹{price}</span>
                  <span className="text-lg text-[#636e72] line-through">₹{originalPrice}</span>
                  <span className="bg-[#d4a574]/20 text-[#c28445] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {discountPercent}% OFF
                  </span>
                </div>
                <p className="text-[11px] text-[#5a7c65] font-bold">Inclusive of all taxes</p>

                <div className="bg-[#5a7c65]/5 border border-[#5a7c65]/10 rounded-2xl p-4 flex items-start gap-3 mt-4">
                  <Sparkles size={18} className="text-[#5a7c65] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#285b46]">Special Launch Offer</p>
                    <p className="text-xs text-[#636e72] mt-0.5">Save ₹{originalPrice - price} on this purchase. Free delivery applies for orders over ₹1000.</p>
                  </div>
                </div>
              </div>

              {/* Variant configurations */}
              <div className="space-y-5 border-b border-[#e8e4df] pb-6 mb-6">
                {/* Packaging choice (only visible if solid perfume) */}
                {category === "solid-perfume" && (
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#636e72] block mb-2.5">
                      Packaging Option
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedPackage("box")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedPackage === "box"
                            ? "bg-[#5a7c65] border-[#5a7c65] text-white shadow-sm font-extrabold"
                            : "border-[#e8e4df] text-[#2d3436] hover:bg-[#5a7c65]/5"
                        }`}
                      >
                        Premium Box
                      </button>
                      <button
                        onClick={() => setSelectedPackage("tin")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedPackage === "tin"
                            ? "bg-[#5a7c65] border-[#5a7c65] text-white shadow-sm font-extrabold"
                            : "border-[#e8e4df] text-[#2d3436] hover:bg-[#5a7c65]/5"
                        }`}
                      >
                        Round Tin
                      </button>
                    </div>
                  </div>
                )}

                {/* Weight details */}
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#636e72] block mb-2">
                    Size / Net Weight
                  </label>
                  <div className="inline-flex py-2.5 px-5 rounded-full border border-[#5a7c65] bg-[#5a7c65]/5 text-xs font-extrabold tracking-widest text-[#285b46] uppercase">
                    {category === "discovery-set" ? "8 x 5g Sampler Tins" : "15g / 0.5 oz (Single Tin)"}
                  </div>
                </div>
              </div>

              {/* Add/Buy CTA */}
              <div className="flex gap-4 border-b border-[#e8e4df] pb-8 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`flex-1 py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    outOfStock
                      ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                      : inCart
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                        : "border-2 border-[#5a7c65] text-[#5a7c65] hover:bg-[#5a7c65] hover:text-white"
                  }`}
                >
                  {outOfStock ? (
                    "Sold Out"
                  ) : inCart ? (
                    <>
                      <Check size={16} />
                      Added ({inCart.quantity})
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      Add to Cart
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className={`flex-1 py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-md flex items-center justify-center cursor-pointer ${
                    outOfStock
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#5a7c65] text-white hover:bg-[#475f50] hover:scale-102 hover:shadow-lg"
                  }`}
                >
                  Buy It Now
                </button>
              </div>

              {/* Scent Profile details container */}
              <div className="bg-[#faf8f5] border border-[#e8e4df] rounded-2xl p-5 mb-8">
                <h3 className="font-serif text-lg font-bold text-[#285b46] mb-3">Scent Profile Summary</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold text-[#636e72] uppercase tracking-wider text-[10px]">Family:</span>
                    <span className="text-[#2d3436] font-semibold capitalize">{scentProfile}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold text-[#636e72] uppercase tracking-wider text-[10px]">Top Note:</span>
                    <span className="text-[#2d3436] italic">{scentNotes.top}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold text-[#636e72] uppercase tracking-wider text-[10px]">Heart Note:</span>
                    <span className="text-[#2d3436] italic font-semibold text-[#5a7c65]">{scentNotes.heart}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold text-[#636e72] uppercase tracking-wider text-[10px]">Base Note:</span>
                    <span className="text-[#2d3436] italic">{scentNotes.base}</span>
                  </div>
                </div>
              </div>

              {/* General details accordion */}
              <div className="border border-[#e8e4df] rounded-2xl overflow-hidden divide-y divide-[#e8e4df] shadow-sm">
                
                {/* About Section */}
                <div>
                  <button
                    onClick={() => toggleAccordion("about")}
                    className="w-full py-4 px-5 flex items-center justify-between text-left font-serif text-lg font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>About the Scent</span>
                    {accordions.about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.about && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72]">
                      <p>{aboutText}</p>
                    </div>
                  )}
                </div>

                {/* Scent Ritual Section */}
                <div>
                  <button
                    onClick={() => toggleAccordion("use")}
                    className="w-full py-4 px-5 flex items-center justify-between text-left font-serif text-lg font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>How to Use & Scent Ritual</span>
                    {accordions.use ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.use && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-2">
                      <p>{howToUseText}</p>
                    </div>
                  )}
                </div>

                {/* Ingredients Transparency Section */}
                <div>
                  <button
                    onClick={() => toggleAccordion("ingredients")}
                    className="w-full py-4 px-5 flex items-center justify-between text-left font-serif text-lg font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>Ingredients Transparency</span>
                    {accordions.ingredients ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.ingredients && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-3">
                      <p className="font-semibold text-[#2d3436]">{ingredientsText}</p>
                      <div className="border-t border-[#e8e4df]/60 pt-3 mt-3 grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <strong className="text-[#285b46] block mb-0.5">Beeswax Base</strong>
                          Retains essential fragrance molecules, releasing aroma slowly.
                        </div>
                        <div>
                          <strong className="text-[#285b46] block mb-0.5">Shea Butter</strong>
                          Gives the perfume a luxurious texture that melts instantly.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Safety Warning Section */}
                <div>
                  <button
                    onClick={() => toggleAccordion("safety")}
                    className="w-full py-4 px-5 flex items-center justify-between text-left font-serif text-lg font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>Safety & Care Warnings</span>
                    {accordions.safety ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.safety && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-2">
                      <p>{safetyText}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Guarantee badges */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="border border-[#e8e4df] rounded-xl p-3.5 text-center flex flex-col items-center">
                  <Shield size={18} className="text-[#5a7c65] mb-1.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#636e72] block">100% Non-Toxic</span>
                  <span className="text-[8px] text-[#888] mt-0.5">Alcohol-free</span>
                </div>
                <div className="border border-[#e8e4df] rounded-xl p-3.5 text-center flex flex-col items-center">
                  <Truck size={18} className="text-[#5a7c65] mb-1.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#636e72] block">Free Shipping</span>
                  <span className="text-[8px] text-[#888] mt-0.5">Orders above ₹1000</span>
                </div>
                <div className="border border-[#e8e4df] rounded-xl p-3.5 text-center flex flex-col items-center">
                  <Sparkles size={18} className="text-[#5a7c65] mb-1.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#636e72] block">Pure Botanicals</span>
                  <span className="text-[8px] text-[#888] mt-0.5">Hand-poured batch</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── WHAT MAKES IT SPECIAL SECTION ── */}
        <section className="bg-white border-y border-[#e8e4df] py-20 mb-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#285b46] text-center mb-4">
              {specialTitle}
            </h2>
            <p className="text-center text-[#636e72] text-[15px] max-w-[750px] mx-auto leading-relaxed mb-12">
              {specialText}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {specialPoints.map((point, idx) => (
                <div key={idx} className="bg-[#fdfbf7] border border-[#e8e4df] rounded-2xl p-6.5 hover:shadow-md transition-all duration-300 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#5a7c65]/10 rounded-full flex items-center justify-center text-[#5a7c65] font-serif text-lg font-bold mb-4 shadow-inner">
                    {idx + 1}
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#285b46] mb-2">{point.label}</h4>
                  <p className="text-xs leading-relaxed text-[#636e72]">{point.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLINICAL/AROMATHERAPY STUDY RESULTS ── */}
        <section className="max-w-[1100px] mx-auto px-6 mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#285b46] text-center mb-2">
            {resultsTitle}
          </h2>
          <p className="text-center text-[#636e72] text-xs uppercase tracking-widest mb-12">Verified User Evaluation Studies</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {results.map((res, idx) => (
              <div key={idx} className="border border-[#e8e4df] rounded-2xl p-8 bg-[#fdfbf7] flex flex-col items-center justify-center text-center shadow-sm">
                <span className="font-serif text-5xl sm:text-6xl font-extrabold text-[#d4a574] mb-3 select-none">
                  {res.percentage}
                </span>
                <p className="text-xs leading-relaxed text-[#2d3436] font-medium max-w-[240px]">
                  {res.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRODUCT-SPECIFIC FAQS ── */}
        <section className="bg-white border-y border-[#e8e4df] py-20 mb-20">
          <div className="max-w-[800px] mx-auto px-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#285b46] text-center mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-[#636e72] text-sm mb-12">Common inquiries about this specific botanical formulation</p>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-[#e8e4df] rounded-2xl overflow-hidden bg-[#fdfbf7] shadow-sm">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4.5 px-6 flex items-center justify-between text-left font-serif text-[17px] font-bold text-[#285b46] hover:bg-[#5a7c65]/5 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle size={18} className="text-[#d4a574] flex-shrink-0" />
                      {faq.q}
                    </span>
                    {faqOpenIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {faqOpenIndex === idx && (
                    <div className="p-6 border-t border-[#e8e4df] bg-white text-[13px] leading-relaxed text-[#636e72]">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CUSTOMER REVIEWS ── */}
        <section className="max-w-[1300px] mx-auto px-6 mb-20">
          <h2 className="font-serif text-3xl font-bold text-[#285b46] mb-8 text-center sm:text-left">
            Customer Reviews ({reviewCount})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, idx) => (
              <div key={idx} className="bg-white border border-[#e8e4df] rounded-2xl p-6.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#2d3436]">{r.name}</h4>
                    <span className="text-xs text-[#636e72]">{r.city}</span>
                  </div>
                  <span className="bg-[#5a7c65]/10 text-[#5a7c65] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Check size={10} /> Verified
                  </span>
                </div>
                <div className="flex text-[#d4a574] mb-3">
                  {[...Array(r.stars)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" stroke="none" />
                  ))}
                  {[...Array(5 - r.stars)].map((_, i) => (
                    <Star key={i} size={14} stroke="currentColor" fill="none" className="text-gray-300" />
                  ))}
                </div>
                <p className="text-[13px] italic leading-relaxed text-[#444]">&quot;{r.quote}&quot;</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── RELATED PRODUCTS ── */}
        <section className="max-w-[1300px] mx-auto px-6 pt-16 border-t border-[#e8e4df]">
          <h2 className="font-serif text-3xl font-bold text-[#285b46] text-center mb-2">You May Also Like</h2>
          <p className="text-center text-[#636e72] text-sm mb-12">Discover other botanical scent blends from the Unar collection</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedProducts.map((p) => {
              const relImage = `/assets/website_assets/mockups/${p.image}`;
              return (
                <div key={p.slug} className="bg-white border border-[#e8e4df] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col">
                  <Link href={`/products/${p.slug}`} className="aspect-square w-full bg-[#faf8f5] overflow-hidden block relative">
                    <img
                      src={relImage}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.outOfStock && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-black/80 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#285b46] mb-1">
                        <Link href={`/products/${p.slug}`} className="hover:text-[#5a7c65] transition-colors">{p.name}</Link>
                      </h3>
                      <p className="text-xs text-[#636e72] line-clamp-2 mb-4 leading-relaxed">{p.tagline}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#e8e4df]/60 pt-3.5 mt-auto">
                      <span className="font-serif text-xl font-bold text-[#285b46]">₹{p.price}</span>
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-xs font-bold uppercase tracking-wider text-[#5a7c65] hover:text-[#285b46] flex items-center gap-1"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
