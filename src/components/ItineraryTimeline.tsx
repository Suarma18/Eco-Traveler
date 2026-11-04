"use client";

import React from "react";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import {
  Locale,
  formatCurrency,
  formatStayPriceRange,
  DAY_COLORS,
} from "@/lib/utils";
import { getVillageVisualMeta } from "@/lib/village-media";
import { DESA_BY_ID } from "@/lib/scoring";
import {
  UI_TEXT,
  formatTimeSlot,
  getLocalizedVillageText,
} from "@/lib/i18n";
import {
  Home,
  Store,
  ArrowRightLeft,
  Mountain,
  ScrollText,
  Users,
  MapPin,
} from "lucide-react";

interface ItineraryTimelineProps {
  days: DayItinerary[];
  allVillages?: DesaWisata[];
  selectedActivity: TripDayActivity | null;
  onSelectActivity: (activity: TripDayActivity) => void;
  selectedDayFilter: number | null;
  onSelectDayFilter: (day: number | null) => void;
  locale: Locale;
  onJumpToMap?: (activity: TripDayActivity) => void;
}

export default function ItineraryTimeline({
  days,
  allVillages = [],
  selectedActivity,
  onSelectActivity,
  selectedDayFilter,
  onSelectDayFilter,
  locale,
  onJumpToMap,
}: ItineraryTimelineProps) {
  const t = UI_TEXT[locale];

  return (
    <div className="space-y-6 sm:space-y-7">
      {selectedDayFilter !== null && (
        <div className="flex items-center justify-between bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-900/15 dark:border-emerald-700/40 px-4 py-2.5 rounded-xl text-xs">
          <span className="text-stone-800 dark:text-stone-200 font-medium">
            {t.showingDayFocus(selectedDayFilter)}
          </span>
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className="font-semibold text-[#C85A32] dark:text-[#F28B66] hover:underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] dark:focus-visible:ring-[#F28B66]"
          >
            {t.showAllDays(days.length)}
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
          const dayPrefix = locale === "en" ? "D" : "H";

          return (
            <section key={day.dayNumber} className="space-y-3.5">
              {/* Header Hari */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#101E18] border border-stone-200/90 dark:border-emerald-900/40 rounded-xl px-4 py-3 shadow-2xs transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0"
                    style={{ backgroundColor: colorInfo.hex }}
                  >
                    {dayPrefix}
                    {day.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
                      {day.themeTitle}
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {t.villagePointsCount(day.activities.length)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 block">
                    {t.activityAllocLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                    {formatCurrency(daySpendRp, locale)}
                  </span>
                </div>
              </div>

              {/* Vertical Timeline Rail */}
              <div className="ml-2 sm:ml-3 pl-4 sm:pl-5 border-l-2 border-stone-200/90 dark:border-emerald-900/50 space-y-3.5">
                {day.activities.map((activity, idx) => {
                  const isSelected =
                    selectedActivity?.villageId === activity.villageId &&
                    selectedActivity?.timeSlot === activity.timeSlot;
                  const isRedirected =
                    activity.capacityStatus === "REDIRECTED_BUFFER";
                  const visualMeta = getVillageVisualMeta(
                    activity.villageId,
                    allVillages,
                    locale
                  );
                  const villageEntity =
                    DESA_BY_ID.get(activity.villageId) ||
                    allVillages.find((v) => v.id === activity.villageId);
                  const vText = villageEntity
                    ? getLocalizedVillageText(villageEntity, locale)
                    : null;

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
                      className={`group relative bg-white dark:bg-[#101E18] rounded-2xl p-3.5 sm:p-4 border transition-[border-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                        isSelected
                          ? "border-[#0D4732] dark:border-emerald-400 ring-2 ring-[#0D4732]/15 dark:ring-emerald-400/25 shadow-md"
                          : "border-stone-200/90 dark:border-emerald-900/40 hover:border-stone-300 dark:hover:border-emerald-700/60 shadow-2xs"
                      }`}
                    >
                      {/* Node Dot on Vertical Timeline */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-[23px] sm:-left-[27px] top-6 w-3 h-3 rounded-full border-2 border-[#F6F5F0] dark:border-[#08120E]"
                        style={{ backgroundColor: colorInfo.hex }}
                      />

                      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
                        {/* Visual Thumbnail Desa */}
                        <div className="relative w-full sm:w-36 h-40 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visualMeta.imageUrl}
                            alt={activity.villageName}
                            width={144}
                            height={144}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <span
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white shadow-xs"
                            style={{ backgroundColor: colorInfo.hex }}
                          >
                            {dayPrefix}
                            {day.dayNumber}.{idx + 1} ·{" "}
                            {formatTimeSlot(activity.timeSlot, locale)}
                          </span>
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1">
                            <Mountain
                              className="w-2.5 h-2.5 text-emerald-300"
                              aria-hidden="true"
                            />
                            {visualMeta.elevationLabel}
                          </span>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                          <div>
                            {/* Top Meta Row */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0D4732] dark:text-emerald-400">
                                  {activity.villageName}
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#162921] text-stone-600 dark:text-stone-300">
                                  {locale === "en"
                                    ? `${activity.regency}`
                                    : `Kab. ${activity.regency}`}
                                </span>
                                {isRedirected && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-[#C85A32] dark:text-[#F28B66] border border-orange-200/70 dark:border-orange-800/50">
                                    <ArrowRightLeft
                                      className="w-3 h-3"
                                      aria-hidden="true"
                                    />
                                    {t.bufferBadge}
                                  </span>
                                )}
                              </div>

                              <span className="font-mono text-xs font-semibold text-stone-800 dark:text-emerald-200 bg-stone-100 dark:bg-[#162921] px-2.5 py-1 rounded-lg tabular-nums shrink-0">
                                {formatCurrency(
                                  activity.estimatedLocalSpendRp,
                                  locale
                                )}
                              </span>
                            </div>

                            {/* Activity Title */}
                            <h4 className="font-display font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base leading-snug mb-1">
                              {activity.activityTitle}
                            </h4>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                              {activity.description}
                            </p>
                          </div>

                          {/* Bottom Impact & Etiquette Footer */}
                          <div className="pt-2.5 border-t border-stone-100 dark:border-emerald-900/30 space-y-1.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {activity.localUmkmSpot && (
                                <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium">
                                  <Store
                                    className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66] shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span>{activity.localUmkmSpot}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
                                  <Users
                                    className="w-3 h-3 text-[#0D4732] dark:text-emerald-400"
                                    aria-hidden="true"
                                  />
                                  <span>{visualMeta.quotaLabel}</span>
                                </div>

                                {onJumpToMap && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onJumpToMap(activity);
                                    }}
                                    className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold text-[11px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
                                  >
                                    <MapPin
                                      className="w-3 h-3"
                                      aria-hidden="true"
                                    />
                                    <span>{t.viewOnMapBtn}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {vText?.customsNote && (
                              <div className="flex items-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                                <ScrollText
                                  className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <span>
                                  <strong className="text-stone-700 dark:text-stone-200">
                                    {t.customsNotePrefix}{" "}
                                  </strong>
                                  {vText.customsNote}
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
                  <div className="relative bg-[#0D261C] dark:bg-[#163527] dark:border dark:border-emerald-500/40 dark:ring-1 dark:ring-emerald-400/15 text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[23px] sm:-left-[27px] top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#F6F5F0] dark:border-[#08120E]"
                    />
                    <div className="flex items-center gap-2">
                      <Home
                        className="w-4 h-4 text-emerald-300 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="text-emerald-200">
                          {t.communityStayPrefix(day.dayNumber)}
                        </strong>{" "}
                        {day.recommendedStay.name} ({day.recommendedStay.type})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      {formatStayPriceRange(
                        day.recommendedStay.priceRangeRp,
                        locale
                      )}
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
