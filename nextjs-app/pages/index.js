import { useState } from "react";
import Image from "next/image";
import Head from "next/head";
import { useCart } from "@/lib/CartContext";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import ProductFlipCard from "@/components/ProductFlipCard";
import ContactForm from "@/components/ContactForm";
import InstagramCarousel from "@/components/InstagramCarousel";
import GoldenPollenParticles from "@/components/GoldenPollenParticles";
import { INSTAGRAM_VIDEO_URLS } from "@/config/instagramVideos";

const PRODUCTS = [
  { name: "Champa", price: 799, badge: "100% Natural", image: "cha.jpg", benefits: ["Eases stress, anxiety, and mental tension", "Provides a warming sense of emotional comfort", "Uplifts spirits and reduces fatigue"] },
  { name: "Jasmine", price: 499, badge: "100% Natural", image: "jas.jpg", benefits: ["Relieves stress and anxiety", "Supports deep, quality sleep", "Enhances libido and intimacy"] },
  { name: "Rose", price: 499, badge: "100% Natural", image: "rose.jpg", benefits: ["Eases anxiety, stress, and depression", "Boosts positivity, calm, and confidence", "Promotes relaxation and improves rest"] },
  { name: "Frangipani", price: 799, badge: "100% Natural", image: "fra.jpg", benefits: ["Enhances mental clarity", "Relieves stress and reduces tension", "Stimulates sensuality and romantic spirit"] },
  { name: "Blue Lotus", price: 799, badge: "100% Natural", image: "lot.jpg", benefits: ["Enhances mood and invites feelings of joy", "Reduces anxiety, fear and mental tension", "A gentle aid for sleep and deep relaxation"] },
  { name: "Vetiver", price: 799, badge: "100% Natural", image: "veti.jpg", benefits: ["Reduces anxiety and emotional tension", "Promotes restful sleep", "Improves memory and concentration"] },
  { name: "Oud", price: 1249, badge: "Premium", image: "oud.jpg", benefits: ["Eases anxiety and mental fatigue", "Supports respiratory health", "Relaxes the nervous system for inner peace"] },
  { name: "Sandalwood", price: 1249, badge: "Premium", image: "sand.jpg", benefits: ["Reduces anxiety and tension", "Soothes the nervous system for better rest", "Promotes grounding and mental clarity"], outOfStock: true },
];

const FEATURES = [
  { icon: "/assets/icons/natural.png", title: "100% Natural", desc: "Pure beeswax and essential oils, with absolutely no synthetic ingredients or harmful chemicals." },
  { icon: "/assets/icons/travel.png", title: "Travel Friendly", desc: "Compact tins perfect for your bag—no spills, no leaks, and TSA-approved for flights." },
  { icon: "/assets/icons/skin.png", title: "Skin Friendly", desc: "Suitable for all skin types. Hand-crafted and hand-poured in small batches with care." },
  { icon: "clock", title: "Long Lasting *", desc: "Compared to alcohol perfume. Solid wax formulas release scents slowly and last much longer.", isSvg: true },
];

const TESTIMONIALS = [
  { initial: "P", name: "Priya M.", city: "Chennai", quote: "\"I was skeptical at first, but the Champa scent is absolutely divine. It lasts all day and my skin feels so soft. Finally, a perfume I don't feel guilty using around my kids!\"" },
  { initial: "R", name: "Rahul K.", city: "Bangalore", quote: "\"The Sandalwood is my daily go-to. Love that it's travel-friendly and doesn't spill in my bag. The scent evolves beautifully throughout the day.\"" },
  { initial: "A", name: "Ananya S.", city: "Mumbai", quote: "\"As someone with sensitive skin, I've struggled with perfumes for years. Unar's solid perfumes are the first that don't irritate my skin. The Rose scent is heavenly!\"" },
];

const INGREDIENTS = [
  { title: "Pure Beeswax", desc: "It keeps the perfume solid while acting as a natural glue that holds the scent to your skin for a longer-lasting fragrance." },
  { title: "Jojoba Oil", desc: "This oil matches your skin's natural oils perfectly, allowing the perfume to soak in quickly without leaving any greasy or sticky feel." },
  { title: "Shea Butter", desc: "It gives the perfume a creamy, soft texture that melts instantly on your skin, leaving it feeling moisturized and smooth." },
  { title: "The Essence of Nature", desc: "These authentic botanical extracts interact with your unique body chemistry to create a personalized, evolving scent profile." },
];

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("box");
  const [testimonialTab, setTestimonialTab] = useState("video");

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
            <h1 className="flex flex-col items-center mb-6">
              <span className="font-edo text-7xl md:text-9xl text-[#5a7c65] tracking-wide leading-none select-none">UNAR</span>
              <span className="font-['Cormorant_Garamond'] text-lg md:text-2xl font-normal text-[#d4a574] italic tracking-[0.45em] mt-2 uppercase select-none">Conscious Living</span>
            </h1>
            <p className="text-lg md:text-xl text-[#636e72] mb-10 max-w-[600px] leading-[1.8]">
              Hand-crafted solid perfumes made with pure beeswax, natural butters, and essential oils.
              No harsh chemicals. No alcohols. No preservatives.
            </p>
            <div className="flex gap-4 justify-center flex-wrap mb-4">
              <a href="#collections" onClick={(e) => { e.preventDefault(); document.querySelector("#collections")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full bg-[#5a7c65] text-white font-medium hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Explore Collections
              </a>
              <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full border-2 border-[#5a7c65] text-[#5a7c65] font-medium hover:bg-[#5a7c65] hover:text-white transition-all hover:-translate-y-0.5">
                Our Story
              </a>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[30px] h-[50px] border-2 border-[#5a7c65] rounded-[20px] flex justify-center pt-2">
            <span className="scroll-dot w-1 h-2 bg-[#5a7c65] rounded-sm" />
          </div>
        </section>

        {/* ── COLLECTIONS ── */}
        <section id="collections" className="py-24 bg-[#fdfbf7]">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-3">Our Collections</h2>
            <p className="text-center text-[#636e72] text-lg mb-8">Eight exquisite fragrances inspired by nature&apos;s finest botanicals</p>
            
            {/* Package Tab Switcher */}
            <div className="flex justify-center mb-12">
              <div className="bg-[#5a7c65]/10 p-1.5 rounded-full flex items-center gap-1 border border-[#5a7c65]/10">
                <button
                  onClick={() => setSelectedPackage("box")}
                  className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    selectedPackage === "box"
                      ? "bg-[#5a7c65] text-white shadow-md"
                      : "text-[#5a7c65] hover:bg-[#5a7c65]/5"
                  }`}
                >
                  Premium Box
                </button>
                <button
                  onClick={() => setSelectedPackage("tin")}
                  className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    selectedPackage === "tin"
                      ? "bg-[#5a7c65] text-white shadow-md"
                      : "text-[#5a7c65] hover:bg-[#5a7c65]/5"
                  }`}
                >
                  Round Tin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-12" style={{ perspective: "1000px" }}>
              {PRODUCTS.map((product) => (
                <ProductFlipCard key={product.name} product={product} packageType={selectedPackage} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TRANSPARENCY & INGREDIENTS ── */}
        <section id="transparency" className="py-24 bg-white border-b border-[#e8e4df]">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-3">Transparency</h2>
            <p className="text-center text-[#636e72] text-lg mb-12">Every ingredient is natural, clean, and selected with care</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {INGREDIENTS.map((ing) => (
                <div key={ing.title} className="ingredient-card bg-[#fdfbf7] border border-[#e8e4df] rounded-xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <h4 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mb-3 font-semibold">{ing.title}</h4>
                  <p className="text-[15px] leading-[1.7] text-[#636e72]">{ing.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-[1300px] mx-auto px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] mb-4">Our Story</h2>
                <div className="space-y-0">
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Name: <span className="font-edo font-normal tracking-wide">UNAR (உணர்)</span></h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">We chose the name <strong><span className="font-edo font-normal tracking-wider text-[1.1em]">UNAR</span></strong> because it translates to more than just &ldquo;sense.&rdquo; It means to feel, to realize, and to become aware. Our brand is built on the belief that every action should be a mindful ritual—a moment where you pause to connect with yourself like our first product &ldquo;Natural Solid Perfumes&rdquo;.</p>
                  
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Story of <span className="font-edo font-normal tracking-wide">UNAR</span>: From Our Home to Your Skin</h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">We began searching for a natural fragrance because we were tired of harsh chemicals and full of guilt when the same was used by our child. Available options were limited to the fragrance of west and usage of synthetics for mass production. We missed the honest scents of our daily lives—the Champa, Frangipani, and Vetiver we walk past every day.</p>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">So, we started researching. What began as a quest for the &ldquo;right mix&rdquo; became a beautiful family ritual. We discovered that a natural scent is a powerful mood elevator that shouldn&apos;t require synthetic alcohol or artificial flavors.</p>
                  
                  {/* Story Video */}
                  <div className="my-8 rounded-2xl overflow-hidden shadow-lg border border-[#e8e4df] bg-[#fdfbf7] aspect-video relative">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                      src="https://unarassets.s3.us-east-1.amazonaws.com/The_Name_UNAR_%E0%AE%89%E0%AE%A3%E0%AE%B0%E0%AF%8D__We_chose.mp4"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Ritual</h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5"><span className="font-edo font-normal tracking-wider text-[1.1em]">UNAR</span> solid perfume is designed for the intimate areas of your life—your pulse points, your neck, and even for natural odor control in your underarms.</p>
                </div>
              </div>

              {/* Right sticky card */}
              <div className="sticky top-[120px]">
                <div className="bg-gradient-to-br from-[#5a7c65] to-[#475f50] text-white p-10 rounded-2xl shadow-2xl">
                  <h3 className="font-['Cormorant_Garamond'] text-3xl mb-4">What is Solid Perfume?</h3>
                  <p className="leading-[1.8] mb-6 opacity-95">Solid perfume is a concentrated fragrance made from natural waxes and oils. Unlike alcohol-based perfumes, our solid perfumes are gentle on the skin, long-lasting, and perfect for on-the-go application.</p>
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm text-center">
                    <Image src="/assets/website_assets/how_to_use.png" alt="How to Use Unar Solid Perfume" width={450} height={300} className="w-full max-w-[450px] rounded-xl mb-4" />
                    <p className="text-[13px] italic text-white/90"><strong>Note:</strong> Natural Solid Perfume contains natural essential oils. If pregnant or nursing, consult your physician before use.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 bg-gradient-to-b from-[#fdfbf7] to-white">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-12">Why Choose <span className="font-edo font-normal tracking-wide">UNAR</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card bg-white p-10 rounded-2xl shadow-sm border border-[#e8e4df] text-center flex flex-col items-center min-h-[280px]">
                  <div className="w-20 h-20 flex items-center justify-center mb-6">
                    {f.isSvg ? (
                      <div className="w-16 h-16 text-[#5a7c65] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                    ) : (
                      <Image src={f.icon} alt={f.title} width={80} height={80} className="object-contain drop-shadow-sm" />
                    )}
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mb-3">{f.title}</h3>
                  <p className="text-[#636e72] leading-[1.7] text-[15px]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="py-24 bg-gradient-to-br from-[#f5f1eb] to-white">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-3">Real Stories &amp; Reviews</h2>
            <p className="text-center text-[#636e72] text-lg mb-8">Hear from our community of conscious living enthusiasts</p>

            {/* Tab Switcher */}
            <div className="flex justify-center mb-12">
              <div className="bg-[#5a7c65]/10 p-1.5 rounded-full flex items-center gap-1 border border-[#5a7c65]/10">
                <button
                  onClick={() => setTestimonialTab("video")}
                  className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    testimonialTab === "video"
                      ? "bg-[#5a7c65] text-white shadow-md"
                      : "text-[#5a7c65] hover:bg-[#5a7c65]/5"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  Video Reviews
                </button>
                <button
                  onClick={() => setTestimonialTab("whatsapp")}
                  className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    testimonialTab === "whatsapp"
                      ? "bg-[#5a7c65] text-white shadow-md"
                      : "text-[#5a7c65] hover:bg-[#5a7c65]/5"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Customer Stories
                </button>
              </div>
            </div>

            {/* ── VIDEO REVIEWS TAB ── */}
            {testimonialTab === "video" && (
              <div className="flex flex-col items-center">
                <InstagramCarousel urls={INSTAGRAM_VIDEO_URLS} />
              </div>
            )}

            {/* ── WHATSAPP STORIES TAB ── */}
            {testimonialTab === "whatsapp" && (
              <div className="flex flex-col items-center gap-8">
                <div className="whatsapp-chat-phone">
                  <div className="whatsapp-chat-header">
                    <div className="whatsapp-chat-avatar">U</div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight"><span className="font-edo font-normal tracking-wider text-[1.1em]">UNAR</span> Customer Support</h4>
                      <span className="whatsapp-chat-status">Online</span>
                    </div>
                  </div>
                  <div className="whatsapp-chat-body">
                    <div className="whatsapp-bubble received">
                      <p className="text-xs font-semibold text-[#128c7e] mb-1">Rahul K. (Bangalore)</p>
                      <p>The Sandalwood is my daily go-to. Love that it&apos;s travel-friendly and doesn&apos;t spill in my bag! The scent evolves beautifully throughout the day. 🌲</p>
                      <div className="whatsapp-bubble-time"><span>11:24 AM</span></div>
                    </div>
                    <div className="whatsapp-bubble sent">
                      <p>So glad you are loving the Sandalwood solid perfume, Rahul! Thank you for the wonderful feedback! 🙏💚</p>
                      <div className="whatsapp-bubble-time">
                        <span>11:26 AM</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                          <polyline points="13 6 13 11" />
                        </svg>
                      </div>
                    </div>
                    <div className="whatsapp-bubble received">
                      <p className="text-xs font-semibold text-[#128c7e] mb-1">Amrit S. (Delhi)</p>
                      <p>Tried the Vetiver sample today. The earthy notes are amazing. It feels so soothing on the skin, and no irritation at all. Definitely ordering a full tin.</p>
                      <div className="whatsapp-bubble-time"><span>02:15 PM</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-16 pt-8 border-t border-[#e8e4df]">
              <p className="font-['Cormorant_Garamond'] text-2xl text-[#2d3436] mb-5">Ready to experience conscious, natural fragrance?</p>
              <a href="#contact" onClick={(e) => { e.preventDefault(); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-block px-8 py-3.5 rounded-full bg-[#5a7c65] text-white font-medium hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Contact Us / Request Sample
              </a>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="py-24 bg-gradient-to-br from-[#fdfbf7] to-[#f0ebe5]">
          <div className="max-w-[1300px] mx-auto px-10">
            <ContactForm />
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#2d3436] text-white">
        <div className="max-w-[1300px] mx-auto px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <Image src="/assets/unar_text.png" alt="UNAR" width={160} height={50} className="mb-3 brightness-200" />
              <p className="text-[#d4a574] italic mb-2">Conscious Living.</p>
              <p className="text-white/60 text-sm leading-relaxed">Natural solid perfumes handcrafted with love, for conscious living.</p>
            </div>
            <div>
              <h4 className="text-[#d4a574] font-semibold mb-4 uppercase text-sm tracking-widest">Quick Links</h4>
              <ul className="space-y-2">
                {["#home", "#about", "#features", "#collections", "#contact"].map((href) => (
                  <li key={href}>
                    <button onClick={() => { document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }} className="text-white/60 hover:text-white transition-colors text-sm bg-transparent border-none cursor-pointer capitalize">
                      {href.replace("#", "")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[#d4a574] font-semibold mb-4 uppercase text-sm tracking-widest">Contact</h4>
              <div className="flex gap-3 items-center flex-wrap">
                {/* Phone */}
                <a href="tel:+919600522437" title="Phone: +91 9600522437" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#5a7c65] hover:text-white transition-all duration-300 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/919600522437" target="_blank" rel="noopener noreferrer" title="WhatsApp: +91 9600522437" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/unar.consciousliving" target="_blank" rel="noopener noreferrer" title="Instagram: @unar.consciousliving" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#E1306C] hover:text-white transition-all duration-300 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                {/* Email */}
                <a href="mailto:unar.consciousliving@gmail.com" title="Email: unar.consciousliving@gmail.com" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#d4a574] hover:text-white transition-all duration-300 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
                {/* Website */}
                <a href="http://www.unar.in" target="_blank" rel="noopener noreferrer" title="Website: www.unar.in" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#5a7c65] hover:text-white transition-all duration-300 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} <span className="font-edo font-normal tracking-wider text-[1.1em]">UNAR</span>. All rights reserved. | Handcrafted with ❤️ by team{" "}
            <a href="https://nunmi.in/" target="_blank" rel="noopener noreferrer" className="text-[#d4a574] hover:text-[#e8c9a8] transition-colors">NuNmi</a>
          </div>
        </div>
      </footer>

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
