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

  useEffect(() => {
    try {
      const unarUser = JSON.parse(localStorage.getItem("unarUser") || "null");
      if (unarUser && unarUser.email) setUser(unarUser);
    } catch {}
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    } catch {}
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/95 backdrop-blur-sm shadow-sm"
      }`}
    >
      <nav className="max-w-[1300px] mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/logo.svg"
            alt="Unar - Handcrafted & 100% Natural"
            width={60}
            height={60}
            className="object-contain transition-transform hover:scale-105"
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex list-none gap-10 items-center">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <button
                onClick={() => scrollToSection(href)}
                className="nav-link-hover text-[#2d3436] font-medium text-[15px] tracking-wide hover:text-[#5a7c65] transition-colors duration-300 bg-transparent border-none cursor-pointer"
              >
                {label}
              </button>
            </li>
          ))}
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
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/98 border-t border-[#e8e4df] px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => scrollToSection(href)}
              className="text-left text-[#2d3436] font-medium text-base hover:text-[#5a7c65] transition-colors py-1 border-none bg-transparent cursor-pointer"
            >
              {label}
            </button>
          ))}
          {user ? (
            <>
              <Link href="/orders" className="text-[#2d3436] font-medium text-base hover:text-[#5a7c65] transition-colors py-1">
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-red-500 border border-red-400 rounded-full px-4 py-2 w-fit"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-[#2d3436] font-medium text-base hover:text-[#5a7c65] transition-colors py-1">
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
