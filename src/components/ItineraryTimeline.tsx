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
  AlertTriangle,
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
  const [expandedAdat, setExpandedAdat] = useState<Record<string, boolean>>({});

  const toggleSubSection = (key: string, section: "stays" | "attractions") => {
    setExpandedSubSection((prev) => ({
      ...prev,
      [key]: prev[key] === section ? null : section,
    }));
  };

  const toggleAdat = (key: string) => {
    setExpandedAdat((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Hitung total akumulasi waktu tempuh dan jarak seluruh rute (seluruh hari + pintu kedatangan + kepulangan)
  const tripTransitTotals = React.useMemo(() => {
    let minutes = 0;
    let km = 0;

    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      if (day.activities.length === 0) continue;

      // Hari 1: pintu kedatangan ke titik pertama
      if (day.dayNumber === 1 && arrivalCoords) {
        const gateEst = estimateBaliTransit(
          arrivalCoords[0],
          arrivalCoords[1],
          day.activities[0].lat,
          day.activities[0].lng,
          locale
        );
        minutes += gateEst.durationMinutes;
        km += gateEst.roadDistanceKm;
      }

      // Hari 2+: kaki pagi dari tempat menginap malam sebelumnya ke titik pertama
      if (day.dayNumber > 1) {
        const prevDay = days[d - 1];
        if (prevDay && prevDay.activities.length > 0) {
          const prevLastAct = prevDay.activities[prevDay.activities.length - 1];
          const prevStay = prevDay.recommendedStay;
          const stayVillage = prevStay
            ? allVillages.find((v) =>
                prevStay.name
                  .toLowerCase()
                  .includes(v.name.toLowerCase())
              ) ||
              allVillages.find(
                (v) =>
                  prevStay.villageName &&
                  v.name
                    .toLowerCase()
                    .includes(
                      prevStay.villageName.toLowerCase()
                    )
              ) ||
              DESA_BY_ID.get(prevLastAct.villageId)
            : DESA_BY_ID.get(prevLastAct.villageId);

          const startLat = stayVillage ? stayVillage.lat : prevLastAct.lat;
          const startLng = stayVillage ? stayVillage.lng : prevLastAct.lng;
          const mornEst = estimateBaliTransit(
            startLat,
            startLng,
            day.activities[0].lat,
            day.activities[0].lng,
            locale
          );
          minutes += mornEst.durationMinutes;
          km += mornEst.roadDistanceKm;
        }
      }

      // Kaki antar-titik hari berjalan
      for (let i = 1; i < day.activities.length; i++) {
        const segEst = estimateBaliTransit(
          day.activities[i - 1].lat,
          day.activities[i - 1].lng,
          day.activities[i].lat,
          day.activities[i].lng,
          locale
        );
        minutes += segEst.durationMinutes;
        km += segEst.roadDistanceKm;
      }

      // Kaki menuju homestay
      const curStay = day.recommendedStay;
      if (curStay && day.activities.length > 0) {
        const lastAct = day.activities[day.activities.length - 1];
        const stayVillage =
          allVillages.find((v) =>
            curStay.name
              .toLowerCase()
              .includes(v.name.toLowerCase())
          ) ||
          allVillages.find(
            (v) =>
              curStay.villageName &&
              v.name
                .toLowerCase()
                .includes(curStay.villageName.toLowerCase())
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
        minutes += stayEst.durationMinutes;
        km += stayEst.roadDistanceKm;
      }

      // Hari terakhir: kaki kembali ke pintu kedatangan/keberangkatan
      if (day.dayNumber === days.length && arrivalCoords) {
        const lastAct = day.activities[day.activities.length - 1];
        const retEst = estimateBaliTransit(
          lastAct.lat,
          lastAct.lng,
          arrivalCoords[0],
          arrivalCoords[1],
          locale
        );
        minutes += retEst.durationMinutes;
        km += retEst.roadDistanceKm;
      }
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const durationFormatted =
      hours > 0
        ? locale === "en"
          ? `${hours}h ${mins}m`
          : `${hours}j ${mins}m`
        : locale === "en"
        ? `${mins} mins`
        : `${mins} mnt`;

    const distanceFormatted =
      locale === "en"
        ? `${km.toFixed(1)} km`
        : `${km.toFixed(1).replace(".", ",")} km`;

    return {
      minutes,
      km,
      durationFormatted,
      distanceFormatted,
    };
  }, [days, arrivalCoords, allVillages, locale]);

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Banner Total Perjalanan Seluruh Rute */}
      {tripTransitTotals.minutes > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111914] border border-stone-200/80 dark:border-emerald-900/40 shadow-sm text-xs text-stone-600 dark:text-stone-300 print-avoid-break">
          <div className="flex items-center gap-2">
            <Car
              className="w-4 h-4 text-[#EA580C] dark:text-[#FB923C] shrink-0"
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {t.totalTripTransit(
                tripTransitTotals.durationFormatted,
                tripTransitTotals.distanceFormatted
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {t.roadConditionNotice}
          </span>
        </div>
      )}

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

          // Hari 2+: Kaki transit pagi
          if (day.dayNumber > 1 && day.activities.length > 0) {
            const prevDay = days.find((d) => d.dayNumber === day.dayNumber - 1);
            if (prevDay && prevDay.activities.length > 0) {
              const prevLastAct =
                prevDay.activities[prevDay.activities.length - 1];
              const prevStay = prevDay.recommendedStay;
              const stayVillage = prevStay
                ? allVillages.find((v) =>
                    prevStay.name
                      .toLowerCase()
                      .includes(v.name.toLowerCase())
                  ) ||
                  allVillages.find(
                    (v) =>
                      prevStay.villageName &&
                      v.name
                        .toLowerCase()
                        .includes(
                          prevStay.villageName.toLowerCase()
                        )
                  ) ||
                  DESA_BY_ID.get(prevLastAct.villageId)
                : DESA_BY_ID.get(prevLastAct.villageId);

              const startLat = stayVillage ? stayVillage.lat : prevLastAct.lat;
              const startLng = stayVillage ? stayVillage.lng : prevLastAct.lng;
              const mornEst = estimateBaliTransit(
                startLat,
                startLng,
                day.activities[0].lat,
                day.activities[0].lng,
                locale
              );
              totalDayTransitMinutes += mornEst.durationMinutes;
              totalDayTransitKm += mornEst.roadDistanceKm;
            }
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

          const curStay = day.recommendedStay;
          if (curStay && day.activities.length > 0) {
            const lastAct = day.activities[day.activities.length - 1];
            const stayVillage =
              allVillages.find((v) =>
                curStay.name
                  .toLowerCase()
                  .includes(v.name.toLowerCase())
              ) ||
              allVillages.find(
                (v) =>
                  curStay.villageName &&
                  v.name
                    .toLowerCase()
                    .includes(curStay.villageName.toLowerCase())
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

          // Hari terakhir: kaki kembali ke pintu keberangkatan
          if (
            day.dayNumber === days.length &&
            arrivalCoords &&
            day.activities.length > 0
          ) {
            const lastAct = day.activities[day.activities.length - 1];
            const retEst = estimateBaliTransit(
              lastAct.lat,
              lastAct.lng,
              arrivalCoords[0],
              arrivalCoords[1],
              locale
            );
            totalDayTransitMinutes += retEst.durationMinutes;
            totalDayTransitKm += retEst.roadDistanceKm;
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
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#111914] border border-stone-200/80 dark:border-emerald-900/40 rounded-xl p-4 shadow-sm transition-colors print-day-header">
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
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
                        {gateTransit.isLongLeg && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                            <AlertTriangle
                              className="w-3 h-3 text-amber-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t.longLegWarning(gateTransit.formattedDuration)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Hari 2+: Kaki Transit Pagi dari Homestay Malam Sebelumnya */}
                {day.dayNumber > 1 &&
                  day.activities.length > 0 && (() => {
                    const prevDay = days.find(
                      (d) => d.dayNumber === day.dayNumber - 1
                    );
                    if (!prevDay || prevDay.activities.length === 0) return null;
                    const prevLastAct =
                      prevDay.activities[prevDay.activities.length - 1];
                    const prevStay = prevDay.recommendedStay;
                    const stayVillage = prevStay
                      ? allVillages.find((v) =>
                          prevStay.name
                            .toLowerCase()
                            .includes(v.name.toLowerCase())
                        ) ||
                        allVillages.find(
                          (v) =>
                            prevStay.villageName &&
                            v.name
                              .toLowerCase()
                              .includes(
                                prevStay.villageName.toLowerCase()
                              )
                        ) ||
                        DESA_BY_ID.get(prevLastAct.villageId)
                      : DESA_BY_ID.get(prevLastAct.villageId);

                    const startLat = stayVillage ? stayVillage.lat : prevLastAct.lat;
                    const startLng = stayVillage ? stayVillage.lng : prevLastAct.lng;
                    const stayName =
                      prevDay.recommendedStay?.name ||
                      (stayVillage ? stayVillage.name : prevLastAct.villageName);

                    const mornTransit = estimateBaliTransit(
                      startLat,
                      startLng,
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
                            {t.morningTransitFromStay(stayName)}:{" "}
                            <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                              {mornTransit.formattedDuration}
                            </strong>{" "}
                            ({mornTransit.formattedDistance})
                          </span>
                        </div>
                        {mornTransit.isLongLeg && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                            <AlertTriangle
                              className="w-3 h-3 text-amber-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t.longLegWarning(mornTransit.formattedDuration)}
                            </span>
                          </div>
                        )}
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
                          {transitFromPrev.isLongLeg && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                              <AlertTriangle
                                className="w-3 h-3 text-amber-600 shrink-0"
                                aria-hidden="true"
                              />
                              <span>
                                {t.longLegWarning(
                                  transitFromPrev.formattedDuration
                                )}
                              </span>
                            </div>
                          )}
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
                      className={`group relative bg-white dark:bg-[#111914] border border-stone-200/80 dark:border-emerald-900/40 rounded-xl shadow-sm p-4 transition-[border-color,box-shadow] cursor-pointer print-avoid-break focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                        isSelected
                          ? "border-[#0D4732] dark:border-emerald-400 ring-1 ring-[#0D4732]/20 shadow-sm"
                          : "hover:border-stone-300 dark:hover:border-emerald-700/60"
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
                          {visualMeta.imageCredit && (
                            <span
                              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white/90 backdrop-blur-xs font-mono max-w-[90%] truncate pointer-events-none"
                              title={visualMeta.imageCredit}
                            >
                              {visualMeta.imageCredit}
                            </span>
                          )}
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
                                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                                  {aiStopNarratives[activity.villageId]}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
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
                                <div
                                  className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums"
                                  title={t.quotaTooltip}
                                >
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

                            {vText?.customsNote && (() => {
                              const isAdatExpanded = Boolean(expandedAdat[cardKey]);
                              return (
                                <div className="space-y-1.5 pt-0.5">
                                  {/* Single-line summary by default, full when expanded or in print */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 min-w-0">
                                      <ScrollText
                                        className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5"
                                        aria-hidden="true"
                                      />
                                      <div className="leading-relaxed">
                                        <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                                          {t.customsNotePrefix}{" "}
                                        </strong>
                                        <span className={isAdatExpanded ? "" : "line-clamp-1"}>
                                          {vText.customsNote}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAdat(cardKey);
                                      }}
                                      className="no-print shrink-0 text-[11px] font-semibold text-[#0D4732] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0D4732]"
                                    >
                                      <span>{isAdatExpanded ? t.adatQuotaLess : t.adatQuotaMore}</span>
                                      <ChevronDown
                                        className={`w-3 h-3 transition-transform ${isAdatExpanded ? "rotate-180" : ""}`}
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </div>

                                  {/* Expanded Adat Rules, Dress Code, Sacred Days, Quota Details & Verification */}
                                  {isAdatExpanded && (
                                    <div className="space-y-1.5 pl-5 pt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-[#142019] p-2.5 rounded-xl border border-slate-200/60 dark:border-emerald-900/30">
                                      {vText.dressCode && (
                                        <p className="leading-relaxed">
                                          <strong className="text-slate-800 dark:text-slate-200 font-medium">
                                            {t.dressAndEtiquetteLabel}:{" "}
                                          </strong>
                                          {vText.dressCode}
                                        </p>
                                      )}
                                      {vText.sacredDaysNote && (
                                        <p className="leading-relaxed text-[#EA580C] dark:text-[#FB923C] font-medium">
                                          <strong className="font-semibold">{t.sacredDaysLabel}: </strong>
                                          {vText.sacredDaysNote}
                                        </p>
                                      )}
                                      {villageEntity && (
                                        <p className="leading-relaxed text-[11px] font-mono text-slate-600 dark:text-slate-400">
                                          {t.quotaDetailLabel(
                                            villageEntity.dailyQuota || 90,
                                            villageEntity.currentSimulatedLoad || 25,
                                            visualMeta.quotaPercentage
                                          )}
                                        </p>
                                      )}
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                                        {villageEntity?.adatVerifiedBy
                                          ? t.adatVerifiedLabel(
                                              villageEntity.adatVerifiedBy,
                                              villageEntity.adatVerifiedAt
                                            )
                                          : t.adatPendingVerification}
                                      </div>
                                    </div>
                                  )}

                                  {/* Print-only complete verification note if not manually expanded */}
                                  {!isAdatExpanded && (
                                    <div className="hidden print:block text-[10px] text-slate-500 italic pl-5">
                                      {villageEntity?.adatVerifiedBy
                                        ? t.adatVerifiedLabel(
                                            villageEntity.adatVerifiedBy,
                                            villageEntity.adatVerifiedAt
                                          )
                                        : t.adatPendingVerification}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Sub-Section Toggle Buttons: Penginapan Warga & Wisata Terdekat */}
                            {(accommodations.length > 0 ||
                              nearbyAttractions.length > 0) && (
                              <div className="no-print pt-2 border-t border-slate-100 dark:border-emerald-900/30 flex flex-wrap items-center gap-2">
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
                    const currentStay = day.recommendedStay;
                    if (!currentStay) return null;
                    const lastAct = day.activities[day.activities.length - 1];
                    const stayVillage =
                      allVillages.find((v) =>
                        currentStay.name
                          .toLowerCase()
                          .includes(v.name.toLowerCase())
                      ) ||
                      allVillages.find(
                        (v) =>
                          currentStay.villageName &&
                          v.name
                            .toLowerCase()
                            .includes(
                              currentStay.villageName.toLowerCase()
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
                        {stayTransit.isLongLeg && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                            <AlertTriangle
                              className="w-3 h-3 text-amber-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t.longLegWarning(stayTransit.formattedDuration)}
                            </span>
                          </div>
                        )}
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

                {/* Hari Terakhir: Kaki Transit Pulang Kembali ke Pintu Kedatangan/Keberangkatan */}
                {day.dayNumber === days.length &&
                  arrivalCoords &&
                  day.activities.length > 0 && (() => {
                    const lastAct = day.activities[day.activities.length - 1];
                    const returnTransit = estimateBaliTransit(
                      lastAct.lat,
                      lastAct.lng,
                      arrivalCoords[0],
                      arrivalCoords[1],
                      locale
                    );
                    return (
                      <div className="relative py-2 print-avoid-break">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-800/40 text-[11px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
                          <Navigation
                            className="w-3 h-3 text-[#EA580C] dark:text-[#FB923C] shrink-0 rotate-180"
                            aria-hidden="true"
                          />
                          <span>
                            {t.returnTransitToGate(arrivalLabel || "Ngurah Rai")}:{" "}
                            <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                              {returnTransit.formattedDuration}
                            </strong>{" "}
                            ({returnTransit.formattedDistance})
                          </span>
                        </div>
                        {returnTransit.isLongLeg && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                            <AlertTriangle
                              className="w-3 h-3 text-amber-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t.longLegWarning(
                                returnTransit.formattedDuration
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </section>
          );
        })}
    </div>
  );
}
