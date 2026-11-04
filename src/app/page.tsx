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
  FileDown,
  BarChart3,
  Sparkles,
  PlaneLanding,
  Clock,
  CheckCircle2,
} from "lucide-react";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] lg:h-[calc(100dvh-6.5rem)] rounded-2xl bg-stone-100 border border-stone-200/80 animate-pulse flex flex-col items-center justify-center p-6 text-center">
      <div className="w-11 h-11 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-3 shadow-sm">
        <MapIcon className="w-5 h-5 text-[#0D4732]" />
      </div>
      <p className="font-display text-sm font-bold text-stone-800">
        Memuat Atlas Spasial Desa Wisata Bali...
      </p>
      <p className="text-xs text-stone-500 mt-1">
        Menyiapkan koordinat 28 desa, poligon kepadatan, dan jalur harian
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
      modelUsed: "Subak Spatial Engine v2.0",
      latencyMs: 14,
      arrivalGateLabel: "Bandara I Gusti Ngurah Rai",
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
  const [activeView, setActiveView] = useState<"atlas" | "simulation">("atlas");

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
    handleGenerate({
      durationDays: 3,
      interests: ["Culture", "Nature", "Culinary"],
      budgetCategory: "Moderate",
      arrivalGate: "NgurahRaiAirport",
      simulateCapacityAlert: true,
    });
  }, [handleGenerate]);

  const handleDownloadPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F6F5F0] text-[#141715]">
      {/* Sticky Top Command Bar */}
      <header className="sticky top-0 z-40 h-16 bg-[#F6F5F0]/90 backdrop-blur-md border-b border-stone-200/80 no-print">
        <div className="max-w-[1520px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D261C] text-white flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-[#0D261C]">
                  Eco Traveler
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/10 text-[#0D4732]">
                  Subak Atelier
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Atlas Spasial & Kurator Rute Berkeadilan Bali
              </p>
            </div>
          </div>

          {/* Center View Mode Switcher */}
          <div className="flex items-center bg-stone-200/75 p-1 rounded-xl border border-stone-300/60">
            <button
              type="button"
              onClick={() => setActiveView("atlas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeView === "atlas"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-[#0D4732]" />
              <span>Eksplorasi Rute & Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("simulation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeView === "simulation"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Simulasi Dampak Regulasi</span>
            </button>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-[#0D261C] hover:bg-[#0D4732] text-white font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">
                Unduh Rencana Perjalanan (PDF)
              </span>
              <span className="md:hidden">Unduh PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeView === "simulation" ? (
          <div className="space-y-5">
            <TelemetryCards itinerary={itinerary} />
            <GovernmentBar
              itinerary={itinerary}
              inlineMode={true}
              onClose={() => setActiveView("atlas")}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* PANEL KIRI: 46% Lebar Layar, Scrollable Editorial Stream */}
            <div className="w-full lg:w-[46%] space-y-5">
              {/* Editorial Hero Banner */}
              <section className="relative rounded-2xl overflow-hidden bg-[#0D261C] text-white p-5 sm:p-6 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
                  alt="Lanskap Subak Bali"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                />
                <div className="relative z-10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15">
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      28 Desa Wisata Terkurasi · Bali Smart Society
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {itinerary.engineMeta?.source === "gemini-ai"
                        ? "Gemini Spatial AI"
                        : "Deterministic Spatial Engine"}
                    </span>
                  </div>

                  <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-white leading-tight">
                    Perencana Rute Wisata Berkeadilan Bali
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed">
                    Menyusun perjalanan bebas macet yang menyalurkan manfaat
                    ekonomi langsung ke homestay warga, koperasi subak, dan UMKM
                    desa di luar koridor padat Bali Selatan.
                  </p>
                </div>
              </section>

              {/* Kontrol Rute & Skenario Instan */}
              <div className="no-print">
                <TripPlannerForm
                  value={request}
                  onChange={setRequest}
                  onSubmit={handleGenerate}
                  isLoading={isLoading}
                />
              </div>

              {/* 3-Cell Bento Impact Grid & 1-Line Regional Share */}
              <TelemetryCards itinerary={itinerary} />

              {/* Ringkasan Narasi Rute Aktif */}
              <section className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D4732] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    <Clock className="w-3.5 h-3.5" />
                    Rencana Perjalanan {itinerary.days.length} Hari
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-stone-600 font-medium">
                    <PlaneLanding className="w-3.5 h-3.5 text-[#C85A32]" />
                    Titik Masuk:{" "}
                    <strong className="text-stone-900">
                      {itinerary.engineMeta?.arrivalGateLabel ||
                        "Bandara I Gusti Ngurah Rai"}
                    </strong>
                  </span>
                </div>

                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-900 pt-0.5">
                  {itinerary.tripTitle}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {itinerary.summaryNarrative}
                </p>
              </section>

              {/* Kartu Rute Timeline Harian (Editorial Visual Timeline) */}
              <ItineraryTimeline
                days={itinerary.days}
                allVillages={ALL_VILLAGES}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
              />

              {/* Panduan Etika Adat Desa (Awig-Awig) */}
              <CulturalBriefing
                itinerary={itinerary}
                allVillages={ALL_VILLAGES}
              />

              {/* Footer Ringkas */}
              <footer className="pt-3 pb-6 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                <span>
                  Eco Traveler · Arsitektur Spasial Pariwisata Berkeadilan
                </span>
                <span>Dataset Terkurasi 28 Desa Wisata Bali</span>
              </footer>
            </div>

            {/* PANEL KANAN: 54% Lebar Layar, Sticky Full-Height Spatial Atlas */}
            <aside className="w-full lg:w-[54%] lg:sticky lg:top-[5.25rem]">
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
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
