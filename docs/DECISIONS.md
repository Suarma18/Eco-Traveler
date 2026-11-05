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
