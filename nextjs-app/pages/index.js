import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Head from "next/head";
import { useCart } from "@/lib/CartContext";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import ProductCard from "@/components/ProductCard";
import GoldenPollenParticles from "@/components/GoldenPollenParticles";

import Footer from "@/components/Footer";
import { PRODUCTS } from "@/config/products";


const FEATURES = [
  { icon: "/assets/icons/natural.png", title: "100% Natural", desc: "Pure beeswax and essential oils, with absolutely no synthetic ingredients or harmful chemicals." },
  { icon: "/assets/icons/travel.png", title: "Travel Friendly", desc: "Compact tins perfect for your bag—no spills, no leaks, and TSA-approved for flights." },
  { icon: "/assets/icons/skin.png", title: "Skin Friendly", desc: "Suitable for all skin types. Hand-crafted and hand-poured in small batches with care." },
  { icon: "clock", title: "Long Lasting *", desc: "Compared to alcohol perfume. Solid wax formulas release scents slowly and last much longer.", isSvg: true },
];


const INGREDIENTS = [
  { title: "Pure Beeswax", desc: "It keeps the perfume solid while acting as a natural glue that holds the scent to your skin for a longer-lasting fragrance." },
  { title: "Jojoba Oil", desc: "This oil matches your skin's natural oils perfectly, allowing the perfume to soak in quickly without leaving any greasy or sticky feel." },
  { title: "Shea Butter", desc: "It gives the perfume a creamy, soft texture that melts instantly on your skin, leaving it feeling moisturized and smooth." },
  { title: "The Essence of Nature", desc: "These authentic botanical extracts interact with your unique body chemistry to create a personalized, evolving scent profile." },
];

export default function Home() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (router.isReady && router.query.category) {
      setActiveCategory(router.query.category);
    }
  }, [router.isReady, router.query.category]);

  // Listen for checkout event from CartSidebar
  if (typeof window !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    // We use a simple approach: let CheckoutButton dispatch an event
    if (!window.__unarCheckoutListenerSet) {
      window.__unarCheckoutListenerSet = true;
      document.addEventListener("openCheckout", () => setCheckoutOpen(true));
    }
  }

  return (
    <>
      <Head>
        <title>Unar - Conscious Living | Natural Solid Perfumes</title>
        <meta name="description" content="Unar - Natural solid perfumes handcrafted with pure beeswax and essential oils. Conscious Living." />
        <meta name="keywords" content="natural perfume, solid perfume, beeswax perfume, essential oils, handcrafted fragrance" />
        <link rel="icon" href="/assets/website_assets/logo-circle.png" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </Head>

      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main>
        {/* ── HERO ── */}
        <section id="home" className="pt-[140px] pb-20 min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-[#fdfbf7] to-[#f5f1eb]">
          <GoldenPollenParticles />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,165,116,0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-[800px] mx-auto px-10 w-full text-center flex flex-col items-center animate-fade-in-up">
            <h1 className="flex flex-col items-center mb-0">
              <img
                src="/assets/website_assets/mockups/logo_tagline.png"
                alt="UNAR"
                className="h-100 md:h-100 w-auto object-contain select-none mb-0"
              />
              {/* <span className="font-madelyn text-5xl md:text-8xl font-normal text-[#d4a574] -mt-8 md:-mt-14 select-none">Conscious Living</span> */}
            </h1>
            <div className="text-left md:text-center text-[#636e72] max-w-[650px] mx-auto mb-8 space-y-6">
              <p className="text-lg md:text-xl leading-[1.8]">
                A sensory brand dedicated to the art of awakening. We bridge the gap between ancient heritage and modern mindfulness through intentional, handcrafted rituals.
              </p>
              <p className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#c28445] italic tracking-wide">
                Awaken your senses. Live with intent.
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap mb-4">
              <a href="#collections" onClick={(e) => { e.preventDefault(); document.querySelector("#collections")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full bg-[#295c47] text-white font-medium hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Explore Collections
              </a>
              <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full border-2 border-[#295c47] text-[#295c47] font-medium hover:bg-[#295c47] hover:text-white transition-all hover:-translate-y-0.5">
                Our Story
              </a>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[30px] h-[50px] border-2 border-[#295c47] rounded-[20px] flex justify-center pt-2">
            <span className="scroll-dot w-1 h-2 bg-[#295c47] rounded-sm" />
          </div>
        </section>

        {/* ── COLLECTIONS ── */}
        <section id="collections" className="py-24 bg-[#fdfbf7]">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#295c47] text-center mb-3">Our Collections</h2>
            <p className="text-center text-[#636e72] text-lg mb-8">Nine exquisite fragrances inspired by native botanical scents from the lands of India</p>

            {/* Category tabs instead of package toggle */}
            <div className="flex justify-center mb-12">
              <div className="bg-[#295c47]/10 p-1.5 rounded-2xl flex flex-wrap justify-center items-center gap-1.5 border border-[#295c47]/10 max-w-full">
                {[
                  { id: "all", label: "All Products" },
                  { id: "solid-perfume", label: "Solid Perfumes" },
                  // { id: "car-fragrance", label: "Car Fragrances" },
                  { id: "discovery-set", label: "Discovery Set" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 cursor-pointer ${activeCategory === cat.id
                      ? "bg-[#295c47] text-white shadow-md"
                      : "text-[#285b46] hover:bg-[#295c47]/5"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-12 animate-fade-in-up">
              {PRODUCTS.filter(p => activeCategory === "all" || p.category === activeCategory).map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>


        {/* ── ABOUT ── */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-[800px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#295c47] mb-4 text-center">Our Story</h2>
            <div className="space-y-0 text-justify md:text-left">
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                <strong>UNAR</strong> began with a simple concern that turned into a serious question: what are we really surrounding ourselves with every day — on our skin, in our hair, in our homes?
              </p>
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                Perfumes and fresheners had become part of daily life, but they were also bringing discomfort and headaches for our loved ones, due to the strong mix of alcohol and synthetic chemicals. We realised we weren’t just looking for “good fragrance” anymore; we were looking for fragrance that felt safe, gentle, and honest.
              </p>
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                In our older traditions, fragrance was deeply personal. It was worn close to the body, used in homes and rituals, for calm, prayer, and inner joy — not to overpower a room or shout for attention. Somewhere along the way, fragrance moved from being a soulful experience for the self to attract strangers.
              </p>

              <p className="text-[21px] leading-[1.8] text-[#295c47] my-9 font-serif italic font-semibold text-center border-y border-[#295c47]/10 py-6">
                UNAR is our way of bringing that original intention back.
              </p>

              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                The idea took shape in a flower market, when the scent of golden champa pulled us straight into a childhood memory — a single flower in the hair, its quiet fragrance lasting all day, with no alcohol, no harshness, just pure happiness close to the body. That moment showed us what we truly wanted: fragrance that is alive, botanical, and rooted in our own land.
              </p>
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                UNAR creates conscious fragrances using native botanicals, plant-based ingredients, and mindful formulations — whether in solid perfumes, hair fragrances, car scents, or room fresheners.
              </p>
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                Whatever the format, our aim is the same: to keep the experience intimate, clean, and deeply connected to you and your space.
              </p>
              <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">
                UNAR is not just about grabbing attention. It is a daily ritual of choosing fragrances that are softer on the senses, kinder to the body, and more in tune with how we really want to live.
              </p>

              <div className="pt-8 border-t border-[#e8e4df]/60 mt-10 text-left">
                <p className="text-[17px] font-medium text-[#636e72] italic mb-2">
                  This is where conscious living begins.
                </p>
                <h3 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-[#295c47] tracking-wide mt-1">
                  Welcome to UNAR
                </h3>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <Footer />

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919600522437?text=Hi%20Unar!%20I'm%20interested%20in%20your%20natural%20solid%20perfumes."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:bg-[#128C7E] hover:scale-110 transition-all group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute right-16 bg-[#2d3436] text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Chat with us</span>
      </a>
    </>
  );
}
