"use client";

import React, { useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { Locale, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import GovernmentBar from "@/components/GovernmentBar";
import {
  TrendingUp,
  Store,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

interface TelemetryCardsProps {
  itinerary: ItineraryResponse;
  hideSimulationTriggers?: boolean;
  locale: Locale;
}

const ZONE_LABELS: Record<Locale, Record<string, string>> = {
  id: {
    North: "Bali Utara",
    East: "Bali Timur",
    West: "Bali Barat",
    "Central-North": "Kaldera Tengah-Utara",
    Central: "Bali Tengah",
    South: "Bali Selatan",
  },
  en: {
    North: "North Bali",
    East: "East Bali",
    West: "West Bali",
    "Central-North": "Central-North Caldera",
    Central: "Central Bali",
    South: "South Bali",
  },
};

export default function TelemetryCards({
  itinerary,
  hideSimulationTriggers = false,
  locale,
}: TelemetryCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { metrics } = itinerary;
  const t = UI_TEXT[locale];

  const priorityPct = metrics.priorityZonePercentage ?? 88.9;
  const redirects = metrics.capacityRedirectsCount ?? 0;

  const zoneShareMap = new Map<string, number>();
  for (const item of metrics.regencyBreakdown || []) {
    const label =
      ZONE_LABELS[locale][item.zone] ||
      (locale === "en" ? `${item.regency}` : `Kab. ${item.regency}`);
    zoneShareMap.set(
      label,
      (zoneShareMap.get(label) || 0) + item.sharePercentage
    );
  }

  const regionalSummaryParts = Array.from(zoneShareMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([zoneLabel, pct]) => `${zoneLabel} ${Math.round(pct)}%`);

  const regionalSummaryText =
    regionalSummaryParts.length > 0
      ? regionalSummaryParts.join(" · ")
      : locale === "en"
      ? "North Bali 45% · East Bali 35% · West Bali 20%"
      : "Bali Utara 45% · Bali Timur 35% · Bali Barat 20%";

  return (
    <div className="space-y-3">
      {/* 3-Cell Bento Impact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cell 1: Anchor Dark Forest Card - Spread Score */}
        <div className="bg-[#0D261C] dark:bg-[#163527] dark:border dark:border-emerald-500/40 dark:ring-1 dark:ring-emerald-400/15 text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-emerald-200/90">
              {t.spreadScoreTitle}
            </span>
            <TrendingUp
              className="w-4 h-4 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-extrabold text-white font-mono tabular-nums">
              {metrics.spreadScore.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-emerald-300">/ 100</span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(100, metrics.spreadScore)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-100/80">
              <span>{t.outsideSouthBali}</span>
              <strong className="font-mono text-emerald-300 tabular-nums">
                {priorityPct}% {t.routeSuffix}
              </strong>
            </div>
          </div>
        </div>

        {/* Cell 2: Local Benefit Index (LBI) */}
        <div className="bg-white dark:bg-[#101E18] border border-stone-200/90 dark:border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
              {t.lbiTitle}
            </span>
            <Store
              className="w-4 h-4 text-[#C85A32] dark:text-[#F28B66] shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-stone-900 dark:text-white font-mono tabular-nums">
              {metrics.localBenefitIndex.toFixed(1)}%
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300">
              {t.lbiTarget}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-stone-100 dark:bg-[#162921] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D4732] dark:bg-emerald-500 rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, metrics.localBenefitIndex)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {t.lbiSub}
            </p>
          </div>
        </div>

        {/* Cell 3: Total Belanja Warga & Capacity Guard */}
        <div className="bg-white dark:bg-[#101E18] border border-stone-200/90 dark:border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
              {t.directSpendTitle}
            </span>
            <ShieldCheck
              className="w-4 h-4 text-[#0D4732] dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-extrabold text-[#0D4732] dark:text-emerald-400 font-mono tabular-nums truncate">
              {formatCompactCurrency(metrics.totalLocalRetainedRp, locale)}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
              {t.totalEstPrefix}{" "}
              {formatCurrency(metrics.totalEstimatedSpendRp, locale)}
            </div>
          </div>

          <div className="pt-1.5 border-t border-stone-100 dark:border-emerald-900/30 flex items-center justify-between text-[11px]">
            <span className="text-stone-600 dark:text-stone-300 font-medium truncate">
              {redirects > 0 ? t.bufferActive(redirects) : t.quotaSafe}
            </span>
            {!hideSimulationTriggers && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-0.5 font-semibold text-[#C85A32] dark:text-[#F28B66] hover:underline cursor-pointer shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] dark:focus-visible:ring-[#F28B66]"
              >
                <span>{t.simPdrbBtn}</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regional Distribution Bar */}
      <div className="bg-white dark:bg-[#101E18] border border-stone-200/80 dark:border-emerald-900/40 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3
            className="w-4 h-4 text-[#0D4732] dark:text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span className="text-stone-600 dark:text-stone-300 truncate">
            <strong className="text-stone-900 dark:text-stone-100">
              {t.regionalShareLabel}{" "}
            </strong>
            <span className="font-mono text-[11px] tabular-nums">
              {regionalSummaryText}
            </span>
          </span>
        </div>

        {!hideSimulationTriggers && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-[#0D4732] dark:text-emerald-400 hover:underline cursor-pointer shrink-0 flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
          >
            <span>{t.openSimDashboard}</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {!hideSimulationTriggers && (
        <GovernmentBar
          itinerary={itinerary}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
