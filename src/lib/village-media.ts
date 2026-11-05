import { DesaWisata } from "@/types/desa";
import { DESA_BY_ID } from "@/lib/scoring";
import { Locale } from "@/lib/utils";

export interface VillageVisualMeta {
  imageUrl: string;
  altText: string;
  landscapeTag: string;
  elevationLabel: string;
  quotaPercentage: number;
  quotaLabel: string;
  imageCredit?: string;
  isIllustration: boolean;
}

export type VillageThemeCategory =
  | "terraces"
  | "craft"
  | "reef"
  | "salt"
  | "heritage"
  | "caldera"
  | "agro"
  | "forest";

interface VillageVisualDefinition {
  category: VillageThemeCategory;
  tagId: string;
  tagEn: string;
  colorA: string;
  colorB: string;
  accent: string;
}

const VILLAGE_DEFINITIONS: Record<string, VillageVisualDefinition> = {
  "desa-pemuteran": {
    category: "reef",
    tagId: "Konservasi Terumbu Biorock",
    tagEn: "Biorock Coral Conservation",
    colorA: "#0B2626",
    colorB: "#144D4B",
    accent: "#2DD4BF",
  },
  "desa-sudaji": {
    category: "terraces",
    tagId: "Lembah Subak & Agroforestri",
    tagEn: "Subak Valley & Agroforestry",
    colorA: "#0D261C",
    colorB: "#1A4D37",
    accent: "#34D399",
  },
  "desa-sidemen": {
    category: "craft",
    tagId: "Lembah Tenun & Kaki Gunung Agung",
    tagEn: "Weaving Valley & Mount Agung Foothills",
    colorA: "#2B1612",
    colorB: "#52251B",
    accent: "#FB923C",
  },
  "desa-penglipuran": {
    category: "heritage",
    tagId: "Tata Ruang Adat & Hutan Bambu",
    tagEn: "Heritage Spatial Layout & Bamboo Forest",
    colorA: "#1A2616",
    colorB: "#334D28",
    accent: "#A3E635",
  },
  "desa-blimbingsari": {
    category: "agro",
    tagId: "Harmoni Budaya & Agro Kakao",
    tagEn: "Cultural Harmony & Cacao Groves",
    colorA: "#261A12",
    colorB: "#4D3422",
    accent: "#FBBF24",
  },
  "desa-munduk": {
    category: "caldera",
    tagId: "Kabut Pegunungan & Kebun Cengkeh",
    tagEn: "Highland Mist & Clove Plantations",
    colorA: "#132126",
    colorB: "#23404A",
    accent: "#38BDF8",
  },
  "desa-les": {
    category: "salt",
    tagId: "Pesisir Garam Palung & Karang",
    tagEn: "Sea Salt Troughs & Reef Restoration",
    colorA: "#1C2429",
    colorB: "#2F3E47",
    accent: "#94A3B8",
  },
  "desa-sembiran": {
    category: "heritage",
    tagId: "Pusaka Megalitikum Bali Aga",
    tagEn: "Megalithic Bali Aga Heritage",
    colorA: "#211D17",
    colorB: "#3D3629",
    accent: "#D97706",
  },
  "desa-pejarakan": {
    category: "forest",
    tagId: "Hutan Mangrove & Teluk Menjangan",
    tagEn: "Mangrove Forest & Menjangan Bay",
    colorA: "#0F2821",
    colorB: "#1B473A",
    accent: "#4ADE80",
  },
  "desa-ambengan": {
    category: "terraces",
    tagId: "Terasering Jembong & Air Terjun",
    tagEn: "Jembong Terraces & Waterfalls",
    colorA: "#0B261A",
    colorB: "#164B34",
    accent: "#6EE7B7",
  },
  "desa-gobleg": {
    category: "caldera",
    tagId: "Kaldera Danau Tamblingan",
    tagEn: "Lake Tamblingan Caldera Forest",
    colorA: "#10232B",
    colorB: "#1E3F4C",
    accent: "#7DD3FC",
  },
  "desa-tenganan": {
    category: "craft",
    tagId: "Tenun Ikat Ganda Gringsing",
    tagEn: "Gringsing Double-Ikat Weaving",
    colorA: "#2B1414",
    colorB: "#542323",
    accent: "#F87171",
  },
  "desa-amed-purwakerti": {
    category: "reef",
    tagId: "Teluk Jemeluk & Garam IG Amed",
    tagEn: "Jemeluk Bay & Artisanal Amed Salt",
    colorA: "#0E242B",
    colorB: "#1B4754",
    accent: "#38BDF8",
  },
  "desa-tulamben": {
    category: "reef",
    tagId: "Ekosistem Laut & Porter Wanita",
    tagEn: "Marine Sanctuary & Women Dive Porters",
    colorA: "#0A2128",
    colorB: "#163E4B",
    accent: "#22D3EE",
  },
  "desa-sibetan": {
    category: "agro",
    tagId: "Agroforestri 14 Varietas Salak",
    tagEn: "Heritage Salak Agroforestry",
    colorA: "#241812",
    colorB: "#472F22",
    accent: "#F59E0B",
  },
  "desa-budakeling": {
    category: "craft",
    tagId: "Tradisi Siwa-Buddha & Kriya Perak",
    tagEn: "Siwa-Buddha Tradition & Silver Craft",
    colorA: "#26231A",
    colorB: "#4A4330",
    accent: "#E2E8F0",
  },
  "desa-muncan": {
    category: "terraces",
    tagId: "Sawah Beras Merah Vulkanik",
    tagEn: "Volcanic Red Rice Terraces",
    colorA: "#122818",
    colorB: "#234C2C",
    accent: "#86EFAC",
  },
  "desa-timbrah": {
    category: "heritage",
    tagId: "Arsitektur Balai Adat Bali Aga",
    tagEn: "Ancient Bali Aga Pavilion",
    colorA: "#241A17",
    colorB: "#45312B",
    accent: "#FDBA74",
  },
  "desa-trunyan": {
    category: "caldera",
    tagId: "Dermaga Danau Batur & Bali Mula",
    tagEn: "Lake Batur Pier & Bali Mula Heritage",
    colorA: "#141D26",
    colorB: "#253647",
    accent: "#93C5FD",
  },
  "desa-undisan": {
    category: "forest",
    tagId: "Lembah Sungai Jinah & Desa Penyangga",
    tagEn: "Jinah River Valley & Buffer Village",
    colorA: "#0F281E",
    colorB: "#1F513C",
    accent: "#5EEAD4",
  },
  "desa-batur-selatan": {
    category: "caldera",
    tagId: "UNESCO Global Geopark Batur",
    tagEn: "UNESCO Global Geopark Batur",
    colorA: "#1B2329",
    colorB: "#313F4A",
    accent: "#CBD5E1",
  },
  "desa-ekasari": {
    category: "agro",
    tagId: "Danau Palasari & Kakao Fermentasi",
    tagEn: "Palasari Basin & Fermented Cacao",
    colorA: "#1C2417",
    colorB: "#35452B",
    accent: "#BEF264",
  },
  "desa-medewi": {
    category: "reef",
    tagId: "Pesisir Eco-Surfing & Lawar Klungah",
    tagEn: "Coastal Surf Point & Coconut Cuisine",
    colorA: "#0C2329",
    colorB: "#174450",
    accent: "#67E8F9",
  },
  "desa-gumbrih": {
    category: "forest",
    tagId: "Gamelan Jegog Bambu & Konservasi",
    tagEn: "Bamboo Jegog Gamelan & Conservation",
    colorA: "#172619",
    colorB: "#2C4A2F",
    accent: "#A7F3D0",
  },
  "desa-jatiluwih": {
    category: "terraces",
    tagId: "Warisan Dunia Subak UNESCO",
    tagEn: "UNESCO World Heritage Subak",
    colorA: "#0B2618",
    colorB: "#164A2F",
    accent: "#34D399",
  },
  "desa-wongaya-gede": {
    category: "forest",
    tagId: "Hutan Hujan Pura Luhur Batukaru",
    tagEn: "Mount Batukaru Sanctuary Forest",
    colorA: "#0C241B",
    colorB: "#164532",
    accent: "#4ADE80",
  },
  "desa-taro": {
    category: "forest",
    tagId: "Konservasi Lembu Putih Suci",
    tagEn: "Sacred White Cattle Sanctuary",
    colorA: "#1C241E",
    colorB: "#334537",
    accent: "#F1F5F9",
  },
  "desa-carangsari": {
    category: "heritage",
    tagId: "Lembah Tukad Ayung & Pusaka Sejarah",
    tagEn: "Ayung River Valley & Historical Site",
    colorA: "#241D17",
    colorB: "#47382B",
    accent: "#FCD34D",
  },
};

function getCategoryVectorGraphic(
  category: VillageThemeCategory,
  accent: string
): string {
  switch (category) {
    case "terraces":
      return `
        <path d="M 0,260 Q 150,220 300,240 T 600,220 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.25"/>
        <path d="M 0,290 Q 180,260 360,280 T 600,260 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.35"/>
        <path d="M 0,330 Q 220,300 420,320 T 600,310 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.5"/>
        <circle cx="480" cy="90" r="38" fill="${accent}" fill-opacity="0.18"/>
      `;
    case "craft":
      return `
        <path d="M 100,50 L 300,250 L 100,350 Z" fill="${accent}" fill-opacity="0.12"/>
        <path d="M 300,50 L 500,250 L 300,350 Z" fill="${accent}" fill-opacity="0.18"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="${accent}" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
        <line x1="0" y1="240" x2="600" y2="240" stroke="${accent}" stroke-width="2" stroke-dasharray="12 6" opacity="0.5"/>
        <line x1="0" y1="280" x2="600" y2="280" stroke="${accent}" stroke-width="3" opacity="0.6"/>
      `;
    case "reef":
      return `
        <path d="M 0,220 Q 150,180 300,220 T 600,200 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.2"/>
        <path d="M 0,270 Q 180,240 360,280 T 600,260 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.35"/>
        <path d="M 0,320 Q 120,300 280,330 T 600,310 L 600,400 L 0,400 Z" fill="${accent}" fill-opacity="0.5"/>
        <circle cx="280" cy="140" r="6" fill="${accent}" opacity="0.6"/>
        <circle cx="340" cy="110" r="10" fill="${accent}" opacity="0.5"/>
        <circle cx="380" cy="160" r="4" fill="${accent}" opacity="0.7"/>
      `;
    case "salt":
      return `
        <polygon points="120,300 180,180 240,300" fill="${accent}" fill-opacity="0.3"/>
        <polygon points="260,320 340,160 420,320" fill="${accent}" fill-opacity="0.45"/>
        <polygon points="430,310 490,200 550,310" fill="${accent}" fill-opacity="0.25"/>
        <line x1="0" y1="320" x2="600" y2="320" stroke="${accent}" stroke-width="4" opacity="0.6"/>
      `;
    case "heritage":
      return `
        <polygon points="300,70 330,120 270,120" fill="${accent}" fill-opacity="0.5"/>
        <polygon points="300,110 360,180 240,180" fill="${accent}" fill-opacity="0.4"/>
        <polygon points="300,160 400,250 200,250" fill="${accent}" fill-opacity="0.3"/>
        <rect x="230" y="250" width="140" height="150" fill="${accent}" fill-opacity="0.2"/>
      `;
    case "caldera":
      return `
        <polygon points="0,320 180,110 380,320" fill="${accent}" fill-opacity="0.25"/>
        <polygon points="240,320 440,80 600,320" fill="${accent}" fill-opacity="0.35"/>
        <ellipse cx="300" cy="340" rx="260" ry="40" fill="${accent}" fill-opacity="0.4"/>
      `;
    case "agro":
      return `
        <path d="M 300,100 C 380,120 420,220 300,320 C 180,220 220,120 300,100 Z" fill="${accent}" fill-opacity="0.35"/>
        <line x1="300" y1="120" x2="300" y2="310" stroke="${accent}" stroke-width="3" opacity="0.6"/>
        <line x1="300" y1="180" x2="350" y2="150" stroke="${accent}" stroke-width="2" opacity="0.6"/>
        <line x1="300" y1="220" x2="250" y2="190" stroke="${accent}" stroke-width="2" opacity="0.6"/>
      `;
    case "forest":
    default:
      return `
        <polygon points="120,330 180,150 240,330" fill="${accent}" fill-opacity="0.3"/>
        <polygon points="280,330 350,110 420,330" fill="${accent}" fill-opacity="0.4"/>
        <polygon points="440,330 500,170 560,330" fill="${accent}" fill-opacity="0.25"/>
        <rect x="0" y="320" width="600" height="80" fill="${accent}" fill-opacity="0.4"/>
      `;
  }
}

export function generateVillageSvgPlaceholder(
  villageId: string,
  villageName: string,
  regency: string
): string {
  const def = VILLAGE_DEFINITIONS[villageId] || {
    category: "forest" as const,
    tagId: "Desa Wisata Mandiri",
    tagEn: "Community Tourism Village",
    colorA: "#0D261C",
    colorB: "#1A4D37",
    accent: "#34D399",
  };

  const vectorShapes = getCategoryVectorGraphic(def.category, def.accent);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bg_${villageId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${def.colorA}"/>
      <stop offset="100%" stop-color="${def.colorB}"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="600" height="400" fill="url(#bg_${villageId})"/>

  <!-- Category Graphic -->
  <g>${vectorShapes}</g>

  <!-- Shading overlay -->
  <rect width="600" height="400" fill="url(#overlay)"/>

  <!-- Typographic Badge -->
  <g transform="translate(32, 40)">
    <rect x="0" y="0" width="160" height="24" rx="6" fill="${def.accent}" fill-opacity="0.2" stroke="${def.accent}" stroke-width="1"/>
    <text x="12" y="16" fill="${def.accent}" font-family="monospace, sans-serif" font-size="11" font-weight="700" letter-spacing="1">ILUSTRASI RESMI</text>
  </g>

  <g transform="translate(32, 345)">
    <text x="0" y="0" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" letter-spacing="-0.5">${villageName}</text>
    <text x="0" y="22" fill="${def.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">Kabupaten ${regency} · ${def.tagId}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Preset Illustrations (Zero stock photo duplication)
export const PRESET_1_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <defs>
    <linearGradient id="p1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2B1612"/>
      <stop offset="100%" stop-color="#52251B"/>
    </linearGradient>
  </defs>
  <rect width="300" height="200" fill="url(#p1)"/>
  <polygon points="40,160 140,60 220,160" fill="#FB923C" fill-opacity="0.35"/>
  <polygon points="120,160 210,70 290,160" fill="#FB923C" fill-opacity="0.2"/>
  <text x="16" y="176" fill="#FDBA74" font-family="system-ui, sans-serif" font-size="12" font-weight="700">EKSPEDISI TIMUR &amp; BATUR (3H)</text>
</svg>
`)}`;

export const PRESET_2_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <defs>
    <linearGradient id="p2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2626"/>
      <stop offset="100%" stop-color="#144D4B"/>
    </linearGradient>
  </defs>
  <rect width="300" height="200" fill="url(#p2)"/>
  <path d="M 0,110 Q 75,90 150,110 T 300,100 L 300,200 L 0,200 Z" fill="#2DD4BF" fill-opacity="0.3"/>
  <path d="M 0,140 Q 90,120 180,140 T 300,130 L 300,200 L 0,200 Z" fill="#2DD4BF" fill-opacity="0.4"/>
  <text x="16" y="176" fill="#5EEAD4" font-family="system-ui, sans-serif" font-size="12" font-weight="700">LINTAS BARAT &amp; BIOROCK (4H)</text>
</svg>
`)}`;

export function getVillageVisualMeta(
  villageId: string,
  allVillages?: DesaWisata[],
  locale: Locale = "id"
): VillageVisualMeta {
  const village =
    DESA_BY_ID.get(villageId) ||
    allVillages?.find((v) => v.id === villageId);

  const def = VILLAGE_DEFINITIONS[villageId] || {
    category: "forest" as const,
    tagId: "Desa Wisata Mandiri",
    tagEn: "Community Tourism Village",
    colorA: "#0D261C",
    colorB: "#1A4D37",
    accent: "#34D399",
  };

  const villageName = village?.name || "Desa Wisata";
  const regency = village?.regency || "Bali";

  // Check if explicit custom image exists in village data (e.g. verified human-uploaded local file)
  let imageUrl: string;
  let isIllustration = true;

  if (village?.image && village.image.trim() !== "") {
    imageUrl = village.image.trim();
    isIllustration = false;
  } else {
    // Generate unique, non-duplicated honest SVG placeholder
    imageUrl = generateVillageSvgPlaceholder(villageId, villageName, regency);
    isIllustration = true;
  }

  const quota = village?.dailyQuota || 100;
  const load = village?.currentSimulatedLoad || 38;
  const quotaPercentage = Math.min(100, Math.round((load / quota) * 100));
  const elevation = village?.elevationMeters ?? 320;

  return {
    imageUrl,
    altText:
      locale === "en"
        ? `Illustration of ${villageName}`
        : `Ilustrasi ${villageName}`,
    landscapeTag: locale === "en" ? def.tagEn : def.tagId,
    elevationLabel: locale === "en" ? `${elevation}m ASL` : `${elevation} mdpl`,
    quotaPercentage,
    quotaLabel:
      locale === "en"
        ? `${load}/${quota} visitors/day (${quotaPercentage}%)`
        : `${load}/${quota} wisatawan/hari (${quotaPercentage}%)`,
    imageCredit: village?.imageCredit || undefined,
    isIllustration,
  };
}
