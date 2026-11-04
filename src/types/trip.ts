export type BudgetCategory = "Backpacker" | "Moderate" | "Comfort";
export type ArrivalGate = "NgurahRaiAirport" | "GilimanukPort";
export type TimeSlot = "Pagi" | "Siang" | "Sore" | "Malam";
export type AppLocale = "id" | "en";

export interface TripRequest {
  durationDays: number; // 1, 2, 3, atau 4
  interests: string[]; // ["Culture", "Nature", "Wellness", "Culinary", "Agriculture"]
  budgetCategory: BudgetCategory;
  arrivalGate: ArrivalGate;
  simulateCapacityAlert?: boolean;
  locale?: AppLocale;
}

export interface TripDayActivity {
  timeSlot: TimeSlot;
  villageId: string;
  villageName: string;
  regency: string;
  activityTitle: string;
  description: string;
  lat: number;
  lng: number;
  estimatedLocalSpendRp: number;
  antiOvertourismNote: string;
  localUmkmSpot?: string;
  capacityStatus?: "OPTIMAL" | "MODERATE" | "REDIRECTED_BUFFER";
  originalSaturatedVillage?: string;
}

export interface DayItinerary {
  dayNumber: number;
  themeTitle: string;
  activities: TripDayActivity[];
  recommendedStay: {
    name: string;
    type: "Community Homestay" | "Eco Lodge";
    priceRangeRp: string;
    villageName?: string;
    regency?: string;
  };
}

export interface RegencySpendBreakdown {
  regency: string;
  zone: string;
  weight: number;
  visitCount: number;
  estimatedSpendRp: number;
  sharePercentage: number;
}

export interface ItineraryResponse {
  tripTitle: string;
  summaryNarrative: string;
  days: DayItinerary[];
  metrics: {
    spreadScore: number;
    localBenefitIndex: number;
    totalEstimatedSpendRp: number;
    totalLocalRetainedRp: number;
    primaryRegenciesBenefited: string[];
    priorityZonePercentage?: number;
    capacityRedirectsCount?: number;
    regencyBreakdown?: RegencySpendBreakdown[];
  };
  culturalEtiquette: {
    ruleTitle: string;
    description: string;
    applicableVillages: string[];
    category?: string;
  }[];
  engineMeta?: {
    source: "gemini-ai" | "deterministic-fallback";
    modelUsed: string;
    latencyMs: number;
    arrivalGateLabel: string;
    arrivalCoords: [number, number];
  };
}
