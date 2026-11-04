"use client";

import React from "react";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import { formatRupiah, DAY_COLORS } from "@/lib/utils";
import { getVillageVisualMeta } from "@/lib/village-media";
import {
  Home,
  Store,
  ArrowRightLeft,
  Mountain,
  ScrollText,
  Users,
} from "lucide-react";

interface ItineraryTimelineProps {
  days: DayItinerary[];
  allVillages?: DesaWisata[];
  selectedActivity: TripDayActivity | null;
  onSelectActivity: (activity: TripDayActivity) => void;
  selectedDayFilter: number | null;
  onSelectDayFilter: (day: number | null) => void;
}

export default function ItineraryTimeline({
  days,
  allVillages = [],
  selectedActivity,
  onSelectActivity,
  selectedDayFilter,
  onSelectDayFilter,
}: ItineraryTimelineProps) {
  return (
    <div className="space-y-7">
      {selectedDayFilter !== null && (
        <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-900/15 px-4 py-2.5 rounded-xl text-xs">
          <span className="text-stone-800">
            Menampilkan fokus rute <strong>Hari {selectedDayFilter}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className="font-semibold text-[#C85A32] hover:underline cursor-pointer"
          >
            Tampilkan Semua Hari ({days.length}H)
          </button>
        </div>
      )}

      {days
        .filter(
          (d) => selectedDayFilter === null || d.dayNumber === selectedDayFilter
        )
        .map((day) => {
          const colorInfo = DAY_COLORS[day.dayNumber] || DAY_COLORS[1];
          const daySpendRp = day.activities.reduce(
            (sum, a) => sum + (Number(a.estimatedLocalSpendRp) || 0),
            0
          );

          return (
            <section key={day.dayNumber} className="space-y-3.5">
              {/* Header Hari */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-stone-200/90 rounded-xl px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0"
                    style={{ backgroundColor: colorInfo.hex }}
                  >
                    H{day.dayNumber}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-stone-900 tracking-tight">
                      {day.themeTitle}
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      {day.activities.length} Titik Desa Wisata Mandiri
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                    Alokasi Aktivitas
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D4732] tabular-nums">
                    {formatRupiah(daySpendRp)}
                  </span>
                </div>
              </div>

              {/* Vertical Timeline Rail */}
              <div className="ml-3 pl-5 border-l-2 border-stone-200/90 space-y-3.5">
                {day.activities.map((activity, idx) => {
                  const isSelected =
                    selectedActivity?.villageId === activity.villageId &&
                    selectedActivity?.timeSlot === activity.timeSlot;
                  const isRedirected =
                    activity.capacityStatus === "REDIRECTED_BUFFER";
                  const visualMeta = getVillageVisualMeta(
                    activity.villageId,
                    allVillages
                  );
                  const villageEntity = allVillages.find(
                    (v) => v.id === activity.villageId
                  );

                  return (
                    <div
                      key={`${day.dayNumber}-${activity.villageId}-${idx}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectActivity(activity)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectActivity(activity);
                        }
                      }}
                      className={`group relative bg-white rounded-2xl p-4 border transition-all cursor-pointer focus-visible:outline-none ${
                        isSelected
                          ? "border-[#0D4732] ring-2 ring-[#0D4732]/15 shadow-md"
                          : "border-stone-200/90 hover:border-stone-300 shadow-2xs"
                      }`}
                    >
                      {/* Node Dot on Vertical Timeline */}
                      <span
                        className="absolute -left-[27px] top-6 w-3 h-3 rounded-full border-2 border-[#F6F5F0]"
                        style={{ backgroundColor: colorInfo.hex }}
                      />

                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Visual Thumbnail Desa */}
                        <div className="relative w-full sm:w-36 h-36 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visualMeta.imageUrl}
                            alt={activity.villageName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <span
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white shadow-xs"
                            style={{ backgroundColor: colorInfo.hex }}
                          >
                            H{day.dayNumber}.{idx + 1} · {activity.timeSlot}
                          </span>
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1">
                            <Mountain className="w-2.5 h-2.5 text-emerald-300" />
                            {visualMeta.elevationLabel}
                          </span>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                          <div>
                            {/* Top Meta Row */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0D4732]">
                                  {activity.villageName}
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                                  Kab. {activity.regency}
                                </span>
                                {isRedirected && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-[#C85A32] border border-orange-200/70">
                                    <ArrowRightLeft className="w-3 h-3" />
                                    Desa Penyangga
                                  </span>
                                )}
                              </div>

                              <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg tabular-nums shrink-0">
                                {formatRupiah(activity.estimatedLocalSpendRp)}
                              </span>
                            </div>

                            {/* Activity Title */}
                            <h4 className="font-display font-bold text-stone-900 text-sm sm:text-base leading-snug mb-1">
                              {activity.activityTitle}
                            </h4>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                              {activity.description}
                            </p>
                          </div>

                          {/* Bottom Impact & Etiquette Footer */}
                          <div className="pt-2.5 border-t border-stone-100 space-y-1.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {activity.localUmkmSpot && (
                                <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                                  <Store className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
                                  <span>{activity.localUmkmSpot}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 tabular-nums">
                                <Users className="w-3 h-3 text-[#0D4732]" />
                                <span>{visualMeta.quotaLabel}</span>
                              </div>
                            </div>

                            {villageEntity?.customsNote && (
                              <div className="flex items-start gap-1.5 text-[11px] text-stone-500">
                                <ScrollText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-stone-700">
                                    Etika Adat:{" "}
                                  </strong>
                                  {villageEntity.customsNote}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Rekomendasi Homestay / Eco-Lodge Warga di Akhir Hari */}
                {day.recommendedStay && (
                  <div className="relative bg-[#0D261C] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
                    <span className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#F6F5F0]" />
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>
                        <strong className="text-emerald-200">
                          Akomodasi Warga (Malam H{day.dayNumber}):
                        </strong>{" "}
                        {day.recommendedStay.name} ({day.recommendedStay.type})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      {day.recommendedStay.priceRangeRp}
                    </span>
                  </div>
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
}
