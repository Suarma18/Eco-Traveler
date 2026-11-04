import type { Metadata, Viewport } from "next";
import {
  Outfit,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F6F5F0",
};

export const metadata: Metadata = {
  title: "Eco Traveler | Perencana Rute Wisata Berkeadilan Bali",
  description:
    "Susun rute perjalanan ke 28 desa wisata di Bali Utara, Timur, dan Barat dengan perhitungan belanja langsung ke homestay warga dan panduan adat Awig-Awig.",
  keywords: [
    "Eco Traveler Bali",
    "Bali DigiFest 2026",
    "Bali Smart Society",
    "Desa Wisata Bali",
    "Perencana Rute Wisata Berkeadilan Bali",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased bg-[#F6F5F0] text-stone-900 selection:bg-[#0D261C] selection:text-emerald-200 min-h-[100dvh]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#0D261C] focus:text-white focus:text-xs focus:font-semibold"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
