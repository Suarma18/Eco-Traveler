"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import presetsFallbackData from "../../data/presets-fallback.json";
import {
  TripRequest,
  ItineraryResponse,
  TripDayActivity,
} from "@/types/trip";
import {
  DESA_DATASET,
  DESA_BY_ID,
  computeItineraryTelemetry,
} from "@/lib/scoring";
import { Locale, formatCurrency } from "@/lib/utils";
import { UI_TEXT, localizeItinerary } from "@/lib/i18n";
import TripPlannerForm from "@/components/TripPlannerForm";
import TelemetryCards from "@/components/TelemetryCards";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import CulturalBriefing from "@/components/CulturalBriefing";
import GovernmentBar from "@/components/GovernmentBar";
import {
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

// Eager-preload chunk LeafletMap di awal runtime browser agar tidak tertahan antrean hidrasi
if (typeof window !== "undefined") {
  import("@/components/LeafletMap");
}

function MapLoadingPlaceholder() {
  const [isEn, setIsEn] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eco-traveler-locale");
      const htmlLang = typeof document !== "undefined" ? document.documentElement.lang : "en";
      setIsEn(stored === "en" || (!stored && htmlLang !== "id"));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="relative w-full h-[calc(100dvh-8.25rem)] sm:h-[560px] lg:h-[calc(100dvh-5.5rem)] rounded-2xl overflow-hidden bg-stone-100 dark:bg-[#08120E] border border-stone-200/90 dark:border-emerald-800/60 shadow-lg flex flex-col items-center justify-center p-6 text-center select-none"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Topographic Coordinate Grid Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#0D4732_1px,transparent_1px)] [background-size:20px_20px] opacity-15 dark:opacity-25"
      />

      {/* Top Floating Badge Mockup */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="px-2.5 py-1 rounded-xl bg-white/90 dark:bg-[#101E18]/90 backdrop-blur-xs border border-stone-200 dark:border-emerald-800/40 text-[11px] font-mono font-medium text-stone-600 dark:text-stone-300 shadow-xs">
          {isEn ? "OpenStreetMap · Standby Basemap" : "OpenStreetMap · Basemap Siaga"}
        </div>
        <div className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-[10px] font-mono text-[#0D4732] dark:text-emerald-300 font-semibold">
          8°20&apos;S 115°13&apos;E
        </div>
      </div>

      {/* Center Animated Bali Spatial Blueprint */}
      <div className="relative z-10 flex flex-col items-center max-w-sm space-y-3.5">
        <div className="relative w-44 h-28 flex items-center justify-center">
          {/* SVG Siluet Pulau Bali dengan Titik Node Desa */}
          <svg
            viewBox="0 0 240 140"
            className="w-full h-full text-emerald-800/20 dark:text-emerald-400/20 drop-shadow-sm"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M 24 64 Q 70 32, 130 36 T 202 66 Q 224 76, 212 92 Q 176 102, 144 100 Q 138 126, 128 132 Q 120 126, 124 102 Q 80 94, 24 64 Z" />
            {/* Jalur Koneksi Desa */}
            <path
              d="M 54 68 L 108 46 L 134 62 L 174 74"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            {/* Simpul Titik Desa */}
            <circle cx="54" cy="68" r="3.5" fill="#C85A32" />
            <circle cx="108" cy="46" r="3.5" fill="#10B981" />
            <circle cx="134" cy="62" r="3.5" fill="#38BDF8" />
            <circle cx="174" cy="74" r="3.5" fill="#FBBF24" />
          </svg>

          {/* Radar Scanner Ripple Effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-16 h-16 rounded-full border-2 border-emerald-500/30 animate-ping" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-display text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {isEn ? "Preparing Bali Spatial Atlas…" : "Menyiapkan Atlas Spasial Bali…"}
          </p>
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
            {isEn
              ? "Synchronizing OpenStreetMap layer & 28 village coordinates…"
              : "Sinkronisasi layer OpenStreetMap & 28 titik desa…"}
          </p>
        </div>
      </div>
    </div>
  );
}

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
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
      arrivalGateLabel:
        locale === "en"
          ? "I Gusti Ngurah Rai Airport"
          : "Bandara I Gusti Ngurah Rai",
      arrivalCoords: [-8.7467, 115.1668],
    },
  };

  return locale === "en" ? localizeItinerary(base, "en") : base;
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [isDark, setIsDark] = useState<boolean>(false);

  const [request, setRequest] = useState<TripRequest>({
    durationDays: 3,
    interests: ["Culture", "Nature", "Culinary"],
    budgetCategory: "Moderate",
    arrivalGate: "NgurahRaiAirport",
    simulateCapacityAlert: true,
    locale: "en",
  });

  const [itinerary, setItinerary] = useState<ItineraryResponse>(() =>
    getInitialItinerary("en")
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(
    null
  );
  const [selectedActivity, setSelectedActivity] =
    useState<TripDayActivity | null>(null);

  const [activeView, setActiveView] = useState<"atlas" | "simulation">("atlas");
  const [mobileTab, setMobileTab] = useState<"plan" | "map" | "simulation">(
    "plan"
  );

  // 1A. AI-Generated Narrative State
  const [aiNarrative, setAiNarrative] = useState<{
    summary: string;
    stops: Record<string, string>;
  } | null>(null);
  const [isAiActive, setIsAiActive] = useState<boolean>(false);

  const fetchAiNarrative = useCallback(
    async (itin: ItineraryResponse, currentLocale: Locale) => {
      try {
        const stopsPayload = itin.days
          .flatMap((d) => d.activities)
          .map((a) => {
            const v = DESA_BY_ID.get(a.villageId);
            return {
              id: a.villageId,
              name: a.villageName,
              regency: a.regency,
              highlights: v?.highlights || [],
              customsNote: v?.customsNote,
              localUmkmSpot: a.localUmkmSpot,
            };
          });

        const res = await fetch("/api/ai/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stops: stopsPayload, locale: currentLocale }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.isAiGenerated && data.summary) {
          setAiNarrative({
            summary: data.summary,
            stops: data.stops || {},
          });
          setIsAiActive(true);
        } else {
          setAiNarrative(null);
          setIsAiActive(false);
        }
      } catch (err) {
        console.warn("AI narrative fetch failed, staying deterministic:", err);
        setAiNarrative(null);
        setIsAiActive(false);
      }
    },
    []
  );

  // Sync React state with initial theme & locale applied in <head>
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("eco-traveler-theme");
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      }
      const savedLocale = localStorage.getItem("eco-traveler-locale");
      if (savedLocale === "id") {
        setLocale("id");
        setRequest((prev) => ({ ...prev, locale: "id" }));
        setItinerary((prev) => {
          const locItin = localizeItinerary(prev, "id");
          fetchAiNarrative(locItin, "id");
          return locItin;
        });
        document.documentElement.lang = "id";
      } else {
        document.documentElement.lang = "en";
        fetchAiNarrative(itinerary, "en");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleToggleLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    setRequest((prev) => ({ ...prev, locale: nextLocale }));
    setItinerary((prev) => {
      const loc = localizeItinerary(prev, nextLocale);
      fetchAiNarrative(loc, nextLocale);
      return loc;
    });
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
          const finalItin =
            locale === "en" ? localizeItinerary(data, "en") : data;
          setItinerary(finalItin);
          // Trigger AI narrative synthesis
          fetchAiNarrative(finalItin, locale);
        }
      } catch (err) {
        console.error("Failed to fetch itinerary:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [locale, fetchAiNarrative]
  );

  // Auto-Light Print Guard: Temporarily switch to Light Mode during window.print() so PDF is ink-friendly
  const handleDownloadPdf = () => {
    if (typeof window === "undefined") return;
    const htmlEl = document.documentElement;
    const wasDark = htmlEl.classList.contains("dark");
    if (wasDark) {
      htmlEl.classList.remove("dark");
    }
    setTimeout(() => {
      window.print();
      if (wasDark) {
        htmlEl.classList.add("dark");
      }
    }, 60);
  };

  const handleJumpToMapOnMobile = (activity: TripDayActivity) => {
    setSelectedActivity(activity);
    setMobileTab("map");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const t = UI_TEXT[locale];

  return (
    <div className="min-h-[100dvh] pb-20 lg:pb-0 bg-[#F8F9FA] dark:bg-[#090E0B] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sticky Top Command Bar */}
      <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#F8F9FA]/90 dark:bg-[#090E0B]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-emerald-950/80 no-print transition-colors">
        <div className="max-w-[1520px] mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-[#0D261C] flex items-center justify-center shadow-xs shrink-0 ring-1 ring-slate-200/80 dark:ring-emerald-500/30 overflow-hidden p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/eco-traveler.svg"
                alt="Eco Traveler Logo"
                className="w-full h-full object-contain"
                width={36}
                height={36}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  translate="no"
                  className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate"
                >
                  Eco Traveler
                </span>
                <span
                  translate="no"
                  title={
                    locale === "en"
                      ? "Subak Atelier: Design aesthetic inspired by Balinese subak landscape geometry"
                      : "Subak Atelier: Tema desain terinspirasi oleh geometri bentang alam subak Bali"
                  }
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 cursor-help"
                >
                  Subak Atelier
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {t.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Center Desktop View Mode Switcher */}
          <div
            role="tablist"
            aria-label="Mode tampilan"
            className="hidden lg:flex items-center bg-slate-200/70 dark:bg-[#121B16] p-1 rounded-xl border border-slate-300/70 dark:border-emerald-900/40"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "atlas"}
              onClick={() => setActiveView("atlas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                activeView === "atlas"
                  ? "bg-white dark:bg-[#18271F] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                activeView === "simulation"
                  ? "bg-white dark:bg-[#18271F] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3
                className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]"
                aria-hidden="true"
              />
              <span>{t.tabSimulation}</span>
            </button>
          </div>

          {/* Right Controls: Language Toggle (ID/EN) + Theme Toggle (Light/Dark) + PDF Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle ID / EN */}
            <div
              role="group"
              aria-label="Pilih Bahasa"
              className="inline-flex items-center bg-slate-200/70 dark:bg-[#121B16] p-0.5 rounded-xl border border-slate-300/70 dark:border-emerald-900/40"
            >
              <button
                type="button"
                aria-pressed={locale === "id"}
                onClick={() => handleToggleLocale("id")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  locale === "id"
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Bahasa Indonesia (ID)"
              >
                ID
              </button>
              <button
                type="button"
                aria-pressed={locale === "en"}
                onClick={() => handleToggleLocale("en")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  locale === "en"
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="English (EN)"
              >
                EN
              </button>
            </div>

            {/* Toggle Light / Dark Segmented Pill */}
            <div
              role="group"
              aria-label="Pilih Tema Tampilan"
              className="inline-flex items-center bg-slate-200/70 dark:bg-[#121B16] p-0.5 rounded-xl border border-slate-300/70 dark:border-emerald-900/40"
            >
              <button
                type="button"
                aria-pressed={!isDark}
                onClick={() => handleSetTheme(false)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  !isDark
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={t.themeLight}
              >
                <Sun
                  className="w-3.5 h-3.5 text-amber-500"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{t.themeLight}</span>
              </button>
              <button
                type="button"
                aria-pressed={isDark}
                onClick={() => handleSetTheme(true)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  isDark
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={t.themeDark}
              >
                <Moon
                  className="w-3.5 h-3.5 text-emerald-300"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{t.themeDark}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main
        id="main-content"
        className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 pb-20 lg:pb-5"
      >
        {/* DESKTOP SIMULATION VIEW OR MOBILE SIMULATION TAB */}
        <div
          className={
            activeView === "simulation" || mobileTab === "simulation"
              ? activeView === "simulation"
                ? "space-y-5"
                : "lg:hidden space-y-5"
              : "hidden"
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

        {/* ATLAS SPLIT-SCREEN (Tetap dimount di DOM agar kontainer Leaflet Map tidak dihancurkan saat beralih tab) */}
        <div
          className={`flex flex-col lg:flex-row gap-6 items-start ${
            activeView === "simulation" || mobileTab === "simulation"
              ? "hidden"
              : ""
          }`}
        >
            {/* PANEL KIRI: 46% Lebar Layar Desktop, atau Tab "plan" di Mobile */}
            <div
              className={`w-full lg:w-[46%] print-full-width space-y-4 sm:space-y-5 ${
                mobileTab === "map" ? "hidden lg:block" : "block"
              }`}
            >
              {/* PRINT-ONLY EQUITABLE HEADER BANNER */}
              <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/img/eco-traveler.svg"
                          alt="Eco Traveler Logo"
                          className="w-full h-full object-contain"
                          width={32}
                          height={32}
                        />
                      </div>
                      <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 uppercase">
                        {t.printHeaderTitle}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {t.printHeaderSub}
                    </p>
                  </div>
                  <div className="text-right text-xs space-y-0.5 shrink-0">
                    <div className="text-slate-500 font-mono text-[10px]">
                      {t.printGeneratedOn}{" "}
                      {new Date().toLocaleDateString(
                        locale === "en" ? "en-US" : "id-ID",
                        { dateStyle: "medium" }
                      )}
                    </div>
                    <div className="font-bold text-slate-900 font-mono text-xs">
                      {itinerary.engineMeta?.modelUsed ||
                        "Subak Spatial Engine v2.0"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-300 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {t.durationLabel}
                    </span>
                    <span className="font-bold text-slate-900">
                      {t.routeSummaryDays(itinerary.days.length)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {t.printArrivalGate}
                    </span>
                    <span className="font-bold text-slate-900 truncate block">
                      {itinerary.engineMeta?.arrivalGateLabel ||
                        (locale === "en"
                          ? "I Gusti Ngurah Rai Airport"
                          : "Bandara I Gusti Ngurah Rai")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {t.printDirectSpend}
                    </span>
                    <span className="font-bold font-mono text-[#0D4732]">
                      {formatCurrency(
                        itinerary.metrics.totalLocalRetainedRp,
                        locale
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {t.printLbiRetention}
                    </span>
                    <span className="font-bold font-mono text-emerald-700">
                      {itinerary.metrics.localBenefitIndex.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Editorial Hero Banner */}
              <section className="no-print relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D261C] via-[#103426] to-[#0A1F17] dark:from-[#0E1F18] dark:to-[#07130E] border border-emerald-900/40 dark:border-emerald-500/30 text-white p-5 sm:p-6 shadow-sm">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1200 400"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,200 Q 300,120 600,200 T 1200,180 L 1200,400 L 0,400 Z"
                    fill="#34D399"
                  />
                  <path
                    d="M 0,260 Q 400,180 800,270 T 1200,240 L 1200,400 L 0,400 Z"
                    fill="#10B981"
                  />
                  <path
                    d="M 0,320 Q 350,250 700,330 T 1200,300 L 1200,400 L 0,400 Z"
                    fill="#059669"
                  />
                </svg>
                <div className="relative z-10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15">
                      <Sparkles
                        className="w-3 h-3 text-emerald-300"
                        aria-hidden="true"
                      />
                      {t.heroBadge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-black/25 px-2 py-0.5 rounded-full border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <CheckCircle2
                        className="w-3 h-3 text-emerald-400"
                        aria-hidden="true"
                      />
                      {isAiActive
                        ? t.engineAiPlus
                        : itinerary.engineMeta?.source === "gemini-ai"
                        ? t.engineAi
                        : t.engineDeterministic}
                    </span>
                  </div>

                  <h1 className="font-display text-xl sm:text-[26px] font-bold tracking-tight text-white leading-snug text-balance">
                    {t.heroTitle}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-xl">
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
                className="bg-white dark:bg-[#111914] border border-stone-200/80 dark:border-emerald-900/40 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D4732] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {t.routeSummaryDays(itinerary.days.length)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <PlaneLanding
                        className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]"
                        aria-hidden="true"
                      />
                      {t.arrivalGatePrefix}{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {itinerary.engineMeta?.arrivalGateLabel ||
                          (locale === "en"
                            ? "I Gusti Ngurah Rai Airport"
                            : "Bandara I Gusti Ngurah Rai")}
                      </strong>
                    </span>
                    {isAiActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        <Sparkles
                          className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        {t.aiNarrativeBadge}
                      </span>
                    )}
                  </div>

                  {/* Primary PDF Download Action */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D261C] dark:bg-emerald-600 hover:bg-[#0D4732] dark:hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                    title={t.downloadPdfFull}
                  >
                    <FileDown
                      className="w-3.5 h-3.5 text-emerald-300 dark:text-white"
                      aria-hidden="true"
                    />
                    <span>{t.downloadPdfFull}</span>
                  </button>
                </div>

                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 pt-0.5 text-balance">
                  {itinerary.tripTitle}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {isAiActive && aiNarrative?.summary
                    ? aiNarrative.summary
                    : itinerary.summaryNarrative}
                </p>
                {isAiActive && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                    {t.aiDisclaimer}
                  </p>
                )}
              </section>

              {/* Kartu Rute Timeline Harian */}
              <ItineraryTimeline
                days={itinerary.days}
                allVillages={DESA_DATASET}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
                selectedDayFilter={selectedDayFilter}
                onSelectDayFilter={setSelectedDayFilter}
                locale={locale}
                onJumpToMap={handleJumpToMapOnMobile}
                arrivalCoords={itinerary.engineMeta?.arrivalCoords}
                arrivalLabel={itinerary.engineMeta?.arrivalGateLabel}
                aiStopNarratives={aiNarrative?.stops}
                isAiActive={isAiActive}
              />

              {/* PRINT-ONLY FOOTER DISCLAIMER */}
              <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  {t.printFooterDisclaimer}
                </p>
                <p>
                  {t.printFooterSource}
                </p>
              </div>

              {/* Closing Action Card: Export Itinerary to PDF */}
              <section className="no-print bg-gradient-to-br from-[#0D261C] via-[#103426] to-[#0A1F17] dark:from-[#0E1F18] dark:to-[#07130E] border border-emerald-900/40 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
                    <FileDown
                      className="w-3.5 h-3.5 text-emerald-300"
                      aria-hidden="true"
                    />
                    <span>{t.pdfExportTitle}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white tracking-tight">
                    {t.readyForJourney}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.readyForJourneyDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  <FileDown className="w-4 h-4 text-slate-950" aria-hidden="true" />
                  <span>{t.downloadPdfFull}</span>
                </button>
              </section>

              {/* Panduan Etika Adat Desa (Awig-Awig) */}
              <CulturalBriefing
                itinerary={itinerary}
                allVillages={DESA_DATASET}
                locale={locale}
              />

              {/* Footer Ringkas */}
              <footer className="pt-3 pb-4 border-t border-slate-200/80 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                isMobileActive={mobileTab === "map"}
              />
            </aside>
          </div>
      </main>

      {/* Sticky Bottom Thumb Navigation Bar (Mobile / Handphone Only, < 1024px) */}
      <nav
        aria-label="Navigasi utama ponsel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111914]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-emerald-900/50 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] no-print shadow-2xl"
      >
        <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto">
          <button
            type="button"
            aria-pressed={mobileTab === "plan"}
            onClick={() => {
              setActiveView("atlas");
              setMobileTab("plan");
            }}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
              mobileTab === "plan"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16231c]"
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
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "instant" });
              }
            }}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
              mobileTab === "map"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16231c]"
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
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
              mobileTab === "simulation"
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16231c]"
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
