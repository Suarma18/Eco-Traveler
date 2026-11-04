"use client";

import React, { useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { formatCompactRupiah, formatRupiah } from "@/lib/utils";
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
}

const ZONE_LABELS: Record<string, string> = {
  North: "Bali Utara",
  East: "Bali Timur",
  West: "Bali Barat",
  "Central-North": "Kaldera Tengah-Utara",
  Central: "Bali Tengah",
  South: "Bali Selatan",
};

export default function TelemetryCards({ itinerary }: TelemetryCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { metrics } = itinerary;

  const priorityPct = metrics.priorityZonePercentage ?? 88.9;
  const redirects = metrics.capacityRedirectsCount ?? 0;

  const zoneShareMap = new Map<string, number>();
  for (const item of metrics.regencyBreakdown || []) {
    const label = ZONE_LABELS[item.zone] || `Kab. ${item.regency}`;
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
      : "Bali Utara 45% · Bali Timur 35% · Bali Barat 20%";

  return (
    <div className="space-y-3">
      {/* 3-Cell Bento Impact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cell 1: Anchor Dark Forest Card - Spread Score */}
        <div className="bg-[#0D261C] text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-emerald-200/90">
              Indeks Pemerataan Wilayah
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
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
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.spreadScore)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-100/80">
              <span>Luar Bali Selatan:</span>
              <strong className="font-mono text-emerald-300 tabular-nums">
                {priorityPct}% Rute
              </strong>
            </div>
          </div>
        </div>

        {/* Cell 2: Local Benefit Index (LBI) */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600">
              Retensi Ekonomi Desa (LBI)
            </span>
            <Store className="w-4 h-4 text-[#C85A32] shrink-0" />
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-stone-900 font-mono tabular-nums">
              {metrics.localBenefitIndex.toFixed(1)}%
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0D4732]">
              Target ≥75%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D4732] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, metrics.localBenefitIndex)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-stone-500 truncate">
              Homestay warga, koperasi & warung lokal
            </p>
          </div>
        </div>

        {/* Cell 3: Total Belanja Warga & Capacity Guard */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600">
              Belanja Langsung ke Warga
            </span>
            <ShieldCheck className="w-4 h-4 text-[#0D4732] shrink-0" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-extrabold text-[#0D4732] font-mono tabular-nums truncate">
              {formatCompactRupiah(metrics.totalLocalRetainedRp)}
            </div>
            <div className="text-[11px] text-stone-500 font-mono tabular-nums">
              Total estimasi: {formatRupiah(metrics.totalEstimatedSpendRp)}
            </div>
          </div>

          <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-stone-600 font-medium truncate">
              {redirects > 0
                ? `${redirects} Desa Penyangga Aktif`
                : "Kuota Kunjungan Aman"}
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-0.5 font-semibold text-[#C85A32] hover:underline cursor-pointer shrink-0"
            >
              <span>Simulasi PDRB</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Regional Distribution Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="w-4 h-4 text-[#0D4732] shrink-0" />
          <span className="text-stone-600 truncate">
            <strong className="text-stone-900">Sebaran Wilayah: </strong>
            <span className="font-mono text-[11px] tabular-nums">
              {regionalSummaryText}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-[#0D4732] hover:underline cursor-pointer shrink-0 flex items-center gap-1"
        >
          <span>Buka Dashboard Simulasi Kabupaten</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <GovernmentBar
        itinerary={itinerary}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
