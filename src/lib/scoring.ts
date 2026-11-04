import { DayItinerary, RegencySpendBreakdown, BudgetCategory } from "@/types/trip";
import { DesaWisata } from "@/types/desa";

/**
 * Bobot Wilayah (W) berdasarkan PRD FR-04:
 * - Badung & Denpasar = 0.2 (Pusat Konsentrasi Sarbagita Inti)
 * - Gianyar & Tabanan = 0.5 (Zona Transisi)
 * - Buleleng, Karangasem, Jembrana, Bangli = 1.0 (Prioritas Pemerataan)
 */
export const REGENCY_WEIGHTS: Record<string, number> = {
  Badung: 0.2,
  Denpasar: 0.2,
  Gianyar: 0.5,
  Tabanan: 0.5,
  Buleleng: 1.0,
  Karangasem: 1.0,
  Jembrana: 1.0,
  Bangli: 1.0,
  Klungkung: 1.0,
};

export const PRIORITY_REGENCIES = new Set([
  "Buleleng",
  "Karangasem",
  "Jembrana",
  "Bangli",
]);

/**
 * Baseline distribusi PDRB Akomodasi & Makan Minum Bali (BPS Provinsi Bali):
 * Kawasan Sarbagita (Badung, Denpasar, Gianyar, Tabanan) menguasai ~65.88% PDRB Bali.
 */
export const BALI_BASELINE_SHARE: Record<string, { baselinePct: number; zone: string; isPriority: boolean }> = {
  Badung: { baselinePct: 38.4, zone: "Bali Selatan (Pusat)", isPriority: false },
  Denpasar: { baselinePct: 14.2, zone: "Bali Selatan (Pusat)", isPriority: false },
  Gianyar: { baselinePct: 8.58, zone: "Zona Transisi", isPriority: false },
  Tabanan: { baselinePct: 4.7, zone: "Zona Transisi", isPriority: false },
  Buleleng: { baselinePct: 11.4, zone: "Bali Utara (Prioritas)", isPriority: true },
  Karangasem: { baselinePct: 7.8, zone: "Bali Timur (Prioritas)", isPriority: true },
  Bangli: { baselinePct: 6.1, zone: "Bali Tengah-Utara (Prioritas)", isPriority: true },
  Jembrana: { baselinePct: 5.32, zone: "Bali Barat (Prioritas)", isPriority: true },
  Klungkung: { baselinePct: 3.5, zone: "Kepulauan & Timur", isPriority: true },
};

/**
 * Mendapatkan bobot wilayah W(Regency_i) sesuai PRD FR-04
 */
export function getRegencyWeight(regency: string): number {
  const normalized = regency.trim();
  for (const [key, weight] of Object.entries(REGENCY_WEIGHTS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return weight;
    }
  }
  return 0.5;
}

/**
 * Menghitung Spread Score (0 - 100) sesuai formula matematis PRD FR-04:
 * Spread Score = ( (1 / N) * sum_{i=1}^{N} W(Regency_i) ) * 100
 */
export function calculateSpreadScore(regencies: string[]): number {
  if (!regencies || regencies.length === 0) return 0;
  const totalWeight = regencies.reduce((sum, reg) => sum + getRegencyWeight(reg), 0);
  const score = (totalWeight / regencies.length) * 100;
  return Math.round(score * 10) / 10;
}

/**
 * Menghitung Local Benefit Index (LBI %) sesuai formula matematis PRD FR-04:
 * LBI = (Estimasi Belanja Homestay + Warung + Guide Lokal) / Total Estimasi Biaya Harian * 100%
 */
export function calculateLocalBenefitIndex(
  localRetainedSpendRp: number,
  totalEstimatedSpendRp: number
): number {
  if (totalEstimatedSpendRp <= 0) return 0;
  const lbi = (localRetainedSpendRp / totalEstimatedSpendRp) * 100;
  return Math.min(100, Math.round(lbi * 10) / 10);
}

/**
 * Estimasi biaya harian non-lokal (transportasi antarkabupaten/BBM/logistik) berdasarkan kategori budget
 */
export function getDailyLogisticsOverheadRp(
  budgetCategory: BudgetCategory = "Moderate"
): number {
  switch (budgetCategory) {
    case "Backpacker":
      return 65000; // Sewa motor lokal & BBM harian
    case "Moderate":
      return 110000; // Transportasi berbagi / driver lokal desa
    case "Comfort":
      return 165000; // Kendaraan privat ramah lingkungan & logistik
    default:
      return 100000;
  }
}

/**
 * Kalkulasi komprehensif seluruh metrik telemetri dari daftar DayItinerary
 */
export function computeItineraryTelemetry(
  days: DayItinerary[],
  desaDataset: DesaWisata[],
  budgetCategory: BudgetCategory = "Moderate"
) {
  const desaMap = new Map<string, DesaWisata>(desaDataset.map((d) => [d.id, d]));

  const allActivities = days.flatMap((d) => d.activities);
  const visitedRegencies = allActivities.map((a) => a.regency);

  // 1. Spread Score
  const spreadScore = calculateSpreadScore(visitedRegencies);

  // 2. Hitung belanja aktivitas langsung ke UMKM/warga + biaya menginap homestay/ecolodge warga
  let activityLocalSpendRp = 0;
  let homestayLocalSpendRp = 0;
  let capacityRedirectsCount = 0;

  const regencySpendMap = new Map<
    string,
    { visitCount: number; spendRp: number; zone: string; weight: number }
  >();

  for (const day of days) {
    for (const act of day.activities) {
      const spend = Math.max(50000, Number(act.estimatedLocalSpendRp) || 150000);
      activityLocalSpendRp += spend;

      if (act.capacityStatus === "REDIRECTED_BUFFER") {
        capacityRedirectsCount += 1;
      }

      const desaInfo = desaMap.get(act.villageId);
      const zone = desaInfo?.zone || "North";
      const weight = getRegencyWeight(act.regency);

      const prev = regencySpendMap.get(act.regency) || {
        visitCount: 0,
        spendRp: 0,
        zone,
        weight,
      };
      regencySpendMap.set(act.regency, {
        visitCount: prev.visitCount + 1,
        spendRp: prev.spendRp + spend,
        zone,
        weight,
      });
    }

    // Tambahkan belanja Homestay/Eco-Lodge ke kabupaten tempat menginap hari tersebut
    const lastActivity = day.activities[day.activities.length - 1];
    const stayVillage = lastActivity ? desaMap.get(lastActivity.villageId) : undefined;
    const stayRegency = day.recommendedStay?.regency || lastActivity?.regency || "Buleleng";

    const baseStayPrice =
      stayVillage?.avgHomestayPrice ||
      (budgetCategory === "Backpacker"
        ? 210000
        : budgetCategory === "Comfort"
        ? 360000
        : 270000);

    // Homestay warga menahan ~92% pendapatan di desa; Eco-Lodge lokal menahan ~85%
    const retentionFactor =
      day.recommendedStay?.type === "Community Homestay" ? 0.94 : 0.86;
    const retainedStayRp = Math.round(baseStayPrice * retentionFactor);
    homestayLocalSpendRp += retainedStayRp;

    const prevReg = regencySpendMap.get(stayRegency) || {
      visitCount: 0,
      spendRp: 0,
      zone: stayVillage?.zone || "North",
      weight: getRegencyWeight(stayRegency),
    };
    regencySpendMap.set(stayRegency, {
      ...prevReg,
      spendRp: prevReg.spendRp + retainedStayRp,
    });
  }

  const totalLocalRetainedRp = activityLocalSpendRp + homestayLocalSpendRp;
  const totalLogisticsOverheadRp = days.length * getDailyLogisticsOverheadRp(budgetCategory);
  const totalEstimatedSpendRp = totalLocalRetainedRp + totalLogisticsOverheadRp;

  // 3. Local Benefit Index (LBI)
  const localBenefitIndex = calculateLocalBenefitIndex(
    totalLocalRetainedRp,
    totalEstimatedSpendRp
  );

  // 4. Persentase durasi di kabupaten prioritas (Buleleng, Karangasem, Jembrana, Bangli)
  const priorityCount = visitedRegencies.filter((r) =>
    Array.from(PRIORITY_REGENCIES).some((pr) =>
      r.toLowerCase().includes(pr.toLowerCase())
    )
  ).length;
  const priorityZonePercentage =
    visitedRegencies.length > 0
      ? Math.round((priorityCount / visitedRegencies.length) * 1000) / 10
      : 100;

  // 5. Breakdown per Kabupaten
  const regencyBreakdown: RegencySpendBreakdown[] = Array.from(
    regencySpendMap.entries()
  )
    .map(([regency, info]) => ({
      regency,
      zone: info.zone,
      weight: info.weight,
      visitCount: info.visitCount,
      estimatedSpendRp: info.spendRp,
      sharePercentage:
        totalLocalRetainedRp > 0
          ? Math.round((info.spendRp / totalLocalRetainedRp) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.estimatedSpendRp - a.estimatedSpendRp);

  const primaryRegenciesBenefited = regencyBreakdown.map((r) => r.regency);

  return {
    spreadScore,
    localBenefitIndex,
    totalEstimatedSpendRp,
    totalLocalRetainedRp,
    primaryRegenciesBenefited,
    priorityZonePercentage,
    capacityRedirectsCount,
    regencyBreakdown,
  };
}

/**
 * FR-06: Anti-Overtourism Capacity Quota Guard
 * Memeriksa apakah destinasi dalam itinerary melampaui ambang kapasitas harian (>= 92% kuota)
 * dan secara otomatis menggeser rute ke desa penyangga (bufferVillageId) terdekat.
 */
export function applyAntiOvertourismCapacityGuard(
  days: DayItinerary[],
  desaDataset: DesaWisata[],
  forceSimulation = false
): DayItinerary[] {
  const desaMap = new Map<string, DesaWisata>(desaDataset.map((d) => [d.id, d]));

  return days.map((day) => {
    const guardedActivities = day.activities.map((activity) => {
      const village = desaMap.get(activity.villageId);
      if (!village) return activity;

      const quota = village.dailyQuota || 100;
      const load = village.currentSimulatedLoad || 45;
      const loadRatio = load / quota;

      // Jika kapasitas >= 92% (seperti Penglipuran 148/150 atau Tenganan 115/120) dan memiliki bufferVillageId
      const isOverCapacity =
        (loadRatio >= 0.92 || (forceSimulation && loadRatio >= 0.65)) &&
        village.bufferVillageId;

      if (isOverCapacity && village.bufferVillageId) {
        const bufferVillage = desaMap.get(village.bufferVillageId);
        if (bufferVillage) {
          const pct = Math.round(loadRatio * 100);
          return {
            ...activity,
            villageId: bufferVillage.id,
            villageName: bufferVillage.name,
            regency: bufferVillage.regency,
            lat: bufferVillage.lat,
            lng: bufferVillage.lng,
            localUmkmSpot: bufferVillage.localUmkm,
            capacityStatus: "REDIRECTED_BUFFER" as const,
            originalSaturatedVillage: village.name,
            antiOvertourismNote: `CAPACITY GUARD AKTIF: Kuota harian ${village.name} mencapai ${pct}% (${load}/${quota} wisatawan). Rute otomatis digeser ke Desa Penyangga ${bufferVillage.name} (${Math.round(
              ((bufferVillage.currentSimulatedLoad || 25) /
                (bufferVillage.dailyQuota || 90)) *
                100
            )}% kapasitas) untuk mencegah overtourism.`,
          };
        }
      }

      return {
        ...activity,
        capacityStatus:
          activity.capacityStatus ||
          (loadRatio >= 0.7 ? "MODERATE" : "OPTIMAL"),
      };
    });

    return {
      ...day,
      activities: guardedActivities,
    };
  });
}

