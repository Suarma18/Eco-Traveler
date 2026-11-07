<div align="center">
  <img src="public/img/eco-traveler.svg" alt="Eco Traveler Logo" width="110" />
  <h1>Eco Traveler — Equitable Bali Travel Route Planner</h1>
  <p><strong>Platform Perencana Wisata Berkeadilan & Generator Rute Berbasis AI untuk 28 Desa Wisata Bali Luar Sarbagita</strong></p>

  <p>
    <a href="https://route-traveler.vercel.app/"><img src="https://img.shields.io/badge/Build-Passing-brightgreen.svg" alt="Production Build" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14.2.16-black.svg" alt="Next.js" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6-blue.svg" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg" alt="Tailwind CSS" /></a>
    <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4.svg" alt="Google Gemini" /></a>
    <a href="tests/"><img src="https://img.shields.io/badge/Unit%20Tests-39%2F39%20Pass-emerald.svg" alt="Tests" /></a>
  </p>
</div>

---

## 🏆 Informasi Partisipasi Kompetisi

- **Kompetisi:** AI Web Innovation Challenge — Bali DigiFest 2026
- **Tema:** *Build with AI, Solver for Bali*
- **Kategori:** Bali Smart Society
- **Live Deployment:** [https://route-traveler.vercel.app/](https://route-traveler.vercel.app/)

---

## 🧭 Latar Belakang & Masalah (*Problem Statement*)

Provinsi Bali menghadapi tantangan ketimpangan spasial dan ekonomi yang nyata:
1. **Konsentrasi Ekonomi Ekstrem:** Sebanyak **65,88% PDRB Bali** (Kategori Penyediaan Akomodasi & Makan Minum) terkonsentrasi di kawasan Sarbagita (Denpasar, Badung, Gianyar, Tabanan Selatan), menciptakan ketimpangan ekonomi akut antar-wilayah.
2. **Krisis Daya Dukung & *Overtourism*:** Kemacetan parah, krisis air, dan penurunan kualitas ruang hidup terkonsentrasi di koridor selatan Bali (Kuta, Canggu, Seminyak, Sanur).
3. **Potensi Terpendam di Luar Sarbagita:** Sebanyak 28 desa wisata berdaya tarik tinggi di Bali Utara (Buleleng), Bali Timur (Karangasem), Bali Barat (Jembrana), dan Bali Tengah-Utara (Bangli) kekurangan eksposur, akses perencana rute terintegrasi, dan distribusi kunjungan wisatawan yang berimbang.

**Eco Traveler** hadir sebagai perencana perjalanan wisata cerdas (*Solver for Bali*) yang mengoptimalkan **pemerataan wilayah (*spatial equity*)** dan **retensi manfaat ekonomi komunitas lokal (*local economic retention*)** secara transparan, terukur, dan menjunjung tinggi kearifan lokal adat Bali.

---

## ⚡ Fitur Utama & Keunggulan

### 1. Dual-Core AI Architecture (Google Gemini + Subak Spatial Engine)
- **POST `/api/ai/narrate`:** Generator narasi rute dinamis (Google Gemini) yang menyusun:
  - Ringkasan kontekstual *"Mengapa rute ini?"* (2–3 kalimat) yang menjelaskan logika redistribusi spasial rute tersebut.
  - Narasi pengalaman per stop (maksimal 60 kata) dalam bahasa aktif (ID / EN).
- **POST `/api/ai/parse-preferences`:** Kotak dialog teks bebas alami yang menerjemahkan instruksi pengguna menjadi parameter rute spasial secara cerdas.
- **Ekstraksi Multi-Intensi Lengkap:**
  - **Minat Perjalanan (`focus`):** Mengenali tema autentik desa (*Culture, Nature, Culinary, Wellness, Agriculture*).
  - **Penghindaran Keramaian (`avoidCrowds`):** Mengaktifkan pengalihan daya tampung dari desa berbeban tinggi ke desa penyangga yang tenang.
  - **Prioritas Usaha Warga (`prioritizeLocalBusiness`):** Memaksimalkan perputaran dana ke UMKM Pokdarwis dan homestay warga lokal.
  - **Preferensi Berkendara (`drivingPreference`):** Mengelompokkan destinasi secara geografis (*short legs*) guna meminimalkan waktu tempuh di jalan.
  - **Ritme Perjalanan (`pace`):** Membedakan ritme *"relaxed"* (2 perhentian mendalam per hari) vs *"active"* (3 perhentian dinamis).
  - **Batasan Negatif (`excludedFocuses`):** Mendeteksi instruksi pengecualian (misal: *"no temples"* atau *"tanpa pantai"*).
- **Anti-Hallucination Guard Akomodasi (`stay`):** Sistem menerapkan *word boundary check* ketat sehingga penyebutan kata seperti *"village"* tidak akan pernah salah ditafsirkan sebagai *"villa"* mewah. Jika akomodasi tidak secara eksplisit diminta, nilai `stay` tetap `null` dan mempertahankan setelan anggaran pengguna.
- **Subak Semantic NLP Engine (Local Fallback):** Mesin semantik deterministik tanpa dependensi eksternal dengan toleransi salah ketik (*typo-tolerant*, misal: *"relaxaced"* ➔ *Wellness*, *"tedekat"* ➔ *Culinary*) dan *clause boundary isolation* yang mencegah kebocoran negasi.
- **Quota Circuit Breaker:** Jika Google Gemini API mendeteksi batas kuota (HTTP 429), sistem mengaktifkan jeda 60 detik dan **seketika beralih ke Subak Semantic NLP (<5ms)** tanpa membuat aplikasi macet atau menampilkan pesan gagal.
- **Transparansi Evaluasi Batasan:** UI menyajikan laporan evaluasi yang membedakan batasan pasti (*hard constraints*) dari preferensi fleksibel (*soft preferences*), dengan penafian jujur untuk fitur yang didukung parsial (misal: proteksi kuota simulasi tanpa sensor IoT lapangan waktu-nyata).

### 2. Optimasi Rute Spasial Dinamis & Konsumsi Parameter Penuh
- **Penghindaran Desa Padat:** Saat `avoidCrowds` aktif, desa dengan beban simulasi $\ge 70\%$ (seperti Penglipuran yang mencapai $88/100$) menerima penalti skor $-8.0$ dan dialihkan ke Desa Penyangga terdekat (Undisan).
- **Nearest-Neighbor Spatial Sequencing:** Saat preferensi waktu berkendara pendek (*short*) dipilih, destinasi diurutkan menggunakan perhitungan jarak Haversine antar koordinat GPS desa untuk meminimalkan waktu di jalan.
- **Prioritas Retensi Lokal:** Saat `prioritizeLocalBusiness` aktif, belanja harian warga dinaikkan $+18\%$ ke warung dan pemandu warga, serta mengutamakan rekomendasi **Community Homestay** (retensi ekonomi lokal $94\%$).
- **Konsistensi Hari & Malam:** Selalu mematuhi prinsip logis perjalanan: rencana $N$ hari memiliki tepat $N - 1$ malam menginap (hari terakhir tidak dibebani biaya penginapan).

### 3. Koleksi 28 Desa Wisata dengan 100% Foto Otentik & Terverifikasi
- **Bebas Stok Foto Palsu:** 100% dari 28 desa wisata memiliki berkas foto otentik teroptimasi web (~960px, rata-rata 150–350 KB) yang tersimpan di `public/img/villages/{id}.jpg`.
- **Landmark Geografis Nyata:** Menampilkan subjek asli tiap desa (Biorock di Pemuteran, tenun gringsing di Tenganan, Danau Tamblingan di Gobleg, USAT Liberty di Tulamben, dsb.).
- **Atribusi Terbuka & Legalitas:** Setiap foto dilengkapi nama fotografer dan lisensi Creative Commons (CC BY / CC BY-SA / CC0) yang didokumentasikan di [`docs/IMAGE-CREDITS.md`](docs/IMAGE-CREDITS.md) dan [`docs/IMAGE-AUDIT.md`](docs/IMAGE-AUDIT.md), serta lencana kredit visual pada antarmuka.

### 4. Estimasi Durasi Transit Realistis & Jalur Spasial Terpadu
- **Formula Haversine Terkalibrasi Medan Bali:** Menggunakan pengali kelokan jalan pegunungan Bali ($1.38\times$), kecepatan berkendara rata-rata $35\text{ km/jam}$, dan buffer kedatangan/parkir 5 menit.
- **Kaki Perjalanan Lengkap:**
  - Konektor antar-destinasi di timeline harian (`A ➔ B: ~25 mnt (9.8 km)`).
  - Kaki perjalanan pagi dari koordinat homestay rekomendasi malam sebelumnya.
  - Kaki perjalanan pulang dari destinasi terakhir rute kembali ke pintu kedatangan (Bandara Ngurah Rai atau Pelabuhan Gilimanuk).
  - Peringatan khusus rute panjang ($\ge 3\text{ jam}$) untuk keselamatan berkendara wisatawan.
- **Tooltip Interaktif Polyline:** Mengarahkan kursor ke segmen rute di peta langsung menampilkan nama asal, tujuan, estimasi waktu tempuh, dan jarak tempuh.

### 5. Akomodasi Komunitas & Wisata Terdekat per Desa
- **Penginapan Warga:** Setiap desa dilengkapi 2–3 opsi akomodasi lokal (Homestay Warga, Eco Lodge, Bamboo Villa) lengkap dengan tarif transparan per malam dan catatan reservasi adat.
- **Wisata Sekitar (Nearby POIs):** Setiap desa dilengkapi 2–4 daya tarik sekitar (Air Terjun, Pura & Budaya, Trekking, Pesisir, Agrowisata) lengkap dengan jarak (km) dan durasi (menit).
- **Drawer Interaktif:** Tombol pill `[🏡 N Penginapan]` dan `[🌿 N Wisata Sekitar]` yang dapat diperluas di kartu aktivitas tanpa mengaburkan alur utama.
- **Toggle Layer Spasial Peta:** Lapisan opsional untuk menampilkan pin sebaran penginapan (toska) dan wisata sekitar (oranye) di atas peta Leaflet.

### 6. Telemetri Dampak & Kuota Kapasitas Lingkungan
- **Spread Score (0–100):** Mengukur sebaran geografis ke wilayah prioritas pemerataan:
  $$\text{Spread Score} = \left( \frac{1}{N} \sum_{i=1}^{N} W(\text{Regency}_i) \right) \times 100$$
  dengan bobot: Prioritas Buleleng/Karangasem/Jembrana/Bangli/Klungkung ($1.0$), Penyangga Tabanan/Gianyar ($0.5$), Inti Sarbagita ($0.2$).
- **Local Benefit Index (LBI %):** Mengukur porsi estimasi belanja wisatawan yang terserap langsung oleh pelaku lokal (homestay warga, warung kuliner, pemandu Pokdarwis) dengan target $\ge 75\%$.
- **Anti-Overtourism Capacity Quota Guard:** Memantau beban simulasi harian desa ($\ge 70\% - 92\%$ kapasitas) dan secara cerdas mengalihkan rute ke Desa Penyangga (*Buffer Village*) terdekat guna melindungi daya dukung lingkungan desa.

### 7. Desain Editorial Rendah Beban Kognitif (Low Cognitive Load & De-Slop)
- **Filter Dampak Wilayah Bersih:** Dashboard simulasi ekonomi (`GovernmentBar.tsx`) hanya merender kabupaten yang menerima alokasi rute ($> 0$), dilengkapi catatan elegan untuk kabupaten yang dikecualikan.
- **Pembersihan Repetisi (De-Slop):** Menghapus repetisi teks estimasi yang berlebihan pada kartu metrik (`TelemetryCards.tsx`) dan menyatukannya dalam satu baris penafian yang rapi di bagian bawah.
- **Palet Soft & Earthy:** Nuansa editorial pariwisata hangat dengan kontras standar WCAG AA, kartu bersudut membulat `rounded-xl`, dan tipografi deskripsi aktivitas yang rileks.
- **Transparansi Rumus:** Modal interaktif *"Bagaimana dihitung?"* yang merinci rumus Spread Score, LBI, belanja langsung, dan simulasi kohort wisatawan.

### 8. Ekspor Dokumen PDF Vektor & Aksesibilitas Internasional
- **Ekspor Dokumen PDF A4 Berkualitas Tinggi:** Tombol unduh PDF dengan layout cetak native A4, kop resmi, pencegahan pemotongan kartu (*page-break guard*), dan *Auto-Light Print Guard* ramah tinta.
- **Default Bahasa Inggris (EN) & Saklar Bilingual (ID | EN):** Terbuka langsung dalam antarmuka internasional (EN & USD \$) saat pertama kali diakses, dengan tombol saklar instan ke Bahasa Indonesia (ID & Rp).
- **Peta Spasial Responsif Mobile:** Integrasi `ResizeObserver` dan `invalidateSize()` mencegah masalah tile abu-abu saat beralih tab di layar smartphone.

---

## 📂 Struktur Direktori Proyek

```text
Eco Traveler/
├── data/
│   ├── desa-wisata.json              # Basis data 28 desa wisata, akomodasi, POI, foto, & awig-awig
│   ├── gdp-share.json                # PDRB baseline 9 kabupaten/kota Provinsi Bali (BPS Bali 2022)
│   └── presets-fallback.json         # Rute deterministik fallback siap pakai
├── docs/
│   ├── DATA-SOURCES.md               # Asal-usul data pariwisata & PDRB resmi
│   ├── DECISIONS.md                  # Log keputusan arsitektural & teknis (T1 - T12)
│   ├── IMAGE-AUDIT.md                # Laporan audit aset visual & penggantian foto asli
│   └── IMAGE-CREDITS.md              # Log atribusi 28 foto asli & lisensi Creative Commons
├── public/
│   └── img/
│       ├── eco-traveler.svg          # Vektor logo resmi Eco Traveler (master identity)
│       └── villages/                 # Direktori 28 berkas foto asli desa wisata (.jpg)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── narrate/          # Endpoint POST narasi rute AI (Google Gemini)
│   │   │   │   └── parse-preferences/# Endpoint POST ekstraksi multi-intensi AI + Subak NLP
│   │   │   └── itinerary/            # Endpoint generasi rute spasial berkeadilan
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
│   │   └── TripPlannerForm.tsx       # Formulir input preferensi, prompt AI, & badge transparansi
│   ├── lib/
│   │   ├── ai-engine.ts              # Optimasi rute spasial & orkestrasi AI
│   │   ├── gemini.ts                 # Klien Google Gemini API, rate-limit, & quota circuit breaker
│   │   ├── i18n.ts                   # Kamus lokalisasi bilingual (ID & EN)
│   │   ├── scoring.ts                # Mesin kalkulasi Spread Score, LBI, & Kuota Lingkungan
│   │   ├── semantic-fallback.ts      # Subak Semantic NLP engine (offline, clause boundary, typo-tolerant)
│   │   ├── utils.ts                  # Formatter mata uang, Haversine Bali, & proper nouns
│   │   └── village-media.ts          # Metadata visual desa, resolusi foto, & fallback SVG
│   └── types/
│       ├── desa.ts                   # Type definitions DesaWisata, LocalAccommodation, dsb.
│       └── trip.ts                   # Type definitions TripRequest, DayItinerary, Telemetry, dsb.
└── tests/
    ├── ai-validation.test.mjs        # Validasi schema output AI & proteksi ID asing
    ├── image-duplicates.test.mjs     # Pengujian keunikan 28 foto fisik & nol URL stok
    ├── master-task.test.mjs          # Pengujian multi-intensi, anti-halusinasi stay, & optimasi rute
    ├── p2-audit.test.mjs             # Pengujian print style, WCAG contrast, & metadata kompetisi
    ├── scoring.test.mjs              # Pengujian algoritma Spread Score, LBI, & Capacity Guard
    ├── text-capitalization.test.mjs  # Pengujian preservasi proper nouns Bali & keragaman template
    └── ui-ux-refactor.test.mjs       # Pengujian filter kabupaten $0 & de-slop metrik UI
```

---

## 🧪 Pengujian Otomatis (*Automated Testing*)

Proyek ini dilengkapi **39 pengujian unit otomatis (*unit tests*)** menggunakan *native test runner* Node.js untuk menjamin stabilitas fungsional, kepatuhan lisensi, dan integritas data:

```bash
npm test
```

### Rangkuman Test Suites (39/39 Passed):
1. `tests/master-task.test.mjs`:
   - Validasi ekstraksi multi-intensi alami (minat, ritme santai, penghindaran keramaian, belanja UMKM lokal, rute berkendara pendek).
   - Pengujian anti-halusinasi: memastikan `stay` tetap `null` saat pengguna tidak menyebutkan penginapan (memperbaiki bug substring *"village"* ➔ *"villa"*).
   - Pengujian isolasi klausul negasi (*"no temples, nature only"*).
   - Pengujian konsistensi hari & malam ($N$ hari = $N-1$ malam menginap).
   - Verifikasi pengalihan desa padat Penglipuran ➔ Undisan dan kenaikan LBI pada rute spasial.
2. `tests/ai-validation.test.mjs`: Pembersihan markdown JSON, proteksi stop ID asing, dan validasi skema parameter input pengguna.
3. `tests/image-duplicates.test.mjs`: Memverifikasi ketiadaan URL duplikat, memastikan 28 berkas foto fisik berada di disk dengan ukuran valid (>10 KB), dan setiap desa memiliki atribusi fotografer.
4. `tests/p2-audit.test.mjs`: Memeriksa styling cetak A4 vektor, kontras warna teks kritis, ketersediaan field verifikasi adat, dan metadata kompetisi.
5. `tests/scoring.test.mjs`: Memvalidasi rumus Spread Score, pemenuhan kuota desa Penglipuran ➔ Undisan, konversi mata uang IDR/USD, formula transit Haversine, kelengkapan akomodasi/POI 28 desa, serta baseline PDRB 9 kabupaten/kota (tepat 100%).
6. `tests/text-capitalization.test.mjs`: Memastikan proper nouns adat Bali (UNESCO, Bali Aga, Danau Batur, Gunung Agung, dsb.) tidak mengalami pengecilan huruf, serta keragaman template kalimat deterministik.
7. `tests/ui-ux-refactor.test.mjs`: Memvalidasi penyaringan kabupaten bernilai \$0 pada visualisasi dampak dan kebersihan label asumsi pada kartu metrik.

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
# Kunci API Google Gemini (Opsional - untuk narasi AI dinamis & parsing preferensi teks bebas)
# Jika dikosongkan atau kuota habis, sistem otomatis beralih ke Subak Semantic NLP Engine lokal
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

- **Bukan Surat Resmi Pemerintah:** Dokumen rencana perjalanan yang dihasilkan platform ini disusun untuk keperluan inovasi kompetisi pariwisata cerdas Bali DigiFest 2026.
- **Pemodelan Berbasis Asumsi Terbuka:** Estimasi pengeluaran wisatawan, alokasi PDRB, dan waktu tempuh merupakan pemodelan matematis berbasis kajian ilmiah (BPS Provinsi Bali 2022 via Kajian UIN Alauddin 2024 & Profil Desa Wisata Dinas Pariwisata Provinsi Bali).
- **Penghormatan Awig-Awig Adat:** Informasi etika, busana pura, dan hari sakral dikurasi dari catatan desa adat setempat dan terus disempurnakan melalui koordinasi partisipatif bersama prajuru adat dan pengelola Pokdarwis desa.

---

## 👥 Tim Pengembang

Dikembangkan dengan dedikasi penuh untuk masa depan pariwisata Bali yang berkelanjutan, berkeadilan spasial, dan beretika.  
**Eco Traveler Team — AI Web Innovation Challenge Bali DigiFest 2026**
