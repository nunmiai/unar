import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";

export default function Navbar({ onCartOpen }) {
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("");

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
        // Trigger when the section is at least halfway into the viewport,
        // or when its top hits roughly the navbar height
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
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    { href: "#collections", label: "Collections" },
    { href: "#contact", label: "Contact" },
  ];

  const scrollToSection = (href) => {
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        const headerH = document.querySelector("header")?.offsetHeight || 80;
        window.scrollTo({ top: el.offsetTop - headerH, behavior: "smooth" });
      }
    }
    setMobileOpen(false);
  };

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
        <ul className="hidden md:flex list-none gap-10 items-center">
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

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="absolute top-[88px] left-0 right-0 bg-[#fdfbf7] shadow-lg border-t border-[#e8e4df] py-6 px-6 md:hidden">
            <ul className="flex flex-col gap-6 items-center">
              {navLinks.map(({ href, label }) => {
                const isActive = activeSection === href;
                return (
                  <li key={href}>
                    <button
                      onClick={() => scrollToSection(href)}
                      className={`text-[16px] tracking-wide transition-all duration-300 bg-transparent border-none cursor-pointer ${
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
                <li className="flex flex-col items-center gap-4 mt-4 w-full">
                  <div className="flex items-center gap-2 bg-[#5a7c65]/10 border border-[#5a7c65]/20 rounded-full px-4 py-2 w-full justify-center">
                    <User size={16} className="text-[#5a7c65]" />
                    <span className="text-[#5a7c65] font-semibold text-[15px]">
                      {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 text-[15px] font-medium text-[#636e72] hover:text-red-500 border border-[#e8e4df] hover:border-red-400 rounded-full px-6 py-2 w-full transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </li>
              ) : (
                <li className="mt-2">
                  <Link
                    href="/login"
                    className="text-[16px] font-semibold text-[#5a7c65] border-2 border-[#5a7c65] rounded-full px-8 py-2 hover:bg-[#5a7c65] hover:text-white transition-all duration-300 inline-block"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

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
            className="md:hidden p-2 ml-2 flex flex-col gap-1.5"
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#fdfbf7] border-t border-[#e8e4df] px-6 py-4 flex flex-col gap-4 shadow-lg absolute top-full left-0 right-0">
          {navLinks.map(({ href, label }) => {
            const isActive = activeSection === href;
            return (
              <button
                key={href}
                onClick={() => scrollToSection(href)}
                className={`text-left text-base transition-colors py-1 border-none bg-transparent cursor-pointer ${
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
              <div className="flex items-center gap-2 bg-[#5a7c65]/10 border border-[#5a7c65]/20 rounded-full px-4 py-2 w-fit mt-2">
                <User size={16} className="text-[#5a7c65]" />
                <span className="text-[#5a7c65] font-semibold text-[15px]">
                  {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-left text-sm text-[#636e72] hover:text-red-500 border border-[#e8e4df] hover:border-red-400 rounded-full px-4 py-2 w-fit mt-2 transition-all"
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
