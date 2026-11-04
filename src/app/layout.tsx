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
  title: "Eco Traveler | Perencana Rute Wisata Berkeadilan Bali",
  description:
    "Platform geospasial dan perencana perjalanan wisata Bali berbasis AI yang mengoptimalkan pemerataan ekonomi Desa Wisata mandiri dan pelestarian etika adat (Awig-Awig).",
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
      <body className="font-sans antialiased bg-[#F6F5F0] text-stone-900 selection:bg-[#0D261C] selection:text-emerald-200 min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}
