import { GoogleGenerativeAI } from "@google/generative-ai";
import presetsFallbackData from "../../data/presets-fallback.json";
import { DesaWisata } from "@/types/desa";
import {
  TripRequest,
  ItineraryResponse,
  DayItinerary,
  TripDayActivity,
} from "@/types/trip";
import {
  DESA_DATASET,
  DESA_BY_ID,
  applyAntiOvertourismCapacityGuard,
  computeItineraryTelemetry,
  PRIORITY_REGENCIES,
} from "@/lib/scoring";
import {
  formatRupiah,
  generateDeterministicStopDescription,
  cleanHighlightPhrase,
} from "@/lib/utils";
import { localizeItinerary } from "@/lib/i18n";

const GEMINI_TIMEOUT_MS = 6000;

export const ARRIVAL_GATES = {
  NgurahRaiAirport: {
    label: "Bandara I Gusti Ngurah Rai (Tuban - Selatan)",
    labelEn: "I Gusti Ngurah Rai International Airport",
    coords: [-8.7467, 115.1668] as [number, number],
  },
  GilimanukPort: {
    label: "Pelabuhan Gilimanuk (Jembrana - Barat)",
    labelEn: "Gilimanuk Ferry Port (West Bali)",
    coords: [-8.1638, 114.4361] as [number, number],
  },
};

export const SYSTEM_INSTRUCTION = `You are the Eco Traveler Spatial Route Planner for Bali.
Your goal is to reduce tourist crowding in South Bali (Sarbagita) and direct visitor spending to North, East, and West Bali.

Guidelines:
1. Prioritize tourist villages from the provided dataset in Buleleng, Karangasem, Jembrana, and Bangli (at least 70% of activities must be in these regencies).
2. Do not route visitors to Kuta, Seminyak, or Canggu.
3. Keep daily routes geographically sequential without backtracking from the arrivalGate.
4. Estimate local spending (Homestay, Warung, Community Guide) in Indonesian Rupiah.
5. Write descriptions in plain, concrete language without promotional clichés. Output valid JSON only.`;

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scoreVillageMatch(
  village: DesaWisata,
  request: TripRequest,
  referenceCoords?: [number, number]
): number {
  const interests = request.interests || ["Culture", "Nature"];
  const normalizedInterests = interests.map((i) => i.toLowerCase());
  let matchCount = 0;

  // 1. Core Interest Alignment
  for (const focus of village.focus) {
    if (normalizedInterests.includes(focus.toLowerCase())) {
      matchCount += 3.0;
    }
  }

  // 2. Negative Constraints: Excluded Focuses & Excluded Villages
  if (request.excludedFocuses && request.excludedFocuses.length > 0) {
    const exLower = request.excludedFocuses.map((f) => f.toLowerCase());
    for (const focus of village.focus) {
      if (exLower.includes(focus.toLowerCase())) {
        matchCount -= 12.0;
      }
    }
  }

  if (request.excludedVillages && request.excludedVillages.includes(village.id)) {
    return -999;
  }

  // 3. Spatial Redistribution Priority Bonus (Buleleng, Karangasem, Jembrana, Bangli, Klungkung)
  if (PRIORITY_REGENCIES.has(village.regency)) {
    matchCount += 2.0;
  }

  // 4. Crowd Avoidance: Penalize high simulated loads, reward serene low-density villages
  if (request.avoidCrowds) {
    const loadRatio =
      village.dailyQuota && village.dailyQuota > 0
        ? (village.currentSimulatedLoad || 0) / village.dailyQuota
        : 0.5;

    if (loadRatio >= 0.70) {
      // High load (e.g. Penglipuran with 88% load): penalty to divert travelers
      matchCount -= 8.0;
    } else if (loadRatio <= 0.45) {
      // Peaceful low-density village: bonus
      matchCount += 3.5;
    }
  }

  // 5. Local Business Priority: Reward community UMKM and homestay models
  if (request.prioritizeLocalBusiness) {
    if (village.localUmkm && village.localUmkm.length > 10) {
      matchCount += 3.0;
    }
    if (village.avgHomestayPrice && village.avgHomestayPrice <= 300000) {
      matchCount += 1.5;
    }
  }

  // 6. Driving Time Preference: Distance penalty to cluster stops
  if (request.drivingPreference === "short" && referenceCoords) {
    const dist = haversineDistanceKm(
      referenceCoords[0],
      referenceCoords[1],
      village.lat,
      village.lng
    );
    matchCount -= dist * 0.12;
  }

  return matchCount;
}

export function buildDeterministicItinerary(
  request: TripRequest
): ItineraryResponse {
  const duration = Math.min(4, Math.max(1, Number(request.durationDays) || 3));
  const interests =
    request.interests && request.interests.length > 0
      ? request.interests
      : ["Culture", "Nature"];
  const budget = request.budgetCategory || "Moderate";
  const gate = request.arrivalGate || "NgurahRaiAirport";
  const locale = request.locale === "en" ? "en" : "id";

  const spendMultiplier =
    budget === "Backpacker" ? 0.78 : budget === "Comfort" ? 1.38 : 1.0;

  const corridorSequence: string[][] =
    gate === "GilimanukPort"
      ? [
          ["desa-blimbingsari", "desa-ekasari", "desa-medewi", "desa-gumbrih"],
          ["desa-pejarakan", "desa-pemuteran", "desa-munduk", "desa-gobleg"],
          ["desa-ambengan", "desa-sudaji", "desa-sembiran", "desa-les"],
          [
            "desa-batur-selatan",
            "desa-trunyan",
            "desa-penglipuran",
            "desa-sidemen",
          ],
        ]
      : [
          interests.includes("Agriculture")
            ? [
                "desa-jatiluwih",
                "desa-wongaya-gede",
                "desa-gobleg",
                "desa-munduk",
              ]
            : [
                "desa-taro",
                "desa-penglipuran",
                "desa-batur-selatan",
                "desa-trunyan",
              ],
          [
            "desa-muncan",
            "desa-sidemen",
            "desa-sibetan",
            "desa-tenganan",
            "desa-budakeling",
          ],
          [
            "desa-amed-purwakerti",
            "desa-tulamben",
            "desa-les",
            "desa-sembiran",
            "desa-sudaji",
          ],
          [
            "desa-ambengan",
            "desa-pemuteran",
            "desa-pejarakan",
            "desa-blimbingsari",
          ],
        ];

  const dayThemeTitles: Record<string, string[]> = {
    GilimanukPort: [
      "Agrowisata Kakao & Pesisir Barat Jembrana",
      "Konservasi Terumbu Biorock & Danau Kembar Buleleng",
      "Jalur Subak & Desa Kuno Buleleng Timur",
      "Kaldera Batur & Lembah Tenun Karangasem",
    ],
    NgurahRaiAirport: [
      interests.includes("Agriculture")
        ? "Sawah Subak Warisan Dunia & Kebun Kopi Pegunungan"
        : "Desa Adat Bangli & Kaldera Geopark Batur",
      "Lembah Tenun Sidemen & Kebun Salak Kaki Gunung Agung",
      "Pesisir Timur Amed & Ladang Garam Palung Buleleng",
      "Terumbu Karang Pemuteran & Kebun Kakao Jembrana",
    ],
  };

  const isRelaxed = request.pace === "relaxed";
  const stopCountPerDay = isRelaxed ? 2 : 3;
  const timeSlots: ("Pagi" | "Siang" | "Sore")[] = isRelaxed
    ? ["Pagi", "Siang"]
    : ["Pagi", "Siang", "Sore"];

  const rawDays: DayItinerary[] = [];
  let referenceCoords: [number, number] = ARRIVAL_GATES[gate].coords;

  for (let d = 0; d < duration; d++) {
    const candidateIds = [...(corridorSequence[d] || corridorSequence[0])];

    // If crowd avoidance is active, inject buffer villages (e.g. Undisan for Penglipuran)
    if (request.avoidCrowds) {
      for (const id of [...candidateIds]) {
        const v = DESA_BY_ID.get(id);
        if (v?.bufferVillageId && !candidateIds.includes(v.bufferVillageId)) {
          candidateIds.push(v.bufferVillageId);
        }
      }
    }

    const candidates = candidateIds
      .map((id) => DESA_BY_ID.get(id))
      .filter((v): v is DesaWisata => Boolean(v));

    const ranked = [...candidates].sort(
      (a, b) =>
        scoreVillageMatch(b, request, referenceCoords) -
        scoreVillageMatch(a, request, referenceCoords)
    );

    const selectedVillages = ranked.slice(0, stopCountPerDay);

    // If short driving time requested, sequence stops by nearest-neighbor from referenceCoords
    if (request.drivingPreference === "short" && selectedVillages.length > 1) {
      const sorted: DesaWisata[] = [];
      const pool = [...selectedVillages];
      let currentRef = referenceCoords;

      while (pool.length > 0) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < pool.length; i++) {
          const dist = haversineDistanceKm(currentRef[0], currentRef[1], pool[i].lat, pool[i].lng);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
        const [nextV] = pool.splice(bestIdx, 1);
        sorted.push(nextV);
        currentRef = [nextV.lat, nextV.lng];
      }
      selectedVillages.length = 0;
      selectedVillages.push(...sorted);
    } else {
      selectedVillages.sort(
        (a, b) => candidateIds.indexOf(a.id) - candidateIds.indexOf(b.id)
      );
    }

    // Update reference coords for next day
    if (selectedVillages.length > 0) {
      const lastSelected = selectedVillages[selectedVillages.length - 1];
      referenceCoords = [lastSelected.lat, lastSelected.lng];
    }

    const localBonus = request.prioritizeLocalBusiness ? 1.18 : 1.0;
    const paceSpendFactor = isRelaxed ? 1.35 : 1.0;
    const finalActivitySpendMultiplier = spendMultiplier * localBonus * paceSpendFactor;

    const activities: TripDayActivity[] = selectedVillages.map(
      (village, idx) => {
        const slot = timeSlots[idx] || "Sore";
        const baseSpend =
          slot === "Siang" ? 185000 : slot === "Pagi" ? 140000 : 160000;
        const estimatedSpend =
          Math.round((baseSpend * finalActivitySpendMultiplier) / 5000) * 5000;

        const slotActionPrefix =
          slot === "Pagi"
            ? "Kunjungan Pagi:"
            : slot === "Siang"
            ? "Lokakarya & Makan Siang Warga:"
            : "Jelajah Sore:";

        return {
          timeSlot: slot,
          villageId: village.id,
          villageName: village.name,
          regency: village.regency,
          activityTitle: `${slotActionPrefix} ${cleanHighlightPhrase(village.highlights)}`,
          description: generateDeterministicStopDescription(
            village.name,
            village.regency,
            village.highlights,
            village.localUmkm,
            slot,
            "id"
          ),
          lat: village.lat,
          lng: village.lng,
          estimatedLocalSpendRp: estimatedSpend,
          antiOvertourismNote: PRIORITY_REGENCIES.has(village.regency)
            ? `Kabupaten prioritas pemerataan ${village.regency} (Bobot Spasial 1.0).`
            : `Koridor jalur penghubung di ${village.regency} yang menghindari koridor padat Bali Selatan menuju Bali Utara dan Timur.`,
          localUmkmSpot: village.localUmkm,
          capacityStatus: "OPTIMAL",
        };
      }
    );

    const isFinalDay = d === duration - 1;
    const anchorVillage =
      selectedVillages[selectedVillages.length - 1] || DESA_DATASET[0];
    const stayPrice = Math.round(
      anchorVillage.avgHomestayPrice * spendMultiplier
    );

    const stayType =
      request.prioritizeLocalBusiness
        ? "Community Homestay"
        : budget === "Comfort"
        ? "Eco Lodge"
        : "Community Homestay";

    const recommendedStay = isFinalDay
      ? undefined
      : {
          name:
            stayType === "Community Homestay"
              ? `Pondok Warga Pokdarwis ${anchorVillage.name}`
              : `${anchorVillage.name} Heritage Eco-Lodge`,
          type: stayType as "Eco Lodge" | "Community Homestay",
          priceRangeRp: `${formatRupiah(stayPrice)} - ${formatRupiah(
            stayPrice + 60000
          )} / malam`,
          villageName: anchorVillage.name,
          regency: anchorVillage.regency,
        };

    rawDays.push({
      dayNumber: d + 1,
      themeTitle: `Hari ${d + 1}: ${
        dayThemeTitles[gate]?.[d] || "Eksplorasi Desa Wisata Mandiri"
      }`,
      activities,
      recommendedStay,
    });
  }

  const guardedDays = applyAntiOvertourismCapacityGuard(
    rawDays,
    DESA_DATASET,
    Boolean(request.simulateCapacityAlert)
  );

  const metrics = computeItineraryTelemetry(guardedDays, DESA_DATASET, budget);

  const visitedVillageIds = new Set(
    guardedDays.flatMap((d) => d.activities.map((a) => a.villageId))
  );
  const visitedVillages = DESA_DATASET.filter((v) =>
    visitedVillageIds.has(v.id)
  );

  const culturalEtiquette = [
    {
      ruleTitle: "Tata Busana Pura & Kawasan Suci Desa Adat (Kamen & Selendang)",
      description: visitedVillages
        .slice(0, 3)
        .map((v) => `${v.name}: ${v.dressCode || v.customsNote}`)
        .join(" • "),
      applicableVillages: visitedVillages.map((v) => v.name),
      category: "Busana Pura" as const,
    },
    {
      ruleTitle: "Awig-Awig Desa, Pantangan Cuntaka & Hari Sakral Piodalan",
      description: visitedVillages
        .slice(0, 3)
        .map((v) => `${v.name}: ${v.sacredDaysNote || v.customsNote}`)
        .join(" • "),
      applicableVillages: visitedVillages.map((v) => v.name),
      category: "Pantangan Adat" as const,
    },
    {
      ruleTitle: "Etika Saluran Subak, Hutan Adat & Pesisir",
      description: visitedVillages
        .map((v) => `${v.name} (${v.regency}): ${v.customsNote}`)
        .slice(0, 4)
        .join(" • "),
      applicableVillages: visitedVillages.map((v) => v.name),
      category: "Ekologi Subak & Laut" as const,
    },
  ];

  const interestLabels: Record<string, string> = {
    Nature: "alam dan konservasi",
    Culture: "seni dan budaya adat",
    Wellness: "kebugaran dan ekowisata",
    Culinary: "kuliner tradisional",
    Agriculture: "pertanian subak",
  };
  const focusSummary = interests
    .map((i) => interestLabels[i] || i)
    .join(", ");

  const baseItinerary: ItineraryResponse = {
    tripTitle: `Rute ${duration} Hari: ${
      gate === "GilimanukPort"
        ? "Lintas Barat Jembrana & Pesisir Utara Buleleng"
        : "Jelajah Desa Bangli, Karangasem & Buleleng"
    }`,
    summaryNarrative: `Perjalanan ${duration} hari dari ${
      ARRIVAL_GATES[gate].label
    } menuju Kabupaten ${metrics.primaryRegenciesBenefited.join(
      ", "
    )}. Rute ini memfokuskan kunjungan pada ${focusSummary}, dengan ${
      metrics.localBenefitIndex
    }% estimasi pengeluaran masuk ke penginapan warga dan usaha desa setempat.`,
    days: guardedDays,
    metrics,
    culturalEtiquette,
    engineMeta: {
      source: "deterministic-fallback",
      modelUsed: "Subak Spatial Engine v2.0",
      latencyMs: 14,
      arrivalGateLabel:
        locale === "en" ? ARRIVAL_GATES[gate].labelEn : ARRIVAL_GATES[gate].label,
      arrivalCoords: ARRIVAL_GATES[gate].coords,
    },
  };

  return locale === "en" ? localizeItinerary(baseItinerary, "en") : baseItinerary;
}

export async function generateRedistributiveItinerary(
  request: TripRequest,
  skipExternalAi = false
): Promise<ItineraryResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  const gate = request.arrivalGate || "NgurahRaiAirport";
  const locale = request.locale === "en" ? "en" : "id";

  if (!skipExternalAi && apiKey && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.35,
        },
      });

      const compactDataset = DESA_DATASET.map((d) => ({
        id: d.id,
        name: d.name,
        regency: d.regency,
        zone: d.zone,
        lat: d.lat,
        lng: d.lng,
        focus: d.focus,
        highlights: d.highlights,
        avgHomestayPrice: d.avgHomestayPrice,
        localUmkm: d.localUmkm,
        customsNote: d.customsNote,
      }));

      const langInstruction =
        locale === "en"
          ? "Write all titles, descriptions, summaryNarrative, and culturalEtiquette in plain, natural English."
          : "Tulis seluruh judul, deskripsi, summaryNarrative, dan culturalEtiquette dalam Bahasa Indonesia yang lugas.";

      const prompt = `Buat rencana perjalanan wisata desa Bali berdasarkan parameter berikut:
- Durasi: ${request.durationDays} hari
- Minat Wisatawan: ${request.interests.join(", ")}
- Kategori Anggaran: ${request.budgetCategory}
- Titik Kedatangan: ${ARRIVAL_GATES[gate].label} (${gate})
- Ritme Perjalanan (Pace): ${request.pace || "standar"}
- Hindari Keramaian: ${request.avoidCrowds ? "YA (hindari desa padat seperti Penglipuran, prioritaskan desa penyangga/tenang)" : "standar"}
- Prioritas Usaha Lokal: ${request.prioritizeLocalBusiness ? "YA (maksimalkan belanja ke UMKM Pokdarwis & homestay warga)" : "standar"}
- Preferensi Berkendara: ${request.drivingPreference === "short" ? "Rute Pendek (jarak antar desa berdekatan, minimalkan waktu berkendara)" : "standar"}
- Pengecualian Minat: ${request.excludedFocuses && request.excludedFocuses.length > 0 ? request.excludedFocuses.join(", ") : "tidak ada"}
- Desa yang Dikecualikan: ${request.excludedVillages && request.excludedVillages.length > 0 ? request.excludedVillages.join(", ") : "tidak ada"}
- Bahasa Output: ${langInstruction}

Dataset Desa Wisata Terverifikasi (HANYA gunakan desa dari daftar ini, jangan mengulang desa yang sama):
${JSON.stringify(compactDataset)}

Kembalikan JSON dengan struktur persis:
{
  "tripTitle": "string",
  "summaryNarrative": "string",
  "days": [
    {
      "dayNumber": 1,
      "themeTitle": "string",
      "activities": [
        {
          "timeSlot": "Pagi" | "Siang" | "Sore",
          "villageId": "string (harus cocok dengan id di dataset)",
          "villageName": "string",
          "regency": "string",
          "activityTitle": "string",
          "description": "string",
          "lat": number,
          "lng": number,
          "estimatedLocalSpendRp": number,
          "antiOvertourismNote": "string",
          "localUmkmSpot": "string"
        }
      ],
      "recommendedStay": {
        "name": "string",
        "type": "Community Homestay" | "Eco Lodge",
        "priceRangeRp": "string"
      }
    }
  ],
  "culturalEtiquette": [
    {
      "ruleTitle": "string",
      "description": "string",
      "applicableVillages": ["string"]
    }
  ]
}`;

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini request timed out after 6s")),
            GEMINI_TIMEOUT_MS
          )
        ),
      ]);

      const text = result.response.text();
      const parsed = JSON.parse(text) as Partial<ItineraryResponse>;

      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        const usedVillageIds = new Set<string>();
        const validSlots: ("Pagi" | "Siang" | "Sore")[] = [
          "Pagi",
          "Siang",
          "Sore",
        ];

        const syncedDays: DayItinerary[] = parsed.days.map((day, idx) => ({
          dayNumber: day.dayNumber || idx + 1,
          themeTitle:
            day.themeTitle ||
            (locale === "en"
              ? `Day ${idx + 1}: Village Exploration`
              : `Hari ${idx + 1}: Eksplorasi Desa Wisata`),
          activities: (day.activities || []).map((act, actIdx) => {
            let matchedVillage =
              DESA_BY_ID.get(act.villageId) ||
              DESA_DATASET.find(
                (v) => v.name.toLowerCase() === act.villageName?.toLowerCase()
              );

            if (!matchedVillage || usedVillageIds.has(matchedVillage.id)) {
              matchedVillage =
                DESA_DATASET.find((v) => !usedVillageIds.has(v.id)) ||
                DESA_DATASET[0];
            }
            usedVillageIds.add(matchedVillage.id);

            const normalizedSlot = validSlots.includes(
              act.timeSlot as "Pagi" | "Siang" | "Sore"
            )
              ? (act.timeSlot as "Pagi" | "Siang" | "Sore")
              : validSlots[actIdx % 3];

            return {
              ...act,
              timeSlot: normalizedSlot,
              villageId: matchedVillage.id,
              villageName: matchedVillage.name,
              regency: matchedVillage.regency,
              lat: matchedVillage.lat,
              lng: matchedVillage.lng,
              localUmkmSpot: act.localUmkmSpot || matchedVillage.localUmkm,
              estimatedLocalSpendRp:
                Number(act.estimatedLocalSpendRp) || 165000,
              capacityStatus: "OPTIMAL",
            };
          }),
          recommendedStay:
            idx === (parsed.days || []).length - 1
              ? undefined
              : day.recommendedStay || {
                  name: "Homestay Koperasi Desa Wisata",
                  type: "Community Homestay",
                  priceRangeRp: "Rp 250.000 - Rp 290.000 / malam",
                },
        }));

        const guardedDays = applyAntiOvertourismCapacityGuard(
          syncedDays,
          DESA_DATASET,
          Boolean(request.simulateCapacityAlert)
        );
        const metrics = computeItineraryTelemetry(
          guardedDays,
          DESA_DATASET,
          request.budgetCategory
        );

        const aiItinerary: ItineraryResponse = {
          tripTitle:
            parsed.tripTitle ||
            (locale === "en"
              ? `${request.durationDays}-Day Bali Village Route`
              : `Rute Perjalanan ${request.durationDays} Hari Desa Bali`),
          summaryNarrative:
            parsed.summaryNarrative ||
            "Rute perjalanan yang menyalurkan belanja wisatawan ke penginapan warga dan usaha desa di luar Bali Selatan.",
          days: guardedDays,
          metrics,
          culturalEtiquette:
            parsed.culturalEtiquette && parsed.culturalEtiquette.length > 0
              ? parsed.culturalEtiquette
              : presetsFallbackData.presets[0].culturalEtiquette,
          engineMeta: {
            source: "gemini-ai",
            modelUsed: modelName,
            latencyMs: Date.now() - startTime,
            arrivalGateLabel:
              locale === "en"
                ? ARRIVAL_GATES[gate].labelEn
                : ARRIVAL_GATES[gate].label,
            arrivalCoords: ARRIVAL_GATES[gate].coords,
          },
        };

        return locale === "en" ? localizeItinerary(aiItinerary, "en") : aiItinerary;
      }
    } catch (error) {
      console.warn(
        "[EcoTraveler AI Engine] Gemini API fallback triggered:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const fallbackResult = buildDeterministicItinerary(request);

  return {
    ...fallbackResult,
    engineMeta: {
      source: "deterministic-fallback",
      modelUsed: "Subak Spatial Engine v2.0",
      latencyMs: Math.max(12, Date.now() - startTime),
      arrivalGateLabel:
        locale === "en"
          ? ARRIVAL_GATES[gate].labelEn
          : ARRIVAL_GATES[gate].label,
      arrivalCoords: ARRIVAL_GATES[gate].coords,
    },
  };
}

export interface ItineraryValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    durationDays: number;
    nightsCount: number;
    totalStops: number;
    visitedVillages: string[];
    uniqueVillages: number;
    priorityRegencyRatio: number;
  };
}

/**
 * Validates the spatial, economic, and logical integrity of an itinerary response.
 * Enforces competition guidelines:
 * - Day / night consistency (1 day = 0 nights, 2 days = 1 night, etc.)
 * - Valid geographic coordinates within Bali bounds
 * - Verifiable village IDs from DESA_DATASET
 * - Realistic spending & non-empty activity sequences
 */
export function validateItineraryRoute(
  itinerary: ItineraryResponse
): ItineraryValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!itinerary) {
    return {
      isValid: false,
      errors: ["Itinerary is null or undefined"],
      warnings: [],
      details: {
        durationDays: 0,
        nightsCount: 0,
        totalStops: 0,
        visitedVillages: [],
        uniqueVillages: 0,
        priorityRegencyRatio: 0,
      },
    };
  }

  const days = itinerary.days || [];
  if (days.length === 0) {
    errors.push("Itinerary has no days");
  } else if (days.length > 4) {
    errors.push(
      `Itinerary days count (${days.length}) exceeds maximum allowable 4 days`
    );
  }

  // Day / night consistency: expected nights is Math.max(0, days.length - 1)
  const expectedNights = Math.max(0, days.length - 1);
  const actualNights = days.filter((d) => Boolean(d.recommendedStay)).length;
  if (actualNights > expectedNights) {
    warnings.push(
      `Itinerary has ${actualNights} overnight stays for a ${days.length}-day trip. Expected ${expectedNights} nights.`
    );
  }

  // Final departure day should not have an overnight stay
  if (days.length > 0) {
    const lastDay = days[days.length - 1];
    if (lastDay.recommendedStay) {
      warnings.push(
        "Final day of itinerary includes an overnight stay despite returning to arrival gate."
      );
    }
  }

  let totalStops = 0;
  const visitedVillages: string[] = [];
  let priorityStops = 0;

  for (const day of days) {
    if (!day.activities || day.activities.length === 0) {
      errors.push(`Day ${day.dayNumber} has no activities`);
      continue;
    }
    for (const act of day.activities) {
      totalStops++;
      visitedVillages.push(act.villageId);

      const village = DESA_BY_ID.get(act.villageId);
      if (!village) {
        errors.push(`Activity references unknown villageId: ${act.villageId}`);
      } else {
        // Bali bounding box: latitude -8.9 to -8.0, longitude 114.4 to 115.8
        if (
          act.lat < -8.9 ||
          act.lat > -8.0 ||
          act.lng < 114.4 ||
          act.lng > 115.8
        ) {
          errors.push(
            `Invalid geographic coordinates for ${act.villageName}: [${act.lat}, ${act.lng}]`
          );
        }
        if (PRIORITY_REGENCIES.has(act.regency)) {
          priorityStops++;
        }
      }

      if (
        typeof act.estimatedLocalSpendRp !== "number" ||
        act.estimatedLocalSpendRp <= 0
      ) {
        warnings.push(
          `Activity in ${act.villageName} has non-positive spend: ${act.estimatedLocalSpendRp}`
        );
      }
    }
  }

  const uniqueVillages = new Set(visitedVillages).size;
  const priorityRatio = totalStops > 0 ? priorityStops / totalStops : 0;

  if (priorityRatio < 0.6) {
    warnings.push(
      `Priority regency representation is ${(priorityRatio * 100).toFixed(
        1
      )}%, target is >= 70%.`
    );
  }

  if (itinerary.metrics) {
    if (
      itinerary.metrics.spreadScore < 0 ||
      itinerary.metrics.spreadScore > 100
    ) {
      errors.push(`Invalid Spread Score: ${itinerary.metrics.spreadScore}`);
    }
    if (
      itinerary.metrics.localBenefitIndex < 0 ||
      itinerary.metrics.localBenefitIndex > 100
    ) {
      errors.push(
        `Invalid Local Benefit Index: ${itinerary.metrics.localBenefitIndex}`
      );
    }
    if (itinerary.metrics.totalEstimatedSpendRp <= 0) {
      errors.push(
        `Invalid total spend: ${itinerary.metrics.totalEstimatedSpendRp}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      durationDays: days.length,
      nightsCount: actualNights,
      totalStops,
      visitedVillages,
      uniqueVillages,
      priorityRegencyRatio: Math.round(priorityRatio * 1000) / 10,
    },
  };
}
