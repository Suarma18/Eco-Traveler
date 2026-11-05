"use client";

import React, { useEffect, useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { BALI_BASELINE_SHARE, PRIORITY_REGENCIES } from "@/lib/scoring";
import { Locale, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import { X, Users, BarChart3, TrendingUp, Scale, Info } from "lucide-react";

interface GovernmentBarProps {
  itinerary: ItineraryResponse;
  isOpen?: boolean;
  onClose?: () => void;
  inlineMode?: boolean;
  locale: Locale;
}

const COHORT_COUNTS = [1, 1000, 10000, 50000];

const ZONE_BADGE_EN: Record<string, string> = {
  "Bali Utara (Prioritas)": "North Bali",
  "Bali Timur (Prioritas)": "East Bali",
  "Bali Tengah-Utara (Prioritas)": "Central-North",
  "Bali Barat (Prioritas)": "West Bali",
  "Zona Transisi": "Transition Zone",
  "Bali Selatan (Pusat)": "South Core",
  "Kepulauan & Timur": "East Islands",
};

export default function GovernmentBar({
  itinerary,
  isOpen = false,
  onClose,
  inlineMode = false,
  locale,
}: GovernmentBarProps) {
  const [touristCohort, setTouristCohort] = useState<number>(1000);
  const t = UI_TEXT[locale];

  useEffect(() => {
    if (!isOpen || inlineMode || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, inlineMode, onClose]);

  if (!isOpen && !inlineMode) return null;

  const breakdown = itinerary.metrics.regencyBreakdown || [];
  const totalRetainedSingle = itinerary.metrics.totalLocalRetainedRp;
  const projectedTotalRetained = totalRetainedSingle * touristCohort;

  const regencySpendLookup = new Map<
    string,
    { spendRp: number; sharePct: number; visits: number }
  >();
  for (const item of breakdown) {
    regencySpendLookup.set(item.regency, {
      spendRp: item.estimatedSpendRp,
      sharePct: item.sharePercentage,
      visits: item.visitCount,
    });
  }

  const orderedRegencies = [
    "Buleleng",
    "Karangasem",
    "Bangli",
    "Jembrana",
    "Klungkung",
    "Tabanan",
    "Gianyar",
    "Badung",
    "Denpasar",
  ];

  // Filter hanya kabupaten yang memiliki alokasi belanja > 0 pada rute aktif (mengurangi beban kognitif)
  const activeRegencies = orderedRegencies.filter((regency) => {
    const activeInfo = regencySpendLookup.get(regency);
    return activeInfo && (activeInfo.spendRp > 0 || activeInfo.sharePct > 0);
  });

  // Identifikasi kabupaten yang tidak masuk dalam rute redistribusi ini
  const excludedRegencies = orderedRegencies.filter(
    (regency) => !activeRegencies.includes(regency)
  );

  const activeRegencyNames = breakdown
    .filter((b) => b.estimatedSpendRp > 0)
    .map((b) => (locale === "en" ? b.regency : `Kab. ${b.regency}`));

  const priorityTotalSpend = breakdown
    .filter((b) => PRIORITY_REGENCIES.has(b.regency))
    .reduce((acc, b) => acc + b.estimatedSpendRp, 0);

  const prioritySharePct =
    totalRetainedSingle > 0
      ? Math.round((priorityTotalSpend / totalRetainedSingle) * 1000) / 10
      : 88.5;

  const cohortFormatted = touristCohort.toLocaleString(
    locale === "en" ? "en-US" : "id-ID"
  );

  const content = (
    <div className="bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/40 rounded-2xl w-full p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xl transition-colors">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-emerald-900/30 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            {t.govBadge}
          </span>
          <h3
            id="modal-sebaran-title"
            className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight text-balance"
          >
            {t.govTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t.govSubtitle}
          </p>
        </div>
        {onClose && !inlineMode && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16231c] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
            aria-label={t.closeModalLabel}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 3-Card Macro Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Scale
              className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]"
              aria-hidden="true"
            />
            <span>{t.statusQuoTitle}</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {locale === "en" ? "65.88%" : "65,88%"}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {t.statusQuoDesc}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D261C] dark:bg-[#12281e] dark:border dark:border-emerald-500/30 text-white space-y-1">
          <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.ecoRouteAllocTitle}</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-white font-mono tabular-nums">
            {prioritySharePct}%
          </div>
          <p className="text-[11px] text-emerald-100/80">
            {t.ecoRouteAllocDesc(activeRegencyNames)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-900/15 dark:border-emerald-800/40 space-y-1">
          <div className="text-xs font-medium text-[#0D4732] dark:text-emerald-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.econInjectionTitle(cohortFormatted)}</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#0D4732] dark:text-emerald-400 font-mono tabular-nums">
            {formatCompactCurrency(projectedTotalRetained, locale)}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {t.econInjectionDesc(formatCurrency(totalRetainedSingle, locale))}
          </p>
        </div>
      </div>

      {/* Cohort Multiplier Controls */}
      <div className="bg-slate-100/80 dark:bg-[#16231c] p-3 rounded-xl space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t.cohortScaleLabel}
          </span>
          <div
            role="group"
            aria-label={t.cohortScaleLabel}
            className="flex flex-wrap items-center gap-1.5"
          >
            {COHORT_COUNTS.map((count) => {
              const active = touristCohort === count;
              const formatted = count.toLocaleString(
                locale === "en" ? "en-US" : "id-ID"
              );
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTouristCohort(count)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                    active
                      ? "bg-[#0D261C] dark:bg-emerald-600 text-white font-semibold shadow-xs"
                      : "bg-white dark:bg-[#111914] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c3025] border border-slate-200/80 dark:border-emerald-900/40"
                  }`}
                >
                  {formatted} {t.touristUnit}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
          {t.cohortDisclaimer}
        </p>
      </div>

      {/* Methodology Note Alert */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
        <Info
          className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="leading-relaxed">{t.methodologyNote}</p>
      </div>

      {/* Regency Comparison Grid (Hanya render kabupaten yang memiliki alokasi belanja > 0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeRegencies.map((regency) => {
          const baseInfo = BALI_BASELINE_SHARE[regency] || {
            baselinePct: 5,
            zone: "Bali",
            isPriority: true,
          };
          const activeInfo = regencySpendLookup.get(regency)!;
          const projectedRegencyRp = activeInfo.spendRp * touristCohort;
          const zoneLabel =
            locale === "en"
              ? ZONE_BADGE_EN[baseInfo.zone] || baseInfo.zone
              : baseInfo.zone
                  .replace(" (Prioritas)", "")
                  .replace(" (Pusat)", "");

          return (
            <div
              key={regency}
              className="bg-white dark:bg-[#14231b] border border-stone-200/80 dark:border-emerald-600/40 rounded-xl shadow-sm p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {locale === "en" ? regency : `Kab. ${regency}`}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      baseInfo.isPriority
                        ? "bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300"
                        : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
                    }`}
                  >
                    {zoneLabel}
                  </span>
                  {baseInfo.isDerived && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                      ({t.derivedLabel})
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                  {formatCompactCurrency(projectedRegencyRp, locale)}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="w-44 text-stone-500 dark:text-stone-400 text-[10px] shrink-0 truncate">
                    {t.statusQuoBar} {baseInfo.baselinePct}%
                  </span>
                  <div className="flex-1 h-1.5 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 dark:bg-slate-600 rounded-full"
                      style={{
                        width: `${Math.min(100, baseInfo.baselinePct * 1.5)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-44 text-[#0D4732] dark:text-emerald-400 font-semibold text-[10px] shrink-0 truncate">
                    {t.thisRouteBar} {activeInfo.sharePct}%
                  </span>
                  <div className="flex-1 h-2 bg-stone-100 dark:bg-[#16231c] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D4732] dark:bg-emerald-500 rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, activeInfo.sharePct)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catatan elegan untuk kabupaten yang tidak masuk dalam rute redistribusi */}
      {excludedRegencies.length > 0 && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 italic">
          {locale === "en"
            ? `Other regencies (${excludedRegencies.slice(0, 3).join(", ")}, etc.) are not included in this redistribution route.`
            : `Kabupaten lainnya (${excludedRegencies.slice(0, 3).join(", ")}, dll) tidak masuk dalam rute redistribusi ini.`}
        </p>
      )}

      {/* Footer Sumber Data PDRB */}
      <div className="border-t border-slate-200/80 dark:border-emerald-900/30 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{t.gdpDataSource}</span>
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
          9 Kabupaten/Kota Provinsi Bali
        </span>
      </div>
    </div>
  );

  if (inlineMode) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sebaran-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto overscroll-contain">
        {content}
      </div>
    </div>
  );
}
