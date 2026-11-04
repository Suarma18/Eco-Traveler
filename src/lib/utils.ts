export type Locale = "id" | "en";

/**
 * Nilai tukar referensi 1 USD = Rp 16.000 untuk konversi harga otomatis saat mode Bahasa Inggris (EN)
 */
export const USD_EXCHANGE_RATE = 16000;

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amountRp: number, locale: Locale = "id"): string {
  if (locale === "en") {
    const usd = amountRp / USD_EXCHANGE_RATE;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: usd < 15 ? 1 : 0,
    }).format(usd);
  }
  return formatRupiah(amountRp);
}

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} Miliar`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(2)} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)} Rb`;
  }
  return formatRupiah(amount);
}

export function formatCompactCurrency(
  amountRp: number,
  locale: Locale = "id"
): string {
  if (locale === "en") {
    const usd = amountRp / USD_EXCHANGE_RATE;
    if (usd >= 1_000_000) {
      return `$${(usd / 1_000_000).toFixed(2)}M`;
    }
    if (usd >= 1_000) {
      return `$${(usd / 1_000).toFixed(1)}K`;
    }
    return `$${Math.round(usd)}`;
  }
  return formatCompactRupiah(amountRp);
}

/**
 * Mengonversi string rentang harga homestay (mis. "Rp 280.000 - Rp 320.000 / malam")
 * menjadi format USD ("$18 - $20 / night") saat locale === "en"
 */
export function formatStayPriceRange(
  priceRangeStr: string,
  locale: Locale = "id"
): string {
  if (!priceRangeStr) return "";
  const matches = priceRangeStr.match(/\d[\d.,]*/g);
  if (!matches || matches.length === 0) return priceRangeStr;

  const amountsRp = matches
    .map((m) => Number(m.replace(/[.,]/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (amountsRp.length === 0) return priceRangeStr;

  const isAlreadyUsd = priceRangeStr.includes("$");
  const normalizedRp = amountsRp.map((val) =>
    isAlreadyUsd && val < 2000 ? val * USD_EXCHANGE_RATE : val
  );

  if (locale === "en") {
    const usdParts = normalizedRp.map(
      (rp) => `$${Math.max(1, Math.round(rp / USD_EXCHANGE_RATE))}`
    );
    return usdParts.length >= 2
      ? `${usdParts[0]} - ${usdParts[1]} / night`
      : `${usdParts[0]} / night`;
  }

  const idrParts = normalizedRp.map((rp) => formatRupiah(rp));
  return idrParts.length >= 2
    ? `${idrParts[0]} - ${idrParts[1]} / malam`
    : `${idrParts[0]} / malam`;
}

export const DAY_COLORS: Record<
  number,
  {
    hex: string;
    darkHex: string;
    label: string;
    labelEn: string;
    bgClass: string;
    borderClass: string;
    softBg: string;
    textClass: string;
  }
> = {
  1: {
    hex: "#0D4732", // Light Mode: Subak Deep Emerald
    darkHex: "#10B981", // Dark Mode Map: Luminous Emerald (High contrast on dark_all)
    label: "Hari 1",
    labelEn: "Day 1",
    bgClass: "bg-[#0D4732]",
    borderClass: "border-[#0D4732]",
    softBg: "bg-emerald-50",
    textClass: "text-[#0D4732]",
  },
  2: {
    hex: "#C85A32", // Light Mode: Warm Terracotta
    darkHex: "#FB923C", // Dark Mode Map: Luminous Amber-Terracotta
    label: "Hari 2",
    labelEn: "Day 2",
    bgClass: "bg-[#C85A32]",
    borderClass: "border-[#C85A32]",
    softBg: "bg-orange-50",
    textClass: "text-[#C85A32]",
  },
  3: {
    hex: "#1D63B8", // Light Mode: Ocean Biorock Blue
    darkHex: "#38BDF8", // Dark Mode Map: Luminous Sky Blue
    label: "Hari 3",
    labelEn: "Day 3",
    bgClass: "bg-[#1D63B8]",
    borderClass: "border-[#1D63B8]",
    softBg: "bg-sky-50",
    textClass: "text-[#1D63B8]",
  },
  4: {
    hex: "#A16207", // Light Mode: Highland Ochre Gold
    darkHex: "#FBBF24", // Dark Mode Map: Luminous Gold
    label: "Hari 4",
    labelEn: "Day 4",
    bgClass: "bg-amber-700",
    borderClass: "border-amber-700",
    softBg: "bg-amber-50",
    textClass: "text-amber-800",
  },
};
