# Product Requirement Document (PRD): Eco Traveler

**Nama Produk:** Eco Traveler (*AI Redistributive Travel Planner for Bali*)  
**Versi:** 1.0.0 (MVP Build)  
**Target Kompetisi:** Bali DigiFest 2026 – AI Web Innovation Challenge  
**Kategori:** Mahasiswa / Umum – Bidang Bali Smart Society  
**Target Rilis MVP:** 07 November 2026  
**Stack Eksekusi:** Next.js 14+ (App Router, Node.js Runtime, React, TypeScript, Tailwind CSS, React-Leaflet)  
**Deployment Target:** Vercel (Edge/Serverless Platform)

---

## 1. Executive Summary & Problem Framing

### 1.1 Latar Belakang & Urgensi Masalah (Berdasarkan Data)
* **Konsentrasi Ekonomi Ekstrem:** Kawasan Sarbagita (Denpasar, Badung, Gianyar, Tabanan) menguasai sekitar 65,88% PDRB Bali. Kabupaten di pinggiran seperti Karangasem, Bangli, Buleleng, dan Jembrana tertinggal secara signifikan dalam penyerapan manfaat belanja pariwisata.
* **Beban Daya Dukung Lingkungan (Overtourism):** Target kunjungan lebih dari 6,6 juta wisman pada tahun 2026 menumpuk di koridor Bali Selatan, memicu kelumpuhan lalu lintas (seperti krisis macet total akhir 2023), krisis air tanah pesisir, serta akumulasi sampah harian di TPA Suwung.
* **Celah Solusi Eksisting:** Platform global seperti Google Maps, TripAdvisor, dan Instagram mengoptimalkan algoritma berdasarkan **popularitas dan ulasan terbanyak**, yang secara sistematis terus mengarahkan wisatawan ke titik padat yang sama dan memperparah ketimpangan spasial.
* **Peluang Kebijakan Pemerintah:** Kebijakan Pemerintah Provinsi Bali dan dorongan Bank Indonesia secara aktif memprioritaskan redistribusi kunjungan dan pemerataan ekonomi ke Bali Utara, Timur, dan Barat melalui pemberdayaan Desa Wisata mandiri berbasis kearifan lokal.

### 1.2 Solusi Produk
**Eco Traveler** adalah perencana perjalanan (*travel planner*) berbasis web cerdas yang **mengoptimalkan pemerataan wilayah (*spatial equity*) dan manfaat ekonomi lokal (*local benefit retention*)**, bukan sekadar mengejar popularitas tempat wisata. 

Aplikasi ini menghasilkan rencana perjalanan interaktif yang memprioritaskan desa wisata binaan di luar Bali Selatan, memvisualisasikan rute bebas macet di peta, menghitung metrik dampak ekonomi secara deterministik, serta menyajikan panduan etika adat (*awig-awig*) desa secara personal.

---

## 2. User Personas & Target Users

| Persona | Peran | Kebutuhan Utama | Pain Point |
| :--- | :--- | :--- | :--- |
| **Wisatawan Sadar Budaya (Conscious Traveler)** | Turis domestik/asing yang mencari pengalaman autentik & tenang | Rute perjalanan terstruktur di Bali luar selatan yang aman, terhindar macet, dan transparan biayanya. | Bingung memilih desa wisata yang kredibel; minim informasi rute terintegrasi di luar Kuta/Canggu/Ubud. |
| **Pengelola Desa Wisata / Pokdarwis** | Pengurus Desa Wisata & Pelaku UMKM Lokal | Peningkatan okupansi homestay lokal, kunjungan kuliner warung, dan penjualan kerajinan rakyat. | Promosi digital kalah saing dengan korporasi hotel berbintang dan restoran waralaba di Bali Selatan. |
| **Panel Juri AI Web Challenge** | Evaluator Teknis & Substansi (Diskominfo, BI, BPD) | Menguji MVP fungsional, memvalidasi implementasi AI riil, dan melihat dampak sosial-ekonomi terukur. | Jenuh dengan chatbot wisata generik yang hanya membungkus ChatGPT tanpa solusi spesifik untuk masalah Bali. |

---

## 3. Core Features & Scope (MVP 4-Day Build)

```
Eco Traveler (Core Architecture)
├── 1. Redistributive Travel Planner Engine (Next.js Server / Gemini API)
│   ├── Filter Masukan: Durasi (1-4 Hari), Minat, Budget, Titik Kedatangan
│   └── Output Terstruktur (Strict JSON Schema)
├── 2. Spatial Mapping & Day-by-Day Route Visualizer (React-Leaflet)
│   ├── Pin Destinasi & Desa Wisata Terkurasi (25-30 Lokasi)
│   └── Polyline Jalur Tempuh Harian Antar-Wilayah
├── 3. Heuristic Impact & Equity Telemetry
│   ├── Spread Score (Skor Pemerataan Wilayah)
│   ├── Local Benefit Index (Estimasi Belanja UMKM/Warga)
│   └── Anti-Overtourism Capacity Quota Guard
├── 4. Contextual Adat & Cultural Etiquette Briefing
│   └── Panduan Busana Pura, Larangan Adat, & Kearifan Desa Setempat
└── 5. Regional Impact Simulation Dashboard (Nilai Tambah Juri)
    └── Visualisasi Sebaran Belanja Wisatawan per Kabupaten
```

### 3.1 Detail Kebutuhan Fungsional (Functional Requirements)

* **FR-01: Formulir Preferensi Wisatawan (Travel Constraint Input)**
  * Input durasi perjalanan: 1 Hari, 2 Hari, 3 Hari, atau 4 Hari.
  * Input preferensi minat (*multi-select*): Alam & Konservasi, Seni & Budaya Luhur, Kuliner Tradisional, Agroturisme/Kebugaran (*Wellness*).
  * Input titik kedatangan: Bandara I Gusti Ngurah Rai (Selatan) atau Pelabuhan Gilimanuk (Barat).
  * Input preferensi anggaran: Backpacker (Homestay), Menengah (Boutique Eco-Lodge).

* **FR-02: Mesin Perencana Rute Cerdas (Redistributive AI Engine)**
  * Sistem membatasi ruang pencarian hanya pada dataset terverifikasi (25–30 Desa Wisata resmi Disparda Bali).
  * AI wajib menyusun rute yang mengalokasikan **minimal 70% durasi kegiatan** di kabupaten prioritas pemerataan (Buleleng, Karangasem, Jembrana, atau Bangli).
  * Output wajib berupa objek JSON terstruktur berisi: nama tempat, koordinat GPS, estimasi durasi, ringkasan aktivitas, dan rekomendasi homestay/warung warga.

* **FR-03: Visualisasi Peta Spasial (Interactive Route Map)**
  * Render peta menggunakan Leaflet.js dengan basemap OpenStreetMap / CartoDB Voyager.
  * Menampilkan pin penanda lokasi dengan kode warna berbeda per hari perjalanan (Hari 1: Biru, Hari 2: Hijau, Hari 3: Jingga, dst).
  * Menghubungkan titik destinasi dalam satu hari dengan garis rute (*polyline*) informatif.

* **FR-04: Kalkulasi Metrik Pemerataan & Dampak Ekonomi (Telemetry Engine)**
  * Menghitung dan menampilkan **Spread Score** secara instan:
    $$\text{Spread Score} = \left( \frac{1}{N} \sum_{i=1}^{N} W(\text{Regency}_i) \right) \times 100$$
    dengan bobot wilayah ($W$):
    * Badung & Denpasar = $0.2$ (Pusat Konsentrasi)
    * Gianyar & Tabanan = $0.5$ (Transisi)
    * Buleleng, Karangasem, Jembrana, & Bangli = $1.0$ (Prioritas Pemerataan)
  * Menghitung **Local Benefit Index (LBI)**:
    $$\text{LBI} = \left( \frac{\text{Estimasi Belanja Homestay + Warung + Guide Lokal}}{\text{Total Estimasi Biaya Harian}} \right) \times 100\%$$
    Target skor ideal: $\text{LBI} \ge 75\%$.

* **FR-05: Panduan Adat Terintegrasi (Cultural Briefing)**
  * Menyajikan aturan etika spesifik untuk destinasi yang masuk dalam rute, seperti:
    * Tata cara berpakaian di Pura desa adat bersangkutan (penggunaan kamen dan selendang).
    * Informasi hari sakral atau pantangan lokal (*cuntaka*, upacara piodalan).

* **FR-06: Anti-Overtourism Capacity Guard**
  * Setiap destinasi memiliki kuota rekomendasi harian virtual. Jika sebuah desa wisata telah mencapai batas simulasi kunjungan, sistem memberikan *tag* peringatan kapasitas dan secara otomatis menggeser rute ke desa penyangga (*buffer village*) terdekat.

---

## 4. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│  Next.js 14 (React 18, Tailwind CSS, Lucide Icons)          │
│  Components: TripForm, RouteMap (React-Leaflet), ScoreCard  │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/itinerary
┌──────────────────────────────▼──────────────────────────────┐
│                    NODE.JS SERVER LAYER                     │
│  Route Handler: app/api/itinerary/route.ts                  │
│  - Heuristic Engine: lib/scoring.ts (Spread & LBI Formula)  │
│  - Dataset Context: data/desa-wisata.json                   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     EXTERNAL AI SERVICE     ││    DETERMINISTIC FALLBACK    │
│  Google Gemini 1.5 Flash    ││  Pre-generated JSON Presets  │
│  Structured JSON Output     ││  (Zero-Crash Failover Cache) │
└─────────────────────────────┘└──────────────────────────────┘
```

* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide-React, React-Leaflet.
* **Backend:** Next.js Route Handlers (Node.js runtime serverless).
* **AI Model:** Google Gemini 1.5 Flash (`gemini-1.5-flash`) via `@google/genai` SDK atau direct HTTPS endpoint.
* **Database / Static Storage:** Local JSON dataset (`data/desa-wisata.json`), menjamin latensi $\le 100\text{ ms}$ untuk *context retrieval* tanpa dependensi SQL server eksternal.

---

## 5. Curated Dataset Specification (`data/desa-wisata.json`)

Dataset mencakup perwakilan desa wisata resmi di luar kawasan Bali Selatan yang telah terverifikasi:

```json
[
  {
    "id": "desa-pemuteran",
    "name": "Desa Pemuteran",
    "regency": "Buleleng",
    "zone": "North",
    "lat": -8.1456,
    "lng": 114.6542,
    "focus": ["Nature", "Wellness"],
    "highlights": "Konservasi Terumbu Karang Biorock, Snorkeling Ramah Lingkungan",
    "avgHomestayPrice": 250000,
    "localUmkm": "Warung Pesisir Organik, Kelompok Tani Garam Pemuteran",
    "customsNote": "Kawasan perlindungan laut adat (DPL Adat). Dilarang menyentuh struktur Biorock."
  },
  {
    "id": "desa-sudaji",
    "name": "Desa Wisata Sudaji",
    "regency": "Buleleng",
    "zone": "North",
    "lat": -8.1925,
    "lng": 115.1481,
    "focus": ["Culture", "Agriculture"],
    "highlights": "Hutan Belajar Budaya, Sistem Pertanian Alami Kuno Gandameru",
    "avgHomestayPrice": 220000,
    "localUmkm": "Kopi Sudaji Tradisional, Gula Aren Arenan",
    "customsNote": "Pakaian sopan di area pura desa. Hormati prosesi pembagian air subak."
  },
  {
    "id": "desa-sidemen",
    "name": "Desa Wisata Sidemen",
    "regency": "Karangasem",
    "zone": "East",
    "lat": -8.4872,
    "lng": 115.4419,
    "focus": ["Culture", "Nature"],
    "highlights": "Lembah Bukit Hijau, Tenun Tradisional Endek & Songket Alami",
    "avgHomestayPrice": 300000,
    "localUmkm": "Perajin Tenun Khas Sidemen, Arak Bali Tradisional Legal",
    "customsNote": "Gunakan pakaian tertutup saat melewati jalur pemukiman griya/brahmana."
  },
  {
    "id": "desa-penglipuran",
    "name": "Desa Wisata Penglipuran",
    "regency": "Bangli",
    "zone": "Central-North",
    "lat": -8.4522,
    "lng": 115.3567,
    "focus": ["Culture", "Nature"],
    "highlights": "Tata Ruang Desa Terbersih di Dunia, Hutan Bambu Lindung",
    "avgHomestayPrice": 280000,
    "localUmkm": "Minuman Loloh Cemcem Tradisional, Kue Tipat Cantok Warga",
    "customsNote": "Dilarang merokok di zona pemukiman inti. Wajib berjalan kaki di lorong desa."
  },
  {
    "id": "desa-blimbingsari",
    "name": "Desa Wisata Blimbingsari",
    "regency": "Jembrana",
    "zone": "West",
    "lat": -8.2917,
    "lng": 114.5028,
    "focus": ["Culture", "Wellness"],
    "highlights": "Arsitektur Khas Perpaduan Budaya Bali dan Toleransi Keberagaman",
    "avgHomestayPrice": 200000,
    "localUmkm": "Kakao Fermentasi Jembrana, Kuliner Betutu Khas Gilimanuk",
    "customsNote": "Hormati tradisi ketenangan dan kebersihan lingkungan desa."
  }
]
```

---

## 6. Directory Structure

```
eco-traveler/
├── data/
│   ├── desa-wisata.json          # Dataset 25-30 Desa Wisata kurasi
│   └── presets-fallback.json     # Data cadangan deterministik anti-crash
├── public/
│   ├── images/
│   │   ├── hero-bali.jpg
│   │   └── marker-icon.png
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── itinerary/
│   │   │       └── route.ts      # Serverless Node backend: validasi & AI pipeline
│   │   ├── globals.css           # Tailwind base styles
│   │   ├── layout.tsx            # Global layout + metadata lomba
│   │   └── page.tsx              # Main interactive single-page app
│   ├── components/
│   │   ├── TripPlannerForm.tsx   # Panel input preferensi wisatawan
│   │   ├── ItineraryTimeline.tsx # Kartu alur perjalanan hari demi hari
│   │   ├── LeafletMap.tsx        # Render visual peta Leaflet (Dynamic Client Only)
│   │   ├── TelemetryCards.tsx    # Card Spread Score, Local Benefit, & Emisi
│   │   ├── CulturalBriefing.tsx  # Modal / Accordion awig-awig & etika lokal
│   │   └── GovernmentBar.tsx     # Dashboard simulasi sebaran PDRB pariwisata
│   ├── lib/
│   │   ├── ai-engine.ts          # Integrasi Gemini 1.5 Flash + structured prompt
│   │   ├── scoring.ts            # Logika formula matematis Spread Score & LBI
│   │   └── utils.ts              # Format rupiah, date helper, & classnames
│   └── types/
│       ├── trip.ts               # Interface TypeScript untuk Request & Response
│       └── desa.ts               # Interface entitas Desa Wisata
├── .env.example                  # Template env variable (GEMINI_API_KEY)
├── next.config.mjs               # Konfigurasi Next.js
├── package.json                  # Dependensi NPM
├── tailwind.config.ts            # Konfigurasi utility Tailwind
└── tsconfig.json                 # Konfigurasi TypeScript
```

---

## 7. Data Contracts & API Specification

### 7.1 POST `/api/itinerary`

* **Request Payload (`src/types/trip.ts`):**

```typescript
export interface TripRequest {
  durationDays: number; // 1, 2, 3, atau 4
  interests: string[]; // ["Culture", "Nature", "Wellness", "Culinary"]
  budgetCategory: 'Backpacker' | 'Moderate' | 'Comfort';
  arrivalGate: 'NgurahRaiAirport' | 'GilimanukPort';
}
```

* **AI System Instruction & Prompt (`src/lib/ai-engine.ts`):**

```text
You are the Eco Traveler Redistribution Engine for Bali DigiFest 2026.
Your primary mission is to fight overtourism in South Bali (Sarbagita) and maximize economic distribution to North, East, and West Bali.

Guidelines:
1. ALWAYS prioritize tourist villages from the provided dataset located in Buleleng, Karangasem, Jembrana, and Bangli.
2. DO NOT route visitors to saturated hotspots (Kuta, Seminyak, Canggu) unless strictly needed for transit.
3. Structure realistic daily traveling sequences that minimize backtracking.
4. Calculate realistic local spend allocations (Homestay, Local Warung, Community Guide).
5. Output MUST strictly match the specified JSON schema.
```

* **Response Success Payload (`src/types/trip.ts`):**

```typescript
export interface TripDayActivity {
  timeSlot: 'Pagi' | 'Siang' | 'Sore' | 'Malam';
  villageId: string;
  villageName: string;
  regency: string;
  activityTitle: string;
  description: string;
  lat: number;
  lng: number;
  estimatedLocalSpendRp: number;
  antiOvertourismNote: string;
}

export interface DayItinerary {
  dayNumber: number;
  themeTitle: string;
  activities: TripDayActivity[];
  recommendedStay: {
    name: string;
    type: 'Community Homestay' | 'Eco Lodge';
    priceRangeRp: string;
  };
}

export interface ItineraryResponse {
  tripTitle: string;
  summaryNarrative: string;
  days: DayItinerary[];
  metrics: {
    spreadScore: number; // Skala 0 - 100
    localBenefitIndex: number; // Persentase belanja ke warga lokal (0 - 100%)
    totalEstimatedSpendRp: number;
    totalLocalRetainedRp: number;
    primaryRegenciesBenefited: string[];
  };
  culturalEtiquette: {
    ruleTitle: string;
    description: string;
    applicableVillages: string[];
  }[];
}
```

---

## 8. Implementation Guide for Antigravity

Eksekusi proyek ini dirancang secara berurutan agar dapat dijalankan oleh agen koding AI dalam satu alur kerja yang runtut:

```
┌─────────────────────────────────────────────────────────────┐
│                 TAHAPAN EKSEKUSI ANTIGRAVITY                │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Inisialisasi Dependensi & Setup TypeScript          │
│         - next, react, react-dom, tailwindcss, lucide-react │
│         - leaflet, react-leaflet, @types/leaflet            │
│ Step 2: Buat dataset statis data/desa-wisata.json & types   │
│ Step 3: Implementasi formula matematis src/lib/scoring.ts   │
│ Step 4: Bangun API route /api/itinerary + AI fallback cache │
│ Step 5: Implementasi komponen UI Leaflet (Client Only dynamic)│
│ Step 6: Bangun formulir interaktif & kartu metrik telemetri │
│ Step 7: Integrasi layout dashboard & modal etika budaya     │
│ Step 8: Validasi build produksi (next build) & deploy Vercel │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Perintah Awal untuk Antigravity:

> *"Tolong bangun aplikasi web Next.js 14 (App Router) berbasis TypeScript sesuai dengan spesifikasi `eco_traveler_prd.md`. Mulai dari inisialisasi file konfigurasi, dataset `data/desa-wisata.json`, implementasi library scoring matematis di `src/lib/scoring.ts`, route API `/api/itinerary` yang memanggil Google Gemini Flash dengan fallback data deterministik, serta antarmuka peta interaktif React-Leaflet yang menampilkan pin dan rute harian."*

---

## 9. Penjaminan Kepatuhan Aturan Lomba (Compliance & Technical Verification)

* **Keamanan Kunci Rahasia:** File `.env.local` yang berisi `GEMINI_API_KEY` tidak di-commit ke repositori Git. File `.env.example` disediakan secara publik dengan nilai variabel kosong.
* **Keandalan Uji Coba Juri (Clean-Start Demonstration):** Sistem menyertakan mekanisme fallback otomatis ke `data/presets-fallback.json`. Jika token API habis atau terjadi kendala jaringan saat pengujian langsung oleh dewan juri, aplikasi tetap merespons dalam $\le 1$ detik tanpa kendala.
* **Transparansi Sumber Daya Pihak Ketiga (Lampiran C):**
  * **Framework:** Next.js 14 (MIT License)
  * **Peta:** Leaflet.js & TileLayer OpenStreetMap (Open Data Commons / CC-BY-SA)
  * **Dataset:** Buku Statistik Pariwisata Dinas Pariwisata Provinsi Bali & Data Pokdarwis Daerah
  * **AI Model:** Google Gemini 1.5 Flash (Generative Language API)
  * **AI Coding Assistant:** Diungkapkan secara jujur (Antigravity & Gemini) untuk penulisan *boilerplate* dan akselerasi MVP.