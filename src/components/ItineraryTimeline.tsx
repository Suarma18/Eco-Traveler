"use client";

import React from "react";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { formatRupiah, DAY_COLORS } from "@/lib/utils";
import { getRegencyWeight } from "@/lib/scoring";
import {
  Clock,
  Home,
  MapPin,
  ShieldAlert,
  Store,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

interface ItineraryTimelineProps {
  days: DayItinerary[];
  selectedActivity: TripDayActivity | null;
  onSelectActivity: (activity: TripDayActivity) => void;
  selectedDayFilter: number | null;
  onSelectDayFilter: (day: number | null) => void;
}

export default function ItineraryTimeline({
  days,
  selectedActivity,
  onSelectActivity,
  selectedDayFilter,
  onSelectDayFilter,
}: ItineraryTimelineProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base lg:text-lg font-display font-bold text-slate-100">
            Rangkaian Rute Harian & Alokasi Belanja Desa
          </h3>
          <p className="text-xs text-slate-400">
            Klik kartu aktivitas untuk menyorot titik koordinat dan jalur di
            peta interaktif.
          </p>
        </div>

        {selectedDayFilter !== null && (
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
          >
            Tampilkan Semua Hari ({days.length} Hari)
          </button>
        )}
      </div>

      <div className="space-y-6">
        {days
          .filter(
            (d) => selectedDayFilter === null || d.dayNumber === selectedDayFilter
          )
          .map((day) => {
            const colorInfo = DAY_COLORS[day.dayNumber] || DAY_COLORS[1];
            const dayTotalLocalRp = day.activities.reduce(
              (acc, a) => acc + (Number(a.estimatedLocalSpendRp) || 0),
              0
            );

            return (
              <div
                key={day.dayNumber}
                className="bg-slate-900/85 border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Day Header */}
                <div className="px-4 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: colorInfo.hex }}
                    >
                      H{day.dayNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-display font-bold text-slate-100">
                        {day.themeTitle}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {day.activities.length} Titik Desa Wisata Terverifikasi
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Belanja Aktivitas Harian
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatRupiah(dayTotalLocalRp)}
                    </span>
                  </div>
                </div>

                {/* Activities List */}
                <div className="divide-y divide-slate-800/70">
                  {day.activities.map((activity, idx) => {
                    const isSelected =
                      selectedActivity?.villageId === activity.villageId &&
                      selectedActivity?.timeSlot === activity.timeSlot;
                    const isRedirected =
                      activity.capacityStatus === "REDIRECTED_BUFFER";
                    const regWeight = getRegencyWeight(activity.regency);

                    return (
                      <div
                        key={`${day.dayNumber}-${activity.villageId}-${idx}`}
                        onClick={() => onSelectActivity(activity)}
                        className={`p-4 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-950/40 border-l-4 border-l-emerald-400"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: colorInfo.hex }}
                            >
                              <Clock className="w-3 h-3" />
                              {activity.timeSlot}
                            </span>

                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-100">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              {activity.villageName}
                            </span>

                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Kab. {activity.regency} (W={regWeight.toFixed(1)})
                            </span>

                            {isRedirected && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <ShieldAlert className="w-3 h-3" />
                                Buffer Desa Penyangga
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                            <span>
                              {formatRupiah(activity.estimatedLocalSpendRp)}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>

                        <h5 className="text-sm font-semibold text-emerald-200 mb-1">
                          {activity.activityTitle}
                        </h5>

                        <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                          {activity.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                          {activity.localUmkmSpot && (
                            <div className="flex items-start gap-1.5 text-slate-300">
                              <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-slate-200">
                                  Mitra UMKM Warga:
                                </strong>{" "}
                                {activity.localUmkmSpot}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex items-start gap-1.5 ${
                              isRedirected
                                ? "text-amber-300"
                                : "text-slate-400"
                            }`}
                          >
                            {isRedirected ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            <span>{activity.antiOvertourismNote}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommended Stay Footer */}
                {day.recommendedStay && (
                  <div className="px-4 py-3 bg-emerald-950/35 border-t border-emerald-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Rekomendasi Menginap (Malam H{day.dayNumber}):</strong>{" "}
                        {day.recommendedStay.name} ({day.recommendedStay.type})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-300">
                      {day.recommendedStay.priceRangeRp}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
