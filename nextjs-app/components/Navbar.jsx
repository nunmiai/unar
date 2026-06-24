import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCart } from "@/lib/CartContext";
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { PRODUCTS } from "@/config/products";

export default function Navbar({ onCartOpen }) {
  const { cartCount } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("");

  // Mega menu states (desktop & mobile)
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const isHomePage = router.pathname === "/";
  let hoverTimeout = null;

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsMegaOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      setIsMegaOpen(false);
    }, 150);
  };

  useEffect(() => {
    try {
      const unarUser = JSON.parse(localStorage.getItem("unarUser") || "null");
      if (unarUser && unarUser.email) setUser(unarUser);
    } catch { }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection Observer for Active Section Highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      {
        rootMargin: "-100px 0px -40% 0px",
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll("section[id], header[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleLogout = async () => {
    const AUTH_API = "https://hxr7qp46qicsvrlnale5v7z34m0crgjm.lambda-url.us-east-1.on.aws/";
    try {
      const tokens = JSON.parse(localStorage.getItem("unarTokens") || "{}");
      if (tokens.access_token) {
        await fetch(`${AUTH_API}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokens.access_token }),
        });
      }
    } catch { }
    localStorage.removeItem("unarUser");
    localStorage.removeItem("unarTokens");
    setUser(null);
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "#about", label: "Our Story" },
    { href: "#contact", label: "Contact" },
  ];

  const scrollToSection = (href) => {
    if (isHomePage) {
      if (href.startsWith("#")) {
        const el = document.querySelector(href);
        if (el) {
          const headerH = document.querySelector("header")?.offsetHeight || 80;
          window.scrollTo({ top: el.offsetTop - headerH, behavior: "smooth" });
        }
      }
    } else {
      router.push(`/${href}`);
    }
    setMobileOpen(false);
  };

  // Scroll to section on mount if arriving from another page with a hash
  useEffect(() => {
    if (isHomePage && router.asPath.includes("#")) {
      const hash = router.asPath.split("#")[1];
      const el = document.getElementById(hash);
      if (el) {
        const timer = setTimeout(() => {
          const headerH = document.querySelector("header")?.offsetHeight || 80;
          window.scrollTo({ top: el.offsetTop - headerH, behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [isHomePage, router.asPath]);

  // Find individual non-solid-perfume category entities
  const carProduct = PRODUCTS.find(p => p.category === "car-fragrance");
  const discoveryProduct = PRODUCTS.find(p => p.category === "discovery-set");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-[#fdfbf7]/95 backdrop-blur-md shadow-md"
          : "bg-[#fdfbf7]/95 backdrop-blur-sm shadow-sm"
        }`}
    >
      <nav className="max-w-[1300px] mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo on top left */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/logo-circle.png"
            alt="UNAR Logo"
            width={55}
            height={55}
            className="object-contain transition-transform hover:scale-105"
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex list-none gap-10 items-center mb-0 pl-0">
          {/* Shop with Mega Menu Trigger */}
          <li 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`nav-link-hover text-[15px] tracking-wide transition-all duration-300 bg-transparent border-none cursor-pointer flex items-center gap-1 font-semibold hover:text-[#5a7c65] ${
                isMegaOpen ? "text-[#285b46]" : "text-[#2d3436]"
              }`}
            >
              Shop
              <ChevronDown size={14} className={`transition-transform duration-300 ${isMegaOpen ? "rotate-180 text-[#285b46]" : "text-gray-400"}`} />
            </button>
            
            {/* Desktop Mega Menu Dropdown */}
            {isMegaOpen && (
              <div 
                className="absolute top-full -left-20 w-[840px] bg-[#fdfbf7]/98 backdrop-blur-md border border-[#e8e4df] rounded-2xl shadow-xl z-50 animate-fade-in-down p-6 mt-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-[1.85fr_1fr_1fr] gap-6">
                  {/* Column 1: Solid Perfumes List (2-column layout) */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#5a7c65] border-b border-[#e8e4df]/60 pb-1.5 mb-1">Solid Perfumes</h4>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                      {PRODUCTS.filter(p => p.category === "solid-perfume").map(p => (
                        <Link 
                          key={p.slug}
                          href={`/products/${p.slug}`}
                          onClick={() => setIsMegaOpen(false)}
                          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#5a7c65]/5 transition-all duration-200 group/item text-left"
                        >
                          <img 
                            src={`/assets/website_assets/mockups/${p.image}`} 
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[#e8e4df] bg-white group-hover/item:scale-102 transition-transform"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#2d3436] group-hover/item:text-[#285b46] transition-colors">{p.name}</span>
                            <span className="text-[9px] text-[#636e72] line-clamp-1">{p.tagline.split(" for ")[0]}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Car Perfumes Spotlight Card */}
                  {carProduct && (
                    <div className="bg-gradient-to-br from-[#faf8f5] to-[#f5f1ea] border border-[#e8e4df] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group/car text-left">
                      <div className="relative">
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-white border border-[#e8e4df] mb-2.5">
                          <img 
                            src={`/assets/website_assets/mockups/${carProduct.image}`} 
                            alt={carProduct.name}
                            className="w-full h-full object-cover group-hover/car:scale-103 transition-transform duration-500"
                          />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#5a7c65] block mb-1">Car Perfume</span>
                        <h5 className="font-serif text-sm font-bold text-[#285b46] leading-snug">{carProduct.name}</h5>
                        <p className="text-[10px] text-[#636e72] mt-1 leading-normal line-clamp-2">{carProduct.tagline}</p>
                      </div>
                      <div className="border-t border-[#e8e4df] pt-3 mt-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-serif text-sm font-extrabold text-[#285b46]">₹{carProduct.price}</span>
                          <span className="text-[9px] text-[#636e72] line-through">₹{carProduct.originalPrice}</span>
                        </div>
                        <Link 
                          href={`/products/${carProduct.slug}`}
                          onClick={() => setIsMegaOpen(false)}
                          className="py-1.5 px-3.5 bg-[#5a7c65] hover:bg-[#285b46] text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full transition-colors duration-200 shadow-sm"
                        >
                          Shop
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Column 3: Discovery Set Spotlight Card */}
                  {discoveryProduct && (
                    <div className="bg-gradient-to-br from-[#faf8f5] to-[#f5f1ea] border border-[#e8e4df] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group/discovery text-left relative">
                      <div className="absolute top-2.5 right-2.5 bg-[#d4a574] text-white text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm z-10">
                        Best Seller
                      </div>
                      <div className="relative">
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-white border border-[#e8e4df] mb-2.5">
                          <img 
                            src={`/assets/website_assets/mockups/${discoveryProduct.image}`} 
                            alt={discoveryProduct.name}
                            className="w-full h-full object-cover group-hover/discovery:scale-103 transition-transform duration-500"
                          />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#d4a574] block mb-1">Discovery Set</span>
                        <h5 className="font-serif text-sm font-bold text-[#285b46] leading-snug">{discoveryProduct.name}</h5>
                        <p className="text-[10px] text-[#636e72] mt-1 leading-normal line-clamp-2">{discoveryProduct.tagline}</p>
                      </div>
                      <div className="border-t border-[#e8e4df] pt-3 mt-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-serif text-sm font-extrabold text-[#285b46]">₹{discoveryProduct.price}</span>
                          <span className="text-[9px] text-[#636e72] line-through">₹{discoveryProduct.originalPrice}</span>
                        </div>
                        <Link 
                          href={`/products/${discoveryProduct.slug}`}
                          onClick={() => setIsMegaOpen(false)}
                          className="py-1.5 px-3.5 bg-[#5a7c65] hover:bg-[#285b46] text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full transition-colors duration-200 shadow-sm"
                        >
                          Shop
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>

          {navLinks.map(({ href, label }) => {
            const isActive = activeSection === href;
            return (
              <li key={href}>
                <button
                  onClick={() => scrollToSection(href)}
                  className={`nav-link-hover text-[15px] tracking-wide transition-all duration-300 bg-transparent border-none cursor-pointer ${
                    isActive
                      ? "text-[#285b46] font-bold"
                      : "text-[#2d3436] font-medium hover:text-[#5a7c65]"
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
          {user ? (
            <li>
              <Link
                href="/orders"
                className="nav-link-hover text-[#2d3436] font-medium text-[15px] hover:text-[#5a7c65] transition-colors duration-300"
              >
                My Orders
              </Link>
            </li>
          ) : null}
          <li>
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#5a7c65]/10 border border-[#5a7c65]/20 rounded-full px-3 py-1.5">
                  <User size={14} className="text-[#5a7c65]" />
                  <span className="text-[#5a7c65] font-semibold text-sm">
                    {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-[#636e72] hover:text-red-500 border border-[#e8e4df] hover:border-red-400 rounded-full px-3 py-1.5 transition-all"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="nav-link-hover text-[#2d3436] font-medium text-[15px] hover:text-[#5a7c65] transition-colors duration-300"
              >
                Login
              </Link>
            )}
          </li>
        </ul>

        {/* Right side container for Cart & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <button
            id="cartIcon"
            onClick={onCartOpen}
            aria-label="Shopping Cart"
            className="relative p-2 rounded-full hover:bg-[#5a7c65]/10 transition-colors"
          >
            <ShoppingCart size={24} className="text-[#2d3436]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#5a7c65] text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 ml-2 flex flex-col gap-1.5 border-none bg-transparent cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X size={24} className="text-[#5a7c65]" />
            ) : (
              <>
                <span className="w-6 h-0.5 bg-[#5a7c65] block" />
                <span className="w-6 h-0.5 bg-[#5a7c65] block" />
                <span className="w-6 h-0.5 bg-[#5a7c65] block" />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#fdfbf7] border-t border-[#e8e4df] px-6 py-5 flex flex-col gap-3 shadow-lg absolute top-full left-0 right-0 max-h-[85vh] overflow-y-auto">
          {/* Shop Products Collapsible Accordion */}
          <div className="border-b border-[#e8e4df]/60 pb-2.5">
            <button
              onClick={() => setMobileShopOpen(!mobileShopOpen)}
              className="w-full flex items-center justify-between text-left text-base font-semibold text-[#2d3436] hover:text-[#5a7c65] py-1.5 border-none bg-transparent cursor-pointer"
            >
              <span>Shop Products</span>
              {mobileShopOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {mobileShopOpen && (
              <div className="pl-3 flex flex-col gap-4 border-l border-[#e8e4df] mt-2 mb-1">
                {/* Solid Perfumes */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5a7c65] block mb-2">Solid Perfumes</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {PRODUCTS.filter(p => p.category === "solid-perfume").map(p => (
                      <Link
                        key={p.slug}
                        href={`/products/${p.slug}`}
                        onClick={() => {
                          setMobileOpen(false);
                          setMobileShopOpen(false);
                        }}
                        className="flex items-center gap-2.5 py-1 px-1 rounded-lg active:bg-[#5a7c65]/5 text-left"
                      >
                        <img src={`/assets/website_assets/mockups/${p.image}`} alt={p.name} className="w-8 h-8 rounded object-cover border border-[#e8e4df] bg-white" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#2d3436]">{p.name}</span>
                          <span className="text-[9px] text-[#636e72]">{p.tagline.split(" for ")[0]}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Car Perfumes */}
                {carProduct && (
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5a7c65] block mb-2">Car Perfumes</span>
                    <Link
                      href={`/products/${carProduct.slug}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileShopOpen(false);
                      }}
                      className="flex items-center gap-2.5 py-1 px-1 rounded-lg active:bg-[#5a7c65]/5 text-left"
                    >
                      <img src={`/assets/website_assets/mockups/${carProduct.image}`} alt={carProduct.name} className="w-8 h-8 rounded object-cover border border-[#e8e4df] bg-white" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#2d3436]">{carProduct.name}</span>
                        <span className="text-[9px] text-[#636e72]">{carProduct.tagline}</span>
                      </div>
                    </Link>
                  </div>
                )}
                
                {/* Discovery Sets */}
                {discoveryProduct && (
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5a7c65] block mb-2">Discovery Sets</span>
                    <Link
                      href={`/products/${discoveryProduct.slug}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileShopOpen(false);
                      }}
                      className="flex items-center gap-2.5 py-1 px-1 rounded-lg active:bg-[#5a7c65]/5 text-left"
                    >
                      <img src={`/assets/website_assets/mockups/${discoveryProduct.image}`} alt={discoveryProduct.name} className="w-8 h-8 rounded object-cover border border-[#e8e4df] bg-white" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#2d3436]">{discoveryProduct.name}</span>
                        <span className="text-[9px] text-[#636e72]">{discoveryProduct.tagline}</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {navLinks.map(({ href, label }) => {
            const isActive = activeSection === href;
            return (
              <button
                key={href}
                onClick={() => scrollToSection(href)}
                className={`text-left text-base transition-colors py-1.5 border-none bg-transparent cursor-pointer ${
                  isActive
                    ? "text-[#285b46] font-bold"
                    : "text-[#2d3436] font-medium hover:text-[#5a7c65]"
                }`}
              >
                {label}
              </button>
            );
          })}
          {user ? (
            <>
              <Link
                href="/orders"
                className="text-left text-base font-medium text-[#2d3436] hover:text-[#5a7c65] py-1.5"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
              <div className="flex items-center gap-2 bg-[#5a7c65]/10 border border-[#5a7c65]/20 rounded-full px-4 py-2 w-fit mt-2">
                <User size={16} className="text-[#5a7c65]" />
                <span className="text-[#5a7c65] font-semibold text-[15px]">
                  {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-left text-sm text-[#636e72] hover:text-red-500 border border-[#e8e4df] hover:border-red-400 rounded-full px-4 py-2 w-fit mt-1 transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="mt-2 text-[16px] font-semibold text-[#5a7c65] border-2 border-[#5a7c65] rounded-full px-8 py-2 hover:bg-[#5a7c65] hover:text-white transition-all duration-300 w-fit text-center block"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
