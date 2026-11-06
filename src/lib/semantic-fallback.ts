// Local Semantic Rule Engine for Eco Traveler
// Deterministic, zero-dependency, offline-capable NLP extractor.
// Distinguishes travel pace, interests, exclusions, duration, and arrival gates.
// Correctly handles clause boundaries, negation, conflicting instructions, typos, and unrecognized requests.

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

export interface SemanticParseResult {
  status: "matched" | "clarification_needed" | "unrecognized";
  confidence: "high" | "medium" | "low" | "none";
  processingSource: "gemini-ai" | "semantic-fallback";
  parsed: ParsedPreferencesResponse | null;
  detectedIntents: {
    duration?: 1 | 2 | 3 | 4;
    arrival?: AllowedArrival;
    focuses?: AllowedFocus[];
    excludedFocuses?: AllowedFocus[];
    stay?: AllowedStay;
    pace?: "relaxed" | "active";
  };
  conflictNotes?: string[];
  clarificationPrompt?: string;
  message?: string;
}

const NEGATION_PATTERNS = [
  "jangan",
  "tidak",
  "tak",
  "bukan",
  "hindari",
  "tanpa",
  "bebas",
  "kecuali",
  "no",
  "not",
  "dont",
  "don't",
  "avoid",
  "without",
  "exclude",
  "except",
  "anti",
];

// Splits raw text into independent semantic clauses across commas, conjunctions, and delimiters
function splitIntoClauses(rawText: string): string[] {
  return rawText
    .split(/[,;.!?\n]+|\b(tapi|tetapi|namun|melainkan|sedangkan|but|whereas|while|instead)\b/i)
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

function normalizeClause(clause: string): string {
  return clause
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks a specific clause for keywords and checks whether negation appears
 * earlier inside the SAME clause. Negations never leak across clause boundaries.
 */
function inspectClauseForKeyword(
  clause: string,
  keywords: string[]
): { matched: boolean; isNegated: boolean; matchedKeyword?: string } {
  const norm = normalizeClause(clause);
  const tokens = norm.split(/\s+/);

  for (const kw of keywords) {
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const isMatch =
        tok === kw ||
        (kw.length >= 4 && (tok.startsWith(kw.slice(0, 4)) || tok.includes(kw))) ||
        (kw.length >= 5 && kw.startsWith(tok) && tok.length >= 4);

      if (isMatch) {
        // Look back inside the same clause for a negation word
        let negated = false;
        for (let j = 0; j < i; j++) {
          if (NEGATION_PATTERNS.includes(tokens[j])) {
            negated = true;
            break;
          }
        }
        return { matched: true, isNegated: negated, matchedKeyword: kw };
      }
    }
  }

  return { matched: false, isNegated: false };
}

/**
 * Scans all clauses for a category.
 * If any clause explicitly negates the category, it is treated as negated (exclusion).
 * Otherwise if matched without negation, it is treated as an active focus.
 */
function evaluateCategoryAcrossClauses(
  clauses: string[],
  keywords: string[]
): { isIncluded: boolean; isExcluded: boolean } {
  let isIncluded = false;
  let isExcluded = false;

  for (const clause of clauses) {
    const res = inspectClauseForKeyword(clause, keywords);
    if (res.matched) {
      if (res.isNegated) {
        isExcluded = true;
      } else {
        isIncluded = true;
      }
    }
  }

  return { isIncluded, isExcluded };
}

/**
 * Extracts travel parameters and intent from natural language input.
 * Handles both Indonesian and English, with clause-aware negation, conflict resolution,
 * pace vs interest separation, and strict non-hallucinatory rejection of unrecognized text.
 */
export function parsePreferencesSemantically(
  rawInput: string,
  lang: "id" | "en" = "id"
): SemanticParseResult {
  const cleanInput = (rawInput || "").trim();
  if (!cleanInput) {
    return {
      status: "unrecognized",
      confidence: "none",
      processingSource: "semantic-fallback",
      parsed: null,
      detectedIntents: {},
      message: lang === "en" ? "Empty input provided." : "Masukan teks kosong.",
      clarificationPrompt:
        lang === "en"
          ? "Please enter travel preferences, e.g. '3 days relaxed with culinary focus'."
          : "Silakan masukkan preferensi perjalanan, misal: '3 hari santai tambah kuliner'.",
    };
  }

  const clauses = splitIntoClauses(cleanInput);
  const fullNorm = normalizeClause(cleanInput.toLowerCase());

  const detectedFocuses = new Set<AllowedFocus>();
  const excludedFocuses = new Set<AllowedFocus>();
  const explanations: string[] = [];
  const conflictNotes: string[] = [];

  // --- 1. CLAUSE-AWARE FOCUS & EXCLUSION DETECTION ---
  // A. Culinary / Kuliner
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
  const culinaryEval = evaluateCategoryAcrossClauses(clauses, culinaryKeywords);
  if (culinaryEval.isExcluded) {
    excludedFocuses.add("Culinary");
    explanations.push(
      lang === "en"
        ? "Excluded culinary stops based on your preference"
        : "Menghindari sentra kuliner sesuai permintaan Anda"
    );
  } else if (culinaryEval.isIncluded) {
    detectedFocuses.add("Culinary");
    explanations.push(
      lang === "en"
        ? "Focus shifted to local village culinary & food UMKM"
        : "Fokus diarahkan ke sentra kuliner lokal dan UMKM pangan desa"
    );
  }

  // B. Wellness / Santai
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
  const wellnessEval = evaluateCategoryAcrossClauses(clauses, wellnessKeywords);
  if (wellnessEval.isExcluded) {
    excludedFocuses.add("Wellness");
  } else if (wellnessEval.isIncluded) {
    detectedFocuses.add("Wellness");
    explanations.push(
      lang === "en"
        ? "Trip pace adjusted for relaxed wellness & tranquility"
        : "Ritme rute disesuaikan untuk ketenangan dan kenyamanan santai"
    );
  }

  // C. Nature / Alam
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
  const natureEval = evaluateCategoryAcrossClauses(clauses, natureKeywords);
  if (natureEval.isExcluded) {
    excludedFocuses.add("Nature");
    explanations.push(
      lang === "en"
        ? "Excluded nature / coastal stops per your request"
        : "Mengecualikan destinasi alam / pantai sesuai permintaan"
    );
  } else if (natureEval.isIncluded) {
    detectedFocuses.add("Nature");
    explanations.push(
      lang === "en"
        ? "Prioritizing natural landscapes & coastal ecotourism"
        : "Memprioritaskan panorama alam dan ekowisata pesisir"
    );
  }

  // D. Agriculture / Subak
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
  const agroEval = evaluateCategoryAcrossClauses(clauses, agroKeywords);
  if (agroEval.isExcluded) {
    excludedFocuses.add("Agriculture");
    explanations.push(
      lang === "en"
        ? "Excluded agricultural & farm stops"
        : "Mengecualikan persawahan dan agrowisata"
    );
  } else if (agroEval.isIncluded) {
    detectedFocuses.add("Agriculture");
    explanations.push(
      lang === "en"
        ? "Emphasizing agro-tourism & UNESCO Subak heritage"
        : "Menonjolkan agrowisata dan lanskap warisan Subak"
    );
  }

  // E. Culture / Budaya
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
  const cultureEval = evaluateCategoryAcrossClauses(clauses, cultureKeywords);
  if (cultureEval.isExcluded) {
    excludedFocuses.add("Culture");
    explanations.push(
      lang === "en"
        ? "Excluded customary & temple heritage stops"
        : "Mengecualikan kunjungan adat dan pura"
    );
  } else if (cultureEval.isIncluded) {
    detectedFocuses.add("Culture");
    explanations.push(
      lang === "en"
        ? "Curating authentic Balinese cultural & heritage villages"
        : "Mengutamakan desa adat tua dan warisan budaya otentik"
    );
  }

  // --- 2. PACE DETECTION ---
  let detectedPace: "relaxed" | "active" | undefined;
  if (/(padat|cepat|aktif|active|packed|intense|banyak\s*tempat)/.test(fullNorm)) {
    detectedPace = "active";
    explanations.push(
      lang === "en"
        ? "Active pace: maximizing village destination exploration"
        : "Ritme aktif: mengoptimalkan jumlah kunjungan destinasi"
    );
  } else if (wellnessEval.isIncluded && !wellnessEval.isExcluded) {
    detectedPace = "relaxed";
  }

  // --- 3. DURATION DETECTION WITH CONFLICT & OUT-OF-BOUNDS RESOLUTION ---
  const durationMatches: { days: number; index: number; raw: string }[] = [];

  const dayRegexes: { days: number; regex: RegExp }[] = [
    { days: 1, regex: /\b(1\s*hari|1\s*day|satu\s*hari|one\s*day|day\s*trip|sehari|1d)\b/g },
    { days: 2, regex: /\b(2\s*hari|2\s*days|dua\s*hari|two\s*days|2d|weekend|akhir\s*pekan)\b/g },
    { days: 3, regex: /\b(3\s*hari|3\s*days|tiga\s*hari|three\s*days|3d)\b/g },
    { days: 4, regex: /\b(4\s*hari|4\s*days|empat\s*hari|four\s*days|4d)\b/g },
  ];

  for (const { days, regex } of dayRegexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(fullNorm)) !== null) {
      durationMatches.push({ days, index: match.index, raw: match[0] });
    }
  }

  // Detect out-of-bounds duration numbers like "10 hari", "0 hari", "7 hari"
  const outOfBoundsMatch = /\b(\d+)\s*(hari|day|days)\b/.exec(fullNorm);
  if (outOfBoundsMatch) {
    const requestedVal = parseInt(outOfBoundsMatch[1], 10);
    if (requestedVal < 1 || requestedVal > 4) {
      return {
        status: "clarification_needed",
        confidence: "medium",
        processingSource: "semantic-fallback",
        parsed: null,
        detectedIntents: {},
        clarificationPrompt:
          lang === "en"
            ? `Eco Traveler supports curated routes between 1 and 4 days. You requested ${requestedVal} days. Please choose 1, 2, 3, or 4 days.`
            : `Eco Traveler mendukung rute 1 sampai 4 hari. Anda meminta ${requestedVal} hari. Silakan pilih 1, 2, 3, atau 4 hari.`,
        message:
          lang === "en"
            ? `Duration ${requestedVal} days is out of bounds (allowed: 1-4 days).`
            : `Durasi ${requestedVal} hari di luar batas (didukung: 1-4 hari).`,
      };
    }
  }

  let detectedDays: 1 | 2 | 3 | 4 | null = null;
  if (durationMatches.length > 0) {
    durationMatches.sort((a, b) => a.index - b.index);
    if (durationMatches.length > 1) {
      const winner = durationMatches[durationMatches.length - 1];
      const loser = durationMatches[0];
      if (winner.days !== loser.days) {
        conflictNotes.push(
          lang === "en"
            ? `Resolved duration conflict: ${winner.days} days chosen (superseding earlier mention of ${loser.days} days).`
            : `Resolusi konflik durasi: memilih ${winner.days} hari (menggantikan penyebutan awal ${loser.days} hari).`
        );
      }
      detectedDays = winner.days as 1 | 2 | 3 | 4;
    } else {
      detectedDays = durationMatches[0].days as 1 | 2 | 3 | 4;
    }
    explanations.push(
      lang === "en" ? `Set duration to ${detectedDays} days` : `Durasi diatur ${detectedDays} hari`
    );
  }

  // --- 4. ARRIVAL GATE DETECTION WITH CLAUSE NEGATION ---
  let detectedArrival: AllowedArrival | null = null;
  const gilimanukEval = evaluateCategoryAcrossClauses(clauses, ["gilimanuk", "ferry", "ketapang"]);
  const airportEval = evaluateCategoryAcrossClauses(clauses, [
    "bandara",
    "airport",
    "dps",
    "ngurah rai",
    "pesawat",
    "flight",
    "tuban",
  ]);

  if (gilimanukEval.isExcluded || (gilimanukEval.isExcluded && airportEval.isIncluded)) {
    detectedArrival = "NgurahRaiAirport";
    explanations.push(
      lang === "en" ? "Arrival set to Airport (avoiding Gilimanuk)" : "Kedatangan diarahkan ke Bandara (bukan Gilimanuk)"
    );
  } else if (airportEval.isExcluded || (airportEval.isExcluded && gilimanukEval.isIncluded)) {
    detectedArrival = "GilimanukPort";
    explanations.push(
      lang === "en" ? "Arrival set to Gilimanuk Port (avoiding Airport)" : "Kedatangan diarahkan ke Gilimanuk (bukan Bandara)"
    );
  } else if (gilimanukEval.isIncluded) {
    detectedArrival = "GilimanukPort";
    explanations.push(
      lang === "en" ? "Set arrival to Gilimanuk Ferry Port" : "Pintu kedatangan: Pelabuhan Gilimanuk"
    );
  } else if (airportEval.isIncluded) {
    detectedArrival = "NgurahRaiAirport";
    explanations.push(
      lang === "en" ? "Set arrival to Ngurah Rai Airport" : "Pintu kedatangan: Bandara Ngurah Rai"
    );
  }

  // --- 5. STAY / BUDGET DETECTION ---
  let detectedStay: AllowedStay | null = null;
  if (/(backpacker|murah|hemat|budget|hostel|losmen)/.test(fullNorm)) {
    detectedStay = "Backpacker";
    explanations.push(
      lang === "en" ? "Accommodation: Backpacker (Community Homestay)" : "Akomodasi: Backpacker (Homestay Warga)"
    );
  } else if (/(menengah|mid|standar|standard|keluarga)/.test(fullNorm)) {
    detectedStay = "Moderate";
    explanations.push(
      lang === "en" ? "Accommodation: Standard / Moderate" : "Akomodasi: Standar / Menengah"
    );
  } else if (/(comfort|resort|boutique|eco\s*lodge|luxury|mewah|glamping|villa)/.test(fullNorm)) {
    detectedStay = "Comfort";
    explanations.push(
      lang === "en" ? "Accommodation: Comfort Eco-Lodge" : "Akomodasi: Comfort (Eco-Lodge Warga)"
    );
  }

  // Final Focuses: remove any that were explicitly excluded
  const finalFocuses = Array.from(detectedFocuses).filter((f) => !excludedFocuses.has(f));

  // --- 6. UNRECOGNIZED & AMBIGUOUS CHECK ---
  const hasConcreteIntent =
    detectedDays !== null ||
    detectedArrival !== null ||
    finalFocuses.length > 0 ||
    excludedFocuses.size > 0 ||
    detectedStay !== null ||
    detectedPace !== undefined;

  if (!hasConcreteIntent) {
    const isVagueTravel = /(liburan|holiday|trip|vacation|wisata|jalan|travel|recommend|rekomen|bagus|seru|mau|tolong|help)/.test(
      fullNorm
    );

    if (isVagueTravel) {
      return {
        status: "clarification_needed",
        confidence: "low",
        processingSource: "semantic-fallback",
        parsed: null,
        detectedIntents: {},
        clarificationPrompt:
          lang === "en"
            ? "Could you specify what kind of trip you prefer? E.g., '3 days culture & culinary from Airport' or '2 days relaxed nature'."
            : "Bisa perjelas perjalanan yang diinginkan? Contoh: '3 hari budaya & kuliner dari bandara' atau '2 hari santai alam'.",
        message:
          lang === "en"
            ? "General travel intent detected, but specific parameters are missing."
            : "Niat perjalanan terdeteksi, namun parameter rute belum spesifik.",
      };
    }

    return {
      status: "unrecognized",
      confidence: "none",
      processingSource: "semantic-fallback",
      parsed: null,
      detectedIntents: {},
      clarificationPrompt:
        lang === "en"
          ? "No recognizable travel parameters found. Try specifying duration (1-4 days), gate (Airport/Gilimanuk), or interests (culture, nature, culinary, wellness, subak)."
          : "Tidak ada parameter rute yang dikenali. Coba sebutkan durasi (1-4 hari), pintu masuk (Bandara/Gilimanuk), atau minat (budaya, alam, kuliner, santai, subak).",
      message:
        lang === "en"
          ? "Input was not recognized as a travel preference request."
          : "Masukan tidak dikenali sebagai permintaan preferensi perjalanan.",
    };
  }

  const allNotes = [...explanations, ...conflictNotes];
  const finalExplanation =
    allNotes.length > 0
      ? allNotes.join(". ") + "."
      : lang === "en"
      ? "Trip preferences updated based on your prompt."
      : "Preferensi rute diperbarui berdasarkan catatan Anda.";

  const parsedData: ParsedPreferencesResponse = {
    days: detectedDays,
    arrival: detectedArrival,
    focus: finalFocuses.length > 0 ? finalFocuses : null,
    stay: detectedStay,
    explanation: finalExplanation,
  };

  return {
    status: "matched",
    confidence: "high",
    processingSource: "semantic-fallback",
    parsed: parsedData,
    detectedIntents: {
      duration: detectedDays || undefined,
      arrival: detectedArrival || undefined,
      focuses: finalFocuses.length > 0 ? finalFocuses : undefined,
      excludedFocuses: excludedFocuses.size > 0 ? Array.from(excludedFocuses) : undefined,
      stay: detectedStay || undefined,
      pace: detectedPace,
    },
    conflictNotes: conflictNotes.length > 0 ? conflictNotes : undefined,
    message: finalExplanation,
  };
}
