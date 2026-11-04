import { DesaWisata } from "@/types/desa";
import { DESA_BY_ID } from "@/lib/scoring";

export interface VillageVisualMeta {
  imageUrl: string;
  landscapeTag: string;
  elevationLabel: string;
  quotaPercentage: number;
  quotaLabel: string;
}

const VILLAGE_IMAGE_MAP: Record<string, { url: string; tag: string }> = {
  "desa-pemuteran": {
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80",
    tag: "Konservasi Terumbu Biorock",
  },
  "desa-sudaji": {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tag: "Lembah Subak & Agroforestri",
  },
  "desa-sidemen": {
    url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
    tag: "Lembah Tenun & Kaki Gunung Agung",
  },
  "desa-penglipuran": {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=900&q=80",
    tag: "Tata Ruang Adat & Hutan Bambu",
  },
  "desa-blimbingsari": {
    url: "https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=900&q=80",
    tag: "Harmoni Budaya & Agro Kakao",
  },
  "desa-munduk": {
    url: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=900&q=80",
    tag: "Kabut Pegunungan & Kebun Cengkeh",
  },
  "desa-les": {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tag: "Pesisir Garam Palung & Karang",
  },
  "desa-sembiran": {
    url: "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=80",
    tag: "Pusaka Megalitikum Bali Aga",
  },
  "desa-pejarakan": {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    tag: "Hutan Mangrove & Teluk Menjangan",
  },
  "desa-ambengan": {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    tag: "Terasering Jembong & Air Terjun",
  },
  "desa-gobleg": {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
    tag: "Kaldera Danau Tamblingan",
  },
  "desa-tenganan": {
    url: "https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80",
    tag: "Tenun Ikat Ganda Gringsing",
  },
  "desa-amed-purwakerti": {
    url: "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80",
    tag: "Teluk Jemeluk & Garam IG Amed",
  },
  "desa-tulamben": {
    url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80",
    tag: "Ekosistem Laut & Porter Wanita",
  },
  "desa-sibetan": {
    url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80",
    tag: "Agroforestri 14 Varietas Salak",
  },
  "desa-budakeling": {
    url: "https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=900&q=80",
    tag: "Tradisi Siwa-Buddha & Kriya Perak",
  },
  "desa-muncan": {
    url: "https://images.unsplash.com/photo-1536152470836-b943b246224c?auto=format&fit=crop&w=900&q=80",
    tag: "Sawah Beras Merah Vulkanik",
  },
  "desa-timbrah": {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=900&q=80",
    tag: "Arsitektur Balai Adat Bali Aga",
  },
  "desa-trunyan": {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    tag: "Dermaga Danau Batur & Bali Mula",
  },
  "desa-undisan": {
    url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
    tag: "Lembah Sungai Jinah & Desa Penyangga",
  },
  "desa-batur-selatan": {
    url: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=900&q=80",
    tag: "UNESCO Global Geopark Batur",
  },
  "desa-ekasari": {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
    tag: "Danau Palasari & Kakao Fermentasi",
  },
  "desa-medewi": {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tag: "Pesisir Eco-Surfing & Lawar Klungah",
  },
  "desa-gumbrih": {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tag: "Gamelan Jegog Bambu & Konservasi",
  },
  "desa-jatiluwih": {
    url: "https://images.unsplash.com/photo-1536152470836-b943b246224c?auto=format&fit=crop&w=900&q=80",
    tag: "Warisan Dunia Subak UNESCO",
  },
  "desa-wongaya-gede": {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    tag: "Hutan Hujan Pura Luhur Batukaru",
  },
  "desa-taro": {
    url: "https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=900&q=80",
    tag: "Konservasi Lembu Putih Suci",
  },
  "desa-carangsari": {
    url: "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=80",
    tag: "Lembah Tukad Ayung & Pusaka Sejarah",
  },
};

export function getVillageVisualMeta(
  villageId: string,
  allVillages?: DesaWisata[]
): VillageVisualMeta {
  const village =
    DESA_BY_ID.get(villageId) ||
    allVillages?.find((v) => v.id === villageId);
  const mapped = VILLAGE_IMAGE_MAP[villageId] || {
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    tag: "Desa Wisata Mandiri Bali",
  };

  const quota = village?.dailyQuota || 100;
  const load = village?.currentSimulatedLoad || 38;
  const quotaPercentage = Math.min(100, Math.round((load / quota) * 100));
  const elevation = village?.elevationMeters ?? 320;

  return {
    imageUrl: mapped.url,
    landscapeTag: mapped.tag,
    elevationLabel: `${elevation} mdpl`,
    quotaPercentage,
    quotaLabel: `${load}/${quota} wisatawan/hari (${quotaPercentage}%)`,
  };
}
