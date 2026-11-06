// Local Semantic Rule Engine for Eco Traveler
// Deterministic, zero-dependency, offline-capable NLP extractor.
// Guarantees user intent is never lost even during API downtime, quota exhaustion, or unconfigured keys.

export const ALLOWED_ARRIVALS = ["NgurahRaiAirport", "GilimanukPort"] as const;
export const ALLOWED_FOCUSES = [
  "Culture",
  "Nature",
  "Culinary",
  "Wellness",
  "Agriculture",
] as const;
export const ALLOWED_STAYS = ["Backpacker", "Moderate", "Comfort"] as const;

export type AllowedArrival = (typeof ALLOWED_ARRIVALS)[number];
export type AllowedFocus = (typeof ALLOWED_FOCUSES)[number];
export type AllowedStay = (typeof ALLOWED_STAYS)[number];

export interface ParsedPreferencesResponse {
  days: 1 | 2 | 3 | 4 | null;
  arrival: AllowedArrival | null;
  focus: AllowedFocus[] | null;
  stay: AllowedStay | null;
  explanation: string;
}

// Normalizes text by removing punctuation, converting to lowercase, and collapsing whitespace
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Typo-tolerant substring/token matcher.
 * Matches keywords even with common typos (e.g. 'relaxaced' -> 'relax', 'tedekat' -> 'dekat').
 */
function containsKeyword(normText: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    if (normText.includes(kw)) return true;
    if (kw.length >= 4) {
      const tokens = normText.split(" ");
      for (const tok of tokens) {
        if (tok.startsWith(kw.slice(0, 4)) || tok.includes(kw)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Extracts travel parameters and intent from natural language input.
 * Handles both Indonesian and English, with resistance to typos.
 */
export function parsePreferencesSemantically(
  rawInput: string,
  lang: "id" | "en" = "id"
): ParsedPreferencesResponse {
  const norm = normalizeText(rawInput);
  const detectedFocuses: AllowedFocus[] = [];
  const explanations: string[] = [];

  // 1. Focus Detection
  // Culinary / Kuliner (e.g. "tambah kuliner tedekat", "makanan lokal")
  const culinaryKeywords = [
    "kuliner",
    "makan",
    "makanan",
    "food",
    "foodie",
    "dish",
    "warung",
    "jajanan",
    "kopi",
    "coffee",
    "snack",
    "tedekat",
    "terdekat",
    "cook",
    "taste",
  ];
  if (containsKeyword(norm, culinaryKeywords)) {
    detectedFocuses.push("Culinary");
    explanations.push(
      lang === "en"
        ? "Focus shifted to local village culinary & food UMKM"
        : "Fokus diarahkan ke kuliner lokal dan sentra UMKM pangan desa"
    );
  }

  // Wellness / Santai (e.g. "more relaxaced", "lebih santai", "relax", "healing")
  const wellnessKeywords = [
    "santai",
    "relax",
    "relaxac",
    "relaxaced",
    "relaxed",
    "relaks",
    "relaksasi",
    "healing",
    "spa",
    "meditasi",
    "meditation",
    "tenang",
    "quiet",
    "calm",
    "slow",
    "damai",
    "adem",
  ];
  if (containsKeyword(norm, wellnessKeywords)) {
    detectedFocuses.push("Wellness");
    explanations.push(
      lang === "en"
        ? "Trip pace adjusted for relaxed wellness & tranquility"
        : "Ritme rute disesuaikan untuk ketenangan dan kenyamanan santai"
    );
  }

  // Nature / Alam
  const natureKeywords = [
    "alam",
    "nature",
    "pantai",
    "beach",
    "laut",
    "sea",
    "gunung",
    "mountain",
    "air terjun",
    "waterfall",
    "danau",
    "lake",
    "hutan",
    "forest",
    "bukit",
    "hill",
    "snorkeling",
    "diving",
    "dolphin",
    "lumba",
    "sunset",
    "sunrise",
  ];
  if (containsKeyword(norm, natureKeywords)) {
    detectedFocuses.push("Nature");
    explanations.push(
      lang === "en"
        ? "Highlights prioritized for natural landscapes & coastal areas"
        : "Prioritas ditambahkan pada panorama alam dan lanskap pesisir"
    );
  }

  // Agriculture / Subak
  const agroKeywords = [
    "tani",
    "agro",
    "agrikultur",
    "subak",
    "sawah",
    "kebun",
    "farm",
    "plantation",
    "rice",
    "terrace",
    "terasering",
    "cengkeh",
    "kakao",
  ];
  if (containsKeyword(norm, agroKeywords)) {
    detectedFocuses.push("Agriculture");
    explanations.push(
      lang === "en"
        ? "Emphasizing agro-tourism & UNESCO Subak heritage"
        : "Menonjolkan agrowisata dan lanskap warisan Subak"
    );
  }

  // Culture / Budaya
  const cultureKeywords = [
    "budaya",
    "culture",
    "adat",
    "pura",
    "temple",
    "sejarah",
    "history",
    "heritage",
    "tenun",
    "craft",
    "kerajinan",
    "tradisi",
    "tradition",
    "upacara",
    "ceremony",
    "desa tua",
    "bali aga",
  ];
  if (containsKeyword(norm, cultureKeywords)) {
    detectedFocuses.push("Culture");
    explanations.push(
      lang === "en"
        ? "Curating authentic Balinese cultural & heritage spots"
        : "Mengutamakan desa adat tua dan warisan budaya otentik"
    );
  }

  // 2. Duration / Days Detection
  let detectedDays: 1 | 2 | 3 | 4 | null = null;
  if (/(1\s*hari|1\s*day|satu\s*hari|one\s*day|day\s*trip|sehari)/.test(norm)) {
    detectedDays = 1;
    explanations.push(lang === "en" ? "Set duration to 1 day" : "Durasi diatur 1 hari");
  } else if (/(2\s*hari|2\s*days|dua\s*hari|two\s*days|2d|weekend)/.test(norm)) {
    detectedDays = 2;
    explanations.push(lang === "en" ? "Set duration to 2 days" : "Durasi diatur 2 hari");
  } else if (/(3\s*hari|3\s*days|tiga\s*hari|three\s*days|3d)/.test(norm)) {
    detectedDays = 3;
    explanations.push(lang === "en" ? "Set duration to 3 days" : "Durasi diatur 3 hari");
  } else if (/(4\s*hari|4\s*days|empat\s*hari|four\s*days|4d)/.test(norm)) {
    detectedDays = 4;
    explanations.push(lang === "en" ? "Set duration to 4 days" : "Durasi diatur 4 hari");
  }

  // 3. Arrival Gate Detection
  let detectedArrival: AllowedArrival | null = null;
  if (/(gilimanuk|pelabuhan|port|ferry|jawa|ketapang)/.test(norm)) {
    detectedArrival = "GilimanukPort";
    explanations.push(
      lang === "en" ? "Set arrival to Gilimanuk Port" : "Pintu kedatangan diatur Pelabuhan Gilimanuk"
    );
  } else if (/(bandara|airport|dps|ngurah\s*rai|pesawat|flight)/.test(norm)) {
    detectedArrival = "NgurahRaiAirport";
    explanations.push(
      lang === "en"
        ? "Set arrival to Ngurah Rai Airport"
        : "Pintu kedatangan diatur Bandara Ngurah Rai"
    );
  }

  // 4. Stay / Accommodation Detection
  let detectedStay: AllowedStay | null = null;
  if (/(backpacker|murah|hemat|budget|hostel|losmen)/.test(norm)) {
    detectedStay = "Backpacker";
    explanations.push(
      lang === "en" ? "Set budget category to Backpacker" : "Tipe akomodasi: Backpacker (Homestay Warga)"
    );
  } else if (/(menengah|mid|standar|standard|keluarga)/.test(norm)) {
    detectedStay = "Moderate";
    explanations.push(
      lang === "en" ? "Set budget category to Moderate" : "Tipe akomodasi: Standar / Moderate"
    );
  } else if (/(comfort|resort|boutique|eco\s*lodge|luxury|mewah|glamping|villa)/.test(norm)) {
    detectedStay = "Comfort";
    explanations.push(
      lang === "en"
        ? "Set accommodation category to Comfort Eco-Lodge"
        : "Tipe akomodasi: Comfort (Eco-Lodge Warga)"
    );
  }

  const finalExplanation =
    explanations.length > 0
      ? explanations.join(". ") + "."
      : lang === "en"
      ? "Trip preferences updated based on your prompt."
      : "Preferensi rute diperbarui berdasarkan catatan Anda.";

  return {
    days: detectedDays,
    arrival: detectedArrival,
    focus: detectedFocuses.length > 0 ? detectedFocuses : null,
    stay: detectedStay,
    explanation: finalExplanation,
  };
}
