import desaWisataData from "../../data/desa-wisata.json";
import gdpShareData from "../../data/gdp-share.json";
import { DayItinerary, RegencySpendBreakdown, BudgetCategory } from "@/types/trip";
import { DesaWisata } from "@/types/desa";

export const DESA_DATASET = desaWisataData as DesaWisata[];

/**
 * Peta pencari DesaWisata tunggal berbasis ID untuk mencegah alokasi ulang Map di setiap fungsi
 */
export const DESA_BY_ID: ReadonlyMap<string, DesaWisata> = new Map(
  DESA_DATASET.map((d) => [d.id, d])
);

/**
 * Bobot Wilayah (W):
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
 * Dimuat secara terpusat dari data/gdp-share.json
 */
export const GDP_SHARE_DATA = gdpShareData;

export const BALI_BASELINE_SHARE: Record<
  string,
  {
    baselinePct: number;
    zone: string;
    isPriority: boolean;
    source?: string;
    year?: number;
    isDerived?: boolean;
  }
> = Object.fromEntries(
  Object.entries(gdpShareData.regencies).map(([reg, item]) => [
    reg,
    {
      baselinePct: item.value,
      zone: item.zone,
      isPriority: item.isPriority,
      source: item.source,
      year: item.year,
      isDerived: "isDerived" in item ? Boolean((item as Record<string, unknown>).isDerived) : false,
    },
  ])
);

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
 * Menghitung Spread Score (0 - 100):
 * Spread Score = ( (1 / N) * sum_{i=1}^{N} W(Regency_i) ) * 100
 */
export function calculateSpreadScore(regencies: string[]): number {
  if (!regencies || regencies.length === 0) return 0;
  const totalWeight = regencies.reduce(
    (sum, reg) => sum + getRegencyWeight(reg),
    0
  );
  const score = (totalWeight / regencies.length) * 100;
  return Math.round(score * 10) / 10;
}

/**
 * Menghitung Local Benefit Index (LBI %):
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

export function getDailyLogisticsOverheadRp(
  budgetCategory: BudgetCategory = "Moderate"
): number {
  switch (budgetCategory) {
    case "Backpacker":
      return 65000;
    case "Moderate":
      return 110000;
    case "Comfort":
      return 165000;
    default:
      return 100000;
  }
}

export function computeItineraryTelemetry(
  days: DayItinerary[],
  desaDataset: DesaWisata[] = DESA_DATASET,
  budgetCategory: BudgetCategory = "Moderate"
) {
  const lookup =
    desaDataset === DESA_DATASET
      ? DESA_BY_ID
      : new Map<string, DesaWisata>(desaDataset.map((d) => [d.id, d]));

  const allActivities = days.flatMap((d) => d.activities);
  const visitedRegencies = allActivities.map((a) => a.regency);

  const spreadScore = calculateSpreadScore(visitedRegencies);

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

      const desaInfo = lookup.get(act.villageId);
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

    const lastActivity = day.activities[day.activities.length - 1];
    const stayVillage = lastActivity
      ? lookup.get(lastActivity.villageId)
      : undefined;
    const stayRegency =
      day.recommendedStay?.regency || lastActivity?.regency || "Buleleng";

    const baseStayPrice =
      stayVillage?.avgHomestayPrice ||
      (budgetCategory === "Backpacker"
        ? 210000
        : budgetCategory === "Comfort"
        ? 360000
        : 270000);

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
  const totalLogisticsOverheadRp =
    days.length * getDailyLogisticsOverheadRp(budgetCategory);
  const totalEstimatedSpendRp = totalLocalRetainedRp + totalLogisticsOverheadRp;

  const localBenefitIndex = calculateLocalBenefitIndex(
    totalLocalRetainedRp,
    totalEstimatedSpendRp
  );

  const priorityCount = visitedRegencies.filter((r) =>
    Array.from(PRIORITY_REGENCIES).some((pr) =>
      r.toLowerCase().includes(pr.toLowerCase())
    )
  ).length;
  const priorityZonePercentage =
    visitedRegencies.length > 0
      ? Math.round((priorityCount / visitedRegencies.length) * 1000) / 10
      : 100;

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
 * Anti-Overtourism Capacity Quota Guard:
 * Memeriksa apakah destinasi dalam itinerary melampaui ambang kapasitas harian (>= 92% kuota)
 * dan secara otomatis menggeser rute ke desa penyangga (bufferVillageId) terdekat.
 */
export function applyAntiOvertourismCapacityGuard(
  days: DayItinerary[],
  desaDataset: DesaWisata[] = DESA_DATASET,
  forceSimulation = false
): DayItinerary[] {
  const lookup =
    desaDataset === DESA_DATASET
      ? DESA_BY_ID
      : new Map<string, DesaWisata>(desaDataset.map((d) => [d.id, d]));

  return days.map((day) => {
    const guardedActivities = day.activities.map((activity) => {
      const village = lookup.get(activity.villageId);
      if (!village) return activity;

      const quota = village.dailyQuota || 100;
      const load = village.currentSimulatedLoad || 45;
      const loadRatio = load / quota;

      const isOverCapacity =
        (loadRatio >= 0.92 || (forceSimulation && loadRatio >= 0.65)) &&
        village.bufferVillageId;

      if (isOverCapacity && village.bufferVillageId) {
        const bufferVillage = lookup.get(village.bufferVillageId);
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
            antiOvertourismNote: `Kuota harian ${village.name} mencapai ${pct}% (${load}/${quota} wisatawan). Rute digeser ke Desa Penyangga ${bufferVillage.name} (${Math.round(
              ((bufferVillage.currentSimulatedLoad || 25) /
                (bufferVillage.dailyQuota || 90)) *
                100
            )}% kapasitas) untuk menjaga kenyamanan kunjungan.`,
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
