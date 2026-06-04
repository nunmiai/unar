import { useState } from "react";
import Image from "next/image";
import Head from "next/head";
import { useCart } from "@/lib/CartContext";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import ProductFlipCard from "@/components/ProductFlipCard";
import ContactForm from "@/components/ContactForm";

const PRODUCTS = [
  { name: "Champa", price: 799, badge: "100% Natural", image: "champa2.png", benefits: ["Eases stress, anxiety, and mental tension", "Provides a warming sense of emotional comfort", "Uplifts spirits and reduces fatigue"] },
  { name: "Jasmine", price: 499, badge: "100% Natural", image: "jasmine1.png", benefits: ["Relieves stress and anxiety", "Supports deep, quality sleep", "Enhances libido and intimacy"] },
  { name: "Rose", price: 499, badge: "100% Natural", image: "Rose.png", benefits: ["Eases anxiety, stress, and depression", "Boosts positivity, calm, and confidence", "Promotes relaxation and improves rest"] },
  { name: "Frangipani", price: 799, badge: "100% Natural", image: "frangipani 4.png", benefits: ["Enhances mental clarity", "Relieves stress and reduces tension", "Stimulates sensuality and romantic spirit"] },
  { name: "Blue Lotus", price: 799, badge: "100% Natural", image: "bluelotus.png", benefits: ["Enhances mood and invites feelings of joy", "Reduces anxiety, fear and mental tension", "A gentle aid for sleep and deep relaxation"] },
  { name: "Vetiver", price: 799, badge: "100% Natural", image: "vetiver.png", benefits: ["Reduces anxiety and emotional tension", "Promotes restful sleep", "Improves memory and concentration"] },
  { name: "Oud", price: 1249, badge: "Premium", image: "oud.png", benefits: ["Eases anxiety and mental fatigue", "Supports respiratory health", "Relaxes the nervous system for inner peace"] },
  { name: "Sandalwood", price: 1249, badge: "Premium", image: "sandalwood1.png", benefits: ["Reduces anxiety and tension", "Soothes the nervous system for better rest", "Promotes grounding and mental clarity"], outOfStock: true },
];

const FEATURES = [
  { icon: "/assets/icons/natural.png", title: "100% Natural", desc: "Pure beeswax and essential oils, with absolutely no synthetic ingredients or harmful chemicals." },
  { icon: "/assets/icons/travel.png", title: "Travel Friendly", desc: "Compact tins perfect for your bag—no spills, no leaks, and TSA-approved for flights." },
  { icon: "/assets/icons/skin.png", title: "Skin Friendly", desc: "Suitable for all skin types. Hand-crafted and hand-poured in small batches with care." },
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
        <link rel="icon" href="/assets/logo.png" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </Head>

      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <main>
        {/* ── HERO ── */}
        <section id="home" className="pt-[140px] pb-20 min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-[#fdfbf7] to-[#f5f1eb]">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,rgba(212,165,116,0.1)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-[1300px] mx-auto px-10 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in-up">
                <h1 className="flex flex-col mb-6">
                  <Image src="/assets/unar_text.png" alt="UNAR" width={250} height={80} className="max-w-[250px] h-auto mb-[-30px] drop-shadow-md" />
                  <span className="font-['Cormorant_Garamond'] text-4xl font-normal text-[#d4a574] italic mt-0">Conscious Living</span>
                </h1>
                <p className="text-lg text-[#636e72] mb-8 max-w-[500px] leading-[1.8]">
                  Hand-crafted solid perfumes made with pure beeswax, natural butters, and essential oils.
                  No harsh chemicals. No alcohols. No preservatives.
                </p>
                <div className="flex gap-4 flex-wrap mb-4">
                  <a href="#collections" onClick={(e) => { e.preventDefault(); document.querySelector("#collections")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full bg-[#5a7c65] text-white font-medium hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    Explore Collections
                  </a>
                  <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full border-2 border-[#5a7c65] text-[#5a7c65] font-medium hover:bg-[#5a7c65] hover:text-white transition-all hover:-translate-y-0.5">
                    Our Story
                  </a>
                </div>
                <div className="mt-4">
                  <Image src="/assets/logo.svg" alt="Handcrafted & 100% Natural" width={300} height={80} className="max-w-[220px] drop-shadow-sm" />
                </div>
              </div>
              <div className="relative animate-fade-in-right">
                <Image src="/assets/Designer.png" alt="Natural botanical illustration" width={500} height={500} className="w-full max-w-[500px] drop-shadow-2xl" />
                <div className="butterfly-float absolute top-[10%] right-[-12%] w-[180px] z-10">
                  <Image src="/assets/butterfly.png" alt="Butterfly decoration" width={180} height={180} className="w-full drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[30px] h-[50px] border-2 border-[#5a7c65] rounded-[20px] flex justify-center pt-2">
            <span className="scroll-dot w-1 h-2 bg-[#5a7c65] rounded-sm" />
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-[1300px] mx-auto px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] mb-4">Our Story</h2>
                <div className="space-y-0">
                  {[
                    { heading: "The Name: Unar (உணர்)", content: "We chose the name Unar because it translates to more than just \"sense.\" It means to feel, to realize, and to become aware. Our brand is built on the belief that every action should be a mindful ritual—a moment where you pause to connect with yourself like our first product \"Natural Solid Perfumes\"." },
                    { heading: "The Story of Unar: From Our Home to Your Skin", content: null },
                  ].map(({ heading }) => (
                    <h3 key={heading} className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">{heading}</h3>
                  ))}
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">We chose the name <strong>Unar</strong> because it translates to more than just &ldquo;sense.&rdquo; It means to feel, to realize, and to become aware.</p>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Story of Unar: From Our Home to Your Skin</h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">We began searching for a natural fragrance because we were tired of harsh chemicals and full of guilt when the same was used by our child. Available options were limited to the fragrance of west and usage of synthetics for mass production. We missed the honest scents of our daily lives—the Champa, Frangipani, and Vetiver we walk past every day.</p>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">So, we started researching. What began as a quest for the &ldquo;right mix&rdquo; became a beautiful family ritual. We discovered that a natural scent is a powerful mood elevator that shouldn&apos;t require synthetic alcohol or artificial flavors.</p>
                  <p className="text-[18px] leading-[1.9] text-[#5a7c65] font-medium px-5 py-5 bg-[#e8d5c4] border-l-4 border-[#5a7c65] rounded mb-5">We created Unar (உணர்) to share this realization. Our goal is to help you become mindful of what touches your skin.</p>
                  <p className="font-['Cormorant_Garamond'] text-xl text-[#2d3436] mt-8"><strong>From our family to yours—experience Conscious Living.</strong></p>

                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Craft</h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-6">We stripped away the alcohol and the aerosols, returning to the ancient, tactile tradition of solid perfumes. Our formula is a deliberate blend of nature&apos;s most resilient ingredients:</p>

                  <div className="grid grid-cols-2 gap-5 my-6">
                    {INGREDIENTS.map((ing) => (
                      <div key={ing.title} className="ingredient-card bg-[#fdfbf7] border border-[#e8e4df] rounded-xl p-6">
                        <h4 className="font-['Cormorant_Garamond'] text-lg text-[#5a7c65] mb-3 font-semibold">{ing.title}</h4>
                        <p className="text-[15px] leading-[1.7] text-[#636e72]">{ing.desc}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mt-9 mb-4">The Ritual</h3>
                  <p className="text-[17px] leading-[1.9] text-[#636e72] mb-5">Unar is designed for the intimate areas of your life—your pulse points, your neck, and even for natural odor control in your underarms. It is travel-friendly, spill-proof, and designed to evolve with your body chemistry over the course of the day.</p>
                  <p className="font-['Cormorant_Garamond'] text-xl text-[#2d3436] mt-8"><strong>We invite you to stop spraying and start sensing.</strong><br />Welcome to Unar. Realize your essence.</p>
                </div>
              </div>

              {/* Right sticky card */}
              <div className="sticky top-[120px]">
                <div className="bg-gradient-to-br from-[#5a7c65] to-[#475f50] text-white p-10 rounded-2xl shadow-2xl">
                  <h3 className="font-['Cormorant_Garamond'] text-3xl mb-4">What is Solid Perfume?</h3>
                  <p className="leading-[1.8] mb-6 opacity-95">Solid perfume is a concentrated fragrance made from natural waxes and oils. Unlike alcohol-based perfumes, our solid perfumes are gentle on the skin, long-lasting, and perfect for on-the-go application.</p>
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm text-center">
                    <Image src="/assets/new_assets/hOW TO USE.png" alt="How to Use Unar Solid Perfume" width={450} height={300} className="w-full max-w-[450px] rounded-xl mb-4" />
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
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-12">Why Choose Unar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card bg-white p-10 rounded-2xl shadow-sm border border-[#e8e4df] text-center flex flex-col items-center min-h-[280px]">
                  <div className="w-20 h-20 flex items-center justify-center mb-6">
                    <Image src={f.icon} alt={f.title} width={80} height={80} className="object-contain drop-shadow-sm" />
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#5a7c65] mb-3">{f.title}</h3>
                  <p className="text-[#636e72] leading-[1.7] text-[15px]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COLLECTIONS ── */}
        <section id="collections" className="py-24 bg-[#fdfbf7]">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-3">Our Collections</h2>
            <p className="text-center text-[#636e72] text-lg mb-12">Eight exquisite fragrances inspired by nature&apos;s finest botanicals</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-12" style={{ perspective: "1000px" }}>
              {PRODUCTS.map((product) => (
                <ProductFlipCard key={product.name} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="py-24 bg-gradient-to-br from-[#f5f1eb] to-white">
          <div className="max-w-[1300px] mx-auto px-10">
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#5a7c65] text-center mb-3">What Our Customers Say</h2>
            <p className="text-center text-[#636e72] text-lg mb-12">Join hundreds of conscious families who&apos;ve made the switch to natural fragrances</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="relative bg-white p-8 rounded-2xl shadow-sm border border-[#e8e4df] hover:-translate-y-1.5 hover:shadow-xl hover:border-[#d4a574] transition-all duration-300">
                  <span className="absolute top-5 right-6 font-['Cormorant_Garamond'] text-7xl text-[#e8d5c4] leading-none opacity-50 select-none">&ldquo;</span>
                  <div className="text-[#f4b942] text-lg tracking-widest mb-4">★★★★★</div>
                  <p className="text-[16px] leading-[1.8] text-[#636e72] mb-6 italic">{t.quote}</p>
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5a7c65] to-[#475f50] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">{t.initial}</div>
                    <div>
                      <h4 className="font-['Cormorant_Garamond'] text-lg text-[#2d3436]">{t.name}</h4>
                      <span className="text-[14px] text-[#636e72]">{t.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12 pt-8 border-t border-[#e8e4df]">
              <p className="font-['Cormorant_Garamond'] text-2xl text-[#2d3436] mb-5">Experience the difference yourself</p>
              <a href="#contact" onClick={(e) => { e.preventDefault(); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-block px-8 py-3.5 rounded-full bg-[#5a7c65] text-white font-medium hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Contact Us
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
              <ul className="space-y-2 text-sm">
                <li><a href="tel:+919600522437" className="text-white/60 hover:text-white transition-colors">+91 9600522437</a></li>
                <li><a href="mailto:unar.consciousliving@gmail.com" className="text-white/60 hover:text-white transition-colors">unar.consciousliving@gmail.com</a></li>
                <li><a href="http://www.unar.in" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">www.unar.in</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} Unar. All rights reserved. | Handcrafted with ❤️ by team{" "}
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
