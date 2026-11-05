"use client";

import React, { useState } from "react";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import {
  Locale,
  formatCurrency,
  formatStayPriceRange,
  DAY_COLORS,
  estimateBaliTransit,
  formatDailyTransitSummary,
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
  Car,
  Navigation,
  BedDouble,
  Compass,
  ChevronDown,
  Sparkles,
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
  arrivalCoords?: [number, number];
  arrivalLabel?: string;
  aiStopNarratives?: Record<string, string>;
  isAiActive?: boolean;
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
  arrivalCoords,
  arrivalLabel,
  aiStopNarratives,
  isAiActive = false,
}: ItineraryTimelineProps) {
  const t = UI_TEXT[locale];
  const [expandedSubSection, setExpandedSubSection] = useState<
    Record<string, "stays" | "attractions" | null>
  >({});

  const toggleSubSection = (key: string, section: "stays" | "attractions") => {
    setExpandedSubSection((prev) => ({
      ...prev,
      [key]: prev[key] === section ? null : section,
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      {selectedDayFilter !== null && (
        <div className="flex items-center justify-between bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-900/15 dark:border-emerald-700/40 px-4 py-2.5 rounded-xl text-xs">
          <span className="text-slate-800 dark:text-slate-200 font-medium">
            {t.showingDayFocus(selectedDayFilter)}
          </span>
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className="font-semibold text-[#EA580C] dark:text-[#FB923C] hover:underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] dark:focus-visible:ring-[#FB923C]"
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

          // Hitung akumulasi jarak dan waktu tempuh harian
          let totalDayTransitMinutes = 0;
          let totalDayTransitKm = 0;

          if (day.dayNumber === 1 && arrivalCoords && day.activities.length > 0) {
            const gateEst = estimateBaliTransit(
              arrivalCoords[0],
              arrivalCoords[1],
              day.activities[0].lat,
              day.activities[0].lng,
              locale
            );
            totalDayTransitMinutes += gateEst.durationMinutes;
            totalDayTransitKm += gateEst.roadDistanceKm;
          }

          for (let i = 1; i < day.activities.length; i++) {
            const segEst = estimateBaliTransit(
              day.activities[i - 1].lat,
              day.activities[i - 1].lng,
              day.activities[i].lat,
              day.activities[i].lng,
              locale
            );
            totalDayTransitMinutes += segEst.durationMinutes;
            totalDayTransitKm += segEst.roadDistanceKm;
          }

          if (day.recommendedStay && day.activities.length > 0) {
            const lastAct = day.activities[day.activities.length - 1];
            const stayVillage =
              allVillages.find((v) =>
                day.recommendedStay.name
                  .toLowerCase()
                  .includes(v.name.toLowerCase())
              ) ||
              allVillages.find(
                (v) =>
                  day.recommendedStay.villageName &&
                  v.name
                    .toLowerCase()
                    .includes(day.recommendedStay.villageName.toLowerCase())
              ) ||
              DESA_BY_ID.get(lastAct.villageId);

            const stayTargetLat = stayVillage ? stayVillage.lat : lastAct.lat;
            const stayTargetLng = stayVillage ? stayVillage.lng : lastAct.lng;
            const stayEst = estimateBaliTransit(
              lastAct.lat,
              lastAct.lng,
              stayTargetLat,
              stayTargetLng,
              locale
            );
            totalDayTransitMinutes += stayEst.durationMinutes;
            totalDayTransitKm += stayEst.roadDistanceKm;
          }

          const dailyTransitSummary =
            totalDayTransitMinutes > 0
              ? formatDailyTransitSummary(
                  totalDayTransitMinutes,
                  totalDayTransitKm,
                  locale
                )
              : null;

          return (
            <section key={day.dayNumber} className="space-y-3.5 print-avoid-break">
              {/* Header Hari */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/40 rounded-xl px-4 py-3 shadow-2xs transition-colors print-day-header">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: colorInfo.hex }}
                  >
                    {dayPrefix}
                    {day.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight text-balance">
                      {day.themeTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{t.villagePointsCount(day.activities.length)}</span>
                      {dailyTransitSummary && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            <Car
                              className="w-3 h-3 text-[#EA580C] dark:text-[#FB923C]"
                              aria-hidden="true"
                            />
                            {dailyTransitSummary}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    {t.activityAllocLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                    {formatCurrency(daySpendRp, locale)}
                  </span>
                </div>
              </div>

              {/* Vertical Timeline Rail */}
              <div className="ml-2 sm:ml-3 pl-4 sm:pl-5 border-l-2 border-slate-200/80 dark:border-emerald-900/40 space-y-3.5">
                {/* Hari 1: Transit dari Pintu Kedatangan */}
                {day.dayNumber === 1 &&
                  arrivalCoords &&
                  day.activities.length > 0 && (() => {
                    const gateTransit = estimateBaliTransit(
                      arrivalCoords[0],
                      arrivalCoords[1],
                      day.activities[0].lat,
                      day.activities[0].lng,
                      locale
                    );
                    return (
                      <div className="relative py-1 print-avoid-break">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-800/40 text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
                          <Navigation
                            className="w-3 h-3 text-[#0D4732] dark:text-emerald-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {t.transitFromGate(arrivalLabel || "Ngurah Rai")}:{" "}
                            <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                              {gateTransit.formattedDuration}
                            </strong>{" "}
                            ({gateTransit.formattedDistance})
                          </span>
                        </div>
                      </div>
                    );
                  })()}

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
                  const cardKey = `${day.dayNumber}-${activity.villageId}-${idx}`;
                  const accommodations = villageEntity?.accommodations || [];
                  const nearbyAttractions =
                    villageEntity?.nearbyAttractions || [];
                  const activeSection = expandedSubSection[cardKey];

                  const prevAct = idx > 0 ? day.activities[idx - 1] : null;
                  const transitFromPrev = prevAct
                    ? estimateBaliTransit(
                        prevAct.lat,
                        prevAct.lng,
                        activity.lat,
                        activity.lng,
                        locale
                      )
                    : null;

                  return (
                    <React.Fragment
                      key={`${day.dayNumber}-${activity.villageId}-${idx}`}
                    >
                      {/* Transit Connector Antar-Titik Aktivitas */}
                      {transitFromPrev && prevAct && (
                        <div className="relative py-1 print-avoid-break">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-[#142019] border border-slate-200/70 dark:border-emerald-900/50 text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
                            <Car
                              className="w-3 h-3 text-[#EA580C] dark:text-[#FB923C] shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {prevAct.villageName} ➔ {activity.villageName}:{" "}
                              <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                                {transitFromPrev.formattedDuration}
                              </strong>{" "}
                              ({transitFromPrev.formattedDistance})
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans hidden sm:inline">
                              · {t.transitRoadEstimate}
                            </span>
                          </div>
                        </div>
                      )}

                      <div
                        role="button"
                      tabIndex={0}
                      onClick={() => onSelectActivity(activity)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectActivity(activity);
                        }
                      }}
                      className={`group relative bg-white dark:bg-[#111914] rounded-2xl p-3.5 sm:p-4 border transition-[border-color,box-shadow] cursor-pointer print-avoid-break focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                        isSelected
                          ? "border-[#0D4732] dark:border-emerald-400 ring-2 ring-[#0D4732]/10 dark:ring-emerald-400/20 shadow-sm"
                          : "border-slate-200/80 dark:border-emerald-900/40 hover:border-slate-300 dark:hover:border-emerald-700/60 shadow-2xs"
                      }`}
                    >
                      {/* Node Dot on Vertical Timeline */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-[23px] sm:-left-[27px] top-6 w-3 h-3 rounded-full border-2 border-[#F8F9FA] dark:border-[#090E0B]"
                        style={{ backgroundColor: colorInfo.hex }}
                      />

                      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
                        {/* Visual Thumbnail Desa */}
                        <div className="relative w-full sm:w-36 h-40 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visualMeta.imageUrl}
                            alt={visualMeta.altText}
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
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                          <div>
                            {/* Top Meta Row: Nama Desa, Kabupaten, Badge Ketinggian (mdpl) & Buffer */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0D4732] dark:text-emerald-400">
                                  {activity.villageName}
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#16231c] text-slate-600 dark:text-slate-300">
                                  {locale === "en"
                                    ? `${activity.regency}`
                                    : `Kab. ${activity.regency}`}
                                </span>
                                {/* Badge Ketinggian dipindah ke baris info agar tidak hilang saat foto diganti */}
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#16231c] text-slate-600 dark:text-slate-300">
                                  <Mountain
                                    className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden="true"
                                  />
                                  {visualMeta.elevationLabel}
                                </span>
                                {isRedirected && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-[#EA580C] dark:text-[#FB923C] border border-orange-200/70 dark:border-orange-800/50">
                                    <ArrowRightLeft
                                      className="w-3 h-3"
                                      aria-hidden="true"
                                    />
                                    {t.bufferBadge}
                                  </span>
                                )}
                              </div>

                              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-emerald-200 bg-slate-100 dark:bg-[#16231c] px-2.5 py-1 rounded-lg tabular-nums shrink-0">
                                {formatCurrency(
                                  activity.estimatedLocalSpendRp,
                                  locale
                                )}
                              </span>
                            </div>

                            {/* Activity Title */}
                            <h4 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug mb-1">
                              {activity.activityTitle}
                            </h4>

                            {/* Description */}
                            {isAiActive && aiStopNarratives?.[activity.villageId] ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50">
                                  <Sparkles
                                    className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden="true"
                                  />
                                  {t.aiStopBadge}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                  {aiStopNarratives[activity.villageId]}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {activity.description}
                              </p>
                            )}
                          </div>

                          {/* Bottom Impact & Etiquette Footer */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-emerald-900/30 space-y-1.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {activity.localUmkmSpot && (
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <Store
                                    className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C] shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span>{activity.localUmkmSpot}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
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
                                    className="no-print lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold text-[11px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
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
                              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <ScrollText
                                  className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <span>
                                  <strong className="text-slate-700 dark:text-slate-200">
                                    {t.customsNotePrefix}{" "}
                                  </strong>
                                  {vText.customsNote}
                                </span>
                              </div>
                            )}

                            {/* Sub-Section Toggle Buttons: Penginapan Warga & Wisata Terdekat */}
                            {(accommodations.length > 0 ||
                              nearbyAttractions.length > 0) && (
                              <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/30 flex flex-wrap items-center gap-2">
                                {accommodations.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubSection(cardKey, "stays");
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                                      activeSection === "stays"
                                        ? "bg-[#0D4732] dark:bg-emerald-600 text-white shadow-2xs"
                                        : "bg-slate-100 dark:bg-[#16231c] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-950/60"
                                    }`}
                                  >
                                    <BedDouble
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                    <span>
                                      {t.staysCountPill(accommodations.length)}
                                    </span>
                                    <ChevronDown
                                      className={`w-3 h-3 transition-transform ${
                                        activeSection === "stays"
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}

                                {nearbyAttractions.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubSection(cardKey, "attractions");
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] dark:focus-visible:ring-orange-400 ${
                                      activeSection === "attractions"
                                        ? "bg-[#EA580C] dark:bg-orange-600 text-white shadow-2xs"
                                        : "bg-slate-100 dark:bg-[#16231c] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-orange-950/60"
                                    }`}
                                  >
                                    <Compass
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                    <span>
                                      {t.attractionsCountPill(
                                        nearbyAttractions.length
                                      )}
                                    </span>
                                    <ChevronDown
                                      className={`w-3 h-3 transition-transform ${
                                        activeSection === "attractions"
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Expanded List: Penginapan di Daerah Tersebut */}
                            {activeSection === "stays" && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 space-y-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-[#142019] border border-emerald-900/15 dark:border-emerald-800/40 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <BedDouble
                                      className="w-3.5 h-3.5 text-[#0D4732] dark:text-emerald-400"
                                      aria-hidden="true"
                                    />
                                    {t.localStaysTitle}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {activity.villageName}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-0.5">
                                  {accommodations.map((stay) => {
                                    const stayName =
                                      locale === "en" && stay.nameEn
                                        ? stay.nameEn
                                        : stay.name;
                                    const features =
                                      locale === "en" && stay.featuresEn
                                        ? stay.featuresEn
                                        : stay.features;
                                    const bookingNote =
                                      locale === "en" && stay.bookingNoteEn
                                        ? stay.bookingNoteEn
                                        : stay.bookingNote;

                                    return (
                                      <div
                                        key={stay.id}
                                        className="p-2.5 rounded-lg bg-white dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-1.5 shadow-2xs"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                              {stayName}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 shrink-0">
                                              {stay.type}
                                            </span>
                                          </div>
                                          <span className="font-mono text-xs font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums shrink-0">
                                            {formatCurrency(
                                              stay.pricePerNightRp,
                                              locale
                                            )}
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal ml-0.5">
                                              {t.perNightLabel}
                                            </span>
                                          </span>
                                        </div>

                                        {features && features.length > 0 && (
                                          <div className="flex flex-wrap items-center gap-1">
                                            {features.map((feat, fIdx) => (
                                              <span
                                                key={fIdx}
                                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-[#1a2b22] text-slate-600 dark:text-slate-300 font-medium"
                                              >
                                                ✓ {feat}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {bookingNote && (
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                            {bookingNote}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Expanded List: Wisata Terdekat */}
                            {activeSection === "attractions" && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 space-y-2 p-3 rounded-xl bg-orange-50/60 dark:bg-[#1c1813] border border-orange-200/60 dark:border-orange-900/40 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <Compass
                                      className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]"
                                      aria-hidden="true"
                                    />
                                    {t.nearbyAttractionsTitle}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {activity.villageName}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-0.5">
                                  {nearbyAttractions.map((poi) => {
                                    const poiName =
                                      locale === "en" && poi.nameEn
                                        ? poi.nameEn
                                        : poi.name;
                                    const desc =
                                      locale === "en" && poi.descriptionEn
                                        ? poi.descriptionEn
                                        : poi.description;
                                    const highlights =
                                      locale === "en" && poi.highlightsEn
                                        ? poi.highlightsEn
                                        : poi.highlights;
                                    const distKmFormatted =
                                      locale === "en"
                                        ? `${poi.distanceKm} km`
                                        : `${poi.distanceKm
                                            .toString()
                                            .replace(".", ",")} km`;

                                    return (
                                      <div
                                        key={poi.id}
                                        className="p-2.5 rounded-lg bg-white dark:bg-[#1e1c18] border border-orange-200/50 dark:border-orange-900/30 space-y-1.5 shadow-2xs"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                              {poiName}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 dark:bg-orange-950/80 text-[#EA580C] dark:text-[#FB923C] shrink-0">
                                              {poi.category}
                                            </span>
                                          </div>
                                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                                            {t.distanceFromVillage(
                                              poi.durationMinutes,
                                              distKmFormatted
                                            )}
                                          </span>
                                        </div>

                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {desc}
                                        </p>

                                        {highlights && (
                                          <div className="text-[10px] font-medium text-[#EA580C] dark:text-[#FB923C] flex items-center gap-1">
                                            <span>✦</span>
                                            <span>{highlights}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                  );
                })}

                {/* Transit Menuju Homestay Warga */}
                {day.recommendedStay &&
                  day.activities.length > 0 && (() => {
                    const lastAct = day.activities[day.activities.length - 1];
                    const stayVillage =
                      allVillages.find((v) =>
                        day.recommendedStay.name
                          .toLowerCase()
                          .includes(v.name.toLowerCase())
                      ) ||
                      allVillages.find(
                        (v) =>
                          day.recommendedStay.villageName &&
                          v.name
                            .toLowerCase()
                            .includes(
                              day.recommendedStay.villageName.toLowerCase()
                            )
                      ) ||
                      DESA_BY_ID.get(lastAct.villageId);

                    const stayTargetLat = stayVillage
                      ? stayVillage.lat
                      : lastAct.lat;
                    const stayTargetLng = stayVillage
                      ? stayVillage.lng
                      : lastAct.lng;
                    const stayTransit = estimateBaliTransit(
                      lastAct.lat,
                      lastAct.lng,
                      stayTargetLat,
                      stayTargetLng,
                      locale
                    );

                    return (
                      <div className="relative py-1 print-avoid-break">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-[#142019] border border-slate-200/70 dark:border-emerald-900/50 text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
                          <Car
                            className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {t.transitToStay}:{" "}
                            <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                              {stayTransit.formattedDuration}
                            </strong>{" "}
                            ({stayTransit.formattedDistance})
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                {/* Rekomendasi Homestay / Eco-Lodge Warga di Akhir Hari */}
                {day.recommendedStay && (
                  <div className="relative bg-[#0D261C] dark:bg-[#12281e] dark:border dark:border-emerald-500/30 text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs print-avoid-break">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[23px] sm:-left-[27px] top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#F8F9FA] dark:border-[#090E0B]"
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
