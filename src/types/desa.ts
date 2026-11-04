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
}

