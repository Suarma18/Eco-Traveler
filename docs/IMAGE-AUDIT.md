# Laporan Audit Gambar (IMAGE-AUDIT.md) - Eco Traveler

Dokumen ini memuat audit lengkap terhadap seluruh aset visual (foto, banner, preset) pada web app Eco Traveler sesuai arahan Tugas 2 (T2).

---

## 1. Identifikasi Masalah Utama
1. **Duplikasi Ekstrem:** Dari 28 desa wisata, terdapat 12 URL Unsplash yang digunakan berulang kali (2 hingga 4 kali per gambar).
2. **Ketidaksesuaian Geografis & Budaya:** Sejumlah foto Unsplash acak menampilkan pemandangan yang tidak sesuai (misalnya danau gaya Eropa untuk Trunyan, pantai dengan pesawat amfibi untuk Kaldera Batur, atau pura Bali Selatan di Tabanan untuk desa di Buleleng/Karangasem).
3. **Kredibilitas Proyek:** Untuk platform pariwisata berkeadilan (*spatial equity*) yang menonjolkan keaslian desa di luar Sarbagita, penggunaan stok foto palsu/duplikat merusak kepercayaan juri dan wisatawan.

---

## 2. Tabel Audit Foto Awal (Sebelum Perbaikan)

| Elemen / Desa | ID Desa | URL Unsplash Awal | Frekuensi | Status Awal |
| :--- | :--- | :--- | :---: | :--- |
| Hero Banner (Header) | `hero-banner` | `...photo-1537996194471...` | 4x | **Duplikat & Perlu Verifikasi Manusia** |
| Preset 1 (Timur & Batur) | `preset-1` | `...photo-1518548419970...` | 3x | **Duplikat & Perlu Verifikasi Manusia** |
| Preset 2 (Barat & Biorock) | `preset-2` | `...photo-1544551763...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Fallback Default | `fallback` | `...photo-1537996194471...` | 4x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Pemuteran | `desa-pemuteran` | `...photo-1544551763...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Sudaji | `desa-sudaji` | `...photo-1537996194471...` | 4x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Sidemen | `desa-sidemen` | `...photo-1518548419970...` | 3x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Penglipuran | `desa-penglipuran` | `...photo-1555400038...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Blimbingsari | `desa-blimbingsari` | `...photo-1573790387...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Munduk | `desa-munduk` | `...photo-1512100356...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Les | `desa-les` | `...photo-1507525428...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Sembiran | `desa-sembiran` | `...photo-1559628233...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Pejarakan | `desa-pejarakan` | `...photo-1506744038...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Ambengan | `desa-ambengan` | `...photo-1501785888...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Gobleg | `desa-gobleg` | `...photo-1470071459...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Tenganan | `desa-tenganan` | `...photo-1558005530...` | 1x | **Perlu Verifikasi Manusia** |
| Desa Amed Purwakerti | `desa-amed-purwakerti` | `...photo-1540202404...` | 1x | **Perlu Verifikasi Manusia** |
| Desa Tulamben | `desa-tulamben` | `...photo-1583212292...` | 1x | **Perlu Verifikasi Manusia** |
| Desa Sibetan | `desa-sibetan` | `...photo-1596040033...` | 1x | **Perlu Verifikasi Manusia** |
| Desa Budakeling | `desa-budakeling` | `...photo-1604999333...` | 1x | **Perlu Verifikasi Manusia** |
| Desa Muncan | `desa-muncan` | `...photo-1536152470...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Timbrah | `desa-timbrah` | `...photo-1555400038...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Trunyan | `desa-trunyan` | `...photo-1506744038...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Undisan | `desa-undisan` | `...photo-1518548419970...` | 3x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Batur Selatan | `desa-batur-selatan` | `...photo-1512100356...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Ekasari | `desa-ekasari` | `...photo-1470071459...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Medewi | `desa-medewi` | `...photo-1507525428...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Gumbrih | `desa-gumbrih` | `...photo-1537996194471...` | 4x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Jatiluwih | `desa-jatiluwih` | `...photo-1536152470...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Wongaya Gede | `desa-wongaya-gede` | `...photo-1501785888...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Taro | `desa-taro` | `...photo-1573790387...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |
| Desa Carangsari | `desa-carangsari` | `...photo-1559628233...` | 2x | **Duplikat & Perlu Verifikasi Manusia** |

---

## 3. Tindakan Perbaikan yang Diterapkan
1. **Pemberhentian Seluruh Stok Foto Unsplash yang Meragukan:**
   - Tidak lagi menggunakan stok foto internet yang tidak bisa diverifikasi keabsahannya.
2. **Sistem Ilustrasi Placeholder Bergradien Jujur & Konsisten:**
   - Dibuat generator vektor SVG data URI beresolusi tinggi dengan palet resmi (Subak Deep Emerald, Warm Terracotta, Marine Ocean, dan Caldera Slate).
   - Setiap desa memiliki ikon kategori lanskap yang akurat:
     - `terraces`: Terasering Subak (Jatiluwih, Sudaji, Muncan)
     - `craft`: Tenun Ikat & Kriya Perak (Sidemen, Tenganan, Budakeling)
     - `reef`: Terumbu Biorock & Bahari (Pemuteran, Tulamben, Amed, Medewi)
     - `salt`: Garam Palung Adat (Les)
     - `heritage`: Arsitektur Bali Aga & Bambu (Penglipuran, Sembiran, Timbrah)
     - `caldera`: Danau & Kaldera Batur (Trunyan, Batur Selatan, Gobleg, Munduk)
     - `agro`: Kakao & Salak Agroforestri (Blimbingsari, Sibetan, Ekasari)
     - `forest`: Hutan Batukaru & Konservasi Lembu (Ambengan, Wongaya Gede, Taro, Carangsari, Gumbrih, Pejarakan)
   - Teks alt dibuat jujur dan eksplisit: misal `"Ilustrasi Desa Wisata Sidemen"` (ID) / `"Illustration of Sidemen Tourism Village"` (EN).
3. **Struktur Penggantian Gambar Asli (Extensibility):**
   - Folder lokal disiapkan di `public/img/villages/`.
   - Jika file `public/img/villages/{villageId}.webp` tersedia atau field `image` terisi di `data/desa-wisata.json`, sistem otomatis menggunakan foto tersebut.
   - Bila belum ada, sistem menampilkan ilustrasi SVG placeholder yang elegan dan konsisten.
4. **Relokasi Badge Ketinggian (mdpl):**
   - Badge `mdpl` dipindahkan keluar dari overlay foto ke baris informasi metadata (`Top Meta Row`), sehingga tidak tertutup atau hilang saat foto diganti.
5. **Uji Otomatis Bebas Duplikasi:**
   - Script pengujian `tests/image-duplicates.test.mjs` dibuat dan dijalankan untuk menjamin tidak ada URL gambar yang duplikat di basis data desa.

---

## 4. Daftar TODO-HUMAN (Pengumpulan Foto Asli)

Pengelola proyek / tim manusia disarankan mengumpulkan foto resmi berlisensi CC-BY atau dokumentasi pribadi untuk 28 desa berikut, lalu menyimpannya ke `public/img/villages/{id}.webp` serta mencatat kreditnya di `docs/IMAGE-CREDITS.md`:

- [ ] `desa-pemuteran.webp` (TODO-HUMAN: Foto struktur Biorock atau Pantai Pemuteran)
- [ ] `desa-sudaji.webp` (TODO-HUMAN: Foto sawah terasering Gandameru / Subak Sudaji)
- [ ] `desa-sidemen.webp` (TODO-HUMAN: Foto lembah tenun Sidemen berlatar Gunung Agung)
- [ ] `desa-penglipuran.webp` (TODO-HUMAN: Foto jalan utama desa adat Penglipuran)
- [ ] `desa-blimbingsari.webp` (TODO-HUMAN: Foto gereja berarsitektur Bali / kebun kakao)
- [ ] `desa-munduk.webp` (TODO-HUMAN: Foto perkebunan cengkeh / kabut perbukitan Munduk)
- [ ] `desa-les.webp` (TODO-HUMAN: Foto proses pembuatan garam palung tradisional Les)
- [ ] `desa-sembiran.webp` (TODO-HUMAN: Foto rumah batu megalitikum Bali Aga Sembiran)
- [ ] `desa-pejarakan.webp` (TODO-HUMAN: Foto hutan mangrove Teluk Terima / Menjangan)
- [ ] `desa-ambengan.webp` (TODO-HUMAN: Foto Terasering Jembong Ambengan)
- [ ] `desa-gobleg.webp` (TODO-HUMAN: Foto panorama Danau Tamblingan dari Gobleg)
- [ ] `desa-tenganan.webp` (TODO-HUMAN: Foto penenun kain gringsing ikat ganda)
- [ ] `desa-amed-purwakerti.webp` (TODO-HUMAN: Foto jukung nelayan Teluk Jemeluk Amed)
- [ ] `desa-tulamben.webp` (TODO-HUMAN: Foto porter wanita selam pantai Tulamben)
- [ ] `desa-sibetan.webp` (TODO-HUMAN: Foto kebun salak Bali Sibetan)
- [ ] `desa-budakeling.webp` (TODO-HUMAN: Foto perajin kriya perak / bale banjar Budakeling)
- [ ] `desa-muncan.webp` (TODO-HUMAN: Foto terasering padi beras merah Muncan)
- [ ] `desa-timbrah.webp` (TODO-HUMAN: Foto bale agung adat Timbrah)
- [ ] `desa-trunyan.webp` (TODO-HUMAN: Foto dermaga Danau Batur / pohon Taru Menyan)
- [ ] `desa-undisan.webp` (TODO-HUMAN: Foto suasana pedesaan lembah Sungai Jinah Undisan)
- [ ] `desa-batur-selatan.webp` (TODO-HUMAN: Foto kaldera lahar hitam Geopark Batur)
- [ ] `desa-ekasari.webp` (TODO-HUMAN: Foto Bendungan Palasari / fermentasi kakao)
- [ ] `desa-medewi.webp` (TODO-HUMAN: Foto pantai berbatu ombak selancar Medewi)
- [ ] `desa-gumbrih.webp` (TODO-HUMAN: Foto kesenian jegog bambu Gumbrih)
- [ ] `desa-jatiluwih.webp` (TODO-HUMAN: Foto lanskap terasering warisan dunia UNESCO)
- [ ] `desa-wongaya-gede.webp` (TODO-HUMAN: Foto Pura Luhur Batukaru di lereng hutan)
- [ ] `desa-taro.webp` (TODO-HUMAN: Foto lembu putih suci Taro)
- [ ] `desa-carangsari.webp` (TODO-HUMAN: Foto monumen pahlawan I Gusti Ngurah Rai / Tukad Ayung)
