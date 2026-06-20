import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { Star, ShoppingCart, Check, Eye } from "lucide-react";

export default function ProductCard({ product }) {
  const { name, price, originalPrice, badge, image, outOfStock, slug, rating, reviewCount, tagline, category } = product;
  const { addToCart, cart } = useCart();
  const [hovered, setHovered] = useState(false);

  const inCart = cart.find((i) => i.name === name);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!outOfStock) {
      addToCart({ name, price, image });
    }
  };

  // Resolve Box/Tin images for crossfade hover effect
  const boxImage = `/assets/website_assets/mockups/${image}`;
  const tinImage = `/assets/website_assets/round_tin/${image === "rose.jpg" ? "rose.jpg" : `${image}-r.jpg`}`;
  
  // Check if it's solid perfume to enable hover image swap
  const hasTinVariant = category === "solid-perfume";
  const hoverImage = hasTinVariant ? tinImage : boxImage;

  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <div
      className="group bg-white border border-[#e8e4df] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* IMAGE WRAPPER with Crossfade Hover and Zoom */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#faf8f5] border-b border-[#e8e4df]/40">
        
        {/* Badge */}
        <div className="absolute top-3.5 left-3.5 z-20">
          <span className="bg-[#285b46] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
            {badge}
          </span>
        </div>

        {/* Sold out overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <span className="bg-black/80 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border border-white/10">
              Sold Out
            </span>
          </div>
        )}

        {/* Default image (Box Mockup) */}
        <img
          src={boxImage}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            hovered && hasTinVariant ? "opacity-0 scale-102" : "opacity-100 scale-100"
          }`}
        />

        {/* Hover image (Tin Mockup) - only for solid perfumes */}
        {hasTinVariant && (
          <img
            src={hoverImage}
            alt={`${name} Tin variant`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              hovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />
        )}

        {/* Quick Action Overlay on Hover */}
        <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-20 flex gap-2 transition-all duration-300 transform ${
          hovered && !outOfStock ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}>
          <Link
            href={`/products/${slug}`}
            className="flex-1 py-2.5 px-3 bg-white text-[#285b46] hover:bg-[#285b46] hover:text-white rounded-full font-bold uppercase tracking-wider text-[10px] text-center flex items-center justify-center gap-1.5 shadow-md transition-all duration-300 transform hover:scale-102"
          >
            <Eye size={12} />
            Quick View
          </Link>
          <button
            onClick={handleAddToCart}
            className={`p-2.5 rounded-full text-white shadow-md transition-all duration-300 transform hover:scale-110 cursor-pointer ${
              inCart ? "bg-green-600 hover:bg-green-700" : "bg-[#5a7c65] hover:bg-[#285b46]"
            }`}
            title="Add to Cart"
          >
            {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>

      {/* INFO WRAPPER */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Star Rating Line */}
          <div className="flex items-center gap-1.5">
            <div className="flex text-[#d4a574]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < Math.floor(rating) ? "currentColor" : "none"}
                  stroke="currentColor"
                  className={i < Math.floor(rating) ? "" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-[#2d3436]">{rating}</span>
            <span className="text-[10px] text-[#636e72]">({reviewCount})</span>
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-xl font-bold text-[#285b46] leading-snug">
            <Link href={`/products/${slug}`} className="hover:text-[#5a7c65] transition-colors">
              {name}
            </Link>
          </h3>

          {/* Product Tagline */}
          <p className="text-[12px] text-[#636e72] leading-relaxed line-clamp-2 h-8">
            {tagline}
          </p>
        </div>

        {/* Pricing & Footer Actions */}
        <div className="border-t border-[#e8e4df]/60 pt-4 mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl font-extrabold text-[#285b46]">₹{price}</span>
              <span className="text-xs text-[#636e72] line-through">₹{originalPrice}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#c28445] mt-0.5">
              Save {discountPercent}%
            </span>
          </div>

          <Link
            href={`/products/${slug}`}
            className="text-[11px] font-extrabold uppercase tracking-widest text-[#5a7c65] hover:text-[#285b46] flex items-center gap-0.5 group/link transition-colors"
          >
            Explore
            <span className="transition-transform duration-300 transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
