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
import { formatRupiah } from "@/lib/utils";

const GEMINI_TIMEOUT_MS = 6000;

export const ARRIVAL_GATES = {
  NgurahRaiAirport: {
    label: "Bandara I Gusti Ngurah Rai (Tuban - Selatan)",
    coords: [-8.7467, 115.1668] as [number, number],
  },
  GilimanukPort: {
    label: "Pelabuhan Gilimanuk (Jembrana - Barat)",
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
5. Write descriptions in plain, concrete Indonesian without promotional clichés. Output valid JSON only.`;

function scoreVillageMatch(village: DesaWisata, interests: string[]): number {
  if (!interests || interests.length === 0) return 1;
  const normalizedInterests = interests.map((i) => i.toLowerCase());
  let matchCount = 0;

  for (const focus of village.focus) {
    if (normalizedInterests.includes(focus.toLowerCase())) {
      matchCount += 2;
    }
  }

  if (PRIORITY_REGENCIES.has(village.regency)) {
    matchCount += 1.5;
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

  const timeSlots: ("Pagi" | "Siang" | "Sore")[] = ["Pagi", "Siang", "Sore"];
  const rawDays: DayItinerary[] = [];

  for (let d = 0; d < duration; d++) {
    const candidateIds = corridorSequence[d] || corridorSequence[0];
    const candidates = candidateIds
      .map((id) => DESA_BY_ID.get(id))
      .filter((v): v is DesaWisata => Boolean(v));

    const ranked = [...candidates].sort(
      (a, b) => scoreVillageMatch(b, interests) - scoreVillageMatch(a, interests)
    );
    const selectedVillages = ranked.slice(0, 3);

    selectedVillages.sort(
      (a, b) => candidateIds.indexOf(a.id) - candidateIds.indexOf(b.id)
    );

    const activities: TripDayActivity[] = selectedVillages.map(
      (village, idx) => {
        const slot = timeSlots[idx] || "Sore";
        const baseSpend =
          slot === "Siang" ? 185000 : slot === "Pagi" ? 140000 : 160000;
        const estimatedSpend =
          Math.round((baseSpend * spendMultiplier) / 5000) * 5000;

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
          activityTitle: `${slotActionPrefix} ${village.highlights.split(",")[0]}`,
          description: `Berkunjung ke ${village.name} di Kabupaten ${village.regency} untuk mengenal ${village.highlights.toLowerCase()} dan berbelanja langsung di ${village.localUmkm}.`,
          lat: village.lat,
          lng: village.lng,
          estimatedLocalSpendRp: estimatedSpend,
          antiOvertourismNote: PRIORITY_REGENCIES.has(village.regency)
            ? `Kabupaten prioritas pemerataan ${village.regency} (Bobot Spasial 1.0).`
            : `Jalur penghubung bebas macet di ${village.regency} menuju Bali Utara dan Timur.`,
          localUmkmSpot: village.localUmkm,
          capacityStatus: "OPTIMAL",
        };
      }
    );

    const anchorVillage =
      selectedVillages[selectedVillages.length - 1] || DESA_DATASET[0];
    const stayPrice = Math.round(
      anchorVillage.avgHomestayPrice * spendMultiplier
    );

    rawDays.push({
      dayNumber: d + 1,
      themeTitle: `Hari ${d + 1}: ${
        dayThemeTitles[gate]?.[d] || "Eksplorasi Desa Wisata Mandiri"
      }`,
      activities,
      recommendedStay: {
        name:
          budget === "Comfort"
            ? `${anchorVillage.name} Heritage Eco-Lodge`
            : `Pondok Warga Pokdarwis ${anchorVillage.name}`,
        type: budget === "Comfort" ? "Eco Lodge" : "Community Homestay",
        priceRangeRp: `${formatRupiah(stayPrice)} - ${formatRupiah(
          stayPrice + 60000
        )} / malam`,
        villageName: anchorVillage.name,
        regency: anchorVillage.regency,
      },
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

  return {
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
  };
}

export async function generateRedistributiveItinerary(
  request: TripRequest,
  skipExternalAi = false
): Promise<ItineraryResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  const gate = request.arrivalGate || "NgurahRaiAirport";

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

      const prompt = `Buat rencana perjalanan wisata desa Bali berdasarkan parameter berikut:
- Durasi: ${request.durationDays} hari
- Minat Wisatawan: ${request.interests.join(", ")}
- Kategori Anggaran: ${request.budgetCategory}
- Titik Kedatangan: ${ARRIVAL_GATES[gate].label} (${gate})

Dataset Desa Wisata Terverifikasi (HANYA gunakan desa dari daftar ini, jangan mengulang desa yang sama):
${JSON.stringify(compactDataset)}

Kembalikan JSON dengan struktur persis:
{
  "tripTitle": "string (Bahasa Indonesia)",
  "summaryNarrative": "string (Bahasa Indonesia, lugas dan faktual)",
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
            day.themeTitle || `Hari ${idx + 1}: Eksplorasi Desa Wisata`,
          activities: (day.activities || []).map((act, actIdx) => {
            let matchedVillage =
              DESA_BY_ID.get(act.villageId) ||
              DESA_DATASET.find(
                (v) => v.name.toLowerCase() === act.villageName?.toLowerCase()
              );

            // Prevent duplicate villages if LLM repeats an ID or hallucinates
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
          recommendedStay: day.recommendedStay || {
            name: "Homestay Koperasi Desa Wisata",
            type: "Community Homestay",
            priceRangeRp: "Rp 250.000 / malam",
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

        return {
          tripTitle:
            parsed.tripTitle ||
            `Rute Perjalanan ${request.durationDays} Hari Desa Bali`,
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
            arrivalGateLabel: ARRIVAL_GATES[gate].label,
            arrivalCoords: ARRIVAL_GATES[gate].coords,
          },
        };
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
      arrivalGateLabel: ARRIVAL_GATES[gate].label,
      arrivalCoords: ARRIVAL_GATES[gate].coords,
    },
  };
}
