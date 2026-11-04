import { DesaWisata } from "@/types/desa";
import { DESA_BY_ID } from "@/lib/scoring";
import { Locale } from "@/lib/utils";

export interface VillageVisualMeta {
  imageUrl: string;
  landscapeTag: string;
  elevationLabel: string;
  quotaPercentage: number;
  quotaLabel: string;
}

const VILLAGE_IMAGE_MAP: Record<
  string,
  { url: string; tagId: string; tagEn: string }
> = {
  "desa-pemuteran": {
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80",
    tagId: "Konservasi Terumbu Biorock",
    tagEn: "Biorock Coral Conservation",
  },
  "desa-sudaji": {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tagId: "Lembah Subak & Agroforestri",
    tagEn: "Subak Valley & Agroforestry",
  },
  "desa-sidemen": {
    url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
    tagId: "Lembah Tenun & Kaki Gunung Agung",
    tagEn: "Weaving Valley & Mount Agung Foothills",
  },
  "desa-penglipuran": {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=900&q=80",
    tagId: "Tata Ruang Adat & Hutan Bambu",
    tagEn: "Heritage Spatial Layout & Bamboo Forest",
  },
  "desa-blimbingsari": {
    url: "https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=900&q=80",
    tagId: "Harmoni Budaya & Agro Kakao",
    tagEn: "Cultural Harmony & Cacao Groves",
  },
  "desa-munduk": {
    url: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=900&q=80",
    tagId: "Kabut Pegunungan & Kebun Cengkeh",
    tagEn: "Highland Mist & Clove Plantations",
  },
  "desa-les": {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tagId: "Pesisir Garam Palung & Karang",
    tagEn: "Sea Salt Troughs & Reef Restoration",
  },
  "desa-sembiran": {
    url: "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=80",
    tagId: "Pusaka Megalitikum Bali Aga",
    tagEn: "Megalithic Bali Aga Heritage",
  },
  "desa-pejarakan": {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    tagId: "Hutan Mangrove & Teluk Menjangan",
    tagEn: "Mangrove Forest & Menjangan Bay",
  },
  "desa-ambengan": {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    tagId: "Terasering Jembong & Air Terjun",
    tagEn: "Jembong Terraces & Waterfalls",
  },
  "desa-gobleg": {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
    tagId: "Kaldera Danau Tamblingan",
    tagEn: "Lake Tamblingan Caldera Forest",
  },
  "desa-tenganan": {
    url: "https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80",
    tagId: "Tenun Ikat Ganda Gringsing",
    tagEn: "Gringsing Double-Ikat Weaving",
  },
  "desa-amed-purwakerti": {
    url: "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80",
    tagId: "Teluk Jemeluk & Garam IG Amed",
    tagEn: "Jemeluk Bay & Artisanal Amed Salt",
  },
  "desa-tulamben": {
    url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80",
    tagId: "Ekosistem Laut & Porter Wanita",
    tagEn: "Marine Sanctuary & Women Dive Porters",
  },
  "desa-sibetan": {
    url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80",
    tagId: "Agroforestri 14 Varietas Salak",
    tagEn: "Heritage Salak Agroforestry",
  },
  "desa-budakeling": {
    url: "https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=900&q=80",
    tagId: "Tradisi Siwa-Buddha & Kriya Perak",
    tagEn: "Siwa-Buddha Tradition & Silver Craft",
  },
  "desa-muncan": {
    url: "https://images.unsplash.com/photo-1536152470836-b943b246224c?auto=format&fit=crop&w=900&q=80",
    tagId: "Sawah Beras Merah Vulkanik",
    tagEn: "Volcanic Red Rice Terraces",
  },
  "desa-timbrah": {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=900&q=80",
    tagId: "Arsitektur Balai Adat Bali Aga",
    tagEn: "Ancient Bali Aga Pavilion",
  },
  "desa-trunyan": {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    tagId: "Dermaga Danau Batur & Bali Mula",
    tagEn: "Lake Batur Pier & Bali Mula Heritage",
  },
  "desa-undisan": {
    url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
    tagId: "Lembah Sungai Jinah & Desa Penyangga",
    tagEn: "Jinah River Valley & Buffer Village",
  },
  "desa-batur-selatan": {
    url: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=900&q=80",
    tagId: "UNESCO Global Geopark Batur",
    tagEn: "UNESCO Global Geopark Batur",
  },
  "desa-ekasari": {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
    tagId: "Danau Palasari & Kakao Fermentasi",
    tagEn: "Palasari Basin & Fermented Cacao",
  },
  "desa-medewi": {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tagId: "Pesisir Eco-Surfing & Lawar Klungah",
    tagEn: "Coastal Surf Point & Coconut Cuisine",
  },
  "desa-gumbrih": {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tagId: "Gamelan Jegog Bambu & Konservasi",
    tagEn: "Bamboo Jegog Gamelan & Conservation",
  },
  "desa-jatiluwih": {
    url: "https://images.unsplash.com/photo-1536152470836-b943b246224c?auto=format&fit=crop&w=900&q=80",
    tagId: "Warisan Dunia Subak UNESCO",
    tagEn: "UNESCO World Heritage Subak",
  },
  "desa-wongaya-gede": {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    tagId: "Hutan Hujan Pura Luhur Batukaru",
    tagEn: "Mount Batukaru Sanctuary Forest",
  },
  "desa-taro": {
    url: "https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=900&q=80",
    tagId: "Konservasi Lembu Putih Suci",
    tagEn: "Sacred White Cattle Sanctuary",
  },
  "desa-carangsari": {
    url: "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=80",
    tagId: "Lembah Tukad Ayung & Pusaka Sejarah",
    tagEn: "Ayung River Valley & Historical Site",
  },
};

export function getVillageVisualMeta(
  villageId: string,
  allVillages?: DesaWisata[],
  locale: Locale = "id"
): VillageVisualMeta {
  const village =
    DESA_BY_ID.get(villageId) ||
    allVillages?.find((v) => v.id === villageId);
  const mapped = VILLAGE_IMAGE_MAP[villageId] || {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tagId: "Desa Wisata Mandiri Bali",
    tagEn: "Community Tourism Village",
  };

  const quota = village?.dailyQuota || 100;
  const load = village?.currentSimulatedLoad || 38;
  const quotaPercentage = Math.min(100, Math.round((load / quota) * 100));
  const elevation = village?.elevationMeters ?? 320;

  return {
    imageUrl: mapped.url,
    landscapeTag: locale === "en" ? mapped.tagEn : mapped.tagId,
    elevationLabel: locale === "en" ? `${elevation}m ASL` : `${elevation} mdpl`,
    quotaPercentage,
    quotaLabel:
      locale === "en"
        ? `${load}/${quota} visitors/day (${quotaPercentage}%)`
        : `${load}/${quota} wisatawan/hari (${quotaPercentage}%)`,
  };
}
