import { DesaWisata } from "@/types/desa";
import { ItineraryResponse, TimeSlot } from "@/types/trip";
import { DESA_BY_ID, PRIORITY_REGENCIES } from "@/lib/scoring";
import {
  Locale,
  formatStayPriceRange,
  generateDeterministicStopDescription,
  cleanHighlightPhrase,
  preserveProperNouns,
} from "@/lib/utils";

export const UI_TEXT = {
  id: {
    brandSubtitle: "Peta Spasial & Perencana Rute Desa Wisata Bali",
    skipToContent: "Lewati ke konten utama",
    tabAtlas: "Eksplorasi Rute & Peta",
    tabAtlasShort: "Rute",
    tabMapShort: "Peta Atlas",
    tabSimulation: "Simulasi Dampak Regulasi",
    tabSimShort: "Simulasi",
    downloadPdfFull: "Unduh Rencana Perjalanan (PDF)",
    downloadPdfShort: "Cetak / PDF",
    pdfExportTitle: "Cetak & Ekspor Rencana Perjalanan",
    pdfExportDesc:
      "Bawa rencana perjalanan ini dalam dokumen PDF luring (offline) dengan estimasi waktu tempuh dan etika adat Awig-Awig.",
    readyForJourney: "Siap Menjelajahi Bali yang Berkeadilan?",
    readyForJourneyDesc:
      "Ekspor seluruh rencana perjalanan ke format PDF rapi untuk panduan navigasi dan reservasi homestay selama di perjalanan.",
    printHeaderTitle: "ECO TRAVELER · DOKUMEN PERJALANAN RESMI",
    printHeaderSub:
      "Rencana Rute Pemerataan Ekonomi & Pelestarian Desa Adat Bali",
    printGeneratedOn: "Tanggal Cetak:",
    printDirectSpend: "Belanja Langsung Komunitas:",
    printLbiRetention: "Retensi Ekonomi Lokal:",
    printArrivalGate: "Pintu Kedatangan:",
    themeLight: "Terang",
    themeDark: "Gelap",
    heroBadge: "28 Desa Wisata · Bali Smart Society",
    engineAi: "Gemini Spatial AI",
    engineAiPlus: "Mesin rute + AI",
    engineDeterministic: "Mesin Rute Deterministik",
    aiNarrativeBadge: "Narasi disusun AI",
    aiStopBadge: "Narasi AI",
    aiDisclaimer:
      "Dibuat AI, bisa keliru. Skor, jarak, dan biaya dihitung mesin rute.",
    aiCustomizeTitle: "Sesuaikan dengan AI",
    aiCustomizePlaceholder:
      "Misal: lebih santai, tambah kuliner, hindari jalan terlalu jauh… (maks 300 karakter)",
    aiCustomizeSubmit: "Sesuaikan Rute",
    aiCustomizing: "Menganalisis permintaan…",
    aiChangePrefix: "Parameter Diperbarui:",
    aiNoChangeNotice:
      "Tidak ada parameter yang perlu diubah dari permintaan Anda.",
    heroTitle: "Perencana Rute Wisata Berkeadilan Bali",
    heroDesc:
      "Susun rute perjalanan ke desa-desa di Bali Utara, Timur, dan Barat. Biaya menginap, makan siang, dan pemandu langsung diterima oleh warga serta koperasi desa setempat.",
    routeSummaryDays: (days: number) => `Rencana Perjalanan ${days} Hari`,
    arrivalGatePrefix: "Titik Masuk:",
    footerLeft: "Eco Traveler · Bali Smart Society",
    footerRight: "Dataset 28 Desa Wisata Provinsi Bali",
    loadingMapTitle: "Memuat Peta Desa Wisata Bali…",
    loadingMapSubtitle:
      "Menyiapkan koordinat 28 desa, poligon kepadatan, dan jalur harian.",
    // Form
    quickScenariosTitle: "Kurasi Ekspedisi Cepat",
    quickScenariosHint: "Klik untuk muat instan",
    scenario1Title: "Timur & Kaldera Batur (3H)",
    scenario1Sub: "Sidemen · Undisan · Tejakula",
    scenario2Title: "Lintas Barat & Biorock (4H)",
    scenario2Sub: "Jembrana · Pemuteran · Munduk",
    durationLabel: "Durasi Perjalanan",
    dayUnit: "Hari",
    arrivalLabel: "Pintu Kedatangan",
    interestsLabel: "Fokus Pengalaman Desa",
    selectedCount: (n: number) => `${n} dipilih`,
    budgetLabel: "Preferensi Menginap & Anggaran",
    capacityGuardCheck:
      "Aktifkan proteksi kuota & pengalihan Desa Penyangga",
    submitLoading: "Menyusun rute…",
    submitButton: "Susun Rute Pemerataan",
    // Telemetry
    spreadScoreTitle: "Indeks Pemerataan Wilayah",
    outsideSouthBali: "Luar Bali Selatan:",
    routeSuffix: "Rute",
    lbiTitle: "Retensi Ekonomi Desa (Local Economic Retention, LBI)",
    lbiTarget: "Target ≥75%",
    lbiSub: "Homestay warga, koperasi & warung lokal",
    directSpendTitle: "Belanja Langsung ke Warga",
    totalEstPrefix: "Total estimasi:",
    bufferActive: (n: number) => `${n} Desa Penyangga Aktif`,
    quotaSafe: "Kapasitas Rencana Aman",
    simPdrbBtn: "Simulasi PDRB",
    regionalShareLabel: "Sebaran Wilayah:",
    openSimDashboard: "Buka Dashboard Simulasi Kabupaten",
    assumptionBadge: "Estimasi berbasis asumsi",
    howCalculatedBtn: "Bagaimana dihitung?",
    formulaModalTitle: "Metodologi & Rumus Perhitungan",
    formulaModalSubtitle:
      "Transparansi model matematis deterministik Subak Spatial Engine",
    formulaNotice:
      "Semua skor, rasio retensi, dan estimasi belanja merupakan hasil pemodelan matematis berbasis bobot wilayah dan asumsi standar komponen wisata, bukan data sensor okupansi lapangan waktu-nyata.",
    spreadScoreFormulaTitle: "1. Indeks Pemerataan Wilayah (Spread Score)",
    spreadScoreFormulaMath:
      "Spread Score = ( (1 / N) * Σ W(Kabupaten_i) ) * 100",
    spreadScoreFormulaDesc:
      "Mengukur sejauh mana rute mendistribusikan kunjungan ke luar kawasan wisata padat Bali Selatan (Sarbagita). Bobot kabupaten: W = 1.0 untuk Wilayah Prioritas (Buleleng, Karangasem, Bangli, Jembrana, Klungkung); W = 0.5 untuk Zona Transisi (Tabanan, Gianyar); W = 0.2 untuk Pusat Keramaian (Badung, Denpasar).",
    lbiFormulaTitle: "2. Retensi Ekonomi Desa (Local Economic Retention, LBI)",
    lbiFormulaMath:
      "LBI = (Belanja Warga Lokal / Total Estimasi Belanja) * 100%",
    lbiFormulaDesc:
      "Mengukur persentase pengeluaran wisatawan yang langsung tinggal di desa wisata (akomodasi homestay warga, kuliner warung lokal/KWT, pemandu Pokdarwis, donasi/tiket koperasi desa). Target ≥75% bertujuan meminimalkan kebocoran ekonomi (economic leakage) ke luar desa (TODO-HUMAN: ambang 75% perlu diverifikasi dengan standar akademis pariwisata berkelanjutan atau Disparda Bali).",
    directSpendFormulaTitle: "3. Belanja Langsung ke Warga (Direct Community Spend)",
    directSpendFormulaDesc:
      "Dihitung dari akumulasi tarif wajar komponen wisata desa di data desa wisata (akomodasi homestay Rp 150rb–350rb, kuliner lokal Rp 35rb–75rb, pemandu lokal Rp 100rb–250rb, donasi/tiket koperasi Rp 15rb–30rb per orang per hari). Total untuk rute dikalikan jumlah hari perjalanan.",
    quotaFormulaTitle:
      "4. Ambang Daya Dukung & Proteksi Kuota (Capacity Quota Guard)",
    quotaFormulaDesc:
      "Batas daya dukung harian desa untuk mencegah overtourism, ditentukan oleh kesiapan pengelola dan kapasitas fisik desa. Angka kuota (contoh: 85/hari) dan beban (contoh: 26/hari) dalam aplikasi adalah beban contoh dalam simulasi perencana, bukan sensor okupansi real-time lapangan. Jika beban simulasi mencapai ≥92%, rute secara otomatis dialihkan ke Desa Penyangga (Buffer Village) terdekat.",
    quotaTooltip:
      "Batas daya dukung harian desa untuk mencegah overtourism, ditentukan oleh kesiapan pengelola dan kapasitas fisik desa. Estimasi berbasis asumsi simulasi.",
    // Timeline
    showingDayFocus: (d: number) => `Menampilkan fokus rute Hari ${d}`,
    showAllDays: (total: number) => `Tampilkan Semua Hari (${total}H)`,
    villagePointsCount: (n: number) => `${n} Titik Desa Wisata Mandiri`,
    activityAllocLabel: "Alokasi Aktivitas",
    bufferBadge: "Desa Penyangga",
    customsNotePrefix: "Etika Adat:",
    viewOnMapBtn: "Lihat di Peta",
    communityStayPrefix: (d: number) => `Akomodasi Warga (Malam H${d}):`,
    // Map
    allDaysBtn: (n: number) => `Semua (${n}H)`,
    dayBtn: (n: number) => `Hari ${n}`,
    villagesLayerBtn: "28 Desa",
    hotspotZoneBtn: "Zona Padat",
    switchBasemapLabel: "Ganti gaya peta dasar",
    hotspotPopupTitle: "Zona Padat Bali Selatan (65,88% PDRB)",
    hotspotPopupDesc:
      "Koridor Kuta, Canggu, dan Seminyak mengalami kepadatan lalu lintas tinggi. Rute Anda dialihkan ke desa wisata di Bali Utara, Timur, dan Barat.",
    homestayNightPrefix: "Homestay ~",
    nightSuffix: "/malam",
    arrivalPopupLabel: "Pintu Kedatangan",
    spendToLocals: "Belanja ke Warga:",
    quotaFilled: (pct: number) => `Kapasitas terpakai: ${pct}% (simulasi)`,
    awigAwigPrefix: "Awig-Awig Desa:",
    prevStopLabel: "Destinasi sebelumnya",
    nextStopLabel: "Destinasi berikutnya",
    minimizePanelLabel: "Kecilkan panel",
    expandPanelLabel: "Perluas detail desa",
    // Transit & Durasi Perjalanan
    transitTravelTime: "Waktu Tempuh",
    transitFromGate: (gate: string) => `Dari ${gate}`,
    transitToStay: "Menuju Homestay Warga",
    transitFromPrev: (summary: string) => `${summary} dari titik sebelumnya`,
    transitRoadEstimate: "Estimasi Jalur Darat",
    morningTransitFromStay: (stayName: string) =>
      `Dari ${stayName} (Malam sebelumnya)`,
    returnTransitToGate: (gate: string) =>
      `Kembali ke ${gate} (Pintu Keberangkatan)`,
    longLegWarning: (duration: string) =>
      `Kaki perjalanan panjang (~${duration}), disarankan istirahat di perjalanan.`,
    totalTripTransit: (duration: string, distance: string) =>
      `Total durasi perjalanan: ~${duration} (${distance})`,
    roadConditionNotice:
      "Waktu tempuh dihitung dengan estimasi jalur darat realistis menghindari koridor padat Bali Selatan. Waktu aktual bergantung pada cuaca dan kondisi jalan lokal.",
    // Penginapan & Wisata Terdekat
    tabOverview: "Ringkasan",
    tabStays: (count: number) => `Penginapan (${count})`,
    tabAttractions: (count: number) => `Wisata Sekitar (${count})`,
    localStaysTitle: "Penginapan di Daerah Ini",
    nearbyAttractionsTitle: "Wisata & Daya Tarik Terdekat",
    staysCountPill: (count: number) => `🏡 ${count} Penginapan Warga`,
    attractionsCountPill: (count: number) => `🌿 ${count} Wisata Terdekat`,
    perNightLabel: "/malam",
    distanceFromVillage: (mins: number, km: string) =>
      `~${mins} mnt (${km}) dari desa`,
    stayBookingNoteLabel: "Catatan Reservasi:",
    emptyStays: "Belum ada daftar penginapan tambahan di area ini.",
    emptyAttractions: "Belum ada daftar wisata sekitar di area ini.",
    layerStaysBtn: "Penginapan",
    layerAttractionsBtn: "Wisata Sekitar",
    featuresLabel: "Fasilitas & Suasana:",
    // Cultural Briefing
    etiquetteHeader: "Panduan Etika Adat Desa (Awig-Awig)",
    etiquetteSub:
      "Aturan busana pura, pantangan adat, dan pelestarian subak setempat",
    relatedVillagesBadge: (n: number) => `${n} Desa Terkait`,
    dressAndEtiquetteLabel: "Etika & Busana:",
    sacredDaysLabel: "Hari Sakral:",
    // Government Bar
    govBadge: "Simulasi Kebijakan Pemerataan Ekonomi Bali",
    govTitle: "Simulasi Dampak per Kabupaten/Kota",
    govSubtitle:
      "Perbandingan ilustratif porsi PDRB wilayah (status quo) dengan distribusi belanja langsung dari rute Eco Traveler saat ini.",
    closeModalLabel: "Tutup rincian sebaran",
    statusQuoTitle: "Porsi PDRB Wilayah (Status Quo)",
    statusQuoDesc:
      "Terkonsentrasi di Bali Selatan (Badung, Denpasar, Gianyar, Tabanan: 65,88%).",
    ecoRouteAllocTitle: "Porsi Belanja Rute Ini (Ilustrasi)",
    ecoRouteAllocDesc: (regencies: string[]) =>
      regencies.length > 0
        ? `Mengalir langsung ke desa wisata di ${regencies.join(", ")}.`
        : "Belum ada alokasi belanja langsung ke kabupaten prioritas.",
    econInjectionTitle: (cohortStr: string) =>
      `Injeksi Ekonomi (${cohortStr} Turis)`,
    econInjectionDesc: (perTouristStr: string) =>
      `Setara ${perTouristStr}/wisatawan ke usaha desa & homestay warga.`,
    cohortScaleLabel: "Skala Simulasi Jumlah Wisatawan:",
    cohortDisclaimer:
      "Perkalian linear dari satu rute contoh, bukan prakiraan ekonomi makro.",
    touristUnit: "Wisatawan",
    statusQuoBar: "Porsi PDRB (Status Quo):",
    thisRouteBar: "Porsi Belanja Rute (Ilustrasi):",
    methodologyNote:
      "Catatan Metodologi: Porsi PDRB wilayah (status quo) dan porsi belanja rute ini bukan padanan langsung. Simulasi bersifat ilustratif untuk menunjukkan pengalihan belanja wisata.",
    gdpDataSource:
      "Sumber: BPS Provinsi Bali (2022, dikutip dari Jurnal UIN Alauddin). Data tahun 2022, perlu pembaruan.",
    derivedLabel: "turunan, perlu verifikasi",
  },
  en: {
    brandSubtitle: "Spatial Atlas & Fair-Trade Route Planner for Bali",
    skipToContent: "Skip to main content",
    tabAtlas: "Route & Spatial Atlas",
    tabAtlasShort: "Route Plan",
    tabMapShort: "Spatial Map",
    tabSimulation: "Policy Impact Simulation",
    tabSimShort: "Impact Sim",
    downloadPdfFull: "Download Itinerary (PDF)",
    downloadPdfShort: "Print / PDF",
    pdfExportTitle: "Export & Print Itinerary",
    pdfExportDesc:
      "Keep this itinerary handy as an offline PDF complete with transit estimates and customary Awig-Awig rules.",
    readyForJourney: "Ready for Your Fair-Trade Bali Journey?",
    readyForJourneyDesc:
      "Export your complete day-by-day route to an ink-friendly offline PDF for effortless navigation and village homestay bookings.",
    printHeaderTitle: "ECO TRAVELER · OFFICIAL TRAVEL ITINERARY",
    printHeaderSub:
      "Equitable Regional Redistribution Plan & Customary Bali Village Guide",
    printGeneratedOn: "Generated On:",
    printDirectSpend: "Direct Community Spend:",
    printLbiRetention: "Local Economic Retention:",
    printArrivalGate: "Arrival Gate:",
    themeLight: "Light",
    themeDark: "Dark",
    heroBadge: "28 Curated Villages · Bali Smart Society",
    engineAi: "Gemini Spatial AI",
    engineAiPlus: "Spatial Engine + AI",
    engineDeterministic: "Deterministic Spatial Engine",
    aiNarrativeBadge: "AI-Generated Narrative",
    aiStopBadge: "AI Narrative",
    aiDisclaimer:
      "AI-generated, may contain inaccuracies. Scores, distance, and costs are computed by the spatial engine.",
    aiCustomizeTitle: "Customize with AI",
    aiCustomizePlaceholder:
      "e.g., more relaxed pace, add culinary, avoid long drives… (max 300 chars)",
    aiCustomizeSubmit: "Apply with AI",
    aiCustomizing: "Analyzing request…",
    aiChangePrefix: "Updated Parameters:",
    aiNoChangeNotice:
      "No parameters needed adjustment from your prompt.",
    heroTitle: "Equitable Bali Village Route Planner",
    heroDesc:
      "Plan sustainable journeys across North, East, and West Bali, avoiding congested South Bali corridors. Your homestay, lunch, and local guide spending goes directly to village families and subak cooperatives.",
    routeSummaryDays: (days: number) => `${days}-Day Travel Itinerary`,
    arrivalGatePrefix: "Arrival Gate:",
    footerLeft: "Eco Traveler · Bali Smart Society",
    footerRight: "28 Verified Tourism Villages Dataset",
    loadingMapTitle: "Loading Bali Spatial Village Atlas…",
    loadingMapSubtitle:
      "Preparing 28 village coordinates, density zones, and daily trails.",
    // Form
    quickScenariosTitle: "Quick Expedition Presets",
    quickScenariosHint: "Tap to load instantly",
    scenario1Title: "East Valley & Batur Caldera (3D)",
    scenario1Sub: "Sidemen · Undisan · Tejakula",
    scenario2Title: "West Coast & Biorock Reef (4D)",
    scenario2Sub: "Jembrana · Pemuteran · Munduk",
    durationLabel: "Trip Duration",
    dayUnit: "Days",
    arrivalLabel: "Arrival Gate",
    interestsLabel: "Village Experience Focus",
    selectedCount: (n: number) => `${n} selected`,
    budgetLabel: "Stay Preference & Daily Budget (USD)",
    capacityGuardCheck:
      "Enable daily quota guard & Buffer Village redirection",
    submitLoading: "Building route…",
    submitButton: "Generate Equitable Route",
    // Telemetry
    spreadScoreTitle: "Regional Spread Score",
    outsideSouthBali: "Outside South Bali:",
    routeSuffix: "of Route",
    lbiTitle: "Local Economic Retention (LBI)",
    lbiTarget: "Target ≥75%",
    lbiSub: "Village homestays, cooperatives & local warungs",
    directSpendTitle: "Direct Community Spend",
    totalEstPrefix: "Total est. trip:",
    bufferActive: (n: number) => `${n} Buffer Village Redirects`,
    quotaSafe: "Within Planned Capacity",
    simPdrbBtn: "GDP Simulation",
    regionalShareLabel: "Regional Share:",
    openSimDashboard: "Open Regency Impact Dashboard",
    assumptionBadge: "Assumption-based estimate",
    howCalculatedBtn: "How is this calculated?",
    formulaModalTitle: "Calculation Formulas & Methodology",
    formulaModalSubtitle:
      "Mathematical transparency for the Subak Spatial Engine deterministic model",
    formulaNotice:
      "All scores, retention ratios, and spend estimates are mathematical model outputs based on regional weights and standard tourism component assumptions, not real-time live field sensor data.",
    spreadScoreFormulaTitle: "1. Regional Spread Score",
    spreadScoreFormulaMath:
      "Spread Score = ( (1 / N) * Σ W(Regency_i) ) * 100",
    spreadScoreFormulaDesc:
      "Measures how effectively the route distributes tourism outside congested South Bali (Sarbagita). Regency weights: W = 1.0 for Priority Regencies (Buleleng, Karangasem, Bangli, Jembrana, Klungkung); W = 0.5 for Transition Zones (Tabanan, Gianyar); W = 0.2 for Core Hubs (Badung, Denpasar).",
    lbiFormulaTitle: "2. Local Economic Retention (LBI)",
    lbiFormulaMath:
      "LBI = (Direct Local Community Spend / Total Estimated Trip Spend) * 100%",
    lbiFormulaDesc:
      "Measures the percentage of tourist spending directly retained by village residents (village homestays, local warung dining, Pokdarwis guides, cooperative/BUMDes entry tickets). The ≥75% target aims to minimize economic leakage outside rural villages (TODO-HUMAN: verify 75% target benchmark against sustainable tourism literature or Bali Tourism Board standards).",
    directSpendFormulaTitle: "3. Direct Community Spend",
    directSpendFormulaDesc:
      "Calculated from the cumulative fair-rate components in the village dataset (homestay Rp 150k–350k, local warung meals Rp 35k–75k, local guides Rp 100k–250k, cooperative entry Rp 15k–30k per person per day), multiplied across trip days.",
    quotaFormulaTitle: "4. Carrying Capacity Limit & Quota Guard",
    quotaFormulaDesc:
      "Daily carrying capacity limit to prevent overtourism, determined by management readiness and physical village capacity. Quota figures (e.g. 85/day) and load figures (e.g. 26/day) are illustrative simulation loads in the planner, not real-time live sensor data. When simulated load reaches ≥92%, the itinerary automatically redirects to the nearest Buffer Village.",
    quotaTooltip:
      "Daily carrying capacity limit to prevent overtourism, determined by management readiness and physical village capacity. Assumption-based simulation estimate.",
    // Timeline
    showingDayFocus: (d: number) => `Showing focused route for Day ${d}`,
    showAllDays: (total: number) => `Show All Days (${total}D)`,
    villagePointsCount: (n: number) => `${n} Community Village Stops`,
    activityAllocLabel: "Activity Spend",
    bufferBadge: "Buffer Village",
    customsNotePrefix: "Village Etiquette:",
    viewOnMapBtn: "View on Map",
    communityStayPrefix: (d: number) => `Community Stay (Night ${d}):`,
    // Map
    allDaysBtn: (n: number) => `All (${n}D)`,
    dayBtn: (n: number) => `Day ${n}`,
    villagesLayerBtn: "28 Villages",
    hotspotZoneBtn: "South Hotspot",
    switchBasemapLabel: "Switch basemap style",
    hotspotPopupTitle: "South Bali Congested Zone (65.88% GDP)",
    hotspotPopupDesc:
      "The Kuta, Canggu, and Seminyak corridor faces heavy traffic congestion. Your route redirects spending to North, East, and West Bali villages.",
    homestayNightPrefix: "Homestay ~",
    nightSuffix: "/night",
    arrivalPopupLabel: "Arrival Gate",
    spendToLocals: "Community Spend:",
    quotaFilled: (pct: number) => `Capacity used: ${pct}% (simulated)`,
    awigAwigPrefix: "Village Awig-Awig:",
    prevStopLabel: "Previous village stop",
    nextStopLabel: "Next village stop",
    minimizePanelLabel: "Minimize panel",
    expandPanelLabel: "Expand village details",
    // Transit & Durasi Perjalanan
    transitTravelTime: "Travel Time",
    transitFromGate: (gate: string) => `From ${gate}`,
    transitToStay: "To Community Homestay",
    transitFromPrev: (summary: string) => `${summary} from previous stop`,
    transitRoadEstimate: "Scenic Road Estimate",
    morningTransitFromStay: (stayName: string) =>
      `From ${stayName} (Previous night stay)`,
    returnTransitToGate: (gate: string) =>
      `Return to ${gate} (Departure Gate)`,
    longLegWarning: (duration: string) =>
      `Long travel leg (~${duration}), scenic roadside rest recommended.`,
    totalTripTransit: (duration: string, distance: string) =>
      `Total trip transit: ~${duration} (${distance})`,
    roadConditionNotice:
      "Travel times reflect scenic road transit avoiding congested South Bali corridors. Actual duration may vary based on weather and local topography.",
    // Accommodations & Nearby Attractions
    tabOverview: "Overview",
    tabStays: (count: number) => `Local Stays (${count})`,
    tabAttractions: (count: number) => `Nearby Sights (${count})`,
    localStaysTitle: "Community Stays in This Area",
    nearbyAttractionsTitle: "Nearby Sights & Attractions",
    staysCountPill: (count: number) => `🏡 ${count} Community Stays`,
    attractionsCountPill: (count: number) => `🌿 ${count} Nearby Sights`,
    perNightLabel: "/night",
    distanceFromVillage: (mins: number, km: string) =>
      `~${mins} mins (${km}) from village`,
    stayBookingNoteLabel: "Booking Note:",
    emptyStays: "No additional stays listed in this area.",
    emptyAttractions: "No additional nearby sights listed in this area.",
    layerStaysBtn: "Local Stays",
    layerAttractionsBtn: "Nearby Sights",
    featuresLabel: "Features & Vibe:",
    // Cultural Briefing
    etiquetteHeader: "Village Customary Etiquette (Awig-Awig)",
    etiquetteSub:
      "Temple dress codes, sacred day taboos, and subak conservation rules",
    relatedVillagesBadge: (n: number) => `${n} Visited Villages`,
    dressAndEtiquetteLabel: "Dress & Etiquette:",
    sacredDaysLabel: "Sacred Days:",
    // Government Bar
    govBadge: "Bali Regional Economic Redistribution Simulation",
    govTitle: "Regency & City Impact Simulation",
    govSubtitle:
      "Illustrative comparison of baseline regional GDP share (status quo) against direct community spending from this Eco Traveler route.",
    closeModalLabel: "Close simulation modal",
    statusQuoTitle: "Regional GDP Share (Status Quo)",
    statusQuoDesc:
      "Concentrated in South Bali (Badung, Denpasar, Gianyar, Tabanan: 65.88%).",
    ecoRouteAllocTitle: "This Route Spend Share (Illustration)",
    ecoRouteAllocDesc: (regencies: string[]) =>
      regencies.length > 0
        ? `Flows directly to community villages in ${regencies.join(", ")}.`
        : "No direct spend allocated to priority regencies yet.",
    econInjectionTitle: (cohortStr: string) =>
      `Community Injection (${cohortStr} Visitors)`,
    econInjectionDesc: (perTouristStr: string) =>
      `Equals ${perTouristStr}/visitor retained by village businesses & homestays.`,
    cohortScaleLabel: "Simulated Visitor Cohort Scale:",
    cohortDisclaimer:
      "Linear extrapolation from a single sample route, not an econometric forecast.",
    touristUnit: "Visitors",
    statusQuoBar: "GDP Share (Status Quo):",
    thisRouteBar: "Route Spend Share (Illustration):",
    methodologyNote:
      "Methodology Note: Regional GDP share (status quo) and route spending share are not direct equivalents. This comparison is illustrative to show tourism spend redirection.",
    gdpDataSource:
      "Source: BPS Bali Province (2022, via UIN Alauddin Journal). Data from 2022, needs update.",
    derivedLabel: "derived, needs verification",
  },
} as const;

export const VILLAGE_EN_META: Record<
  string,
  {
    highlightsEn: string;
    customsNoteEn: string;
    dressCodeEn: string;
    sacredDaysNoteEn: string;
  }
> = {
  "desa-pemuteran": {
    highlightsEn:
      "Biorock coral reef restoration, Menjangan Bay snorkeling, and coastal Lontar weaving",
    customsNoteEn:
      "Never step on Biorock coral structures, use reef-safe sunscreen, and wear modest attire when visiting Pura Bukit Kursi.",
    dressCodeEn:
      "Sarong (kamen) and sash required at Pura Bukit Kursi & Pura Pulaki; cover shoulders after swimming.",
    sacredDaysNoteEn:
      "During Nyepi Segara (Ocean Silence Day), all boat and diving activities stop for 24 hours.",
  },
  "desa-sudaji": {
    highlightsEn:
      "Subak Gandameru rice terraces, durian and palm sugar agroforestry, and purification water rituals",
    customsNoteEn:
      "Ask a local subak guide before crossing irrigation weirs and dress modestly near village springs.",
    dressCodeEn:
      "Traditional sarong and sash required for purification rituals at sacred village water springs.",
    sacredDaysNoteEn:
      "Respect Subak temple ceremony days (Ngusaba Nini) during the rice harvest season.",
  },
  "desa-sidemen": {
    highlightsEn:
      "Handwoven Songket & Endek textiles, Unda River valley walks, and Mount Agung foothill views",
    customsNoteEn:
      "Ask permission before photographing women weavers inside family compounds and speak softly near Griya priestly homes.",
    dressCodeEn:
      "Sarong and sash required at Pura Desa and Griya compounds; shirts must cover shoulders.",
    sacredDaysNoteEn:
      "Full moon (Purnama) and Kajeng Kliwon ceremonies at village temples.",
  },
  "desa-penglipuran": {
    highlightsEn:
      "Tri Mandala linear village architecture, 45-hectare conservation bamboo forest, and Loloh Cemcem herbal drink",
    customsNoteEn:
      "Motorized vehicles are prohibited inside the village lane; never litter or enter private family shrines without invitation.",
    dressCodeEn:
      "Modest clothing covering shoulders and knees; sarong and sash mandatory at Pura Penataran.",
    sacredDaysNoteEn:
      "Galungan, Kuningan, and village temple Piodalan anniversaries.",
  },
  "desa-blimbingsari": {
    highlightsEn:
      "Balinese architectural heritage church, fermented cacao plantations, and West Bali forest trails",
    customsNoteEn:
      "Maintain quiet during community prayer hours and support the village cacao farmer cooperative.",
    dressCodeEn:
      "Neat attire covering shoulders when visiting the Balinese heritage church compound.",
    sacredDaysNoteEn:
      "Sunday morning community service and annual harvest thanksgiving.",
  },
  "desa-munduk": {
    highlightsEn:
      "Highland waterfalls, century-old Dutch clove and coffee estates, and twin caldera lake trails",
    customsNoteEn:
      "Stay on marked forest trails around sacred Tamblingan springs and carry back all plastic waste.",
    dressCodeEn:
      "Warm modest layers for highland trails; sarong and sash required at Pura Ulun Danu Tamblingan.",
    sacredDaysNoteEn:
      "Water conservation rituals around the Twin Lakes caldera.",
  },
  "desa-les": {
    highlightsEn:
      "Coconut-trunk sea salt crystallization, community coral reef restoration, and Yeh Mampeh waterfall",
    customsNoteEn:
      "Never step on wooden salt crystallization troughs (palungan) and use reef-safe sunscreen when snorkeling.",
    dressCodeEn:
      "Cover up when walking from the beach back through residential village lanes.",
    sacredDaysNoteEn: "Purnama Kapat sea offerings and temple festivals.",
  },
  "desa-sembiran": {
    highlightsEn:
      "Prehistoric Bali Aga megalithic pavilions, hand-spun cotton weaving, and northern ridge views",
    customsNoteEn:
      "Never touch or move sacred megalithic stones inside the ancient village bale and avoid loud speech.",
    dressCodeEn:
      "Sarong and sash mandatory throughout the ancient core temple zone.",
    sacredDaysNoteEn:
      "Sacred Bali Aga rituals when inner sanctums are closed to visitors.",
  },
  "desa-pejarakan": {
    highlightsEn:
      "Menjangan Bay mangrove boardwalks, Bali Starling conservation breeding, and coastal kayaking",
    customsNoteEn:
      "Do not feed wild macaques or disturb Bali Starling nesting enclosures in the buffer forest.",
    dressCodeEn:
      "Sarong and sash required when visiting Pura Segara Rupek or Pura Pulaki.",
    sacredDaysNoteEn:
      "Nyepi Segara and West Bali National Park conservation closures.",
  },
  "desa-ambengan": {
    highlightsEn:
      "Jembong stepped rice terraces, cascading waterfalls, and pandan mat weaving",
    customsNoteEn:
      "Keep soap and shampoo out of natural spring pools and follow subak footpath markers.",
    dressCodeEn:
      "Modest trekking clothes; sarong required at village water temples.",
    sacredDaysNoteEn: "Subak water blessing days.",
  },
  "desa-gobleg": {
    highlightsEn:
      "Lake Tamblingan dugout canoe crossings, ancient forest temples, and highland Arabica coffee",
    customsNoteEn:
      "Motorboats and swimming are strictly forbidden in sacred Lake Tamblingan; only traditional wooden canoes are permitted.",
    dressCodeEn:
      "Sarong and sash required around Pura Dalem Tamblingan lakeside shrines.",
    sacredDaysNoteEn:
      "Lake water sanctity ceremonies held by the Catur Desa Adat alliance.",
  },
  "desa-tenganan": {
    highlightsEn:
      "Double-ikat Gringsing weaving, Bali Aga walled village layout, and lontar palm-leaf manuscripts",
    customsNoteEn:
      "Do not climb sacred communal pavilions (Bale Agung) and respect village residency rules before dusk.",
    dressCodeEn:
      "Modest attire covering shoulders and knees inside the Bali Aga village walls.",
    sacredDaysNoteEn:
      "Usaba Sambah (5th lunar month) featuring traditional Mekare-kare pandan leaf rituals.",
  },
  "desa-amed-purwakerti": {
    highlightsEn:
      "Jemeluk Bay coral gardens, Geographical Indication Amed pyramid salt, and traditional jukung outriggers",
    customsNoteEn:
      "Avoid standing on shallow live coral in Jemeluk Bay and purchase salt directly from the artisan cooperative.",
    dressCodeEn:
      "Wear a shirt and sarong when leaving the beach into Purwakerti village lanes.",
    sacredDaysNoteEn: "Nyepi Segara ocean rest day in East Karangasem.",
  },
  "desa-tulamben": {
    highlightsEn:
      "Coral-covered historic shipwrecks, women dive gear porters cooperative, and black volcanic pebble coast",
    customsNoteEn:
      "Never touch marine life or take volcanic stones from the beach; hire certified local dive guides.",
    dressCodeEn: "Modest village attire outside diving entry zones.",
    sacredDaysNoteEn: "Coastal temple Piodalan days.",
  },
  "desa-sibetan": {
    highlightsEn:
      "Century-old agroforestry of 14 salak (snakefruit) varieties, salak seed coffee, and artisan fruit fermentation",
    customsNoteEn:
      "Harvest salak fruit only with your farmer host as thorny fronds require careful handling.",
    dressCodeEn:
      "Long trousers or sarong recommended in thorny salak orchards.",
    sacredDaysNoteEn: "Ngusaba Salak harvest thanksgiving ceremony.",
  },
  "desa-budakeling": {
    highlightsEn:
      "Historic Siwa-Buddha interfaith harmony, traditional silver & gold smithing, and Wayang Wong masks",
    customsNoteEn:
      "Ask before entering traditional metalworking forges (prapen) as villagers regard fire tools as sacred.",
    dressCodeEn:
      "Sarong and sash required when visiting Siwa-Buddha Griya compounds.",
    sacredDaysNoteEn: "Tumpek Landep (blessing of metalwork and tools).",
  },
  "desa-muncan": {
    highlightsEn:
      "Volcanic red rice terraces, traditional bull-plowing (Matekap), and wood-fired Jaje Laklak pancakes",
    customsNoteEn:
      "Walk carefully along narrow mud bunds and never shift stone subak water dividers (tembuku).",
    dressCodeEn: "Modest clothing; sarong required at Pura Subak Muncan.",
    sacredDaysNoteEn: "Ngusaba Nini rice harvest rituals.",
  },
  "desa-timbrah": {
    highlightsEn:
      "Ancient Bali Aga longhouse pavilions, roasted pork and lawar culinary heritage, and terraced hills",
    customsNoteEn:
      "Do not step onto the raised Bale Agung platform during village council gatherings.",
    dressCodeEn: "Sarong and sash required along the main temple axis.",
    sacredDaysNoteEn: "Usaba Desa Timbrah festival.",
  },
  "desa-trunyan": {
    highlightsEn:
      "Lake Batur cooperative boat crossing, ancient Taru Menyan tree, and Pura Pancering Jagat",
    customsNoteEn:
      "Use only official village cooperative boats, speak respectfully, and never touch anything at the sacred cemetery.",
    dressCodeEn:
      "Sarong and sash mandatory at Pura Pancering Jagat and Trunyan pier.",
    sacredDaysNoteEn:
      "Brutuk sacred mask dance festival on the fourth full moon (Purnama Kapat).",
  },
  "desa-undisan": {
    highlightsEn:
      "Jinah River green valley walks, traditional silver crafting, and quiet Bangli buffer village lanes",
    customsNoteEn:
      "Keep village lanes quiet in the early morning and greet residents when passing family gates (angkul-angkul).",
    dressCodeEn:
      "Modest attire covering shoulders and knees; sarong required for temple visits.",
    sacredDaysNoteEn:
      "Purnama, Tilem, and local Piodalan temple celebrations.",
  },
  "desa-batur-selatan": {
    highlightsEn:
      "UNESCO Global Geopark Batur caldera, wet-hulled Kintamani Arabica coffee farms, and volcanic hot springs",
    customsNoteEn:
      "Respect sacred zones around Pura Ulun Danu Batur and hike the caldera only with registered local guides.",
    dressCodeEn:
      "Full Balinese temple attire (sarong, sash, covered shoulders) required at Pura Ulun Danu Batur.",
    sacredDaysNoteEn: "Ngusaba Kadasa grand festival on the tenth full moon.",
  },
  "desa-ekasari": {
    highlightsEn:
      "Palasari dam cycling trails, internationally exported fermented cacao beans, and birdwatching",
    customsNoteEn:
      "Do not step on cacao fermentation boxes or drying racks in farmers' courtyards.",
    dressCodeEn: "Neat outdoor clothing; modest dress at Palasari sanctuary.",
    sacredDaysNoteEn: "Subak Abian cacao harvest blessings.",
  },
  "desa-medewi": {
    highlightsEn:
      "Long point-break eco-surfing waves, young coconut Lawar Klungah cuisine, and coastal fishermen",
    customsNoteEn:
      "Share waves respectfully with local youth surf clubs and keep beach access paths clean.",
    dressCodeEn:
      "Put on a shirt and shorts/sarong when entering Medewi village.",
    sacredDaysNoteEn: "Coastal Melasti purification processions.",
  },
  "desa-gumbrih": {
    highlightsEn:
      "Giant bamboo Jegog gamelan ensemble, sea turtle hatchery conservation, and organic rice fields",
    customsNoteEn:
      "Never use flash photography near sea turtle hatchlings and ask before playing giant bamboo Jegog instruments.",
    dressCodeEn:
      "Modest attire when attending bamboo gamelan rehearsals in the village pavilion.",
    sacredDaysNoteEn: "Tumpek Kandang (blessing of animals and nature).",
  },
  "desa-jatiluwih": {
    highlightsEn:
      "UNESCO World Heritage Subak landscape, heritage red rice trails, and Mount Batukaru views",
    customsNoteEn:
      "Stay on designated subak boardwalks and never block water channels flowing into farmers' paddies.",
    dressCodeEn:
      "Modest walking attire; sarong required at Bedugul/Subak shrines.",
    sacredDaysNoteEn: "Subak temple ceremonies along the Batukaru watershed.",
  },
  "desa-wongaya-gede": {
    highlightsEn:
      "Pura Luhur Batukaru rainforest sanctuary, thermal spring baths, and highland organic farming",
    customsNoteEn:
      "Maintain strict silence around Pura Luhur Batukaru and refrain from climbing temple walls.",
    dressCodeEn:
      "Sarong and sash mandatory at Pura Luhur Batukaru; women on their period may not enter.",
    sacredDaysNoteEn:
      "Piodalan after Galungan when thousands of pilgrims pray at Batukaru.",
  },
  "desa-taro": {
    highlightsEn:
      "Sacred white cattle (Lembu Putih) conservation, firefly garden nights, and ancient Pura Gunung Raung",
    customsNoteEn:
      "Do not startle the sacred white cattle and turn off flashlights during evening firefly walks.",
    dressCodeEn:
      "Sarong and sash required at Pura Agung Gunung Raung and the cattle sanctuary.",
    sacredDaysNoteEn:
      "Tumpek Kandang and Wednesday Kliwon ceremonies at Pura Gunung Raung.",
  },
  "desa-carangsari": {
    highlightsEn:
      "Ayung River canyon trails, national hero I Gusti Ngurah Rai heritage site, and nutmeg groves",
    customsNoteEn:
      "Respect historical monuments and follow safety briefings along the Ayung River gorge.",
    dressCodeEn:
      "Neat attire at historical memorials and sarong at village temples.",
    sacredDaysNoteEn: "Margarana commemoration day (November 20).",
  },
};

const TIME_SLOT_EN: Record<string, string> = {
  Pagi: "Morning",
  Siang: "Midday",
  Sore: "Afternoon",
  Malam: "Evening",
};

export function formatTimeSlot(slot: TimeSlot | string, locale: Locale): string {
  if (locale === "en") {
    return TIME_SLOT_EN[slot] || slot;
  }
  return slot;
}

export function getLocalizedVillageText(
  village: DesaWisata,
  locale: Locale
): {
  highlights: string;
  customsNote: string;
  dressCode: string;
  sacredDaysNote: string;
} {
  if (locale === "en") {
    const enMeta = VILLAGE_EN_META[village.id];
    if (enMeta) {
      return {
        highlights: enMeta.highlightsEn,
        customsNote: enMeta.customsNoteEn,
        dressCode: enMeta.dressCodeEn,
        sacredDaysNote: enMeta.sacredDaysNoteEn,
      };
    }
  }
  return {
    highlights: village.highlights,
    customsNote: village.customsNote,
    dressCode: village.dressCode || village.customsNote,
    sacredDaysNote: village.sacredDaysNote || "",
  };
}

/**
 * Menerjemahkan objek ItineraryResponse yang sedang tampil secara langsung saat user mengubah toggle ID <-> EN,
 * termasuk judul rute, ringkasan narasi, aktivitas tiap desa, etika adat, dan harga (Rp <-> USD).
 */
export function localizeItinerary(
  itinerary: ItineraryResponse,
  locale: Locale
): ItineraryResponse {
  const duration = itinerary.days.length;
  const isGilimanuk =
    itinerary.engineMeta?.arrivalGateLabel?.toLowerCase().includes("gilimanuk") ??
    false;

  const arrivalGateLabel =
    locale === "en"
      ? isGilimanuk
        ? "Gilimanuk Ferry Port (West Bali)"
        : "I Gusti Ngurah Rai International Airport"
      : isGilimanuk
      ? "Pelabuhan Gilimanuk (Jembrana - Barat)"
      : "Bandara I Gusti Ngurah Rai";

  const regenciesList =
    itinerary.metrics.primaryRegenciesBenefited?.join(", ") ||
    "Karangasem, Bangli, Buleleng";

  const localizedDays = itinerary.days.map((day) => {
    const firstRegency = day.activities[0]?.regency || "Bali";
    const lastRegency =
      day.activities[day.activities.length - 1]?.regency || firstRegency;
    const regionPair =
      firstRegency === lastRegency
        ? firstRegency
        : `${firstRegency} & ${lastRegency}`;

    const themeTitle =
      locale === "en"
        ? `Day ${day.dayNumber}: ${regionPair} Village & Cultural Trail`
        : day.themeTitle.startsWith("Day ")
        ? `Hari ${day.dayNumber}: Jelajah Desa & Budaya ${regionPair}`
        : day.themeTitle;

    const activities = day.activities.map((act) => {
      const village = DESA_BY_ID.get(act.villageId);
      const vText = village ? getLocalizedVillageText(village, locale) : null;
      const firstHighlight = vText
        ? vText.highlights.split(",")[0]
        : act.activityTitle;

      const slotPrefixEn =
        act.timeSlot === "Pagi"
          ? "Morning Visit:"
          : act.timeSlot === "Siang"
          ? "Workshop & Village Lunch:"
          : "Afternoon Walk:";

      const slotPrefixId =
        act.timeSlot === "Pagi"
          ? "Kunjungan Pagi:"
          : act.timeSlot === "Siang"
          ? "Lokakarya & Makan Siang Warga:"
          : "Jelajah Sore:";

      const isRedirected = act.capacityStatus === "REDIRECTED_BUFFER";

      const rawHighlight = vText?.highlights || act.activityTitle;
      const cleanHighlight = cleanHighlightPhrase(rawHighlight);

      const activityTitle =
        locale === "en"
          ? `${slotPrefixEn} ${cleanHighlight}`
          : `${slotPrefixId} ${cleanHighlight}`;

      const description = generateDeterministicStopDescription(
        act.villageName,
        act.regency,
        rawHighlight,
        act.localUmkmSpot || "",
        act.timeSlot,
        locale,
        isRedirected,
        act.originalSaturatedVillage
      );

      const antiOvertourismNote =
        locale === "en"
          ? isRedirected
            ? `Redirects visitors from ${act.originalSaturatedVillage || "crowded villages"} (98% capacity) to ${act.villageName} Buffer Village (30% capacity).`
            : PRIORITY_REGENCIES.has(act.regency)
            ? `Priority economic redistribution regency (${act.regency}, Spatial Weight 1.0).`
            : `Scenic transition corridor through ${act.regency} outside congested South Bali toward North and East Bali.`
          : isRedirected
          ? `Mengalihkan kunjungan dari ${act.originalSaturatedVillage || "desa padat"} (98% kapasitas) ke Desa Penyangga ${act.villageName} (30% kapasitas).`
          : PRIORITY_REGENCIES.has(act.regency)
          ? `Kabupaten prioritas pemerataan ${act.regency} (Bobot Spasial 1.0).`
          : `Koridor jalur penghubung di ${act.regency} yang menghindari koridor padat Bali Selatan menuju Bali Utara dan Timur.`;

      return {
        ...act,
        activityTitle,
        description,
        antiOvertourismNote,
      };
    });

    return {
      ...day,
      themeTitle,
      activities,
      recommendedStay: {
        ...day.recommendedStay,
        priceRangeRp: formatStayPriceRange(
          day.recommendedStay.priceRangeRp,
          locale
        ),
      },
    };
  });

  const visitedIds = new Set(
    localizedDays.flatMap((d) => d.activities.map((a) => a.villageId))
  );
  const visitedVillages = Array.from(visitedIds)
    .map((id) => DESA_BY_ID.get(id))
    .filter((v): v is DesaWisata => Boolean(v));

  const culturalEtiquette =
    locale === "en"
      ? [
          {
            ruleTitle:
              "Temple Dress Code & Sacred Courtyards (Sarong & Sash)",
            description: visitedVillages
              .slice(0, 3)
              .map(
                (v) =>
                  `${v.name}: ${getLocalizedVillageText(v, "en").dressCode}`
              )
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Temple Attire",
          },
          {
            ruleTitle:
              "Village Awig-Awig, Cuntaka Taboos & Sacred Piodalan Days",
            description: visitedVillages
              .slice(0, 3)
              .map(
                (v) =>
                  `${v.name}: ${
                    getLocalizedVillageText(v, "en").sacredDaysNote ||
                    getLocalizedVillageText(v, "en").customsNote
                  }`
              )
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Customary Taboos",
          },
          {
            ruleTitle: "Subak Irrigation Channels, Sacred Forests & Reef Care",
            description: visitedVillages
              .slice(0, 4)
              .map(
                (v) =>
                  `${v.name} (${v.regency}): ${
                    getLocalizedVillageText(v, "en").customsNote
                  }`
              )
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Subak & Marine Ecology",
          },
        ]
      : [
          {
            ruleTitle:
              "Tata Busana Pura & Kawasan Suci Desa Adat (Kamen & Selendang)",
            description: visitedVillages
              .slice(0, 3)
              .map((v) => `${v.name}: ${v.dressCode || v.customsNote}`)
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Busana Pura",
          },
          {
            ruleTitle:
              "Awig-Awig Desa, Pantangan Cuntaka & Hari Sakral Piodalan",
            description: visitedVillages
              .slice(0, 3)
              .map((v) => `${v.name}: ${v.sacredDaysNote || v.customsNote}`)
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Pantangan Adat",
          },
          {
            ruleTitle: "Etika Saluran Subak, Hutan Adat & Pesisir",
            description: visitedVillages
              .slice(0, 4)
              .map((v) => `${v.name} (${v.regency}): ${v.customsNote}`)
              .join(" • "),
            applicableVillages: visitedVillages.map((v) => v.name),
            category: "Ekologi Subak & Laut",
          },
        ];

  const tripTitle =
    locale === "en"
      ? `${duration}-Day Equitable Route: ${regenciesList} Villages`
      : itinerary.tripTitle.includes("Equitable Route")
      ? `Rute ${duration} Hari: Jelajah Desa ${regenciesList}`
      : itinerary.tripTitle;

  const summaryNarrative =
    locale === "en"
      ? `This ${duration}-day route travels directly from ${arrivalGateLabel} into ${regenciesList}, avoiding congested South Bali corridors. It achieves a ${itinerary.metrics.spreadScore.toFixed(
          1
        )}/100 Regional Spread Score and retains ${itinerary.metrics.localBenefitIndex.toFixed(
          1
        )}% of total spending with community homestays, subak farmers, and village cooperatives.`
      : itinerary.summaryNarrative.startsWith("This ")
      ? `Perjalanan ${duration} hari dari ${arrivalGateLabel} menuju Kabupaten ${regenciesList} yang menghindari koridor padat Bali Selatan. Rute ini mencatat Indeks Pemerataan ${itinerary.metrics.spreadScore.toFixed(
          1
        )}/100 dengan ${itinerary.metrics.localBenefitIndex.toFixed(
          1
        )}% pengeluaran masuk ke homestay warga dan koperasi desa.`
      : itinerary.summaryNarrative;

  return {
    ...itinerary,
    tripTitle,
    summaryNarrative,
    days: localizedDays,
    culturalEtiquette,
    engineMeta: itinerary.engineMeta
      ? {
          ...itinerary.engineMeta,
          arrivalGateLabel,
        }
      : undefined,
  };
}

