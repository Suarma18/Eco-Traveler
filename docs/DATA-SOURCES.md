# Asal-Usul & Sumber Data (DATA-SOURCES.md) - Eco Traveler

Dokumen ini mencatat sumber data resmi, metodologi kurasi, dan batasan verifikasi untuk seluruh dataset yang digunakan dalam aplikasi Eco Traveler.

---

## 1. Dataset 28 Desa Wisata Terkurasi Bali
- **Sumber Data Awal:** Dinas Pariwisata Provinsi Bali 2025 (Tabel 33 - `TODO-HUMAN: lengkapi nomor SK/dokumen resmi Disparda Bali`).
- **Cakupan Wilayah:** 28 desa wisata yang difokuskan pada kawasan Bali Utara (Kabupaten Buleleng), Bali Timur (Kabupaten Karangasem & Bangli), dan Bali Barat (Kabupaten Jembrana), ditambah koridor penyangga di Tabanan dan Klungkung.
- **Tujuan Kurasi:** Menghadirkan alternatif destinasi berkualitas tinggi di luar kluster pariwisata padat Sarbagita (Denpasar, Badung, Gianyar selatan) guna mendorong pemerataan ekonomi pariwisata yang berkeadilan.
- **Atribut Per Desa:**
  - Nama desa, kabupaten, koordinat lintang/bujur (diverifikasi terhadap OpenStreetMap).
  - Ketinggian (mdpl / m ASL).
  - Sorotan lanskap & budaya (*highlights*).
  - UMKM / Koperasi desa unggulan (*localUmkm*).
  - Aturan adat & etika kunjungan (*customsNote*, *dressCode*, *sacredDaysNote*).
  - Desa penyangga (*bufferVillageId*) untuk proteksi daya dukung lingkungan.
  - Akomodasi homestay warga (*accommodations*) & daya tarik sekitar (*nearbyAttractions*).

---

## 2. Porsi PDRB & Baseline Disparitas Ekonomi (9 Kabupaten/Kota)
- **Sumber Data PDRB:** Badan Pusat Statistik (BPS) Provinsi Bali tahun 2022, diolah melalui kajian ilmiah UIN Alauddin Makassar (2024).
- **Rincian Porsi PDRB Penyediaan Akomodasi dan Makan Minum:**
  - **Kluster Sarbagita (Status Quo: 65,88% PDRB):**
    - Badung: 38,40% (BPS Bali 2022)
    - Denpasar: 14,20% (BPS Bali 2022)
    - Gianyar: 8,58% (BPS Bali 2022)
    - Tabanan: 4,70% (BPS Bali 2022)
  - **Wilayah Sasaran Pemerataan (34,12% PDRB):**
    - Buleleng: 11,40% (BPS Bali 2022)
    - Karangasem: 7,80% (BPS Bali 2022)
    - Bangli: 6,10% (BPS Bali 2022)
    - Jembrana: 5,32% (BPS Bali 2022)
    - Klungkung: 3,50% (`isDerived: true`, `TODO-HUMAN: verifikasi angka definitif BPS Bali`)
  - **Total 9 Kabupaten/Kota:** Tepat 100,00%

---

## 3. Batasan dan Status Verifikasi Lapangan (`TODO-HUMAN`)
Eco Traveler secara jujur membedakan data yang telah terkurasi dengan data yang masih memerlukan verifikasi langsung di lapangan:
1. `TODO-HUMAN`: **Verifikasi Awig-Awig Desa Adat:**
   Aturan adat yang dimuat dikurasi dari publikasi Pokdarwis dan literatur budaya setempat. Verifikasi langsung bersama Prajuru Adat / Bendesa Adat per desa masih berlangsung (`adatVerifiedBy`, `adatVerifiedAt`).
2. `TODO-HUMAN`: **Tarif & Ketersediaan Homestay:**
   Kisaran tarif homestay warga (Rp 150.000–350.000) adalah tarif wajar standar desa wisata percontohan. Wisatawan disarankan mengonfirmasi langsung kepada narahubung Pokdarwis setempat sebelum kunjungan.
3. `TODO-HUMAN`: **Target Retensi Lokal (LBI ≥ 75%):**
   Ambang 75% adalah target acuan standar literatur pariwisata berbasis masyarakat (*Community-Based Tourism*) untuk menekan kebocoran ekonomi (*economic leakage*), perlu sinkronisasi dengan target resmi Disparda Bali.
4. `TODO-HUMAN`: **Kapasitas Rencana:**
   Angka kapasitas harian (misal 85/hari) adalah batas daya dukung simulasi untuk memicu mekanisme pengalihan Desa Penyangga, bukan sensor okupansi IoT *live*.

