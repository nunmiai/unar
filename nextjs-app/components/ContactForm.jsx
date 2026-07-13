import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, Mail, Globe, ChevronDown } from "lucide-react";

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycby1PbOkJZVBbk0SPiPkW64Q7lZFUp-pTRvH0H8FJWx-izJxNKFSfVObuuk-MDJZMj6E/exec";

const PRODUCT_CATEGORIES = {
  "Solid Perfumes": [
    "Jasmine",
    "Rose",
    "Champa",
    "Frangipani",
    "Vetiver",
    "Blue Lotus",
    "Ylang ylang",
    "Tuberose",
    "Sandalwood",
    "Oud",
    "Parijat",
    "Kadamba",
    "Discovery set"
  ],
  "Car Perfumes": [
    "Javadu",
    "Poomalai",
    "Madurai Manam"
  ]
};
const CONTACT_ITEMS = [
  { icon: Phone, label: "Phone", value: "+91 9600522437", href: "tel:+919600522437" },
  { 
    icon: Mail, 
    label: "Email", 
    value: ["unar.consciousliving@gmail.com", "unar@unar.in"], 
    href: ["mailto:unar.consciousliving@gmail.com", "mailto:unar@unar.in"] 
  },
  { icon: Globe, label: "Website", value: "www.unar.in", href: "http://www.unar.in" },
];

const TERMS = [
  { title: "1. Patch Test Requirement", body: "Our perfumes are handcrafted using Natural Oils, Waxes, and Essential Oils. Because everyone's skin is unique, you agree to perform a patch test before full application. Apply a small amount to the inside of your wrist or elbow and wait 24 hours. If irritation occurs, discontinue use immediately." },
  { title: "2. General Safety & Intended Use", body: "External Use Only: This product is for topical application only. Do not ingest. Keep Out of Reach: Keep samples away from pets. Sensitive Areas: Avoid contact with eyes, broken skin, or mucous membranes." },
  { title: "3. Ingredients & Allergies", body: "A full list of ingredients is provided on the product page. By opting in, you acknowledge that you have reviewed this list and confirm you have no known allergies to the ingredients listed." },
  { title: "4. Limitation of Liability", body: "By requesting this sample, you voluntarily assume all risks associated with its use. Unar and its founders shall not be held liable for any adverse skin reactions, allergic responses, or damages resulting from the use or misuse of the sample." },
  { title: "5. No Medical Claims", body: "Our perfumes are intended for fragrance purposes only. They are not intended to diagnose, treat, cure, or prevent any medical condition or skin disease." },
];

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", fragrance: "", message: "", agreeTerms: false });
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const selectRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    "Solid Perfumes": true,
    "Car Perfumes": true
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isValid = form.name && form.email && form.fragrance && form.agreeTerms;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timestamp: new Date().toISOString() }),
      });
      toast.success("Thank you for your message! We will get back to you soon.");
      setForm({ name: "", email: "", phone: "", fragrance: "", message: "", agreeTerms: false });
    } catch {
      toast.error("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      {/* Left – Info */}
      <div>
        <h2 className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#295c47] mb-4">Get in Touch</h2>
        <p className="text-[17px] text-[#636e72] leading-[1.8] mb-8">Have questions or want to learn more about our natural perfumes? We&apos;d love to hear from you.</p>
        <div className="flex flex-col gap-6">
          {CONTACT_ITEMS.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-[#295c47] to-[#475f50] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <h4 className="text-[14px] uppercase tracking-wide text-[#636e72] mb-1 font-semibold">{label}</h4>
                {Array.isArray(value) ? (
                  <div className="flex flex-col gap-1.5 items-start">
                    {value.map((val, idx) => (
                      <a 
                        key={idx} 
                        href={href[idx]} 
                        className="text-[#295c47] font-medium text-[16px] hover:text-[#475f50] hover:underline transition-colors block"
                      >
                        {val}
                      </a>
                    ))}
                  </div>
                ) : (
                  <a 
                    href={href} 
                    target={label === "Website" ? "_blank" : undefined} 
                    rel="noopener noreferrer" 
                    className="text-[#295c47] font-medium text-[16px] hover:text-[#475f50] hover:underline transition-colors"
                  >
                    {value}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right – Form */}
      <div className="bg-white p-12 rounded-2xl shadow-2xl">
        <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#295c47] mb-8">Send a Message</h3>
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Name */}
          <div className="float-label-group">
            <input id="cf-name" name="name" type="text" required placeholder=" " value={form.name} onChange={handleChange} />
            <label htmlFor="cf-name">Your Name</label>
          </div>
          {/* Email */}
          <div className="float-label-group">
            <input id="cf-email" name="email" type="email" required placeholder=" " value={form.email} onChange={handleChange} />
            <label htmlFor="cf-email">Your Email</label>
          </div>
          {/* Phone */}
          <div className="float-label-group">
            <input id="cf-phone" name="phone" type="tel" placeholder=" " value={form.phone} onChange={handleChange} />
            <label htmlFor="cf-phone">Phone Number</label>
          </div>
          {/* Fragrance Select */}
          <div className="relative" ref={selectRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full text-left bg-[#faf8f5] hover:bg-white border-2 border-[#e8e4df] focus:border-[#295c47] rounded-lg px-4 py-3.5 text-[15px] text-[#2d3436] outline-none flex justify-between items-center transition-all shadow-sm"
              style={{ minHeight: "54px" }}
            >
              <span>{form.fragrance || " "}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <label className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1.5 ${form.fragrance || isOpen ? "top-[-10px] left-3 text-xs text-[#295c47] font-medium" : "top-3.5 text-[15px] text-[#636e72]"}`}>
              Products
            </label>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-[#e8e4df] rounded-xl shadow-xl z-50 max-h-[320px] overflow-y-auto py-2 divide-y divide-gray-100 animate-fade-in">
                {Object.entries(PRODUCT_CATEGORIES).map(([category, items]) => {
                  const isExpanded = expandedCategories[category];
                  return (
                    <div key={category} className="py-1.5 first:pt-0">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                        className="w-full flex items-center justify-between px-4 py-2 text-[#295c47] hover:bg-[#295c47]/5 transition-colors font-bold text-[14px]"
                      >
                        <span>{category}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Items List */}
                      {isExpanded && (
                        <div className="flex flex-col gap-0.5 mt-1 px-2">
                          {items.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, fragrance: item }));
                                setIsOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-[14px] transition-colors rounded-lg ${form.fragrance === item ? "bg-[#295c47] text-white font-medium" : "text-[#2d3436] hover:bg-[#295c47]/5"}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Not Sure option */}
                <div className="py-1.5 last:pb-0">
                  <div className="px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, fragrance: "Not Sure / Need Recommendation" }));
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors rounded-lg font-medium ${form.fragrance === "Not Sure / Need Recommendation" ? "bg-[#295c47] text-white" : "text-[#636e72] hover:bg-[#295c47]/5"}`}
                    >
                      Not Sure / Need Recommendation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Message */}
          <div className="float-label-group">
            <textarea id="cf-message" name="message" rows={5} placeholder="&#10;&#10;Share your address and any additional message" value={form.message} onChange={handleChange} />
            <label htmlFor="cf-message">Your Address / Message (Optional)</label>
          </div>

          {/* Terms */}
          <div className="relative">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" id="agreeTerms" name="agreeTerms" required checked={form.agreeTerms} onChange={handleChange} className="w-4 h-4 mt-0.5 accent-[#295c47]" />
              <span className="text-[14px] text-[#636e72]">
                I agree to the{" "}
                <button type="button" id="termsLink" className="text-[#295c47] font-semibold underline hover:text-[#475f50] transition-colors bg-transparent border-none cursor-pointer" onClick={() => setTermsOpen((o) => !o)}>
                  Terms &amp; Conditions
                </button>
              </span>
            </label>
            {/* Terms Tooltip */}
            {termsOpen && (
              <div ref={tooltipRef} className="terms-tooltip show">
                <h4>Terms of Usage: Solid Perfume Samples</h4>
                <p className="mb-2">By checking the box to receive a sample, you agree to the following terms:</p>
                {TERMS.map((t) => (
                  <div key={t.title}>
                    <h5>{t.title}</h5>
                    <p>{t.body}</p>
                  </div>
                ))}
                <button type="button" onClick={() => setTermsOpen(false)} className="mt-3 text-xs text-[#295c47] font-semibold underline bg-transparent border-none cursor-pointer">
                  Close
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="submitBtn"
            disabled={!isValid || loading}
            className="w-full py-3.5 rounded-full bg-[#295c47] text-white font-semibold text-base hover:bg-[#475f50] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
