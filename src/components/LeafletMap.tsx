"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import { formatRupiah, DAY_COLORS } from "@/lib/utils";
import { getVillageVisualMeta } from "@/lib/village-media";
import {
  Layers,
  Store,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Mountain,
  ShieldAlert,
  Minimize2,
  Maximize2,
} from "lucide-react";

const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY?.trim() || "";

export type BasemapProvider = "carto-voyager" | "carto-positron" | "osm-clean";

function createDayMarkerIcon(
  dayNumber: number,
  stepOrder: number,
  isSelected: boolean,
  isRedirected: boolean
) {
  const color = DAY_COLORS[dayNumber]?.hex || "#0D4732";
  const scale = isSelected ? "scale(1.22)" : "scale(1)";
  const ring = isSelected
    ? `0 0 0 6px rgba(13, 71, 50, 0.28), 0 8px 20px rgba(13, 38, 28, 0.35)`
    : `0 4px 12px rgba(13, 38, 28, 0.25)`;
  const badgeHtml = isRedirected
    ? `<span style="position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:9999px;background:#C85A32;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#FFFFFF;">!</span>`
    : "";

  return L.divIcon({
    className: "custom-eco-marker",
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        background: ${color};
        border: 2.5px solid #FFFFFF;
        box-shadow: ${ring};
        transform: ${scale};
        transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 700;
      ">
        H${dayNumber}.${stepOrder}
        ${badgeHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function createGateIcon() {
  return L.divIcon({
    className: "custom-gate-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #0D261C;
        border: 2px solid #34D399;
        box-shadow: 0 4px 12px rgba(13, 38, 28, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ECFDF5;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 10px;
        font-weight: 800;
      ">
        IN
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function MapViewportController({
  focusCoords,
  allRouteCoords,
}: {
  focusCoords: [number, number] | null;
  allRouteCoords: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (focusCoords) {
      map.flyTo(focusCoords, 12, { duration: 1.05 });
    }
  }, [focusCoords, map]);

  useEffect(() => {
    if (!focusCoords && allRouteCoords.length > 1) {
      const bounds = L.latLngBounds(allRouteCoords);
      map.fitBounds(bounds, { padding: [46, 46], maxZoom: 11 });
    }
  }, [allRouteCoords, focusCoords, map]);

  return null;
}

interface LeafletMapProps {
  days: DayItinerary[];
  allVillages: DesaWisata[];
  selectedDayFilter: number | null;
  onSelectDayFilter: (day: number | null) => void;
  selectedActivity: TripDayActivity | null;
  onSelectActivity: (activity: TripDayActivity) => void;
  arrivalCoords?: [number, number];
  arrivalLabel?: string;
}

export default function LeafletMap({
  days,
  allVillages,
  selectedDayFilter,
  onSelectDayFilter,
  selectedActivity,
  onSelectActivity,
  arrivalCoords = [-8.7467, 115.1668],
  arrivalLabel = "Bandara I Gusti Ngurah Rai",
}: LeafletMapProps) {
  const [showAllCuratedVillages, setShowAllCuratedVillages] = useState(true);
  const [showSouthHotspotZone, setShowSouthHotspotZone] = useState(true);
  const [inspectorMinimized, setInspectorMinimized] = useState(false);
  const [tileTheme, setTileTheme] = useState<BasemapProvider>(
    CARTO_API_KEY ? "carto-voyager" : "osm-clean"
  );

  const visibleDays = useMemo(() => {
    if (selectedDayFilter === null) return days;
    return days.filter((d) => d.dayNumber === selectedDayFilter);
  }, [days, selectedDayFilter]);

  const flatActivities = useMemo(() => {
    return visibleDays.flatMap((d) =>
      d.activities.map((act, idx) => ({
        dayNumber: d.dayNumber,
        stepNumber: idx + 1,
        activity: act,
      }))
    );
  }, [visibleDays]);

  const activeStepIndex = useMemo(() => {
    if (!selectedActivity) return 0;
    const foundIdx = flatActivities.findIndex(
      (item) =>
        item.activity.villageId === selectedActivity.villageId &&
        item.activity.timeSlot === selectedActivity.timeSlot
    );
    return foundIdx >= 0 ? foundIdx : 0;
  }, [flatActivities, selectedActivity]);

  const activeStep = flatActivities[activeStepIndex] || flatActivities[0];
  const activeVillageEntity = useMemo(() => {
    if (!activeStep) return undefined;
    return allVillages.find((v) => v.id === activeStep.activity.villageId);
  }, [activeStep, allVillages]);

  const activeVisualMeta = useMemo(() => {
    if (!activeStep) return null;
    return getVillageVisualMeta(activeStep.activity.villageId, allVillages);
  }, [activeStep, allVillages]);

  const routeVillageIds = useMemo(() => {
    return new Set(days.flatMap((d) => d.activities.map((a) => a.villageId)));
  }, [days]);

  const allRouteCoords = useMemo(() => {
    const coords: [number, number][] = [];
    for (const day of visibleDays) {
      for (const act of day.activities) {
        coords.push([act.lat, act.lng]);
      }
    }
    return coords;
  }, [visibleDays]);

  const focusCoords: [number, number] | null = selectedActivity
    ? [selectedActivity.lat, selectedActivity.lng]
    : null;

  const tileConfig = useMemo(() => {
    if (tileTheme === "carto-voyager" && CARTO_API_KEY) {
      return {
        url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      };
    }
    if (tileTheme === "carto-positron" && CARTO_API_KEY) {
      return {
        url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      };
    }
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdomains: "abc",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }, [tileTheme]);

  const handleStepNavigation = (direction: "prev" | "next") => {
    if (flatActivities.length === 0) return;
    const nextIdx =
      direction === "next"
        ? (activeStepIndex + 1) % flatActivities.length
        : (activeStepIndex - 1 + flatActivities.length) % flatActivities.length;
    onSelectActivity(flatActivities[nextIdx].activity);
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[calc(100dvh-5.5rem)] rounded-2xl overflow-hidden border border-stone-200/90 bg-stone-200 shadow-lg">
      {/* Top Floating Glassmorphic HUD */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter Hari */}
        <div className="flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-md border border-stone-200/90 p-1.5 rounded-xl pointer-events-auto shadow-md">
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedDayFilter === null
                ? "bg-[#0D261C] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Semua ({days.length}H)
          </button>
          {days.map((d) => {
            const colorInfo = DAY_COLORS[d.dayNumber] || DAY_COLORS[1];
            const isActive = selectedDayFilter === d.dayNumber;
            return (
              <button
                key={d.dayNumber}
                type="button"
                onClick={() =>
                  onSelectDayFilter(isActive ? null : d.dayNumber)
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: colorInfo.hex }}
                />
                Hari {d.dayNumber}
              </button>
            );
          })}
        </div>

        {/* Layer & Basemap Switcher */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-stone-200/90 p-1.5 rounded-xl pointer-events-auto shadow-md">
          <button
            type="button"
            onClick={() => setShowAllCuratedVillages((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showAllCuratedVillages
                ? "bg-emerald-50 text-[#0D4732] font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>28 Desa</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSouthHotspotZone((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              showSouthHotspotZone
                ? "bg-orange-50 text-[#C85A32] font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zona Padat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (CARTO_API_KEY) {
                setTileTheme((t) =>
                  t === "carto-voyager"
                    ? "carto-positron"
                    : t === "carto-positron"
                    ? "osm-clean"
                    : "carto-voyager"
                );
              }
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-stone-700 hover:text-stone-950 bg-stone-100 transition-all cursor-pointer"
            title="Ganti gaya peta dasar"
          >
            {tileTheme === "carto-voyager"
              ? "Voyager"
              : tileTheme === "carto-positron"
              ? "Positron"
              : "OSM"}
          </button>
        </div>
      </div>

      {/* Map Instance */}
      <MapContainer
        center={[-8.3405, 115.1889]}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={tileTheme}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom}
        />

        <MapViewportController
          focusCoords={focusCoords}
          allRouteCoords={allRouteCoords}
        />

        {/* Visualisasi Zona Konsentrasi Bali Selatan */}
        {showSouthHotspotZone && (
          <CircleMarker
            center={[-8.6785, 115.1585]}
            radius={26}
            pathOptions={{
              color: "#C85A32",
              fillColor: "#C85A32",
              fillOpacity: 0.14,
              weight: 1.5,
              dashArray: "4 4",
            }}
          >
            <Popup>
              <div className="p-1 max-w-[220px] text-stone-800">
                <p className="text-xs font-bold text-[#C85A32] mb-1">
                  Zona Padat Bali Selatan (65,88% PDRB)
                </p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Koridor Kuta-Canggu-Seminyak mengalami beban lalu lintas
                  tinggi. Rute Anda dialihkan menuju desa mandiri di utara,
                  timur, dan barat.
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Titik 28 Desa Wisata Terkurasi Lainnya */}
        {showAllCuratedVillages &&
          allVillages
            .filter((v) => !routeVillageIds.has(v.id))
            .map((village) => (
              <CircleMarker
                key={village.id}
                center={[village.lat, village.lng]}
                radius={5.5}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 1.5,
                  fillColor: "#0D4732",
                  fillOpacity: 0.65,
                }}
              >
                <Popup>
                  <div className="text-stone-900 min-w-[200px] max-w-[240px] space-y-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#0D4732] inline-block">
                      Kab. {village.regency}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900">
                      {village.name}
                    </h4>
                    <p className="text-xs text-stone-600 leading-snug">
                      {village.highlights}
                    </p>
                    <div className="pt-1 border-t border-stone-100 text-[11px] text-[#0D4732] font-mono font-semibold tabular-nums">
                      Homestay ~{formatRupiah(village.avgHomestayPrice)}/malam
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

        {/* Pin Titik Kedatangan */}
        <Marker position={arrivalCoords} icon={createGateIcon()}>
          <Popup>
            <div className="text-stone-900 min-w-[180px]">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                Pintu Kedatangan
              </p>
              <p className="text-xs font-bold mt-0.5">{arrivalLabel}</p>
            </div>
          </Popup>
        </Marker>

        {/* Garis dari Pintu Kedatangan ke Destinasi Pertama Hari 1 */}
        {visibleDays.length > 0 &&
          visibleDays[0].dayNumber === 1 &&
          visibleDays[0].activities.length > 0 && (
            <Polyline
              positions={[
                arrivalCoords,
                [
                  visibleDays[0].activities[0].lat,
                  visibleDays[0].activities[0].lng,
                ],
              ]}
              pathOptions={{
                color: "#0D4732",
                weight: 2,
                dashArray: "6 8",
                opacity: 0.65,
              }}
            />
          )}

        {/* Polyline Jalur Harian & Pin Destinasi */}
        {visibleDays.map((day, dayIdx) => {
          const dayColor = DAY_COLORS[day.dayNumber]?.hex || "#0D4732";
          const dayPositions: [number, number][] = day.activities.map((a) => [
            a.lat,
            a.lng,
          ]);

          const prevDay = dayIdx > 0 ? visibleDays[dayIdx - 1] : null;
          const prevLastAct =
            prevDay && prevDay.activities.length > 0
              ? prevDay.activities[prevDay.activities.length - 1]
              : null;

          return (
            <React.Fragment key={day.dayNumber}>
              {prevLastAct && day.activities.length > 0 && (
                <Polyline
                  positions={[
                    [prevLastAct.lat, prevLastAct.lng],
                    [day.activities[0].lat, day.activities[0].lng],
                  ]}
                  pathOptions={{
                    color: "#78716C",
                    weight: 2.5,
                    dashArray: "4 7",
                    opacity: 0.75,
                  }}
                />
              )}

              {dayPositions.length > 1 && (
                <Polyline
                  positions={dayPositions}
                  pathOptions={{
                    color: dayColor,
                    weight: 4,
                    opacity: 0.9,
                  }}
                />
              )}

              {day.activities.map((activity, actIdx) => {
                const isSelected =
                  selectedActivity?.villageId === activity.villageId &&
                  selectedActivity?.timeSlot === activity.timeSlot;
                const isRedirected =
                  activity.capacityStatus === "REDIRECTED_BUFFER";

                return (
                  <Marker
                    key={`${day.dayNumber}-${activity.villageId}-${actIdx}`}
                    position={[activity.lat, activity.lng]}
                    icon={createDayMarkerIcon(
                      day.dayNumber,
                      actIdx + 1,
                      isSelected,
                      isRedirected
                    )}
                    eventHandlers={{
                      click: () => {
                        onSelectActivity(activity);
                        setInspectorMinimized(false);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-stone-900 min-w-[225px] max-w-[265px] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: dayColor }}
                          >
                            Hari {day.dayNumber} · {activity.timeSlot}
                          </span>
                          <span className="text-[11px] font-medium text-stone-500">
                            Kab. {activity.regency}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-stone-900">
                          {activity.villageName}
                        </h4>
                        <p className="text-xs font-medium text-[#0D4732]">
                          {activity.activityTitle}
                        </p>

                        {activity.localUmkmSpot && (
                          <div className="bg-stone-50 p-1.5 rounded text-[11px] text-stone-700 flex items-start gap-1.5">
                            <Store className="w-3.5 h-3.5 text-[#C85A32] shrink-0 mt-0.5" />
                            <span>{activity.localUmkmSpot}</span>
                          </div>
                        )}

                        <div className="pt-1 border-t border-stone-100 flex items-center justify-between text-xs">
                          <span className="text-stone-500">
                            Belanja ke Warga:
                          </span>
                          <span className="font-mono font-bold text-[#0D4732] tabular-nums">
                            {formatRupiah(activity.estimatedLocalSpendRp)}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Bottom Floating Village & Awig-Awig Inspector Dock */}
      {activeStep && activeVisualMeta && (
        <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[500] pointer-events-none">
          <div className="bg-[#0D261C]/95 backdrop-blur-md text-white border border-emerald-800/60 rounded-2xl p-3.5 shadow-2xl pointer-events-auto transition-all">
            {inspectorMinimized ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold shrink-0">
                    H{activeStep.dayNumber}.{activeStep.stepNumber}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    {activeStep.activity.villageName} (Kab.{" "}
                    {activeStep.activity.regency})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStepNavigation("prev")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Destinasi sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepNavigation("next")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Destinasi berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorMinimized(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 cursor-pointer"
                    aria-label="Perluas detail desa"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                {/* Thumbnail Foto Lanskap Desa */}
                <div className="relative w-full sm:w-28 h-24 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-stone-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeVisualMeta.imageUrl}
                    alt={activeStep.activity.villageName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                    <Mountain className="w-2.5 h-2.5" />
                    {activeVisualMeta.elevationLabel}
                  </span>
                </div>

                {/* Detail & Awig-Awig Desa Aktif */}
                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          Hari {activeStep.dayNumber} ·{" "}
                          {activeStep.activity.timeSlot}
                        </span>
                        <span className="text-[11px] text-emerald-200/80 font-mono">
                          Kab. {activeStep.activity.regency}
                        </span>
                        <span className="text-[10px] font-mono text-stone-300 bg-white/10 px-1.5 py-0.5 rounded tabular-nums">
                          Kuota: {activeVisualMeta.quotaPercentage}% Terisi
                        </span>
                      </div>
                      <h4 className="text-sm font-display font-bold text-white mt-1 truncate">
                        {activeStep.activity.villageName}
                      </h4>
                    </div>

                    {/* Step Navigator & Minimize */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepNavigation("prev")}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Destinasi sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepNavigation("next")}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Destinasi berikutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectorMinimized(true)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 transition-colors cursor-pointer"
                        title="Kecilkan panel"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Awig-Awig & Etika Adat Kontekstual */}
                  <div className="p-2 rounded-lg bg-white/10 border border-white/10 text-[11px] text-emerald-50 leading-snug flex items-start gap-2">
                    <ScrollText className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">
                        Awig-Awig Desa:{" "}
                      </strong>
                      {activeVillageEntity?.customsNote ||
                        "Hormati kesucian kawasan pura dan jaga kelestarian irigasi subak setempat."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
