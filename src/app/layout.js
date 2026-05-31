import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Salama AI — Kamus Cerdas & Chatbot Bahasa Daerah Ternate dan Sula",
  description: "Platform kamus digital interaktif bahasa daerah Ternate (dialek Melayu Ternate dan Tidore) dan Sula dengan dukungan Chatbot AI Gemini, kuis interaktif, rating ulasan, dan sistem usulan perbaikan komunitas.",
  keywords: ["Salama AI", "Kamus Bahasa Ternate", "Kamus Bahasa Sula", "Bahasa Maluku Utara", "Duta Bahasa Maluku Utara 2026", "Universitas Khairun", "Chatbot AI Gemini", "Belajar Bahasa Daerah"],
  authors: [{ name: "Muhamad Ikbal Wambes" }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/logo.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-gold-500/25 selection:text-slate-950">
        <Header />
        <main className="flex-grow pt-24 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
