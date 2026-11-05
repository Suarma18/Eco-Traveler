# Log Keputusan Teknis (DECISIONS.md) - Eco Traveler

Dokumen ini mencatat setiap keputusan arsitektural dan teknis yang diambil selama penerapan perbaikan hasil audit lomba AI Web Innovation Challenge (Baligivation 2026 - Bali Smart Society).

---

## [2026-11-05] Inisialisasi Keputusan & T1 (Fitur AI Nyata)

### Keputusan 1: Arsitektur Pemanggilan Anthropic Messages API
- **Konteks:** Sesuai arahan T1, aplikasi membutuhkan fitur AI nyata yang terhubung ke Anthropic Messages API (`https://api.anthropic.com/v1/messages`) untuk (1A) pembuatan narasi rute dan (1B) parsing preferensi teks bebas pengguna.
- **Keputusan:** Menggunakan native `fetch` server-side Node.js tanpa menambah dependensi SDK Anthropic pihak ketiga untuk menjaga bundle tetap ringan. Kunci API `ANTHROPIC_API_KEY` dan model `ANTHROPIC_MODEL` (default: `claude-sonnet-5-5`) hanya dibaca di sisi server (`POST /api/ai/narrate` dan `POST /api/ai/parse-preferences`).
- **Keamanan:** Kunci API sama sekali tidak diekspos ke klien (tidak ada prefix `NEXT_PUBLIC_`).
- **Prinsip Fallback & Zero-Crash:** Jika `ANTHROPIC_API_KEY` tidak disetel atau terjadi timeout/kegagalan jaringan, sistem secara otomatis dan mulus kembali ke narasi deterministik tanpa menampilkan badge "AI" palsu.
- **Pemisahan Peran:** AI tidak pernah menghitung skor pemerataan (Spread Score), retensi lokal (LBI), jarak, waktu tempuh, atau alokasi belanja. Seluruh perhitungan numerik tetap dihitung secara deterministik oleh `src/lib/scoring.ts`.

---

## [2026-11-05] T2: Foto, Duplikasi, dan Placeholder Jujur
- **Konteks:** Ditemukan 14 foto Unsplash yang terduplikasi di beberapa desa dan foto stok yang tidak mencerminkan lanskap desa wisata riil di Bali Utara/Timur/Barat.
- **Keputusan:** Menghapus seluruh duplikasi foto stok. Disediakan struktur folder `public/img/villages/{id}.webp` dengan metadata `image` dan `imageCredit` di `data/desa-wisata.json` untuk verifikasi manusia mendatang.
- **Visual Jujur:** Menggunakan ilustrasi SVG berbasis landscape kearifan lokal (teras sawah, kerajinan tenun, terumbu karang, tambak garam, warisan budaya, kaldera, agro perkebunan, dan hutan lindung) dengan alt text jujur (`Ilustrasi Desa Wisata...`) sehingga tidak menyesatkan juri atau wisatawan.
- **Pemisahan Elemen UI:** Lencana ketinggian (`mdpl`) dipisahkan dari overlay foto ke baris metadata untuk estetika dan hierarki informasi yang bersih.

---

## [2026-11-05] T3: Dashboard Simulasi Dampak & 9 Kabupaten/Kota
- **Konteks:** Dashboard simulasi ekonomi sebelumnya hanya menampilkan 8 kabupaten/kota (Klungkung hilang) dan teks deskripsi mengklaim persentase hanya untuk Buleleng, Karangasem, dan Bangli meskipun rute bisa melewati kabupaten lain.
- **Keputusan:**
  1. Menambahkan seluruh 9 kabupaten/kota Provinsi Bali ke dalam konfigurasi `data/gdp-share.json` dan `BALI_BASELINE_SHARE` di `src/lib/scoring.ts`.
  2. Klungkung dimasukkan dengan nilai PDRB turunan (3.5% dengan penanda `isDerived: true` dan label "(turunan, perlu verifikasi)" serta ditandai `TODO-HUMAN`).
  3. Total porsi PDRB 9 kabupaten/kota adalah tepat 100% (Sarbagita 65.88%, 5 kabupaten lainnya 34.12%).
  4. Deskripsi alokasi belanja rute dibuat dinamis melalui `ecoRouteAllocDesc(activeRegencyNames)` sehingga hanya menyebut kabupaten yang benar-benar dikunjungi dan menerima alokasi belanja pada rute aktif.
  5. Ditambahkan kotak peringatan metodologi (*Methodology Note*) dan catatan kaki sumber data PDRB (BPS Bali 2022 via kajian ilmiah UIN Alauddin Makassar).
  6. Label perbandingan diperjelas menjadi "Porsi PDRB (Status Quo)" vs "Porsi Belanja Rute (Ilustrasi)".
  7. Ditambahkan disclaimer eksplisit untuk pengali kohort wisatawan: pengali 1.000, 10.000, 50.000 mengasumsikan pola belanja identik tanpa memperhitungkan kendala kapasitas fisik desa.

---

## [2026-11-05] T4: Label Estimasi, Penjelasan Rumus, dan Istilah Transparan
- **Konteks:** Angka metrik (Spread Score, Local Retention, Direct Spend) berpotensi disalahpahami sebagai hasil pengukuran real-time di lapangan. Format lama "26/85 wisatawan/hari" tampak seperti data sensor/okupansi live. Istilah LBI dan target ≥75% belum dijelaskan secara transparan.
- **Keputusan:**
  1. **Badge Estimasi Asumsi:** Menambahkan label tegas "Estimasi berbasis asumsi" / "Assumption-based estimate" pada kartu ringkasan skor rute (`TelemetryCards`), dashboard simulasi (`GovernmentBar`), dan bar kapasitas desa.
  2. **Modal Transparansi Rumus (`CalculationFormulasModal`):** Menyediakan tombol "Bagaimana dihitung?" / "How is this calculated?" yang membuka modal penjelasan matematis lengkap untuk:
     - Spread Score: bobot wilayah (Prioritas = 1.0, Transisi = 0.5, Inti Sarbagita = 0.2).
     - Local Economic Retention (LBI): rasio pengeluaran homestay, warung, pemandu lokal, tiket koperasi terhadap total estimasi belanja. Target ≥75% dijelaskan sebagai acuan meminimalkan kebocoran ekonomi (*economic leakage*) dengan penanda `TODO-HUMAN` untuk verifikasi akademis/Disparda.
     - Direct Community Spend: dasar perhitungan akumulasi tarif wajar komponen wisata desa per hari per orang.
     - Ambang Daya Dukung & Proteksi Kuota: definisi daya dukung desa untuk mencegah overtourism, penegasan bahwa beban adalah beban simulasi contoh tanpa sensor IoT live.
  3. **Penyesuaian Istilah Kuota & LBI:**
     - LBI diperluas menjadi: "Retensi Ekonomi Desa (Local Economic Retention, LBI)".
     - "26/85 wisatawan/hari" diubah menjadi format simulasi jujur: "Kapasitas rencana: 85/hari (simulasi beban: 26/hari · 31%)" dan "Kapasitas terpakai: 31% (simulasi)".
     - Menambahkan tooltip penjelasan definisi ambang daya dukung harian desa pada elemen kapasitas.

---

## [2026-11-05] T5: Waktu Tempuh: Kaki Pagi dan Pulang Lengkap
- **Konteks:** Perhitungan waktu tempuh sebelumnya tidak memperhitungkan kaki perjalanan pagi dari homestay malam sebelumnya ke destinasi pertama hari berikutnya, serta kaki perjalanan pulang dari destinasi terakhir hari terakhir ke pintu kepulangan (Bandara Ngurah Rai/Pelabuhan). Selain itu terdapat klaim berlebihan seperti "bebas macet" dan belum ada penanda jika transit melampaui durasi 3 jam.
- **Keputusan:**
  1. **Kaki Pagi (Hari 2+):** Menghitung transit dari koordinat homestay rekomendasi malam sebelumnya ke stop pertama hari berjalan dan menampilkannya sebagai konektor resmi di timeline rute.
  2. **Kaki Pulang (Hari Terakhir):** Menghitung transit dari destinasi terakhir rute kembali ke pintu kedatangan/keberangkatan awal (default: Bandara Ngurah Rai atau pelabuhan asal) serta menggambarkannya pada peta spasial Leaflet (`LeafletMap`).
  3. **Akumulasi Waktu Tempuh Total:** Menghitung total durasi dan jarak tempuh keseluruhan rute dan menampilkannya dalam banner ringkasan di atas timeline.
  4. **Peringatan Perjalanan Panjang (≥ 3 Jam):** Menambahkan penanda `isLongLeg` (`durationMinutes >= 180`) dan chip peringatan lembut "Kaki perjalanan panjang (~X jam), disarankan istirahat di perjalanan" dengan ikon peringatan amber.
  5. **Bahasa Netral & Penghapusan Klaim Berlebihan:** Menghapus seluruh klaim "bebas macet", "jalur pintas tanpa hambatan", dan "traffic-free" dari prompt, UI, dan narasi. Diganti dengan bahasa realistis bahwa rute dirancang menghindari koridor padat Bali Selatan, dengan disclaimer bahwa durasi aktual tetap bergantung pada kondisi jalan lokal dan cuaca.

---

## [2026-11-05] T6: Teks, Huruf Kapital, dan Keragaman Template Deterministik
- **Konteks:** Pemanggilan `.toLowerCase()` pada string deskripsi dan highlights menyebabkan nama diri dan istilah adat ("UNESCO", "Danau Batur", "Gunung Agung", "Bali Aga", "Sungai Unda") tercetak berhuruf kecil. Selain itu, kalimat deskripsi stop deterministik mengulang pola kaku ("Berkunjung ke [Nama]... untuk mengenal... dan berbelanja...") sehingga terasa artifisial saat AI tidak aktif.
- **Keputusan:**
  1. **Preservasi Huruf Kapital Proper Nouns:** Mengimplementasikan fungsi `preserveProperNouns(text)` dan `cleanHighlightPhrase(highlights)` di `src/lib/utils.ts` dengan daftar kamus proper nouns dan istilah adat Bali. Menghapus semua pemanggilan `.toLowerCase()` pada highlights.
  2. **Tiga Pola Template Berbeda:** Menyediakan `generateDeterministicStopDescription` dengan 3 variasi pembuka kalimat berbeda sesuai slot waktu aktivitas (Pagi/Morning, Siang/Afternoon, Sore/Sunset, serta variasi mitigasi overtourism untuk pengalihan desa penyangga).
  3. **Pengujian Otomatis:** Menambahkan rangkaian tes unit di `tests/text-capitalization.test.mjs` untuk memverifikasi preservasi kapitalisasi dan keragaman kalimat.

---

## [2026-11-05] T7: Hapus Klaim "Verified" dan "Official" yang Berlebihan
- **Konteks:** Frasa seperti "28 Verified Tourism Villages" dan "OFFICIAL TRAVEL ITINERARY" berisiko memberi kesan bahwa dokumen dan seleksi desa telah diverifikasi resmi oleh pemerintah atau instansi pengesah eksternal, padahal merupakan kurasi internal tim berbasis data terbuka.
- **Keputusan:**
  1. **Penggantian Frasa:** Mengganti "28 Verified Tourism Villages" menjadi "28 desa wisata terkurasi" (ID) / "28 curated tourism villages" (EN).
  2. **Template Cetak & PDF Jujur:** Mengganti header cetak "OFFICIAL TRAVEL ITINERARY" menjadi "ECO TRAVELER · EQUITABLE TRAVEL ITINERARY" (EN) dan "ECO TRAVELER · RENCANA PERJALANAN BERKEADILAN" (ID).
  3. **Disclaimer Kaki Cetak:** Menambahkan catatan kaki cetak eksplisit: "Disusun oleh Eco Traveler. Dokumen ini bukan surat resmi pemerintah. Skor dan estimasi biaya adalah pemodelan berbasis asumsi."
  4. **Dokumentasi Asal-Usul Data:** Menyusun `docs/DATA-SOURCES.md` yang merinci asal data dari Dinas Pariwisata Provinsi Bali 2025 (Tabel 33) dan PDRB BPS Bali 2022, serta mencatat bagian-bagian yang masih dalam proses verifikasi manusia (`TODO-HUMAN`).

---

## [2026-11-05] T8: Peta: Perbaikan Tile dan Rendering di Mobile/Desktop
- **Konteks:** Pada tampilan mobile, perpindahan tab memicu sebagian tile Leaflet menjadi abu-abu karena ukuran kontainer DOM belum selesai dihitung saat mount. Selain itu pada layar desktop, garis rute sering tertutup atau nomor urut stop tertimpa garis polyline.
- **Keputusan:**
  1. **Invalidasi Ukuran Multitier:** `map.invalidateSize()` diikat ke `ResizeObserver`, event `resize`, dan `orientationchange` dengan jeda debounce (150ms) saat tab mobile "Spatial Map" aktif agar kontainer Leaflet selalu terisi penuh tanpa area abu-abu.
  2. **Hierarki Z-Index Stop vs Garis:** Menetapkan `zIndexOffset={isSelected ? 1500 : 800 + actIdx * 10}` pada pin destinasi dan `zIndexOffset={600}` pada pintu kedatangan sehingga nomor urut (H1.1, H1.2, dsb.) selalu berada di atas seluruh garis polyline dan overlay kawasan padat.
  3. **Garis Casing Kontras Tinggi:** Menambahkan garis dasar pelindung (casing polyline `weight: 6`) di bawah garis utama harian (`weight: 3.5`) agar jalur perjalanan memiliki kontras tajam di atas semua jenis tile (OpenStreetMap, Carto Dark, Carto Light, maupun foto satelit).
  4. **FitBounds Menyeluruh:** Memasukkan koordinat pintu kedatangan/keberangkatan ke dalam `allRouteCoords` dan memanggil `fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })` saat rute dimuat.









---

## [2026-11-05] T9: Ekspor PDF Berbasis Vektor A4 Bersih
- **Konteks:** Ekspor PDF sebelumnya rentan menghasilkan file raksasa berbasis tangkapan layar raster (html2canvas) yang berat, teks tidak dapat diseleksi/dicari, dan boros tinta jika dicetak.
- **Keputusan:**
  1. **Styling Cetak @media print Native:** Menggunakan lembar gaya `@media print` native berstandar A4 portrait (`size: A4 portrait`) dengan margin yang presisi (`12mm 10mm 15mm 10mm`), teks vektor tajam yang dapat diseleksi, dan pencegahan pemotongan kartu (`break-inside: avoid`).
  2. **Auto-Light Print Guard:** Mengalihkan tema sementara ke Light Mode saat `window.print()` dipanggil agar hasil cetak ramah tinta (latar belakang putih bersih, border minimalis, tanpa shadow tebal).
  3. **Penyembunyian Kontrol Interaktif:** Memberikan kelas `.no-print` pada seluruh bilah navigasi, filter pill, tab drawer, formulir, dan tombol aksi peta sehingga dokumen cetak bersih dan rapi.
  4. **Kelengkapan Dokumen:** Mencantumkan ringkasan perjalanan, hari dan destinasi lengkap, estimasi biaya dan waktu tempuh, panduan etika adat, serta catatan kaki penafian dan sumber data resmi.

---

## [2026-11-05] T10: Keterbacaan, Kontras WCAG AA, dan Kepadatan UI
- **Konteks:** Audit menemukan beberapa teks sekunder berukuran terlalu kecil (<11px) atau terpotong elipsis (`truncate`/`line-clamp`) pada informasi penting ("Hari Sakral", "Etika & Busana", "Desa Penyangga", "Homestay warga & koperasi"). Kartu destinasi di timeline juga dirasa terlalu padat.
- **Keputusan:**
  1. **Penghapusan Pemotongan Teks Kritis:** Menghapus `truncate` dan `line-clamp` pada seluruh aturan adat, hari sakral, dan label proteksi desa penyangga di `CulturalBriefing.tsx` dan `TelemetryCards.tsx`.
  2. **Peningkatan Ukuran Font & Kontras Warna (WCAG AA):** Menaikkan ukuran font label sekunder ("ALOKASI AKTIVITAS", "Total estimasi", subteks LBI) ke minimal 12px (`text-xs`) dan memastikan rasio kontras warna terhadap latar belakang gelap maupun terang memenuhi target WCAG AA (≥ 4.5:1).
  3. **Bar Bertumpuk Mini Sebaran Wilayah:** Menambahkan representasi visual *mini stacked bar* di samping teks sebaran wilayah pada `TelemetryCards.tsx` agar distribusi rute terlihat intuitif sekilas.
  4. **Kartu Stop Rapi & Collapsible:** Mengubah rincian etika adat dan batas kuota harian pada kartu stop menjadi collapsible (default tertutup dengan ringkasan 1 baris terbuka) dilengkapi tombol "Rincian Adat & Kuota" / "Adat & Quota Details". Saat dicetak (`@media print`), seluruh rincian tetap dicetak utuh tanpa memerlukan interaksi klik.
  5. **Tooltip Informatif:** Menambahkan tooltip penjelas untuk "Subak Atelier", "Zona Padat", dan "OSM".

---

## [2026-11-05] T11: Catatan Verifikasi Konten Adat (Awig-Awig)
- **Konteks:** Aturan adat (seperti larangan di Sema Wayah Trunyan atau etika di desa-desa Bali Aga) belum diverifikasi langsung oleh prajuru adat/pengelola desa setempat. Klaim sepihak bahwa data telah "terverifikasi" berisiko menurunkan kredibilitas.
- **Keputusan:**
  1. Menambahkan field `adatVerifiedBy` dan `adatVerifiedAt` (default string kosong) pada setiap entri desa di `data/desa-wisata.json`.
  2. Menampilkan catatan penafian kecil pada panel etika adat di timeline dan dock peta Leaflet selama status verifikasi masih kosong: `"Konten adat dikurasi dan sedang diverifikasi bersama pengelola desa (TODO-HUMAN)"` (ID) / `"Customary rules curated from village records; official verification with village customary council in progress (TODO-HUMAN)"` (EN).
  3. Mendokumentasikan seluruh aturan adat spesifik dalam `docs/DATA-SOURCES.md` dengan status memerlukan verifikasi manusia.

---

## [2026-11-05] T12: Detail i18n dan Metadata Kompetisi
- **Konteks:** Layar loading peta masih menggunakan bahasa Indonesia kaku saat pengguna memilih bahasa Inggris. Selain itu, metadata kompetisi masih mencantumkan nama umum ("Bali DigiFest") alih-alih identitas resmi lomba "Baligivation" / "AI Web Innovation Challenge".
- **Keputusan:**
  1. **Layar Loading Peta Bilingual:** Mengekstrak `MapLoadingPlaceholder` di `src/app/page.tsx` yang membaca preferensi bahasa aktif (`localStorage` atau `document.documentElement.lang`) dan menampilkan teks bilingual yang selaras ("Preparing Bali Spatial Atlas…" vs "Menyiapkan Atlas Spasial Bali…").
  2. **Pembaruan Metadata Resmi Kompetisi:** Memperbarui `metadata.keywords` di `src/app/layout.tsx` dengan kata kunci resmi: "Baligivation 2026", "AI Web Innovation Challenge", "Build with AI", "Solver for Bali", dan "Bali Smart Society", disertai penanda `TODO-HUMAN` untuk konfirmasi final nama resmi di poster.
  3. **Metadata Berbasis AI:** Menyelaraskan `meta description` dan OpenGraph tags untuk menegaskan integrasi AI nyata (Claude AI narration) bersama mesin deterministik Subak Spatial Engine.
