# Eco Traveler - AI Redistributive Travel Planner for Bali

**Target Kompetisi:** Bali DigiFest 2026 - AI Web Innovation Challenge  
**Bidang:** Bali Smart Society  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React-Leaflet, Google Gemini 1.5 Flash + Deterministic Fallback Engine

---

## Ringkasan Solusi

**Eco Traveler** adalah perencana perjalanan wisata cerdas yang mengoptimalkan **pemerataan wilayah (*spatial equity*)** dan **retensi manfaat ekonomi lokal (*local benefit retention*)** ke Desa Wisata di Bali Utara (Buleleng), Bali Timur (Karangasem), Bali Barat (Jembrana), dan Bali Tengah-Utara (Bangli), guna mengatasi konsentrasi ekonomi (65,88% PDRB di Sarbagita) dan *overtourism* di Bali Selatan.

---

## Fitur Utama

### 1. Redistributive AI Travel Planner (`/api/itinerary` & `src/lib/ai-engine.ts`)
- **Dual-Engine Architecture:** Mengintegrasikan **Google Gemini 1.5 Flash** (*Structured JSON Output*) dan dilengkapi **Deterministic Fallback Engine** (`data/presets-fallback.json` + algoritma koridor geografis bebas *backtracking*) yang menjamin *zero-crash* ($\le 100\text{ ms}$) saat pengujian meskipun tanpa kunci API.
- **28 Desa Wisata Terkurasi:** Membatasi ruang rekomendasi pada 28 desa wisata resmi (`data/desa-wisata.json`) dan mengunci minimal 70% durasi kegiatan di kabupaten prioritas pemerataan.

### 2. Estimasi Durasi Transit & Jarak Tempuh Realistis (`src/lib/utils.ts`)
- **Kalibrasi Jalur Darat Bali:** Menggunakan formula Haversine yang dikalibrasikan dengan faktor kelokan jalan pegunungan/pedesaan Bali ($1.38\times$), kecepatan berkendara rata-rata $35\text{ km/jam}$, dan buffer kedatangan/parkir 5 menit.
- **Timeline Connector Pill:** Menampilkan indikator waktu tempuh dan jarak di antara setiap titik kunjungan (`A ➔ B: ~25 mnt (9,8 km)`), dari pintu kedatangan (Bandara Ngurah Rai / Pelabuhan Gilimanuk), dan menuju homestay warga di akhir hari.
- **Akumulasi Harian:** Menghitung total waktu tempuh harian di Header Hari (misal: `Perjalanan: ~1j 25m (38,4 km)`).
- **Sticky Tooltip pada Polyline Peta:** Saat kursor diarahkan ke garis rute di peta, tooltip interaktif langsung memunculkan desa asal, desa tujuan, waktu tempuh, dan jarak tempuh.

### 3. Penginapan Lokal & Wisata Terdekat per Daerah (`data/desa-wisata.json`)
- **Penginapan di Daerah Tersebut:** Setiap desa wisata dilengkapi 2-3 opsi akomodasi komunitas (Homestay Warga, Eco Lodge, Bamboo Villa, Pondok Desa) lengkap dengan tarif transparan per malam, fasilitas autentik (view sawah subak, sarapan organik, dsb.), dan catatan reservasi adat.
- **Wisata & Daya Tarik Terdekat (POIs):** Setiap desa dilengkapi 2-4 daya tarik sekitar (Air Terjun, Pura & Budaya, Trekking & Viewpoint, Pantai & Pesisir, Agrowisata) lengkap dengan jarak (km) dan estimasi menit dari pusat desa.
- **Sub-Drawer Interaktif di Timeline:** Tombol pill `[🏡 N Penginapan Warga]` dan `[🌿 N Wisata Terdekat]` pada kartu aktivitas yang dapat diperluas (*expandable*) tanpa membuat tampilan berantakan.
- **Tab Inspector Dock Bawah Peta:** Navigasi segmented tab `[Ringkasan]`, `[Penginapan (N)]`, dan `[Wisata Sekitar (N)]` untuk inspeksi langsung di peta.
- **Toggle Layer Spasial Peta:** Tombol layer opsional untuk menampilkan pin sebaran penginapan (hijau toska) dan wisata sekitar (oranye/amber) di atas peta.

### 4. Peta Spasial & Pemetaan Visualisasi Jalur (`src/components/LeafletMap.tsx`)
- **React-Leaflet Engine:** Peta interaktif dengan pemetaan jalur harian berkode warna (Hari 1: Emerald, Hari 2: Terakota, Hari 3: Biru Samudra, Hari 4: Kuning Emas), pin pintu kedatangan, serta penanda zona konsentrasi Bali Selatan (Kuta, Canggu, Seminyak).
- **Default Basemap OpenStreetMap (OSM):** Menggunakan OpenStreetMap (OSM) sebagai basemap default yang ringan, stabil, dan cepat dimuat, dengan switcher basemap ke CARTO Voyager, Positron, dan Dark.

### 5. Telemetri Dampak & Kuota Kapasitas (`src/lib/scoring.ts`)
- **Spread Score (0-100):** $\text{Spread Score} = \left( \frac{1}{N} \sum_{i=1}^{N} W(\text{Regency}_i) \right) \times 100$ dengan bobot wilayah $W$: Badung/Denpasar ($0.2$), Gianyar/Tabanan ($0.5$), Buleleng/Karangasem/Jembrana/Bangli ($1.0$).
- **Local Benefit Index (LBI %):** Mengukur porsi belanja langsung ke homestay warga, kuliner lokal, dan pemandu Pokdarwis terhadap total anggaran harian (Target $\ge 75\%$).
- **Anti-Overtourism Capacity Quota Guard:** Otomatis mendeteksi beban kunjungan harian desa ($\ge 92\%$ kapasitas) dan mengalihkan rute ke Desa Penyangga (*Buffer Village*) terdekat untuk menjaga daya dukung lingkungan.

### 6. Desain Clean & Modern serta Aksesibilitas
- **Palet Warna Harmonis:** Subak Deep Emerald (`#0D4732`), Warm Terracotta (`#EA580C`), Light Surface (`#F8F9FA`), Dark Surface (`#090E0B`).
- **Tipografi Formal:** Font `Inter` untuk display/headings, `Plus Jakarta Sans` untuk teks bacaan, dan `JetBrains Mono` dengan `tabular-nums` untuk angka serta metrik finansial.
- **Dukungan Bilingual (ID | EN):** Penyesuaian bahasa dan konversi mata uang otomatis (IDR ke USD) dengan saklar instan.
- **Ekspor Dokumen (PDF):** Dukungan pencetakan ramah tinta (*Auto-Light Print Guard*) yang otomatis beralih ke latar belakang putih saat dokumen dicetak.

---

## Struktur Direktori

```text
Eco Traveler/
├── data/
│   ├── desa-wisata.json          # Basis data 28 desa wisata, penginapan & wisata sekitar
│   └── presets-fallback.json     # Rute deterministik fallback bebas crash
├── src/
│   ├── app/
│   │   ├── api/itinerary/        # Endpoint API generasi rute (Gemini + Fallback)
│   │   ├── globals.css           # Konfigurasi Tailwind, CSS variable, & Leaflet tweaks
│   │   ├── layout.tsx            # Root layout dengan font Inter & Plus Jakarta Sans
│   │   └── page.tsx              # Halaman utama antarmuka Eco Traveler
│   ├── components/
│   │   ├── CulturalBriefing.tsx  # Panduan etika adat, busana pura, & awig-awig
│   │   ├── GovernmentBar.tsx     # Simulasi kebijakan pemerataan ekonomi wilayah
│   │   ├── ItineraryTimeline.tsx # Timeline rute, pill transit, & drawer penginapan/wisata
│   │   ├── LeafletMap.tsx        # Peta interaktif Leaflet, tooltip jalur, & inspector dock
│   │   ├── TelemetryCards.tsx    # 3 kartu bento metrik pemerataan & retensi lokal
│   │   └── TripPlannerForm.tsx   # Formulir preferensi durasi, budget, minat, & pintu kedatangan
│   ├── lib/
│   │   ├── ai-engine.ts          # Integrasi Gemini AI & logika deterministik
│   │   ├── i18n.ts               # Kamus lokalisasi bilingual (ID & EN)
│   │   ├── scoring.ts            # Kalkulasi Spread Score, LBI, & Capacity Guard
│   │   ├── utils.ts              # Utilitas format mata uang, Haversine & transit Bali
│   │   └── village-media.ts      # Visual metadata desa & ketinggian mdpl
│   └── types/
│       ├── desa.ts               # Tipe data DesaWisata, LocalAccommodation, & NearbyAttraction
│       └── trip.ts               # Tipe data TripRequest, DayItinerary, & Telemetri
└── tests/
    └── scoring.test.mjs          # Unit testing scoring, dataset, transit, & akomodasi
```

---

## Cara Menjalankan Secara Lokal

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variable (Opsional):**
   Salin `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi `GEMINI_API_KEY` jika ingin menggunakan model Google Gemini 1.5 Flash. Jika tidak diisi, sistem otomatis beroperasi penuh menggunakan **Deterministic Engine**.

3. **Menjalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban.

4. **Menjalankan Pengujian Unit:**
   ```bash
   npm test
   ```

5. **Kompilasi Build Produksi:**
   ```bash
   npm run build
   npm run start
   ```
