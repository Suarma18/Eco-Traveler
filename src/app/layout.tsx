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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#08120E" },
  ],
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

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem("eco-traveler-theme");
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    var l = localStorage.getItem("eco-traveler-locale");
    if (l === "en" || l === "id") {
      document.documentElement.lang = l;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-[#F6F5F0] dark:bg-[#08120E] text-stone-900 dark:text-stone-100 selection:bg-[#0D261C] selection:text-emerald-200 min-h-[100dvh]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#0D261C] dark:focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-semibold"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
