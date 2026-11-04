"use client";

import React, { useEffect, useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { BALI_BASELINE_SHARE, PRIORITY_REGENCIES } from "@/lib/scoring";
import { formatCompactRupiah, formatRupiah } from "@/lib/utils";
import { X, Users, BarChart3, TrendingUp, Scale } from "lucide-react";

interface GovernmentBarProps {
  itinerary: ItineraryResponse;
  isOpen?: boolean;
  onClose?: () => void;
  inlineMode?: boolean;
}

const COHORT_MULTIPLIERS = [
  { count: 1, label: "1 Wisatawan" },
  { count: 1000, label: "1.000 Wisatawan" },
  { count: 10000, label: "10.000 Wisatawan" },
  { count: 50000, label: "50.000 Wisatawan" },
];

export default function GovernmentBar({
  itinerary,
  isOpen = false,
  onClose,
  inlineMode = false,
}: GovernmentBarProps) {
  const [touristCohort, setTouristCohort] = useState<number>(1000);

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

  const content = (
    <div className="bg-white border border-stone-200/90 rounded-2xl w-full p-5 sm:p-6 space-y-6 shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0D4732] font-semibold mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            Simulasi Kebijakan Pemerataan Ekonomi Bali
          </span>
          <h3
            id="modal-sebaran-title"
            className="text-lg sm:text-xl font-display font-bold text-stone-900 tracking-tight text-balance"
          >
            Proyeksi Redistribusi Belanja Wisatawan Antar-Kabupaten
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Membandingkan porsi PDRB Status Quo (65,88% terpusat di Bali
            Selatan) dengan distribusi belanja langsung dari rute Eco Traveler.
          </p>
        </div>
        {onClose && !inlineMode && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
            aria-label="Tutup rincian sebaran"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 3-Card Macro Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
          <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
            <Scale
              className="w-3.5 h-3.5 text-[#C85A32]"
              aria-hidden="true"
            />
            <span>Status Quo PDRB Bali</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-stone-900 font-mono tabular-nums">
            65,88%
          </div>
          <p className="text-[11px] text-stone-600">
            Terkonsentrasi di Bali Selatan (Badung, Denpasar, Gianyar, Tabanan).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D261C] text-white space-y-1">
          <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Alokasi Rute Eco Traveler</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-white font-mono tabular-nums">
            {prioritySharePct}%
          </div>
          <p className="text-[11px] text-emerald-100/80">
            Mengalir langsung ke Buleleng, Karangasem, Bangli, dan Jembrana.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-900/15 space-y-1">
          <div className="text-xs font-medium text-[#0D4732] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Injeksi Ekonomi ({touristCohort.toLocaleString("id-ID")} Turis)
            </span>
          </div>
          <div className="text-2xl font-display font-extrabold text-[#0D4732] font-mono tabular-nums">
            {formatCompactRupiah(projectedTotalRetained)}
          </div>
          <p className="text-[11px] text-stone-600">
            Setara {formatRupiah(totalRetainedSingle)}/wisatawan ke usaha desa &
            homestay warga.
          </p>
        </div>
      </div>

      {/* Cohort Multiplier Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100/80 p-3 rounded-xl">
        <span className="text-xs font-semibold text-stone-700">
          Skala Simulasi Jumlah Wisatawan:
        </span>
        <div
          role="group"
          aria-label="Skala jumlah wisatawan"
          className="flex flex-wrap items-center gap-1.5"
        >
          {COHORT_MULTIPLIERS.map((m) => {
            const active = touristCohort === m.count;
            return (
              <button
                key={m.count}
                type="button"
                aria-pressed={active}
                onClick={() => setTouristCohort(m.count)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  active
                    ? "bg-[#0D261C] text-white font-semibold shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80"
                }`}
              >
                {m.label}
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

          return (
            <div
              key={regency}
              className={`p-3.5 rounded-xl border transition-colors ${
                activeInfo.sharePct > 0
                  ? "bg-white border-emerald-800/30 shadow-2xs"
                  : "bg-stone-50/70 border-stone-200/70 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    Kab. {regency}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      baseInfo.isPriority
                        ? "bg-emerald-50 text-[#0D4732]"
                        : "bg-stone-200/70 text-stone-600"
                    }`}
                  >
                    {baseInfo.zone
                      .replace(" (Prioritas)", "")
                      .replace(" (Pusat)", "")}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#0D4732] tabular-nums">
                  {activeInfo.sharePct > 0
                    ? formatCompactRupiah(projectedRegencyRp)
                    : "Rp 0"}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="w-28 text-stone-500 text-[10px] shrink-0">
                    Status Quo: {baseInfo.baselinePct}%
                  </span>
                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 rounded-full"
                      style={{
                        width: `${Math.min(100, baseInfo.baselinePct * 1.5)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-28 text-[#0D4732] font-semibold text-[10px] shrink-0">
                    Rute Ini: {activeInfo.sharePct}%
                  </span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D4732] rounded-full transition-[width] duration-500"
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
      className="fixed inset-0 z-[1000] bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain"
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
