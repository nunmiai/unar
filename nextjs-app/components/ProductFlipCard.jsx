import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check } from "lucide-react";

export default function ProductFlipCard({ product, packageType = "box" }) {
  const { name, price, badge, image, benefits, outOfStock, slug } = product;
  const { addToCart, cart } = useCart();
  const [flipped, setFlipped] = useState(false);

  const inCart = cart.find((i) => i.name === name);

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    setFlipped((f) => !f);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!outOfStock) {
      addToCart({ name, price, image });
    }
  };

  const currentImage = packageType === "tin"
    ? `/assets/website_assets/round_tin/${image === "rose.jpg" ? "rose.jpg" : `${image}-r.jpg`}`
    : `/assets/website_assets/mockups/${image}`;

  return (
    <div
      className={`flip-card h-[480px] ${flipped ? "flipped" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flip-card-inner rounded-2xl shadow-lg">
        {/* FRONT */}
        <div className="flip-card-front overflow-hidden bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe5] rounded-2xl">
          <img
            src={currentImage}
            alt={`${name} Natural Solid Perfume`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#5a7c65] text-white text-[11px] font-semibold uppercase tracking-wide px-3.5 py-1.5 rounded-full">
              {badge}
            </span>
          </div>
          {outOfStock && (
            <div className="out-of-stock-overlay rounded-2xl">
              Out of Stock
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-medium px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Tap to see details
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-back bg-[#faf8f5] rounded-2xl flex flex-col justify-center items-center p-6 text-center">
          <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#5a7c65] mb-3">{name}</h3>
          <p className="text-[13px] font-semibold text-[#5a7c65] mb-3">Botanical Benefits:</p>
          <ul className="list-none p-0 m-0 w-full mb-3.5 text-center">
            {benefits.map((b) => (
              <li key={b} className="text-[14px] leading-[1.5] py-2 border-b border-black/5 text-[#444] last:border-0">
                {b}
              </li>
            ))}
          </ul>
          <div className="text-[11px] font-medium text-[#5a7c65] bg-[#5a7c65]/10 rounded px-4 py-2 mb-3.5">
            100% Natural | Zero Waste | Cruelty Free
          </div>
          <p className="font-['Cormorant_Garamond'] text-[32px] font-bold text-[#5a7c65] mb-3.5">₹{price}</p>
          <div className="flex flex-col gap-2.5 items-center w-full relative z-10">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex items-center justify-center gap-2 w-full max-w-[200px] py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-wide transition-all
                ${outOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : inCart
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-[#5a7c65] text-white hover:bg-[#475f50] hover:scale-105 hover:shadow-lg"
                }`}
            >
              {outOfStock ? (
                "Out of Stock"
              ) : inCart ? (
                <>
                  <Check size={14} />
                  In Cart ({inCart.quantity})
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Add to Cart
                </>
              )}
            </button>
            <Link
              href={`/products/${slug}`}
              className="text-[12px] font-bold uppercase tracking-wider text-[#5a7c65] hover:text-[#285b46] underline hover:no-underline transition-colors mt-1"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
