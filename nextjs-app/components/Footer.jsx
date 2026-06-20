import Image from "next/image";

export default function Footer() {
  const scrollToSection = (href) => {
    if (typeof window !== "undefined") {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        // If not on the main page, navigate back home first
        window.location.href = `/${href}`;
      }
    }
  };

  return (
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
                  <button onClick={() => scrollToSection(href)} className="text-white/60 hover:text-white transition-colors text-sm bg-transparent border-none cursor-pointer capitalize">
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
  );
}
