import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useCart } from "@/lib/CartContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { PRODUCTS, FAQS } from "@/config/products";
import { ShoppingCart, Check, ChevronDown, ChevronUp, Shield, Truck, Sparkles, AlertCircle, HelpCircle, Sparkle, Clock, Hand, Heart, ChevronLeft, ChevronRight, Award } from "lucide-react";

const FEATURES = [
  { icon: "/assets/icons/natural.png", title: "100% Natural", desc: "Pure beeswax and essential oils, with absolutely no synthetic ingredients or harmful chemicals." },
  { icon: "/assets/icons/travel.png", title: "Travel Friendly", desc: "Compact tins perfect for your bag—no spills, no leaks, and TSA-approved for flights." },
  { icon: "/assets/icons/skin.png", title: "Skin Friendly", desc: "Suitable for all skin types. Hand-crafted and hand-poured in small batches with care." },
  { icon: "clock", title: "Long Lasting", desc: "Compared to alcohol perfume. Solid wax formulas release scents slowly and last much longer.", isSvg: true },
  { icon: "/assets/icons/handmade.png", title: "Hand Crafted", desc: "Hand-crafted and hand-poured in small batches, ensuring maximum quality control and care." }
];

const INGREDIENTS = [
  { title: "Pure Beeswax", desc: "It keeps the perfume solid while acting as a natural glue that holds the scent to your skin for a longer-lasting fragrance." },
  { title: "Jojoba Oil", desc: "This oil matches your skin's natural oils perfectly, allowing the perfume to soak in quickly without leaving any greasy or sticky feel." },
  { title: "Shea Butter", desc: "It gives the perfume a creamy, soft texture that melts instantly on your skin, leaving it feeling moisturized and smooth." },
  { title: "The Essence of Nature", desc: "These authentic botanical extracts interact with your unique body chemistry to create a personalized, evolving scent profile." },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart, cart, updateQuantity, appliedCoupon, setAppliedCoupon, discountAmount } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("box");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedScents, setSelectedScents] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // General Accordion states
  const [accordions, setAccordions] = useState({
    special: false,
    use: false,
    features: false,
    safety: false,
    shipping: false
  });

  // FAQs Accordion states
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  // Coupon UI state (local to this page)
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState(null); // null | "loading" | "success" | "error"
  const [couponMessage, setCouponMessage] = useState("");
  const [defaultCoupons, setDefaultCoupons] = useState([]); // fetched from coupon Lambda

  const toggleAccordion = (section) => {
    setAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFaq = (index) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  const COUPON_LAMBDA_URL =
    process.env.NEXT_PUBLIC_COUPON_LAMBDA_URL || "https://gcxezmcpoov26ggxmguzrpb25e0jzdju.lambda-url.us-east-1.on.aws";

  // Fetch default coupons once on mount
  useEffect(() => {
    if (!COUPON_LAMBDA_URL) return;
    fetch(`${COUPON_LAMBDA_URL}/coupon/list-default`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.coupons)) {
          setDefaultCoupons(data.coupons);
        }
      })
      .catch((err) => console.warn('Failed to fetch default coupons:', err));
  }, [COUPON_LAMBDA_URL]);

  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride || couponInput).trim().toUpperCase();
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
        body: JSON.stringify({ coupon_code: code, email: "" }),
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

  useEffect(() => {
    if (slug) {
      const found = PRODUCTS.find((p) => p.slug === slug);
      if (found) {
        setProduct(found);
        // Default packaging choice based on categories
        setSelectedPackage(found.category === "solid-perfume" ? "box" : "tin");
        // Reset selected scents
        setSelectedScents([]);
        setActiveSlide(0);

        // Get related products based on category scenarios (stable on load)
        let related = [];
        const category = found.category;
        if (category === "solid-perfume") {
          // Scenario 1: Shuffle pick 1 from top 3 lowest priced, 1 from top 3 highest priced, and add Discovery Set
          const solidCandidates = PRODUCTS.filter((p) => p.slug !== slug && p.category === "solid-perfume");
          if (solidCandidates.length > 0) {
            const sortedSolidsAsc = [...solidCandidates].sort((a, b) => a.price - b.price);
            const lowestThree = sortedSolidsAsc.slice(0, 3);

            const sortedSolidsDesc = [...solidCandidates].sort((a, b) => b.price - a.price);
            const highestThree = sortedSolidsDesc.slice(0, 3);

            const minItem = lowestThree[Math.floor(Math.random() * lowestThree.length)];

            let highestCandidates = highestThree.filter((p) => p.slug !== minItem.slug);
            if (highestCandidates.length === 0) {
              highestCandidates = highestThree;
            }
            const maxItem = highestCandidates[Math.floor(Math.random() * highestCandidates.length)];

            const discoverySetItem = PRODUCTS.find((p) => p.slug === "discovery-set");

            related.push(maxItem);
            if (minItem.slug !== maxItem.slug) {
              related.push(minItem);
            }
            if (discoverySetItem && discoverySetItem.slug !== slug) {
              related.push(discoverySetItem);
            }
          }

        } else if (category === "discovery-set") {
          // Scenario 2: Shuffle pick 3 from top 6 highest priced solid perfumes, excluding self
          const solidCandidates = PRODUCTS.filter((p) => p.slug !== slug && p.category === "solid-perfume");
          if (solidCandidates.length > 0) {
            const sortedSolidsDesc = [...solidCandidates].sort((a, b) => b.price - a.price);
            const topSix = sortedSolidsDesc.slice(0, 6);
            const shuffled = [...topSix].sort(() => Math.random() - 0.5);
            related = shuffled.slice(0, 3);
          }
        } else {
          // Fallback logic
          related = PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3);
        }
        setRelatedProducts(related);
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
          <Link href="/" className="px-8 py-3 rounded-full bg-[#295c47] text-white font-semibold hover:bg-[#475f50] transition-all">
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
    outOfStock,
    tagline,
    scentNotes,
    specialTitle,
    specialText,
    specialPoints,
    howToUseText,
    howToUse,
    safetyText,
    category
  } = product;

  // Resolve active image
  const currentImage = `/assets/website_assets/mockups/${image}`;

  const hasCustomSlides = [
    "jasmine",
    "rose",
    "champa",
    "frangipani",
    "vetiver",
    "blue-lotus",
    "oud",
    "parijat",
    "sandalwood"
  ].includes(slug);

  const slides = slug === "discovery-set"
    ? [
      "/assets/website_assets/mockups/d_set_aux.png",
      "/assets/website_assets/round_tin/jas.jpg-r.jpg",
      "/assets/website_assets/round_tin/rose.jpg",
      "/assets/website_assets/round_tin/cha.jpg-r.jpg",
      "/assets/website_assets/round_tin/fra.jpg-r.jpg",
      "/assets/website_assets/round_tin/lot.jpg-r.jpg",
      "/assets/website_assets/round_tin/veti.jpg-r.jpg",
      "/assets/website_assets/round_tin/oud.jpg-r.jpg",
      "/assets/website_assets/round_tin/sand.jpg-r.jpg",
      "/assets/website_assets/round_tin/par.jpg-r.jpg"
    ]
    : hasCustomSlides
      ? [
        currentImage,
        `/assets/product_slides/${slug}-2.png`,
        "/assets/website_assets/mockups/pomelli_4_5.png",
        `/assets/product_slides/${slug}-4.png`,
        "/assets/website_assets/mockups/pomelli_9_16.png"
      ]
      : [
        currentImage,
        "/assets/website_assets/mockups/pomelli_4_5.png",
        "/assets/website_assets/mockups/pomelli_9_16.png"
      ];

  const currentId = category === "discovery-set"
    ? `discovery-set-${[...selectedScents].sort().map((s) => s.toLowerCase().replace(/\s+/g, "-")).join("-")}`
    : null;

  const inCart = cart.find((i) => currentId ? (i.id === currentId) : (i.name === name));

  const handleAddToCart = () => {
    if (!outOfStock) {
      if (category === "discovery-set") {
        if (selectedScents.length !== 5) {
          toast.error("Please select exactly 5 scents.");
          return;
        }
        const sortedScents = [...selectedScents].sort();
        addToCart({
          id: currentId,
          name: "Unar Solid Perfumes Discovery Set",
          price,
          image,
          selectedScents: sortedScents
        }, localQuantity);
      } else {
        addToCart({ name, price, image }, localQuantity);
      }
      setAddingToCart(true);
      setTimeout(() => {
        setAddingToCart(false);
        setLocalQuantity(1);
      }, 1000);
    }
  };

  const handleBuyNow = () => {
    if (!outOfStock) {
      if (category === "discovery-set") {
        if (selectedScents.length !== 5) {
          toast.error("Please select exactly 5 scents.");
          return;
        }
        const sortedScents = [...selectedScents].sort();
        if (!inCart) {
          addToCart({
            id: currentId,
            name: "Unar Solid Perfumes Discovery Set",
            price,
            image,
            selectedScents: sortedScents
          }, localQuantity);
        }
      } else {
        if (!inCart) {
          addToCart({ name, price, image }, localQuantity);
        }
      }
      setCheckoutOpen(true);
    }
  };

  // relatedProducts is handled dynamically in useEffect on load

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
        <link href="https://fonts.cdnfonts.com/css/urbanist" rel="stylesheet" />
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
            <Link href="/" className="hover:text-[#295c47] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/#collections" className="hover:text-[#295c47] transition-colors">Collections</Link>
            <span>/</span>
            <Link href={`/?category=${category}#collections`} className="hover:text-[#295c47] transition-colors">
              {categoryTitles[category] || "Products"}
            </Link>
            <span>/</span>
            <span className="text-[#2d3436] font-extrabold">{name}</span>
          </nav>
        </div>

        {/* HERO SECTION: Gallery and Header Details */}
        <div className="max-w-[1300px] mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-x-16 gap-y-12 items-start relative">

            {/* Left Image Showcase & Features */}
            <div className="relative flex flex-col-reverse md:flex-row gap-8 items-start w-full lg:col-start-1 lg:row-start-1">

              {/* Features list (Why Choose Unar) */}
              <div className="flex flex-row md:flex-col justify-around md:justify-start md:gap-8 w-full md:w-auto flex-shrink-0 pt-4 md:pt-0">
                {FEATURES.map((f, idx) => (
                  <div key={idx} className="relative group flex flex-col items-center">
                    {/* Circular Icon Wrapper */}
                    <div className="w-12 h-12 rounded-full bg-white border border-[#e8e4df] shadow-sm flex items-center justify-center text-[#295c47] hover:border-[#295c47] hover:bg-[#295c47]/5 transition-all duration-300 cursor-pointer p-1">
                      {!f.isSvg ? (
                        <img src={f.icon} alt={f.title} className="w-full h-full object-contain" />
                      ) : f.icon === "clock" ? (
                        <Clock className="w-full h-full" />
                      ) : f.icon === "hand" ? (
                        <Hand className="w-full h-full" />
                      ) : f.icon === "heart" ? (
                        <Heart className="w-full h-full" />
                      ) : (
                        <Sparkles className="w-full h-full" />
                      )}
                    </div>
                    {/* Label */}
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#636e72] text-center mt-2 max-w-[80px] leading-tight select-none">
                      {f.title}
                    </span>

                    {/* Premium Animated Tooltip */}
                    <div className="absolute z-35 w-[220px] bg-white/98 backdrop-blur-sm border border-[#e8e4df] p-3.5 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100
                      bottom-full left-1/2 -translate-x-1/2 mb-3.5
                      md:bottom-auto md:left-full md:top-1/2 md:translate-x-0 md:-translate-y-1/2 md:ml-3.5 md:mb-0">
                      <h5 className="font-serif text-xs font-bold text-[#285b46] mb-1">{f.title}</h5>
                      <p className="text-[11px] leading-relaxed text-[#636e72] normal-case tracking-normal font-normal">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Product Image Carousel */}
              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="aspect-square w-full relative bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] rounded-3xl overflow-hidden border border-[#e8e4df] shadow-md group">
                  {/* Slides */}
                  <div className="relative w-full h-full">
                    {slides.map((slide, index) => (
                      <img
                        key={index}
                        src={slide}
                        alt={`${name} Slide ${index + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${activeSlide === index ? "opacity-100 z-10 scale-100 group-hover:scale-105" : "opacity-0 z-0 scale-95"
                          }`}
                      />
                    ))}
                  </div>

                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-[#285b46] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-sm">
                      {badge}
                    </span>
                  </div>
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <span className="bg-black/90 text-white text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full border border-white/10">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-[#e8e4df] shadow-md flex items-center justify-center text-[#285b46] hover:text-[#295c47] transition-all hover:scale-105 opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Previous Slide"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-[#e8e4df] shadow-md flex items-center justify-center text-[#285b46] hover:text-[#295c47] transition-all hover:scale-105 opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Next Slide"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Thumbnails Gallery */}
                <div className="flex flex-wrap justify-center gap-2.5 mt-2">
                  {slides.map((slide, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white transition-all cursor-pointer shadow-sm ${activeSlide === index ? "border-[#295c47] scale-102 shadow-md" : "border-[#e8e4df] hover:border-[#295c47]/60"
                        }`}
                    >
                      <img src={slide} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Product Options Details */}
            <div className="flex flex-col lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-[140px] z-10 pb-8 h-fit">

              {/* Product Header */}
              <div className="border-b border-[#e8e4df] pb-6 mb-6">
                <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#285b46] leading-tight mb-2">
                  {name}
                </h1>

                {/* Scent tagline */}
                <p className="text-lg italic font-serif text-[#d4a574] leading-relaxed mb-3">
                  {tagline}
                </p>
              </div>

              {/* Price block & Size / Net Weight */}
              <div className="border-b border-[#e8e4df] pb-6 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-4 mb-1">
                    <span className="font-serif text-4xl font-extrabold text-[#285b46]">₹{price}</span>
                    <span className="text-lg text-[#636e72] line-through">₹{originalPrice}</span>
                    <span className="bg-[#d4a574]/20 text-[#c28445] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {discountPercent}% OFF
                    </span>
                    <span className="bg-[#d4a574]/20 text-[#c28445] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {category === "discovery-set" ? "5 x 3g Sampler Tins" : "10g (Single Tin)"}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#295c47] font-bold">Inclusive of all taxes</p>
                </div>

                {/* <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#636e72]">
                    Size / Net Weight
                  </span>
                  <div className="inline-flex py-2.5 px-5 rounded-full border border-[#295c47] bg-[#295c47]/5 text-xs font-extrabold tracking-widest text-[#285b46] uppercase">
                    {category === "discovery-set" ? "5 x 5g Sampler Tins" : "10g (Single Tin)"}
                  </div>
                </div> */}
              </div>

              {/* Custom Scent Selector for Discovery Set */}
              {category === "discovery-set" && (
                <div className="border border-[#e8e4df] rounded-2xl p-5 mb-6 bg-[#faf8f5]">
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#285b46] block">
                      Customize Your Set (Choose Exactly 5)
                    </label>
                    <span className={`text-xs font-extrabold tracking-wider ${selectedScents.length === 5 ? "text-[#285b46]" : "text-[#c28445]"}`}>
                      {selectedScents.length} / 5 selected
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#e8e4df] h-2 rounded-full overflow-hidden mb-4 shadow-inner">
                    <div
                      className="bg-[#295c47] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(selectedScents.length / 5) * 100}%` }}
                    />
                  </div>

                  {/* Scents Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {PRODUCTS.filter((p) => p.category === "solid-perfume").map((perfume) => {
                      const isSelected = selectedScents.includes(perfume.name);
                      const tinImg = `/assets/website_assets/round_tin/${perfume.image === "rose.jpg" ? "rose.jpg" : `${perfume.image}-r.jpg`}`;

                      const handleSelect = () => {
                        if (isSelected) {
                          setSelectedScents(selectedScents.filter((s) => s !== perfume.name));
                        } else {
                          if (selectedScents.length >= 5) {
                            toast.error("You can select up to 5 scents. Deselect one to add another.");
                            return;
                          }
                          setSelectedScents([...selectedScents, perfume.name]);
                        }
                      };

                      return (
                        <button
                          key={perfume.slug}
                          onClick={handleSelect}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${isSelected
                            ? "border-[#295c47] bg-white shadow-sm ring-1 ring-[#295c47]/30"
                            : "border-[#e8e4df] bg-white hover:bg-[#faf8f5] hover:border-[#d4a574]/60 hover:-translate-y-1 hover:shadow-md"
                            } ${!isSelected && selectedScents.length >= 5 ? "opacity-50 grayscale" : ""}`}
                        >
                          {/* Scent Thumbnail */}
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] border border-[#e8e4df]/60 relative">
                            <img
                              src={tinImg}
                              alt={perfume.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Scent Information */}
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-[#2d3436] truncate leading-snug">
                              {perfume.name}
                            </span>
                            {/* <span className="block text-[9px] text-[#636e72] truncate leading-normal">
                              {perfume.scentNotes.heart}
                            </span> */}
                          </div>

                          {/* Selection Checkbox */}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                            ? "bg-[#295c47] border-[#295c47] text-white"
                            : "border-[#ccd1d9] group-hover:border-[#295c47]/60"
                            }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              {!outOfStock && (
                <div className="flex items-center justify-between mb-6 bg-[#faf8f5] border border-[#636e72] rounded-2xl p-4 animate-fade-in">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#285b46]">
                    Select Quantity
                  </span>
                  <div className="flex items-center border border-[#636e72] bg-white rounded-full p-1 shadow-sm">
                    <button
                      onClick={() => inCart ? updateQuantity(currentId || name, -1) : setLocalQuantity(Math.max(1, localQuantity - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#636e72] hover:bg-[#295c47]/5 hover:text-[#285b46] active:scale-95 transition-all font-bold cursor-pointer"
                      title="Decrease Quantity"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-[#2d3436] text-sm select-none">
                      {inCart ? inCart.quantity : localQuantity}
                    </span>
                    <button
                      onClick={() => inCart ? updateQuantity(currentId || name, 1) : setLocalQuantity(localQuantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#636e72] hover:bg-[#295c47]/5 hover:text-[#285b46] active:scale-95 transition-all font-bold cursor-pointer"
                      title="Increase Quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* ── Coupon Code (Hidden behind Accordion) ────────────────── */}
              <div className="mb-6 border border-[#636e72] rounded-2xl overflow-hidden bg-white shadow-sm">
                {/* <button
                  onClick={() => toggleAccordion("coupon")}
                  className="w-full py-4 px-5 flex items-center justify-between text-left font-serif text-[15px] font-bold text-[#285b46] hover:bg-[#faf8f5] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                    View Available Offers
                  </span>
                  {accordions.coupon ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button> */}

                {true && (
                  <div className="p-5 bg-[#faf8f5]">
                    {/* Default coupon chips — shown when no coupon is applied */}
                    {!appliedCoupon && defaultCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {defaultCoupons.map((c) => (
                          <button
                            key={c.coupon_code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.coupon_code)}
                            disabled={couponStatus === "loading"}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-dashed border-[#295c47]/40 bg-[#295c47]/5 hover:bg-[#295c47]/15 hover:border-[#295c47] transition-all cursor-pointer disabled:opacity-50 group"
                            title={c.description || `${c.discount_percent}% off`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#295c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                            <span className="text-[11px] font-bold tracking-widest text-[#295c47] uppercase">{c.description || c.coupon_code}</span>
                            <span className="text-[10px] font-bold text-[#295c47] bg-[#295c47]/15 group-hover:bg-[#295c47]/25 px-1.5 py-0.5 rounded-full transition-colors">{c.discount_percent}% OFF</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {appliedCoupon ? (
                      /* Applied chip */
                      <div className="flex items-center gap-2 bg-[#295c47]/8 border border-[#295c47]/30 rounded-2xl px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#295c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="text-sm text-[#295c47] font-bold flex-1 tracking-widest uppercase">
                          {appliedCoupon.description || appliedCoupon.code}
                        </span>
                        <span className="text-xs text-[#295c47] font-bold bg-[#295c47]/10 px-2.5 py-1 rounded-full">
                          -{appliedCoupon.discountPercent}% OFF
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="ml-1 text-[#636e72] hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Remove coupon"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ) : (
                      /* Input row */
                      <div className="flex gap-2">
                        <input
                          id="slug-coupon-input"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponStatus) { setCouponStatus(null); setCouponMessage(""); }
                          }}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                          placeholder="ENTER COUPON CODE"
                          maxLength={20}
                          className="flex-1 border bg-white rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-[#636e72] transition-colors placeholder:text-[#636e72] placeholder:tracking-wider placeholder:font-sans placeholder:text-xs placeholder:uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponStatus === "loading" || !couponInput.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[#295c47] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1c4536] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                        >
                          {couponStatus === "loading" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                          ) : "Apply"}
                        </button>
                      </div>
                    )}

                    {/* Status message */}
                    {couponStatus === "success" && couponMessage && (
                      <p className="text-xs text-[#295c47] font-medium mt-2 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#295c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {couponMessage}
                      </p>
                    )}
                    {couponStatus === "error" && couponMessage && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Add/Buy CTA */}
              <div className="flex gap-4 border-b border-[#e8e4df] pb-8 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock || (category === "discovery-set" && selectedScents.length !== 5)}
                  className={`flex-1 py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${outOfStock
                    ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                    : (category === "discovery-set" && selectedScents.length !== 5)
                      ? "bg-[#f5f1ea] border-[#e8e4df] text-[#a59b8d] cursor-not-allowed opacity-80"
                      : inCart
                        ? "bg-[#295c47] hover:bg-[#1c4536] text-white shadow-md"
                        : "border-2 border-[#295c47] text-[#295c47] hover:bg-[#295c47] hover:text-white"
                    }`}
                >
                  {outOfStock ? (
                    "Sold Out"
                  ) : (category === "discovery-set" && selectedScents.length !== 5) ? (
                    `Select 5 Tins`
                  ) : addingToCart ? (
                    <>
                      <Check size={16} className="animate-bounce" />
                      Added!
                    </>
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
                  disabled={outOfStock || (category === "discovery-set" && selectedScents.length !== 5)}
                  className={`flex-1 py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-md flex items-center justify-center cursor-pointer ${outOfStock
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : (category === "discovery-set" && selectedScents.length !== 5)
                      ? "bg-[#e8e4df] text-[#a59b8d] cursor-not-allowed opacity-80 shadow-none"
                      : "bg-[#295c47] text-white hover:bg-[#475f50] hover:scale-102 hover:shadow-lg"
                    }`}
                >
                  {(category === "discovery-set" && selectedScents.length !== 5) ? "Select 5 Tins" : "Buy It Now"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[10px] font-bold uppercase tracking-wider text-[#636e72] font-['Urbanist'] mb-6 select-none">
                <div className="flex items-center gap-1.5">
                  <Truck size={13} className="text-[#295c47]" />
                  <span>Free shipping above ₹900</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={13} className="text-[#295c47]" />
                  <span>Non-Returnable (Hygiene Standards)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={13} className="text-[#295c47]" />
                  <span>ISO 9001:2015 Certified</span>
                </div>
              </div>



            </div> {/* End of Right Product Options Details */}

            {/* Left Column Bottom Details (ZERO Block + Accordions) */}
            <div className="lg:col-start-1 lg:row-start-2 w-full flex flex-col gap-8">

              {/* Innovative ZERO Formulation Banner */}
              <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-[#285b46] shadow-xl text-white w-full border border-[#1a3d2e] mt-2 lg:mt-0 group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#d4a574]/10 rounded-full blur-2xl group-hover:bg-[#d4a574]/20 transition-all duration-700"></div>

                <div className="relative z-2 flex flex-row items-stretch gap-0">
                  {/* ZERO - massive, spans the height of the list */}
                  <div className="flex items-center justify-center pr-6 flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="font-serif font-extrabold text-[#d4a574] leading-none select-none" style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)" }}>ZERO</span>
                    </div>
                  </div>

                  {/* Vertical divider */}
                  <div className="w-px bg-[#d4a574]/30 self-stretch mx-2 flex-shrink-0"></div>

                  {/* Chemicals — single column stacked */}
                  <div className="flex flex-col justify-around pl-6 gap-3 py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[#d4a574] flex-shrink-0"></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Phthalates</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[#d4a574] flex-shrink-0"></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Parabens</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[#d4a574] flex-shrink-0"></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Synthetics</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[#d4a574] flex-shrink-0"></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Alcohol</span>
                    </div>   {/* end Alcohol item */}
                  </div>  {/* end chemicals column */}
                </div>   {/* end flex-row */}
              </div>     {/* end banner card */}

              {/* Product Details Accordion */}
              <div className="border border-[#e8e4df] rounded-2xl overflow-hidden divide-y divide-[#e8e4df] shadow-sm bg-white">



                {/* 2. What Makes It Special */}
                {specialTitle && specialText && (
                  <div>
                    <button
                      onClick={() => toggleAccordion("special")}
                      className="w-full py-4.5 px-5 flex items-center justify-between text-left font-serif text-[17px] font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                    >
                      <span>What Makes It Special</span>
                      {accordions.special ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {accordions.special && (
                      <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-4">
                        <p>{specialText}</p>
                        {specialPoints && specialPoints.length > 0 && (
                          <div className="space-y-3 pt-2">
                            {specialPoints.map((point, idx) => (
                              <div key={idx} className="flex gap-3 items-start">
                                <div className="w-5 h-5 bg-[#295c47]/10 rounded-full flex items-center justify-center text-[#295c47] font-serif text-xs font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-serif text-xs font-bold text-[#285b46] mb-0.5">{point.label}</h4>
                                  <p className="text-[11px] leading-relaxed text-[#636e72]">{point.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. How to Use & Scent Ritual */}
                <div>
                  <button
                    onClick={() => toggleAccordion("use")}
                    className="w-full py-4.5 px-5 flex items-center justify-between text-left font-serif text-[17px] font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>How to Use & Scent Ritual</span>
                    {accordions.use ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.use && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-4">
                      {howToUse ? (
                        howToUse.steps && howToUse.areas ? (
                          <div className="space-y-3 text-left">
                            {howToUse.steps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#295c47] mt-2 flex-shrink-0" />
                                <span className="font-semibold text-[#2d3436]">{step}</span>
                              </div>
                            ))}
                            {howToUse.areas.map((area, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 pl-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574] mt-2 flex-shrink-0" />
                                <span className="font-semibold text-[#636e72] font-['Urbanist'] tracking-wide">{area}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>{howToUse.text || howToUse}</p>
                        )
                      ) : (
                        <p>{howToUseText}</p>
                      )}
                      <div className="relative rounded-2xl overflow-hidden border border-[#e8e4df] shadow-sm bg-white p-2.5 max-w-[380px] mx-auto mt-2">
                        <Image
                          src="/assets/website_assets/how_to_use.png"
                          alt="How to Use Unar Solid Perfume"
                          width={380}
                          height={250}
                          className="rounded-xl object-cover w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>




                {/* 5. Shipping & Returns Policy */}
                <div>
                  <button
                    onClick={() => toggleAccordion("shipping")}
                    className="w-full py-4.5 px-5 flex items-center justify-between text-left font-serif text-[17px] font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>Shipping & Returns Policy</span>
                    {accordions.shipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.shipping && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-4 text-left">
                      <div>
                        <h4 className="font-bold text-[#285b46] mb-1 text-[11px] uppercase tracking-wider">Shipping Details:</h4>
                        <p>Orders are dispatched within 24-48 hours. Delivery takes 3-5 business days across India. Free shipping is automatically applied on all orders above ₹900.</p>
                      </div>
                      <div className="border-t border-[#e8e4df]/60 pt-3 mt-3">
                        <h4 className="font-bold text-[#285b46] mb-1 text-[11px] uppercase tracking-wider">Return & Refund Policy:</h4>
                        <p>Due to the personal care and hygiene standards of natural solid perfumes, we maintain a strict <strong>no returns, no exchanges, and no refunds policy</strong>. All sales are final.</p>
                        <p className="mt-2 text-xs">If you receive a damaged, broken, or incorrect product, please email us with receipt details and photos at <a href="mailto:unar.consciousliving@gmail.com" className="text-[#295c47] font-semibold underline hover:text-[#475f50]">unar.consciousliving@gmail.com</a> or <a href="mailto:unar@unar.in" className="text-[#295c47] font-semibold underline hover:text-[#475f50]">unar@unar.in</a> within <strong>48 hours of delivery</strong>. We will happily replace it for you.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Safety & FAQs */}
                <div>
                  <button
                    onClick={() => toggleAccordion("safety")}
                    className="w-full py-4.5 px-5 flex items-center justify-between text-left font-serif text-[17px] font-bold text-[#285b46] bg-white hover:bg-[#fdfbf7] transition-all"
                  >
                    <span>Safety & Product FAQs</span>
                    {accordions.safety ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {accordions.safety && (
                    <div className="p-5 bg-[#fdfbf7] text-[13px] leading-[1.7] text-[#636e72] space-y-4">
                      <div>
                        <h4 className="font-bold text-[#285b46] mb-1 text-[11px] uppercase tracking-wider">Usage Precautions:</h4>
                        <p>{safetyText}</p>
                      </div>
                      {FAQS && FAQS.length > 0 && (
                        <div className="border-t border-[#e8e4df]/60 pt-3 mt-3 space-y-3">
                          <h4 className="font-bold text-[#285b46] mb-2 text-[11px] uppercase tracking-wider">Frequently Asked Questions:</h4>
                          <div className="faq-scroll-container space-y-3">
                            {FAQS.map((faq, idx) => (
                              <div key={idx} className="space-y-1">
                                <p className="font-semibold text-[#2d3436] text-[12px]">Q: {faq.q}</p>
                                <p className="text-[12px] text-[#636e72] pl-3 border-l-2 border-[#295c47]/30">A: {faq.a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>


        {/* ── RELATED PRODUCTS ── */}
        <section className="max-w-[1300px] mx-auto px-6 pt-16 border-t border-[#e8e4df]">
          <h2 className="font-serif text-3xl font-bold text-[#285b46] text-center mb-2">You May Also Like</h2>
          <p className="text-center text-[#636e72] text-sm mb-12">Discover other solid perfumes from UNAR collection</p>
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
                        <Link href={`/products/${p.slug}`} className="hover:text-[#295c47] transition-colors">{p.name}</Link>
                      </h3>
                      <p className="text-xs text-[#636e72] line-clamp-2 mb-4 leading-relaxed">{p.tagline}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#e8e4df]/60 pt-3.5 mt-auto">
                      <span className="font-serif text-xl font-bold text-[#285b46]">₹{p.price}</span>
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-xs font-bold uppercase tracking-wider text-[#295c47] hover:text-[#285b46] flex items-center gap-1"
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
