# Eco Traveler — AI Redistributive Travel Planner for Bali

**Target Kompetisi:** Bali DigiFest 2026 – AI Web Innovation Challenge  
**Bidang:** Bali Smart Society  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React-Leaflet, Google Gemini 1.5 Flash + Deterministic Fallback Engine

---

## Ringkasan Solusi

**Eco Traveler** adalah perencana perjalanan wisata cerdas yang mengoptimalkan **pemerataan wilayah (*spatial equity*)** dan **retensi manfaat ekonomi lokal (*local benefit retention*)** ke Desa Wisata di Bali Utara (Buleleng), Bali Timur (Karangasem), Bali Barat (Jembrana), dan Bali Tengah-Utara (Bangli), guna mengatasi konsentrasi ekonomi (65,88% PDRB di Sarbagita) dan *overtourism* di Bali Selatan.

---

## Fitur Utama (Sesuai PRD v1.0.0)

1. **Redistributive AI Travel Planner (`/api/itinerary` & `src/lib/ai-engine.ts`)**
   - Mengintegrasikan **Google Gemini 1.5 Flash** dengan *Structured JSON Output* dan dilengkapi **Deterministic Fallback Engine** (`data/presets-fallback.json` + algoritma koridor geografis bebas *backtracking*) yang menjamin *zero-crash* ($\le 100\text{ ms}$) saat pengujian juri meskipun tanpa kunci API.
   - Membatasi ruang rekomendasi pada **28 Desa Wisata Terverifikasi** (`data/desa-wisata.json`) dan mengunci minimal **70% durasi kegiatan** di kabupaten prioritas pemerataan.
2. **Spatial Mapping & Day-by-Day Route Visualizer (`src/components/LeafletMap.tsx`)**
   - Peta interaktif React-Leaflet (*Client-Only Dynamic Import*) dengan pin berkode warna harian (Hari 1: Biru, Hari 2: Hijau, Hari 3: Jingga, Hari 4: Terakota), *polyline* rute antar-desa, penanda pintu masuk (Bandara Ngurah Rai / Pelabuhan Gilimanuk), serta *layer* 28 Desa Wisata Disparda.
3. **Heuristic Impact & Equity Telemetry (`src/lib/scoring.ts` & `src/components/TelemetryCards.tsx`)**
   - **Spread Score (0–100):** $\text{Spread Score} = \left( \frac{1}{N} \sum_{i=1}^{N} W(\text{Regency}_i) \right) \times 100$ dengan bobot wilayah $W$: Badung/Denpasar ($0.2$), Gianyar/Tabanan ($0.5$), Buleleng/Karangasem/Jembrana/Bangli ($1.0$).
   - **Local Benefit Index (LBI %):** Proporsi belanja homestay warga, warung lokal, dan pemandu Pokdarwis terhadap total biaya harian (Target $\ge 75\%$).
   - **Anti-Overtourism Capacity Quota Guard (FR-06):** Mengalihkan rute secara otomatis ke Desa Penyangga (*Buffer Village*) terdekat apabila beban kunjungan harian suatu desa melampaui ambang kuota.
4. **Regional Impact Simulation Dashboard (`src/components/GovernmentBar.tsx`)**
   - Simulasi perbandingan pangsa PDRB Status Quo (Sarbagita 65,88%) vs distribusi rute Eco Traveler per Kabupaten dengan pengali skala adopsi (1 hingga 50.000 wisatawan).
5. **Contextual Adat & Awig-Awig Briefing (`src/components/CulturalBriefing.tsx`)**
   - Panduan busana pura (*kamen* & selendang), pantangan adat (*cuntaka*, *piodalan*), serta aturan ekologis subak dan konservasi laut (DPL Adat) spesifik per desa.

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
   Isi `GEMINI_API_KEY` jika ingin menggunakan generasi langsung dari Google Gemini 1.5 Flash. Jika dikosongkan, sistem otomatis berjalan dalam **Zero-Crash Deterministic Fallback Mode**.

3. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban.

4. **Verifikasi Build Produksi:**
   ```bash
   npm run build
   npm run start
   ```

