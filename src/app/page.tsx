"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import desaWisataData from "../../data/desa-wisata.json";
import presetsFallbackData from "../../data/presets-fallback.json";
import { DesaWisata } from "@/types/desa";
import {
  TripRequest,
  ItineraryResponse,
  TripDayActivity,
} from "@/types/trip";
import { computeItineraryTelemetry } from "@/lib/scoring";
import TripPlannerForm from "@/components/TripPlannerForm";
import TelemetryCards from "@/components/TelemetryCards";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import CulturalBriefing from "@/components/CulturalBriefing";
import GovernmentBar from "@/components/GovernmentBar";
import {
  Compass,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  BarChart3,
  ScrollText,
  ArrowDownRight,
  Globe2,
  Database,
  Cpu,
} from "lucide-react";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] lg:h-[620px] rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center mb-3">
        <MapIcon className="w-6 h-6 text-emerald-400" />
      </div>
      <p className="text-sm font-display font-bold text-slate-200">
        Memuat Peta Spasial Desa Wisata Bali...
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Menyiapkan 28 titik koordinat Disparda & jalur polyline harian
      </p>
    </div>
  ),
});

const ALL_VILLAGES = desaWisataData as DesaWisata[];

function getInitialItinerary(): ItineraryResponse {
  const preset = presetsFallbackData.presets[0];
  const days = preset.days as ItineraryResponse["days"];
  const metrics = computeItineraryTelemetry(days, ALL_VILLAGES, "Moderate");

  return {
    tripTitle: preset.tripTitle,
    summaryNarrative: preset.summaryNarrative,
    days,
    metrics,
    culturalEtiquette: preset.culturalEtiquette,
    engineMeta: {
      source: "deterministic-fallback",
      modelUsed: "EcoTraveler Heuristic Spatial Engine v1.0",
      latencyMs: 14,
      arrivalGateLabel: "Bandara I Gusti Ngurah Rai (Tuban - Selatan)",
      arrivalCoords: [-8.7467, 115.1668],
    },
  };
}

export default function HomePage() {
  const [request, setRequest] = useState<TripRequest>({
    durationDays: 3,
    interests: ["Culture", "Nature", "Culinary"],
    budgetCategory: "Moderate",
    arrivalGate: "NgurahRaiAirport",
    simulateCapacityAlert: true,
  });

  const [itinerary, setItinerary] = useState<ItineraryResponse>(() =>
    getInitialItinerary()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(
    null
  );
  const [selectedActivity, setSelectedActivity] =
    useState<TripDayActivity | null>(null);

  const handleGenerate = useCallback(async (reqPayload: TripRequest) => {
    setIsLoading(true);
    setSelectedDayFilter(null);
    setSelectedActivity(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });
      if (res.ok) {
        const data: ItineraryResponse = await res.json();
        setItinerary(data);
      }
    } catch (err) {
      console.error("Failed to fetch itinerary:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sinkronisasi awal saat halaman pertama kali dibuka
    handleGenerate({
      durationDays: 3,
      interests: ["Culture", "Nature", "Culinary"],
      budgetCategory: "Moderate",
      arrivalGate: "NgurahRaiAirport",
      simulateCapacityAlert: true,
    });
  }, [handleGenerate]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#07130E] text-slate-100">
      {/* Sticky Navigation Header (Height 68px, single-line on desktop) */}
      <header className="sticky top-0 z-[600] h-[68px] bg-[#07130E]/90 backdrop-blur-md border-b border-emerald-950/80">
        <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-display font-extrabold shadow-md shadow-emerald-950">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight text-slate-100">
                  Eco Traveler
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/70">
                  Bali DigiFest 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Redistributive Travel Planner • Bali Smart Society
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a
              href="#workspace-planner"
              className="hover:text-emerald-400 transition-colors"
            >
              Perencana & Peta
            </a>
            <a
              href="#simulasi-pdrb"
              className="hover:text-emerald-400 transition-colors"
            >
              Simulasi Dampak Kabupaten
            </a>
            <a
              href="#panduan-adat"
              className="hover:text-emerald-400 transition-colors"
            >
              Panduan Awig-Awig
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              28 Desa Terverifikasi
            </span>
            <a
              href="#workspace-planner"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs transition-all"
            >
              Mulai Rute
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-10">
        {/* Split-Screen Editorial Hero Section (Strict Hero Stack Discipline) */}
        <section className="relative rounded-3xl bg-gradient-to-br from-slate-900/95 via-[#0B2219] to-slate-950 border border-emerald-900/50 p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Copy Stack (4 elements max) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/90 border border-emerald-800/70 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Redistributive Spatial AI Engine • Bali Smart Society
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-100 leading-[1.1]">
                Sebarkan Manfaat Wisata ke{" "}
                <span className="text-emerald-400">
                  Desa Mandiri Bali Utara, Timur & Barat.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-[60ch]">
                Kawasan Sarbagita menanggung 65,88% konsentrasi PDRB dan beban
                kemacetan akut. Eco Traveler mengoptimalkan rute bebas macet
                yang menahan ≥75% belanja wisatawan di homestay warga dan UMKM
                desa.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <a
                  href="#workspace-planner"
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-950/60"
                >
                  <span>Rancang Perjalanan</span>
                  <ArrowDownRight className="w-4 h-4" />
                </a>
                <a
                  href="#simulasi-pdrb"
                  className="px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Simulasi Ekonomi Juri</span>
                </a>
              </div>
            </div>

            {/* Right Spatial Equity Live Summary Card */}
            <div className="lg:col-span-5 bg-slate-950/85 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Indeks Ketimpangan Spasial Bali
                  </span>
                  <h2 className="text-sm font-display font-bold text-slate-100">
                    Mengapa Algoritma Popularitas Gagal?
                  </h2>
                </div>
                <Globe2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-rose-300">
                    <span>Bali Selatan (Sarbagita)</span>
                    <span className="font-mono">65,88% PDRB (Bobot 0.2)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Algoritma ulasan populer menumpuk 6,6 juta wisman di koridor
                    Kuta–Canggu–Ubud, memicu krisis air & macet.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-emerald-300">
                    <span>Buleleng, Karangasem, Bangli, Jembrana</span>
                    <span className="font-mono">Prioritas 1.0</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Eco Traveler mengunci minimal 70% durasi di desa wisata
                    luar selatan + pelindung kuota otomatis (Buffer Village).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-base font-mono font-bold text-emerald-400">
                    {itinerary.metrics.spreadScore}
                  </div>
                  <div className="text-[10px] text-slate-400">Spread Score</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-base font-mono font-bold text-emerald-400">
                    {itinerary.metrics.localBenefitIndex}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Local Benefit
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-base font-mono font-bold text-amber-300">
                    28 Desa
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kurasi Disparda
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Interactive Workspace: Form + Telemetry + Map + Timeline */}
        <section id="workspace-planner" className="scroll-mt-20 space-y-6">
          {/* Telemetry Metrics Strip */}
          <TelemetryCards itinerary={itinerary} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Trip Planner Form (4 Cols on Desktop) */}
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <TripPlannerForm
                value={request}
                onChange={setRequest}
                onSubmit={handleGenerate}
                isLoading={isLoading}
              />
            </div>

            {/* Right Main Panel: Active Route Header, Interactive Map & Day-by-Day Timeline (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Active Itinerary Narrative Banner */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Rencana Perjalanan Aktif ({itinerary.days.length} Hari)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Pintu Masuk:{" "}
                    <strong className="text-slate-200">
                      {itinerary.engineMeta?.arrivalGateLabel ||
                        "Bandara I Gusti Ngurah Rai"}
                    </strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-100">
                  {itinerary.tripTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {itinerary.summaryNarrative}
                </p>
              </div>

              {/* Interactive Leaflet Spatial Map */}
              <LeafletMap
                days={itinerary.days}
                allVillages={ALL_VILLAGES}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                arrivalCoords={itinerary.engineMeta?.arrivalCoords}
                arrivalLabel={itinerary.engineMeta?.arrivalGateLabel}
              />

              {/* Day-by-Day Route Timeline */}
              <ItineraryTimeline
                days={itinerary.days}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
              />
            </div>
          </div>
        </section>

        {/* Regional Impact Simulation Dashboard (Nilai Tambah Juri) */}
        <div id="simulasi-pdrb" className="scroll-mt-20">
          <GovernmentBar itinerary={itinerary} />
        </div>

        {/* Contextual Adat & Cultural Etiquette Briefing */}
        <div id="panduan-adat" className="scroll-mt-20">
          <CulturalBriefing itinerary={itinerary} allVillages={ALL_VILLAGES} />
        </div>
      </main>

      {/* Competition Compliance & Attribution Footer (PRD Section 9) */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 mt-12 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-slate-200 text-sm">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Eco Traveler — Bali DigiFest 2026</span>
              </div>
              <p className="leading-relaxed">
                AI Redistributive Travel Planner untuk mengatasi overtourism
                Bali Selatan dan mempercepat pemerataan ekonomi Desa Wisata di
                Buleleng, Karangasem, Bangli, dan Jembrana.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Transparansi Dataset & Peta (Lampiran C)</span>
              </div>
              <ul className="space-y-1 text-[11px]">
                <li>
                  • <strong>Dataset Desa Wisata:</strong> Kurasi 28 Desa Wisata
                  Binaan Disparda Provinsi Bali & Pokdarwis Daerah.
                </li>
                <li>
                  • <strong>Spasial & Basemap:</strong> Leaflet.js &
                  OpenStreetMap / CartoDB Voyager (ODbL / CC-BY-SA).
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Arsitektur AI & Keandalan Juri</span>
              </div>
              <ul className="space-y-1 text-[11px]">
                <li>
                  • <strong>AI Engine:</strong> Google Gemini 1.5 Flash dengan
                  Structured JSON Output + Deterministic Failover Cache.
                </li>
                <li>
                  • <strong>Telemetry Math:</strong> Kalkulasi deterministik{" "}
                  <code>src/lib/scoring.ts</code> (Spread Score & LBI ≥ 75%).
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              © 2026 Eco Traveler MVP • Kategori Mahasiswa/Umum — Bidang Bali
              Smart Society
            </span>
            <span className="font-mono flex items-center gap-1.5 text-emerald-400/90">
              <ScrollText className="w-3.5 h-3.5" />
              Zero-Crash Deterministic Fallback Ready (≤100ms)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

