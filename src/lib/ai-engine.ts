import { GoogleGenerativeAI } from "@google/generative-ai";
import desaWisataData from "../../data/desa-wisata.json";
import presetsFallbackData from "../../data/presets-fallback.json";
import { DesaWisata } from "@/types/desa";
import {
  TripRequest,
  ItineraryResponse,
  DayItinerary,
  TripDayActivity,
} from "@/types/trip";
import {
  applyAntiOvertourismCapacityGuard,
  computeItineraryTelemetry,
  PRIORITY_REGENCIES,
} from "@/lib/scoring";
import { formatRupiah } from "@/lib/utils";

const DESA_DATASET = desaWisataData as DesaWisata[];

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

export const SYSTEM_INSTRUCTION = `You are the Eco Traveler Redistribution Engine for Bali DigiFest 2026.
Your primary mission is to fight overtourism in South Bali (Sarbagita) and maximize economic distribution to North, East, and West Bali.

Guidelines:
1. ALWAYS prioritize tourist villages from the provided dataset located in Buleleng, Karangasem, Jembrana, and Bangli (at least 70% of activities MUST be in these priority regencies).
2. DO NOT route visitors to saturated hotspots (Kuta, Seminyak, Canggu) unless strictly needed for transit.
3. Structure realistic daily traveling sequences that minimize backtracking based on the arrivalGate.
4. Calculate realistic local spend allocations (Homestay, Local Warung, Community Guide) in Indonesian Rupiah.
5. Output MUST strictly match the specified JSON schema (valid JSON object only).`;

/**
 * Menghitung skor kecocokan sebuah Desa Wisata terhadap minat wisatawan
 */
function scoreVillageMatch(village: DesaWisata, interests: string[]): number {
  if (!interests || interests.length === 0) return 1;
  const normalizedInterests = interests.map((i) => i.toLowerCase());
  let matchCount = 0;

  for (const focus of village.focus) {
    if (normalizedInterests.includes(focus.toLowerCase())) {
      matchCount += 2;
    }
  }

  // Bonus jika berada di kabupaten prioritas pemerataan
  if (PRIORITY_REGENCIES.has(village.regency)) {
    matchCount += 1.5;
  }

  return matchCount;
}

/**
 * Menyusun aktivitas harian yang koheren secara geografis berdasarkan koridor wilayah
 */
function buildDeterministicItinerary(request: TripRequest): ItineraryResponse {
  const duration = Math.min(4, Math.max(1, Number(request.durationDays) || 3));
  const interests =
    request.interests && request.interests.length > 0
      ? request.interests
      : ["Culture", "Nature"];
  const budget = request.budgetCategory || "Moderate";
  const gate = request.arrivalGate || "NgurahRaiAirport";

  const spendMultiplier =
    budget === "Backpacker" ? 0.78 : budget === "Comfort" ? 1.38 : 1.0;

  // Definisikan koridor geografis bebas-backtracking sesuai pintu masuk
  const corridorSequence: string[][] =
    gate === "GilimanukPort"
      ? [
          // Hari 1: Bali Barat (Jembrana)
          ["desa-blimbingsari", "desa-ekasari", "desa-medewi", "desa-gumbrih"],
          // Hari 2: Bali Utara Barat & Tengah (Buleleng)
          ["desa-pejarakan", "desa-pemuteran", "desa-munduk", "desa-gobleg"],
          // Hari 3: Bali Utara Timur & Kaldera Bangli
          ["desa-ambengan", "desa-sudaji", "desa-sembiran", "desa-les"],
          // Hari 4: Kaldera Bangli & Bali Timur (Karangasem)
          [
            "desa-batur-selatan",
            "desa-trunyan",
            "desa-penglipuran",
            "desa-sidemen",
          ],
        ]
      : [
          // Hari 1: Transisi Tengah-Utara & Kaldera Bangli (atau Karangasem)
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
          // Hari 2: Bali Timur (Karangasem)
          [
            "desa-muncan",
            "desa-sidemen",
            "desa-sibetan",
            "desa-tenganan",
            "desa-budakeling",
          ],
          // Hari 3: Pesisir Timur ke Bali Utara (Karangasem -> Buleleng)
          [
            "desa-amed-purwakerti",
            "desa-tulamben",
            "desa-les",
            "desa-sembiran",
            "desa-sudaji",
          ],
          // Hari 4: Bali Utara Barat & Jembrana
          [
            "desa-ambengan",
            "desa-pemuteran",
            "desa-pejarakan",
            "desa-blimbingsari",
          ],
        ];

  const dayThemeTitles: Record<string, string[]> = {
    GilimanukPort: [
      "Koridor Harmoni Bali Barat & Agro-Kakao Jembrana",
      "Konservasi Terumbu Biorock & Kaldera Hujan Buleleng",
      "Jejak Subak Kuno & Pusaka Bali Aga Buleleng Timur",
      "Geopark Kaldera Batur & Lembah Tenun Karangasem",
    ],
    NgurahRaiAirport: [
      interests.includes("Agriculture")
        ? "Warisan Subak UNESCO & Hutan Kopi Pegunungan Utara"
        : "Pusaka Desa Adat Bangli & Kaldera Geopark Batur",
      "Lembah Tenun Sidemen & Agroforestri Kaki Gunung Agung",
      "Konservasi Pesisir Timur & Garam Piramida Buleleng",
      "Eksplorasi Biorock Pemuteran & Harmoni Barat Jembrana",
    ],
  };

  const desaMap = new Map<string, DesaWisata>(
    DESA_DATASET.map((d) => [d.id, d])
  );

  const timeSlots: ("Pagi" | "Siang" | "Sore")[] = ["Pagi", "Siang", "Sore"];

  const rawDays: DayItinerary[] = [];

  for (let d = 0; d < duration; d++) {
    const candidateIds = corridorSequence[d] || corridorSequence[0];
    const candidates = candidateIds
      .map((id) => desaMap.get(id))
      .filter((v): v is DesaWisata => Boolean(v));

    // Urutkan kandidat di dalam koridor berdasarkan kecocokan minat, lalu ambil 3 desa terbaik
    const ranked = [...candidates].sort(
      (a, b) => scoreVillageMatch(b, interests) - scoreVillageMatch(a, interests)
    );
    const selectedVillages = ranked.slice(0, 3);

    // Urutkan kembali sesuai urutan geografis di candidateIds agar tidak zig-zag
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
            ? "Eksplorasi Pagi & Edukasi Komunitas:"
            : slot === "Siang"
            ? "Lokakarya Warga & Kuliner UMKM:"
            : "Telusur Senja & Kearifan Lokal:";

        return {
          timeSlot: slot,
          villageId: village.id,
          villageName: village.name,
          regency: village.regency,
          activityTitle: `${slotActionPrefix} ${village.highlights.split(",")[0]}`,
          description: `Mengunjungi ${village.name} di Kabupaten ${village.regency} (${village.highlights}). Berinteraksi langsung dengan pelaku lokal (${village.localUmkm}) untuk memastikan perputaran ekonomi tinggal di desa.`,
          lat: village.lat,
          lng: village.lng,
          estimatedLocalSpendRp: estimatedSpend,
          antiOvertourismNote: PRIORITY_REGENCIES.has(village.regency)
            ? `Prioritas Pemerataan ${village.regency} (Bobot Spasial 1.0) — mengalihkan beban wisata dari koridor Sarbagita.`
            : `Zona Transisi Terkendali (${village.regency}) — penghubung bebas macet menuju Bali Utara/Timur.`,
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

  // Terapkan FR-06: Anti-Overtourism Capacity Quota Guard
  const guardedDays = applyAntiOvertourismCapacityGuard(
    rawDays,
    DESA_DATASET,
    Boolean(request.simulateCapacityAlert)
  );

  // Hitung metrik telemetri deterministik menggunakan src/lib/scoring.ts
  const metrics = computeItineraryTelemetry(guardedDays, DESA_DATASET, budget);

  // Kumpulkan panduan adat kontekstual dari desa-desa yang dikunjungi
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
      ruleTitle: "Etika Ekologi Subak, Hutan Adat & Konservasi Pesisir",
      description: visitedVillages
        .map((v) => `${v.name} (${v.regency}): ${v.customsNote}`)
        .slice(0, 4)
        .join(" • "),
      applicableVillages: visitedVillages.map((v) => v.name),
      category: "Ekologi Subak & Laut" as const,
    },
  ];

  const interestLabels: Record<string, string> = {
    Nature: "Alam & Konservasi",
    Culture: "Seni & Budaya Luhur",
    Wellness: "Kebugaran & Ekowisata",
    Culinary: "Kuliner Tradisional",
    Agriculture: "Agroturisme Subak",
  };
  const focusSummary = interests
    .map((i) => interestLabels[i] || i)
    .join(", ");

  return {
    tripTitle: `Rute Redistributif ${duration} Hari: ${
      gate === "GilimanukPort"
        ? "Lintas Barat Jembrana & Pesisir Utara Buleleng"
        : "Eksplorasi Pusaka Bangli, Karangasem & Buleleng"
    }`,
    summaryNarrative: `Rencana perjalanan ${duration} hari dari ${
      ARRIVAL_GATES[gate].label
    } ini dirancang khusus untuk mendistribusikan manfaat ekonomi keluar dari kawasan padat Bali Selatan. Mengutamakan minat ${focusSummary} dengan Spread Score ${
      metrics.spreadScore
    }/100 dan Local Benefit Index ${
      metrics.localBenefitIndex
    }% yang mengalir langsung ke homestay warga, koperasi subak, dan UMKM desa di ${metrics.primaryRegenciesBenefited.join(
      ", "
    )}.`,
    days: guardedDays,
    metrics,
    culturalEtiquette,
  };
}

/**
 * Fungsi utama perencana rute:
 * Mencoba memanggil Google Gemini 1.5 Flash terlebih dahulu jika GEMINI_API_KEY tersedia,
 * kemudian menormalisasi koordinat GPS dan menghitung metrik secara deterministik.
 * Jika API key tidak ada atau terjadi kendala jaringan/kuota, otomatis beralih ke Deterministic Fallback.
 */
export async function generateRedistributiveItinerary(
  request: TripRequest
): Promise<ItineraryResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  const gate = request.arrivalGate || "NgurahRaiAirport";

  // Jika GEMINI_API_KEY tersedia, panggil Google Gemini Flash
  if (apiKey && apiKey.length > 10) {
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

      const prompt = `Buat rencana perjalanan Eco Traveler Bali berdasarkan parameter berikut:
- Durasi: ${request.durationDays} hari
- Minat Wisatawan: ${request.interests.join(", ")}
- Kategori Anggaran: ${request.budgetCategory}
- Titik Kedatangan: ${ARRIVAL_GATES[gate].label} (${gate})

Dataset Desa Wisata Terverifikasi (HANYA gunakan desa dari daftar ini):
${JSON.stringify(compactDataset)}

Kembalikan JSON dengan struktur persis:
{
  "tripTitle": "string (Bahasa Indonesia)",
  "summaryNarrative": "string (Bahasa Indonesia, jelaskan dampak redistribusi ekonomi)",
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

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as Partial<ItineraryResponse>;

      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        const desaMap = new Map<string, DesaWisata>(
          DESA_DATASET.map((d) => [d.id, d])
        );

        // Sinkronisasi koordinat GPS dan regency dengan dataset resmi
        const syncedDays: DayItinerary[] = parsed.days.map((day, idx) => ({
          dayNumber: day.dayNumber || idx + 1,
          themeTitle: day.themeTitle || `Hari ${idx + 1}: Eksplorasi Desa Wisata`,
          activities: (day.activities || []).map((act) => {
            const matchedVillage =
              desaMap.get(act.villageId) ||
              DESA_DATASET.find(
                (v) => v.name.toLowerCase() === act.villageName?.toLowerCase()
              ) ||
              DESA_DATASET[0];

            return {
              ...act,
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
            `Ekspedisi Redistributif ${request.durationDays} Hari Bali`,
          summaryNarrative:
            parsed.summaryNarrative ||
            "Rute cerdas yang memprioritaskan pemerataan ekonomi ke desa wisata luar Bali Selatan.",
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

  // Deterministic Failover Engine (Zero-Crash Mode <= 100ms)
  const fallbackResult = buildDeterministicItinerary(request);

  return {
    ...fallbackResult,
    engineMeta: {
      source: "deterministic-fallback",
      modelUsed: "EcoTraveler Heuristic Spatial Engine v1.0 (Preset + Curated Graph)",
      latencyMs: Math.max(12, Date.now() - startTime),
      arrivalGateLabel: ARRIVAL_GATES[gate].label,
      arrivalCoords: ARRIVAL_GATES[gate].coords,
    },
  };
}

