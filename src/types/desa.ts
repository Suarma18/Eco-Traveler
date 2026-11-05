export type BaliRegency =
  | "Buleleng"
  | "Karangasem"
  | "Jembrana"
  | "Bangli"
  | "Klungkung"
  | "Tabanan"
  | "Gianyar"
  | "Badung"
  | "Denpasar";

export type BaliZone =
  | "North"
  | "East"
  | "West"
  | "Central-North"
  | "Central"
  | "South";

export type TourismFocus =
  | "Nature"
  | "Culture"
  | "Wellness"
  | "Culinary"
  | "Agriculture";

export type AccommodationType =
  | "Homestay Warga"
  | "Eco Lodge"
  | "Bamboo Villa"
  | "Pondok Desa";

export interface LocalAccommodation {
  id: string;
  name: string;
  nameEn?: string;
  type: AccommodationType;
  pricePerNightRp: number;
  lat: number;
  lng: number;
  features: string[];
  featuresEn?: string[];
  bookingNote?: string;
  bookingNoteEn?: string;
}

export type AttractionCategory =
  | "Air Terjun"
  | "Pura & Budaya"
  | "Trekking & Viewpoint"
  | "Pantai & Pesisir"
  | "Agrowisata";

export interface NearbyAttraction {
  id: string;
  name: string;
  nameEn?: string;
  category: AttractionCategory;
  distanceKm: number;
  durationMinutes: number;
  lat: number;
  lng: number;
  description: string;
  descriptionEn?: string;
  highlights: string;
  highlightsEn?: string;
}

export interface DesaWisata {
  id: string;
  name: string;
  regency: BaliRegency;
  zone: BaliZone;
  lat: number;
  lng: number;
  focus: TourismFocus[];
  highlights: string;
  avgHomestayPrice: number;
  localUmkm: string;
  customsNote: string;
  dressCode?: string;
  sacredDaysNote?: string;
  dailyQuota?: number;
  currentSimulatedLoad?: number;
  bufferVillageId?: string;
  elevationMeters?: number;
  accommodations?: LocalAccommodation[];
  nearbyAttractions?: NearbyAttraction[];
}

