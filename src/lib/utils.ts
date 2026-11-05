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

/**
 * Menghitung jarak garis lurus (Haversine) dalam kilometer
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface TransitEstimate {
  straightKm: number;
  roadDistanceKm: number;
  durationMinutes: number;
  formattedDuration: string;
  formattedDistance: string;
  formattedSummary: string;
  isLongLeg: boolean;
}

/**
 * Memperkirakan waktu tempuh dan jarak jalan realistis di Bali
 * dengan faktor kelokan (1.38x) dan kecepatan berkendara rata-rata 35 km/jam
 */
export function estimateBaliTransit(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  locale: Locale = "id"
): TransitEstimate {
  const straight = calculateHaversineDistanceKm(fromLat, fromLng, toLat, toLng);
  // Faktor kelokan jalan pedesaan Bali (1.38x garis lurus)
  const roadKm = Math.max(0.5, Math.round(straight * 1.38 * 10) / 10);
  // Rata-rata 35 km/jam + buffer transisi/parkir 5 menit
  const durationMinutes = Math.max(10, Math.round((roadKm / 35) * 60) + 5);
  const isLongLeg = durationMinutes >= 180;

  let formattedDuration: string;
  if (durationMinutes < 60) {
    formattedDuration =
      locale === "en" ? `${durationMinutes} mins` : `${durationMinutes} mnt`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    if (mins === 0) {
      formattedDuration = locale === "en" ? `${hours} hr` : `${hours} jam`;
    } else {
      formattedDuration =
        locale === "en" ? `${hours}h ${mins}m` : `${hours}j ${mins}m`;
    }
  }

  const formattedDistance =
    locale === "en"
      ? `${roadKm.toFixed(1)} km`
      : `${roadKm.toFixed(1).replace(".", ",")} km`;

  const formattedSummary = `~${formattedDuration} (${formattedDistance})`;

  return {
    straightKm: straight,
    roadDistanceKm: roadKm,
    durationMinutes,
    formattedDuration,
    formattedDistance,
    formattedSummary,
    isLongLeg,
  };
}

/**
 * Format total akumulasi durasi perjalanan harian
 */
export function formatDailyTransitSummary(
  totalMinutes: number,
  totalKm: number,
  locale: Locale = "id"
): string {
  let timeStr: string;
  if (totalMinutes < 60) {
    timeStr = locale === "en" ? `${totalMinutes} mins` : `${totalMinutes} mnt`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      timeStr = locale === "en" ? `${hours} hr` : `${hours} jam`;
    } else {
      timeStr = locale === "en" ? `${hours}h ${mins}m` : `${hours}j ${mins}m`;
    }
  }

  const distStr =
    locale === "en"
      ? `${totalKm.toFixed(1)} km`
      : `${totalKm.toFixed(1).replace(".", ",")} km`;

  return locale === "en"
    ? `Transit: ~${timeStr} (${distStr})`
    : `Perjalanan: ~${timeStr} (${distStr})`;
}

/**
 * Daftar istilah adat, nama geografis, dan proper nouns Bali
 * yang wajib mempertahankan huruf kapital benar (tidak boleh berhuruf kecil).
 */
export const BALI_PROPER_NOUNS = [
  "UNESCO",
  "Danau Batur",
  "Lake Batur",
  "Gunung Agung",
  "Mount Agung",
  "Gunung Batur",
  "Mount Batur",
  "Danau Tamblingan",
  "Lake Tamblingan",
  "Danau Buyan",
  "Lake Buyan",
  "Danau Beratan",
  "Lake Beratan",
  "Bali Aga",
  "Bali Mula",
  "Sungai Unda",
  "Unda River",
  "Pura Pancering Jagat",
  "Pura Besakih",
  "Pura Ulun Danu",
  "Taman Nasional Bali Barat",
  "West Bali National Park",
  "Taman Ujung",
  "Tirta Gangga",
  "Jatiluwih",
  "Penglipuran",
  "Trunyan",
  "Tenganan",
  "Sidemen",
  "Munduk",
  "Pemuteran",
  "Buleleng",
  "Karangasem",
  "Bangli",
  "Jembrana",
  "Klungkung",
  "Tabanan",
  "Gianyar",
  "Badung",
  "Denpasar",
  "Pokdarwis",
  "BUMDes",
  "Subak",
  "Awig-Awig",
  "Gringsing",
  "Kintamani",
  "Amed",
  "Tulamben",
  "Menjangan",
  "Black Lava",
];

/**
 * Memastikan setiap istilah geografis dan adat dalam teks ditulis dengan huruf kapital yang benar.
 */
export function preserveProperNouns(text: string): string {
  if (!text) return "";
  let result = text;
  for (const noun of BALI_PROPER_NOUNS) {
    const regex = new RegExp(
      `\\b${noun.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
      "gi"
    );
    result = result.replace(regex, noun);
  }
  return result;
}

/**
 * Membersihkan frasa highlights dan menjaga nama geografis/istilah adat tetap kapital.
 */
export function cleanHighlightPhrase(highlights: string): string {
  if (!highlights) return "";
  const firstClause = highlights.split(",")[0].trim();
  return preserveProperNouns(firstClause);
}

/**
 * Menghasilkan deskripsi stop deterministik dengan minimal 3 pola kalimat berbeda
 * (Morning / Afternoon / Sunset) untuk mencegah teks berulang kaku saat AI tidak aktif.
 */
export function generateDeterministicStopDescription(
  villageName: string,
  regency: string,
  highlights: string,
  umkm: string,
  timeSlot: string,
  locale: Locale = "id",
  isRedirected = false,
  originalSaturatedVillage?: string
): string {
  const cleanHighlight = cleanHighlightPhrase(highlights);
  const cleanUmkm = preserveProperNouns(
    umkm || (locale === "en" ? "local village artisans" : "UMKM warga")
  );
  const regencyLabel = locale === "en" ? regency : `Kabupaten ${regency}`;

  if (isRedirected) {
    if (locale === "en") {
      return preserveProperNouns(
        `To mitigate overtourism pressures at ${
          originalSaturatedVillage || "nearby saturated hotspots"
        }, the journey shifts smoothly to ${villageName} in ${regencyLabel}. Experience authentic ${cleanHighlight} while investing directly with ${cleanUmkm}.`
      );
    }
    return preserveProperNouns(
      `Untuk mencegah beban overtourism di ${
        originalSaturatedVillage || "kawasan padat"
      }, rute dialihkan ke ${villageName} (${regencyLabel}). Nikmati kearifan lokal ${cleanHighlight} sembari mendukung perputaran ekonomi langsung di ${cleanUmkm}.`
    );
  }

  // Tiga pola pembuka berbeda untuk Pagi, Siang, dan Sore/Sunset
  const normalizedSlot = timeSlot.toUpperCase();

  if (normalizedSlot.includes("MORNING") || normalizedSlot.includes("PAGI")) {
    if (locale === "en") {
      return preserveProperNouns(
        `Begin the morning expedition exploring ${cleanHighlight} at ${villageName} (${regencyLabel}), directly benefiting village families and ${cleanUmkm}.`
      );
    }
    return preserveProperNouns(
      `Awali perjalanan pagi dengan mengeksplorasi ${cleanHighlight} di ${villageName} (${regencyLabel}), yang memberikan manfaat ekonomi langsung bagi ${cleanUmkm}.`
    );
  }

  if (normalizedSlot.includes("WORKSHOP") || normalizedSlot.includes("SIANG") || normalizedSlot.includes("AFTERNOON")) {
    if (locale === "en") {
      return preserveProperNouns(
        `Immerse in local living heritage and ${cleanHighlight} at ${villageName} (${regencyLabel}), with community spending channeled to ${cleanUmkm}.`
      );
    }
    return preserveProperNouns(
      `Selami tradisi kehidupan dan kearifan ${cleanHighlight} di ${villageName} (${regencyLabel}), sembari berbelanja langsung di ${cleanUmkm}.`
    );
  }

  // Default: Sore / Sunset
  if (locale === "en") {
    return preserveProperNouns(
      `Wind down the day taking in ${cleanHighlight} around ${villageName} (${regencyLabel}), accompanied by warm local hospitality at ${cleanUmkm}.`
    );
  }
  return preserveProperNouns(
    `Nikmati suasana sore dengan mengamati ${cleanHighlight} di ${villageName} (${regencyLabel}), disertai keramahan warga di ${cleanUmkm}.`
  );
}
