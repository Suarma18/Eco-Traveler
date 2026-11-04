"use client";

import React, { useEffect, useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { BALI_BASELINE_SHARE, PRIORITY_REGENCIES } from "@/lib/scoring";
import { Locale, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import { X, Users, BarChart3, TrendingUp, Scale } from "lucide-react";

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
    "Tabanan",
    "Gianyar",
    "Badung",
    "Denpasar",
  ];

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
    <div className="bg-white dark:bg-[#101E18] border border-stone-200/90 dark:border-emerald-900/40 rounded-2xl w-full p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xl transition-colors">
      <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 dark:border-emerald-900/30 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            {t.govBadge}
          </span>
          <h3
            id="modal-sebaran-title"
            className="text-lg sm:text-xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance"
          >
            {t.govTitle}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
            {t.govSubtitle}
          </p>
        </div>
        {onClose && !inlineMode && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#162921] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
            aria-label={t.closeModalLabel}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 3-Card Macro Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#162921] border border-stone-200/80 dark:border-emerald-900/40 space-y-1">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Scale
              className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66]"
              aria-hidden="true"
            />
            <span>{t.statusQuoTitle}</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-stone-900 dark:text-white font-mono tabular-nums">
            {locale === "en" ? "65.88%" : "65,88%"}
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300">
            {t.statusQuoDesc}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D261C] dark:bg-[#132A20] dark:border dark:border-emerald-700/40 text-white space-y-1">
          <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.ecoRouteAllocTitle}</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-white font-mono tabular-nums">
            {prioritySharePct}%
          </div>
          <p className="text-[11px] text-emerald-100/80">
            {t.ecoRouteAllocDesc}
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
          <p className="text-[11px] text-stone-600 dark:text-stone-300">
            {t.econInjectionDesc(formatCurrency(totalRetainedSingle, locale))}
          </p>
        </div>
      </div>

      {/* Cohort Multiplier Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100/80 dark:bg-[#162921] p-3 rounded-xl">
        <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  active
                    ? "bg-[#0D261C] dark:bg-emerald-600 text-white font-semibold shadow-xs"
                    : "bg-white dark:bg-[#101E18] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#1c3329] border border-stone-200/80 dark:border-emerald-900/40"
                }`}
              >
                {formatted} {t.touristUnit}
              </button>
            );
          })}
        </div>
      </div>

      {/* Regency Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {orderedRegencies.map((regency) => {
          const baseInfo = BALI_BASELINE_SHARE[regency] || {
            baselinePct: 5,
            zone: "Bali",
            isPriority: true,
          };
          const activeInfo = regencySpendLookup.get(regency) || {
            spendRp: 0,
            sharePct: 0,
            visits: 0,
          };
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
              className={`p-3.5 rounded-xl border transition-colors ${
                activeInfo.sharePct > 0
                  ? "bg-white dark:bg-[#14251E] border-emerald-800/30 dark:border-emerald-600/40 shadow-2xs"
                  : "bg-stone-50/70 dark:bg-[#101E18]/60 border-stone-200/70 dark:border-emerald-900/30 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {locale === "en" ? regency : `Kab. ${regency}`}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      baseInfo.isPriority
                        ? "bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300"
                        : "bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {zoneLabel}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                  {activeInfo.sharePct > 0
                    ? formatCompactCurrency(projectedRegencyRp, locale)
                    : locale === "en"
                    ? "$0"
                    : "Rp 0"}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="w-28 text-stone-500 dark:text-stone-400 text-[10px] shrink-0">
                    {t.statusQuoBar} {baseInfo.baselinePct}%
                  </span>
                  <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 dark:bg-stone-600 rounded-full"
                      style={{
                        width: `${Math.min(100, baseInfo.baselinePct * 1.5)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-28 text-[#0D4732] dark:text-emerald-400 font-semibold text-[10px] shrink-0">
                    {t.thisRouteBar} {activeInfo.sharePct}%
                  </span>
                  <div className="flex-1 h-2 bg-stone-100 dark:bg-[#162921] rounded-full overflow-hidden">
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
