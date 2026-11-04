"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import presetsFallbackData from "../../data/presets-fallback.json";
import {
  TripRequest,
  ItineraryResponse,
  TripDayActivity,
} from "@/types/trip";
import { DESA_DATASET, computeItineraryTelemetry } from "@/lib/scoring";
import { Locale } from "@/lib/utils";
import { UI_TEXT, localizeItinerary } from "@/lib/i18n";
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
  Sun,
  Moon,
  Route,
} from "lucide-react";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-[calc(100dvh-8.25rem)] sm:h-[560px] lg:h-[calc(100dvh-6.5rem)] rounded-2xl bg-stone-100 dark:bg-[#101E18] border border-stone-200/80 dark:border-emerald-900/40 animate-pulse flex flex-col items-center justify-center p-6 text-center"
      aria-live="polite"
    >
      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#162921] border border-stone-200 dark:border-emerald-800/50 flex items-center justify-center mb-3 shadow-sm">
        <MapIcon
          className="w-5 h-5 text-[#0D4732] dark:text-emerald-400"
          aria-hidden="true"
        />
      </div>
      <p className="font-display text-sm font-bold text-stone-800 dark:text-stone-100">
        Loading Bali Spatial Village Atlas…
      </p>
    </div>
  ),
});

function getInitialItinerary(locale: Locale = "id"): ItineraryResponse {
  const preset = presetsFallbackData.presets[0];
  const days = preset.days as ItineraryResponse["days"];
  const metrics = computeItineraryTelemetry(days, DESA_DATASET, "Moderate");

  const base: ItineraryResponse = {
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

  return locale === "en" ? localizeItinerary(base, "en") : base;
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("id");
  const [isDark, setIsDark] = useState<boolean>(false);

  const [request, setRequest] = useState<TripRequest>({
    durationDays: 3,
    interests: ["Culture", "Nature", "Culinary"],
    budgetCategory: "Moderate",
    arrivalGate: "NgurahRaiAirport",
    simulateCapacityAlert: true,
    locale: "id",
  });

  const [itinerary, setItinerary] = useState<ItineraryResponse>(() =>
    getInitialItinerary("id")
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(
    null
  );
  const [selectedActivity, setSelectedActivity] =
    useState<TripDayActivity | null>(null);

  // Desktop view mode ("atlas" shows split-screen Plan+Map, "simulation" shows full-screen simulation)
  // Mobile view mode ("plan" | "map" | "simulation") controlled via bottom thumb bar
  const [activeView, setActiveView] = useState<"atlas" | "simulation">("atlas");
  const [mobileTab, setMobileTab] = useState<"plan" | "map" | "simulation">(
    "plan"
  );

  // Hydrate saved theme & locale preferences from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("eco-traveler-theme");
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      }
      const savedLocale = localStorage.getItem("eco-traveler-locale");
      if (savedLocale === "en") {
        setLocale("en");
        setItinerary((prev) => localizeItinerary(prev, "en"));
        document.documentElement.lang = "en";
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleToggleLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    setRequest((prev) => ({ ...prev, locale: nextLocale }));
    setItinerary((prev) => localizeItinerary(prev, nextLocale));
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
    }
    try {
      localStorage.setItem("eco-traveler-locale", nextLocale);
    } catch {
      // ignore
    }
  };

  const handleSetTheme = (nextDark: boolean) => {
    setIsDark(nextDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", nextDark);
    }
    try {
      localStorage.setItem("eco-traveler-theme", nextDark ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  const handleGenerate = useCallback(
    async (reqPayload: TripRequest) => {
      setIsLoading(true);
      setSelectedDayFilter(null);
      setSelectedActivity(null);

      try {
        const res = await fetch("/api/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...reqPayload, locale }),
        });
        if (res.ok) {
          const data: ItineraryResponse = await res.json();
          setItinerary(locale === "en" ? localizeItinerary(data, "en") : data);
        }
      } catch (err) {
        console.error("Failed to fetch itinerary:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [locale]
  );

  const handleDownloadPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleJumpToMapOnMobile = (activity: TripDayActivity) => {
    setSelectedActivity(activity);
    setMobileTab("map");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const t = UI_TEXT[locale];

  return (
    <div className="min-h-[100dvh] pb-20 lg:pb-0 bg-[#F6F5F0] dark:bg-[#08120E] text-[#141715] dark:text-stone-100 transition-colors">
      {/* Sticky Top Command Bar */}
      <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#F6F5F0]/90 dark:bg-[#08120E]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-emerald-900/40 no-print transition-colors">
        <div className="max-w-[1520px] mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0D261C] dark:bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Compass
                className="w-4 h-4 text-emerald-300 dark:text-white"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  translate="no"
                  className="font-display text-sm sm:text-base font-bold tracking-tight text-[#0D261C] dark:text-white truncate"
                >
                  Eco Traveler
                </span>
                <span
                  translate="no"
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/10 dark:bg-emerald-500/20 text-[#0D4732] dark:text-emerald-300"
                >
                  Subak Atelier
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block truncate">
                {t.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Center Desktop View Mode Switcher (Hidden on Mobile, replaced by Bottom Thumb Bar) */}
          <div
            role="tablist"
            aria-label="Mode tampilan"
            className="hidden lg:flex items-center bg-stone-200/75 dark:bg-[#101E18] p-1 rounded-xl border border-stone-300/60 dark:border-emerald-900/50"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "atlas"}
              onClick={() => setActiveView("atlas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                activeView === "atlas"
                  ? "bg-white dark:bg-[#162921] text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <MapIcon
                className="w-3.5 h-3.5 text-[#0D4732] dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>{t.tabAtlas}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "simulation"}
              onClick={() => setActiveView("simulation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                activeView === "simulation"
                  ? "bg-white dark:bg-[#162921] text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <BarChart3
                className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66]"
                aria-hidden="true"
              />
              <span>{t.tabSimulation}</span>
            </button>
          </div>

          {/* Right Controls: Language Toggle (ID/EN) + Theme Toggle (Light/Dark) + PDF Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle ID / EN (Also converts Rp <-> USD) */}
            <div
              role="group"
              aria-label="Pilih Bahasa dan Mata Uang"
              className="inline-flex items-center bg-stone-200/80 dark:bg-[#101E18] p-0.5 rounded-xl border border-stone-300/70 dark:border-emerald-900/50"
            >
              <button
                type="button"
                aria-pressed={locale === "id"}
                onClick={() => handleToggleLocale("id")}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  locale === "id"
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                title="Bahasa Indonesia (IDR Rp)"
              >
                ID·Rp
              </button>
              <button
                type="button"
                aria-pressed={locale === "en"}
                onClick={() => handleToggleLocale("en")}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  locale === "en"
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                title="English (USD $)"
              >
                EN·$
              </button>
            </div>

            {/* Toggle Light / Dark Segmented Pill */}
            <div
              role="group"
              aria-label="Pilih Tema Tampilan"
              className="inline-flex items-center bg-stone-200/80 dark:bg-[#101E18] p-0.5 rounded-xl border border-stone-300/70 dark:border-emerald-900/50"
            >
              <button
                type="button"
                aria-pressed={!isDark}
                onClick={() => handleSetTheme(false)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  !isDark
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                title={t.themeLight}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span className="hidden sm:inline">{t.themeLight}</span>
              </button>
              <button
                type="button"
                aria-pressed={isDark}
                onClick={() => handleSetTheme(true)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  isDark
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                title={t.themeDark}
              >
                <Moon className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span className="hidden sm:inline">{t.themeDark}</span>
              </button>
            </div>

            {/* Export PDF Action */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#0D261C] dark:bg-emerald-600 hover:bg-[#0D4732] dark:hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] focus-visible:ring-offset-2"
            >
              <FileDown
                className="w-3.5 h-3.5 text-emerald-300 dark:text-white"
                aria-hidden="true"
              />
              <span className="hidden xl:inline">{t.downloadPdfFull}</span>
              <span className="xl:hidden">{t.downloadPdfShort}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main
        id="main-content"
        className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5"
      >
        {/* DESKTOP SIMULATION VIEW OR MOBILE SIMULATION TAB */}
        {activeView === "simulation" || mobileTab === "simulation" ? (
          <div
            className={
              activeView === "simulation"
                ? "space-y-5"
                : "lg:hidden space-y-5"
            }
          >
            <TelemetryCards
              itinerary={itinerary}
              hideSimulationTriggers
              locale={locale}
            />
            <GovernmentBar
              itinerary={itinerary}
              inlineMode={true}
              onClose={() => {
                setActiveView("atlas");
                setMobileTab("plan");
              }}
              locale={locale}
            />
          </div>
        ) : null}

        {/* ATLAS SPLIT-SCREEN (Desktop shows both columns; Mobile shows active mobileTab) */}
        {activeView === "atlas" && mobileTab !== "simulation" && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* PANEL KIRI: 46% Lebar Layar Desktop, atau Tab "plan" di Mobile */}
            <div
              className={`w-full lg:w-[46%] space-y-4 sm:space-y-5 ${
                mobileTab === "map" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Editorial Hero Banner */}
              <section className="relative rounded-2xl overflow-hidden bg-[#0D261C] dark:bg-[#132A20] dark:border dark:border-emerald-800/50 text-white p-4 sm:p-6 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
                  alt=""
                  aria-hidden="true"
                  width={1200}
                  height={400}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                />
                <div className="relative z-10 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15">
                      <Sparkles
                        className="w-3 h-3 text-emerald-300"
                        aria-hidden="true"
                      />
                      {t.heroBadge}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-300">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-400"
                        aria-hidden="true"
                      />
                      {itinerary.engineMeta?.source === "gemini-ai"
                        ? t.engineAi
                        : t.engineDeterministic}
                    </span>
                  </div>

                  <h1 className="font-display text-xl sm:text-[28px] font-bold tracking-tight text-white leading-tight text-balance">
                    {t.heroTitle}
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed">
                    {t.heroDesc}
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
                  locale={locale}
                />
              </div>

              {/* 3-Cell Bento Impact Grid & 1-Line Regional Share */}
              <TelemetryCards itinerary={itinerary} locale={locale} />

              {/* Ringkasan Narasi Rute Aktif */}
              <section
                aria-live="polite"
                className="bg-white dark:bg-[#101E18] border border-stone-200/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D4732] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.routeSummaryDays(itinerary.days.length)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300 font-medium">
                    <PlaneLanding
                      className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66]"
                      aria-hidden="true"
                    />
                    {t.arrivalGatePrefix}{" "}
                    <strong className="text-stone-900 dark:text-stone-100">
                      {itinerary.engineMeta?.arrivalGateLabel ||
                        "Bandara I Gusti Ngurah Rai"}
                    </strong>
                  </span>
                </div>

                <h2 className="font-display text-base sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 pt-0.5 text-balance">
                  {itinerary.tripTitle}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {itinerary.summaryNarrative}
                </p>
              </section>

              {/* Kartu Rute Timeline Harian (Editorial Visual Timeline) */}
              <ItineraryTimeline
                days={itinerary.days}
                allVillages={DESA_DATASET}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
                locale={locale}
                onJumpToMap={handleJumpToMapOnMobile}
              />

              {/* Panduan Etika Adat Desa (Awig-Awig) */}
              <CulturalBriefing
                itinerary={itinerary}
                allVillages={DESA_DATASET}
                locale={locale}
              />

              {/* Footer Ringkas */}
              <footer className="pt-3 pb-4 border-t border-stone-200/80 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span translate="no">{t.footerLeft}</span>
                <span>{t.footerRight}</span>
              </footer>
            </div>

            {/* PANEL KANAN: 54% Lebar Layar Desktop, atau Tab "map" Full-Screen di Mobile */}
            <aside
              className={`w-full lg:w-[54%] lg:sticky lg:top-[5.25rem] ${
                mobileTab === "plan" ? "hidden lg:block" : "block"
              }`}
            >
              <LeafletMap
                days={itinerary.days}
                allVillages={DESA_DATASET}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                arrivalCoords={itinerary.engineMeta?.arrivalCoords}
                arrivalLabel={itinerary.engineMeta?.arrivalGateLabel}
                locale={locale}
                isDark={isDark}
              />
            </aside>
          </div>
        )}
      </main>

      {/* Sticky Bottom Thumb Navigation Bar (Mobile / Handphone Only, < 1024px) */}
      <nav
        aria-label="Navigasi utama ponsel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#101E18]/95 backdrop-blur-md border-t border-stone-200/90 dark:border-emerald-900/50 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] no-print shadow-2xl"
      >
        <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto">
          <button
            type="button"
            aria-pressed={mobileTab === "plan"}
            onClick={() => {
              setActiveView("atlas");
              setMobileTab("plan");
            }}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
              mobileTab === "plan"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162921]"
            }`}
          >
            <Route className="w-4 h-4" aria-hidden="true" />
            <span>{t.tabAtlasShort}</span>
          </button>

          <button
            type="button"
            aria-pressed={mobileTab === "map"}
            onClick={() => {
              setActiveView("atlas");
              setMobileTab("map");
            }}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
              mobileTab === "map"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162921]"
            }`}
          >
            <MapIcon className="w-4 h-4" aria-hidden="true" />
            <span>{t.tabMapShort}</span>
          </button>

          <button
            type="button"
            aria-pressed={mobileTab === "simulation"}
            onClick={() => {
              setMobileTab("simulation");
            }}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
              mobileTab === "simulation"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#162921]"
            }`}
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>{t.tabSimShort}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
