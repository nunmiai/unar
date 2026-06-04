import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/CartContext";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </CartProvider>
  );
}
