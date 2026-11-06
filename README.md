# Eco Traveler - AI Equitable Spatial Tourism Planner for Bali

> **Platform Perencana Wisata Berkeadilan & Generator Rute Berbasis AI untuk 28 Desa Wisata Bali Luar Sarbagita**

[![Production Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://route-traveler.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%203.5%20Flash-4285F4.svg)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-30%2F30%20Pass-emerald.svg)](tests/)

---

## 🏆 Informasi Partisipasi Kompetisi

- **Kompetisi:** Baligivation 2026 — AI Web Innovation Challenge
- **Tema:** *Build with AI, Solver for Bali*
- **Bidang:** Bali Smart Society
- **Live Deployment:** [https://route-traveler.vercel.app/](https://route-traveler.vercel.app/)

---

## 🧭 Latar Belakang & Masalah (*Problem Statement*)

Provinsi Bali menghadapi tantangan ketimpangan spasial dan ekonomi yang signifikan:
1. **Konsentrasi Ekonomi Ekstrem:** Sebanyak **65,88% PDRB Bali** terkonsentrasi di kawasan Sarbagita (Denpasar, Badung, Gianyar, Tabanan Selatan), menciptakan ketimpangan ekonomi akut antar-wilayah.
2. **Krisis Daya Dukung & *Overtourism*:** Kemacetan parah, krisis air, dan penurunan kualitas hidup terkonsentrasi di koridor selatan Bali (Kuta, Canggu, Seminyak, Ubud).
3. **Potensi Terpendam di Luar Sarbagita:** Sebanyak 28 desa wisata berdaya tarik tinggi di Bali Utara (Buleleng), Bali Timur (Karangasem), Bali Barat (Jembrana), dan Bali Tengah-Utara (Bangli) kekurangan visibilitas, akses perencana rute terintegrasi, dan distribusi kunjungan wisatawan yang berimbang.

**Eco Traveler** hadir sebagai perencana perjalanan wisata cerdas berbasis AI (*Solver for Bali*) yang mengoptimalkan **pemerataan wilayah (*spatial equity*)** dan **retensi manfaat ekonomi komunitas lokal (*local economic retention*)** secara transparan, terukur, dan menghormati kearifan lokal adat Bali.

---

## ⚡ Fitur Utama & Keunggulan

### 1. Dual-Core AI Architecture (Google Gemini 3.5 Flash + Subak Spatial Engine)
- **POST `/api/ai/narrate`:** Generator narasi rute dinamis (Google Gemini) yang menyusun:
  - Ringkasan kontekstual *"Mengapa rute ini?"* (2–3 kalimat) yang menjelaskan logika redistribusi spasial rute tersebut.
  - Narasi pengalaman per stop (maksimal 60 kata) dalam bahasa aktif (ID / EN).
- **POST `/api/ai/parse-preferences`:** Kotak dialog teks bebas alami (contoh: *"lebih santai, perbanyak kuliner tradisional, hindari jalan terlalu jauh"*) yang diterjemahkan secara cerdas oleh Google Gemini menjadi parameter mesin rute (durasi, preferensi menginap, fokus aktivitas, dsb.).
- **Honest AI Badge:** Lencana *"AI Generated"* hanya muncul apabila respons AI benar-benar dihasilkan secara langsung melalui Google Gemini API.
- **Prinsip *Deterministic Source of Truth*:** Seluruh angka matematis (skor pemerataan, retensi lokal, waktu tempuh, jarak, simulasi PDRB) tetap dihitung secara deterministik oleh mesin kalkulasi internal untuk mencegah halusinasi data numerik.
- **Zero-Crash Fallback Guarantee:** Jika kuota API habis atau server offline, aplikasi secara mulus beralih ke narasi deterministik tanpa membuat web crash atau terganggu.

### 2. Koleksi 28 Desa Wisata dengan 100% Foto Otentik & Terverifikasi
- **Bebas Stok Foto Palsu:** 100% dari 28 desa wisata memiliki berkas foto otentik teroptimasi web (~960px, rata-rata 150–350 KB) yang tersimpan di `public/img/villages/{id}.jpg`.
- **Landmark Geografis Akurat:** Foto menampilkan subjek nyata masing-masing desa (misal: Biorock di Pemuteran, kain tenun gringsing di Tenganan, Danau Tamblingan di Gobleg, USAT Liberty di Tulamben, dsb.).
- **Atribusi Terbuka & Legalitas:** Setiap foto dilengkapi nama fotografer dan lisensi Creative Commons (CC BY / CC BY-SA / CC0) yang didokumentasikan di [`docs/IMAGE-CREDITS.md`](docs/IMAGE-CREDITS.md) dan [`docs/IMAGE-AUDIT.md`](docs/IMAGE-AUDIT.md), serta lencana kredit visual pada antarmuka.

### 3. Estimasi Durasi Transit Realistis & Jalur Spasial Terpadu
- **Formula Haversine Terkalibrasi Medan Bali:** Menggunakan pengali kelokan jalan pegunungan Bali ($1.38\times$), kecepatan berkendara rata-rata $35\text{ km/jam}$, dan buffer kedatangan/parkir 5 menit.
- **Kaki Perjalanan Lengkap:**
  - Konektor antar-destinasi di timeline harian (`A ➔ B: ~25 mnt (9.8 km)`).
  - Kaki perjalanan pagi dari koordinat homestay rekomendasi malam sebelumnya.
  - Kaki perjalanan pulang dari destinasi terakhir rute kembali ke pintu kedatangan (Bandara Ngurah Rai atau Pelabuhan Gilimanuk).
  - Peringatan khusus rute panjang ($\ge 3\text{ jam}$) untuk keamanan berkendara wisatawan.
- **Tooltip Interaktif Polyline:** Mengarahkan kursor ke segmen rute di peta langsung menampilkan nama asal, tujuan, estimasi waktu tempuh, dan jarak tempuh.

### 4. Akomodasi Komunitas & Wisata Terdekat per Desa
- **Penginapan Warga:** Setiap desa dilengkapi 2–3 opsi akomodasi lokal (Homestay Warga, Eco Lodge, Bamboo Villa) lengkap dengan tarif transparan per malam dan catatan reservasi adat.
- **Wisata Sekitar (Nearby POIs):** Setiap desa dilengkapi 2–4 daya tarik sekitar (Air Terjun, Pura & Budaya, Trekking, Pesisir, Agrowisata) lengkap dengan jarak (km) dan durasi (menit).
- **Drawer Interaktif:** Tombol pill `[🏡 N Penginapan]` dan `[🌿 N Wisata Sekitar]` yang dapat diperluas di kartu aktivitas tanpa mengaburkan alur utama.
- **Toggle Layer Spasial Peta:** Lapisan opsional untuk menampilkan pin sebaran penginapan (toska) dan wisata sekitar (oranye) di atas peta Leaflet.

### 5. Telemetri Dampak & Kuota Kapasitas Lingkungan
- **Spread Score (0–100):** Mengukur sebaran geografis ke wilayah prioritas pemerataan:
  $$\text{Spread Score} = \left( \frac{1}{N} \sum_{i=1}^{N} W(\text{Regency}_i) \right) \times 100$$
  dengan bobot: Prioritas Buleleng/Karangasem/Jembrana/Bangli ($1.0$), Penyangga Tabanan/Gianyar ($0.5$), Inti Sarbagita ($0.2$).
- **Local Benefit Index (LBI %):** Mengukur porsi estimasi belanja wisatawan yang terserap langsung oleh pelaku lokal (homestay warga, warung kuliner, pemandu Pokdarwis) dengan target $\ge 75\%$.
- **Anti-Overtourism Capacity Quota Guard:** Memantau beban simulasi harian desa ($\ge 92\%$ kapasitas) dan secara cerdas mengalihkan rute ke Desa Penyangga (*Buffer Village*) terdekat guna melindungi daya dukung lingkungan desa.

### 6. Desain Editorial Rendah Beban Kognitif (Low Cognitive Load & De-Slop)
- **Filter Dampak Wilayah Bersih:** Dashboard simulasi ekonomi (`GovernmentBar.tsx`) hanya merender kabupaten yang menerima alokasi rute ($> 0$), dilengkapi catatan elegan untuk kabupaten yang dikecualikan.
- **Pembersihan Repetisi (De-Slop):** Menghapus repetisi teks estimasi yang berlebihan pada kartu metrik (`TelemetryCards.tsx`) dan menyatukannya dalam satu baris penafian yang rapi di bagian bawah.
- **Palet Soft & Earthy:** Nuansa editorial pariwisata hangat dengan kontras standar WCAG AA, kartu bersudut membulat `rounded-xl`, dan tipografi deskripsi aktivitas yang rileks.
- **Transparansi Rumus:** Modal interaktif *"Bagaimana dihitung?"* yang merinci rumus Spread Score, LBI, belanja langsung, dan simulasi kohort wisatawan.

### 7. Ekspor Dokumen PDF Vektor & Aksesibilitas Internasional
- **Ekspor Dokumen PDF A4 Berkualitas Tinggi:** Tombol unduh PDF dengan layout cetak native A4, kop resmi, pencegahan pemotongan kartu (*page-break guard*), dan *Auto-Light Print Guard* ramah tinta.
- **Default Bahasa Inggris (EN) & Saklar Bilingual (ID | EN):** Terbuka langsung dalam antarmuka internasional (EN & USD \$) saat pertama kali diakses, dengan tombol saklar instan ke Bahasa Indonesia (ID & Rp).
- **Peta Spasial Responsif Mobile:** Integrasi `ResizeObserver` dan `invalidateSize()` mencegah masalah tile abu-abu saat beralih tab di layar smartphone.

---

## 📂 Struktur Direktori Proyek

```text
Eco Traveler/
├── data/
│   ├── desa-wisata.json              # Basis data 28 desa wisata, akomodasi, POI, foto, & awig-awig
│   ├── gdp-share.json                # PDRB baseline 9 kabupaten/kota Provinsi Bali
│   └── presets-fallback.json         # Rute deterministik fallback siap pakai
├── docs/
│   ├── DATA-SOURCES.md               # Asal-usul data pariwisata & PDRB resmi
│   ├── DECISIONS.md                  # Log keputusan arsitektural & teknis (T1 - T12)
│   ├── IMAGE-AUDIT.md                # Laporan audit aset visual & penggantian foto asli
│   └── IMAGE-CREDITS.md              # Log atribusi 28 foto asli & lisensi Creative Commons
├── public/
│   └── img/
│       └── villages/                 # Direktori 28 berkas foto asli desa wisata (.jpg)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── narrate/          # Endpoint POST narasi rute AI (Claude 3.5 Sonnet)
│   │   │   │   └── parse-preferences/# Endpoint POST penerjemah preferensi teks bebas AI
│   │   │   └── itinerary/            # Endpoint generasi rute spasial
│   │   ├── globals.css               # Styling Tailwind, print rules A4, & custom Leaflet
│   │   ├── layout.tsx                # Layout root, metadata kompetisi, & Google Fonts
│   │   └── page.tsx                  # Halaman utama aplikasi (UI integrasi)
│   ├── components/
│   │   ├── CalculationFormulasModal.tsx # Modal rincian formula matematis transparansi
│   │   ├── CulturalBriefing.tsx      # Edukasi etika adat, busana pura, & awig-awig desa
│   │   ├── GovernmentBar.tsx         # Dashboard simulasi ekonomi & perbandingan PDRB 9 kabupaten
│   │   ├── ItineraryTimeline.tsx     # Timeline visual, pill transit, foto desa, & drawer penginapan
│   │   ├── LeafletMap.tsx            # Peta Leaflet interaktif, polyline rute, & inspector dock
│   │   ├── TelemetryCards.tsx        # Kartu telemetri Spread Score, LBI, dan belanja warga
│   │   └── TripPlannerForm.tsx       # Formulir input preferensi perjalanan & prompt AI
│   ├── lib/
│   │   ├── ai-engine.ts              # Logika orkestrasi AI & validasi server-side
│   │   ├── i18n.ts                   # Kamus lokalisasi bilingual (ID & EN)
│   │   ├── scoring.ts                # Mesin kalkulasi Spread Score, LBI, & Kuota Lingkungan
│   │   ├── utils.ts                  # Formatter mata uang, Haversine Bali, & proper nouns
│   │   └── village-media.ts          # Metadata visual desa, resolusi foto, & fallback SVG
│   └── types/
│       ├── desa.ts                   # Type definitions DesaWisata, LocalAccommodation, dsb.
│       └── trip.ts                   # Type definitions TripRequest, DayItinerary, Telemetry, dsb.
└── tests/
    ├── ai-validation.test.mjs        # Pengujian validasi schema input/output AI & rate limit
    ├── image-duplicates.test.mjs     # Pengujian keunikan 28 foto fisik, credit, & nol URL stok
    ├── p2-audit.test.mjs             # Pengujian print style, WCAG contrast, & metadata
    ├── scoring.test.mjs              # Pengujian algoritma Spread Score, LBI, & Capacity Guard
    ├── text-capitalization.test.mjs  # Pengujian preservasi proper nouns Bali & keragaman kalimat
    └── ui-ux-refactor.test.mjs       # Pengujian filter kabupaten $0 & de-slop metrik UI
```

---

## 🧪 Pengujian Otomatis (*Automated Testing*)

Proyek ini dilengkapi **30 pengujian unit otomatis (*unit tests*)** menggunakan *native test runner* Node.js untuk menjamin stabilitas fungsional, kepatuhan lisensi, dan integritas data:

```bash
npm test
```

### Rangkuman Test Suites:
1. `tests/ai-validation.test.mjs`: Validasi pembersihan markdown JSON, proteksi stop ID asing, dan validasi skema parameter input pengguna.
2. `tests/image-duplicates.test.mjs`: Memverifikasi ketiadaan URL duplikat, memastikan 28 berkas foto fisik berada di disk dengan ukuran valid (>10 KB), dan setiap desa memiliki atribusi fotografer.
3. `tests/p2-audit.test.mjs`: Memeriksa styling cetak A4 vektor, kontras warna teks kritis, ketersediaan field verifikasi adat, dan metadata kompetisi.
4. `tests/scoring.test.mjs`: Memvalidasi rumus Spread Score, pemenuhan kuota desa Penglipuran ➔ Undisan, konversi mata uang IDR/USD, formula transit Haversine, kelengkapan akomodasi/POI 28 desa, serta baseline PDRB 9 kabupaten/kota (tepat 100%).
5. `tests/text-capitalization.test.mjs`: Memastikan proper nouns adat Bali (UNESCO, Bali Aga, Danau Batur, Gunung Agung, dsb.) tidak mengalami pengecilan huruf, serta keragaman 3 template pembuka kalimat deterministik.
6. `tests/ui-ux-refactor.test.mjs`: Memvalidasi penyaringan kabupaten bernilai \$0 pada visualisasi dampak dan kebersihan label asumsi pada kartu metrik.

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat Sistem
- **Node.js:** Versi 18.17.0 atau yang lebih baru (disarankan Node.js 20+ LTS).
- **NPM:** Versi 9+ atau manajer paket yang kompatibel (pnpm, yarn).

### 2. Kloning Repositori & Instalasi
```bash
git clone https://github.com/Suarma18/Eco-Traveler.git
cd "Eco Traveler"
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas konfigurasi contoh `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan konfigurasikan variabel lingkungan:
```env
# Kunci API Anthropic Claude (Opsional - untuk narasi AI dinamis & parse teks bebas)
# Jika dikosongkan, sistem berjalan otomatis dalam mode Deterministic Spatial Engine
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-5-5

# Kunci API Google Gemini (Opsional - model pendukung)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Kunci API Carto Basemap (Opsional - default fallback otomatis ke OpenStreetMap)
NEXT_PUBLIC_CARTO_BASEMAP_KEY=
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban web di alamat:  
👉 **`http://localhost:3000`**

### 5. Kompilasi & Build Produksi
```bash
npm run build
npm run start
```

---

## 📄 Kebijakan Data, Privasi & Penafian (*Disclaimer*)

- **Bukan Surat Resmi Pemerintah:** Dokumen rencana perjalanan yang dihasilkan platform ini disusun untuk keperluan inovasi kompetisi pariwisata cerdas.
- **Pemodelan Berbasis Asumsi:** Estimasi biaya belanja, alokasi PDRB, dan waktu tempuh merupakan pemodelan matematis berbasis asumsi terbuka dan kajian ilmiah (BPS Bali & Dinas Pariwisata Provinsi Bali).
- **Penghormatan Awig-Awig Adat:** Informasi etika dan hari sakral dikurasi dari catatan desa adat setempat dan terus disempurnakan bersama perwakilan prajuru adat dan pengelola Pokdarwis terkait (*TODO-HUMAN*).

---

## 👥 Tim Pengembang

Dikembangkan dengan dedikasi penuh untuk masa depan pariwisata Bali yang berkelanjutan, berkeadilan spasial, dan beretika.  
**Eco Traveler Team — Baligivation 2026**
