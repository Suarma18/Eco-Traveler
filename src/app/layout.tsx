import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Eco Traveler | AI Redistributive Travel Planner for Bali",
  description:
    "Perencana perjalanan wisata cerdas berbasis AI yang mengoptimalkan pemerataan ekonomi wilayah (Spatial Equity) dan retensi belanja UMKM Desa Wisata di Bali Utara, Timur, dan Barat. Karya Kompetisi Bali DigiFest 2026 - Bidang Bali Smart Society.",
  keywords: [
    "Eco Traveler Bali",
    "Bali DigiFest 2026",
    "Bali Smart Society",
    "Desa Wisata Bali",
    "Anti-Overtourism Bali",
    "Spatial Equity Tourism",
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
      <body className="font-sans antialiased bg-[#07130E] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}

