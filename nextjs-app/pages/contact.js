import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { ArrowLeft } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact Us | Unar - Natural Solid Perfumes</title>
        <meta name="description" content="Get in touch with Unar for inquiries, custom orders, or sensory recommendations." />
      </Head>

      <Navbar />

      <main className="pt-[140px] pb-24 bg-gradient-to-br from-[#fdfbf7] to-[#f5f1eb] min-h-screen flex flex-col justify-start">
        <div className="max-w-[1300px] mx-auto px-10 w-full animate-fade-in-up">
          {/* Back button */}
          <div className="max-w-2xl mx-auto mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-[#636e72] hover:text-[#295c47] font-medium transition-all duration-300 group text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back to Home</span>
            </Link>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </>
  );
}
