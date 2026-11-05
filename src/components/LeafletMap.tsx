"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DayItinerary, TripDayActivity } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import {
  Locale,
  formatCurrency,
  DAY_COLORS,
  estimateBaliTransit,
} from "@/lib/utils";
import { getVillageVisualMeta } from "@/lib/village-media";
import { DESA_BY_ID } from "@/lib/scoring";
import {
  UI_TEXT,
  formatTimeSlot,
  getLocalizedVillageText,
} from "@/lib/i18n";
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
  Car,
  Compass,
  BedDouble,
} from "lucide-react";

const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY?.trim() || "";

export type BasemapProvider =
  | "carto-voyager"
  | "carto-positron"
  | "carto-dark"
  | "osm-clean";

function createDayMarkerIcon(
  dayNumber: number,
  stepOrder: number,
  isSelected: boolean,
  isRedirected: boolean,
  locale: Locale,
  useDarkMapColors: boolean
) {
  const colorObj = DAY_COLORS[dayNumber] || DAY_COLORS[1];
  const color = useDarkMapColors ? colorObj.darkHex : colorObj.hex;
  const textColor = useDarkMapColors && dayNumber === 4 ? "#141715" : "#FFFFFF";
  const scale = isSelected ? "scale(1.22)" : "scale(1)";
  const ring = isSelected
    ? useDarkMapColors
      ? `0 0 0 6px rgba(52, 211, 153, 0.35), 0 8px 20px rgba(0, 0, 0, 0.65)`
      : `0 0 0 6px rgba(13, 71, 50, 0.28), 0 8px 20px rgba(13, 38, 28, 0.35)`
    : `0 4px 12px rgba(13, 38, 28, 0.35)`;
  const badgeHtml = isRedirected
    ? `<span style="position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:9999px;background:#C85A32;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#FFFFFF;">!</span>`
    : "";
  const prefix = locale === "en" ? "D" : "H";

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
        color: ${textColor};
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 800;
      ">
        ${prefix}${dayNumber}.${stepOrder}
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
        box-shadow: 0 4px 12px rgba(13, 38, 28, 0.45);
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
  isMobileActive,
}: {
  focusCoords: [number, number] | null;
  allRouteCoords: [number, number][];
  isMobileActive?: boolean;
}) {
  const map = useMap();

  // ResizeObserver: Secara instan mendeteksi perubahan ukuran kontainer DOM Leaflet
  // (misal saat tab beralih dari display:none menjadi block di layar ponsel atau orientasi berubah)
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;

    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            map.invalidateSize({ animate: false });
          });
        }
      }
    });

    observer.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [map]);

  // Ketika tab ponsel "Spatial Map" diaktifkan oleh pengguna
  useEffect(() => {
    if (isMobileActive) {
      map.invalidateSize({ animate: false });
      const timer = setTimeout(() => {
        map.invalidateSize({ animate: false });
        if (allRouteCoords.length > 1 && !focusCoords) {
          const bounds = L.latLngBounds(allRouteCoords);
          map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMobileActive, map, allRouteCoords, focusCoords]);

  useEffect(() => {
    // Pastikan ukuran viewport Leaflet ter-kalkulasi sempurna saat mount
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 120);
    return () => clearTimeout(timer);
  }, [map]);

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
  locale: Locale;
  isDark?: boolean;
  isMobileActive?: boolean;
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
  locale,
  isDark = false,
  isMobileActive = true,
}: LeafletMapProps) {
  const t = UI_TEXT[locale];
  const [showAllCuratedVillages, setShowAllCuratedVillages] = useState(true);
  const [showSouthHotspotZone, setShowSouthHotspotZone] = useState(true);
  const [inspectorMinimized, setInspectorMinimized] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<
    "overview" | "stays" | "attractions"
  >("overview");
  const [showNearbyAttractions, setShowNearbyAttractions] = useState(false);
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [tileTheme, setTileTheme] = useState<BasemapProvider>("osm-clean");

  // Map basemap selalu konsisten mempertahankan OpenStreetMap (OSM) sebagai default
  // terlepas dari apakah pengguna memilih tema Terang atau Gelap di seluruh website.
  const useDarkMapColors = tileTheme === "carto-dark";

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
    return (
      DESA_BY_ID.get(activeStep.activity.villageId) ||
      allVillages.find((v) => v.id === activeStep.activity.villageId)
    );
  }, [activeStep, allVillages]);

  const activeVisualMeta = useMemo(() => {
    if (!activeStep) return null;
    return getVillageVisualMeta(
      activeStep.activity.villageId,
      allVillages,
      locale
    );
  }, [activeStep, allVillages, locale]);

  const activeVillageText = useMemo(() => {
    if (!activeVillageEntity) return null;
    return getLocalizedVillageText(activeVillageEntity, locale);
  }, [activeVillageEntity, locale]);

  const activeAccommodations = useMemo(() => {
    return activeVillageEntity?.accommodations || [];
  }, [activeVillageEntity]);

  const activeAttractions = useMemo(() => {
    return activeVillageEntity?.nearbyAttractions || [];
  }, [activeVillageEntity]);

  const activeTransitEstimate = useMemo(() => {
    if (!activeStep) return null;
    if (activeStepIndex > 0) {
      const prev = flatActivities[activeStepIndex - 1];
      return estimateBaliTransit(
        prev.activity.lat,
        prev.activity.lng,
        activeStep.activity.lat,
        activeStep.activity.lng,
        locale
      );
    }
    if (activeStepIndex === 0 && activeStep.dayNumber === 1 && arrivalCoords) {
      return estimateBaliTransit(
        arrivalCoords[0],
        arrivalCoords[1],
        activeStep.activity.lat,
        activeStep.activity.lng,
        locale
      );
    }
    return null;
  }, [activeStep, activeStepIndex, flatActivities, arrivalCoords, locale]);

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
    if (tileTheme === "carto-dark") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      };
    }
    if (tileTheme === "carto-voyager") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      };
    }
    if (tileTheme === "carto-positron") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
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

  const dayPrefix = locale === "en" ? "D" : "H";

  return (
    <div className="relative w-full h-[calc(100dvh-8.75rem)] sm:h-[560px] lg:h-[calc(100dvh-5.5rem)] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-emerald-800/60 bg-slate-100 dark:bg-[#090E0B] shadow-sm">
      {/* Top Floating Glassmorphic HUD (Mobile Swipeable) */}
      <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 right-2.5 sm:right-3.5 z-[500] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        {/* Filter Hari - Horizontal Scrollable on Mobile */}
        <div
          role="group"
          aria-label="Filter hari perjalanan"
          className="flex items-center gap-1 bg-white/95 dark:bg-[#111914]/95 backdrop-blur-md border border-slate-200/90 dark:border-emerald-700/50 p-1 rounded-xl pointer-events-auto shadow-xs overflow-x-auto no-scrollbar max-w-full"
        >
          <button
            type="button"
            aria-pressed={selectedDayFilter === null}
            onClick={() => onSelectDayFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
              selectedDayFilter === null
                ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16231c]"
            }`}
          >
            {t.allDaysBtn(days.length)}
          </button>
          {days.map((d) => {
            const colorInfo = DAY_COLORS[d.dayNumber] || DAY_COLORS[1];
            const isActive = selectedDayFilter === d.dayNumber;
            const dotColor = useDarkMapColors
              ? colorInfo.darkHex
              : colorInfo.hex;
            return (
              <button
                key={d.dayNumber}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onSelectDayFilter(isActive ? null : d.dayNumber)
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  isActive
                    ? "bg-slate-900 dark:bg-emerald-700 text-white shadow-2xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16231c]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span>{t.dayBtn(d.dayNumber)}</span>
              </button>
            );
          })}
        </div>

        {/* Layer & Basemap Switcher */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-[#111914]/95 backdrop-blur-md border border-slate-200/90 dark:border-emerald-700/50 p-1 rounded-xl pointer-events-auto shadow-xs self-start sm:self-auto">
          <button
            type="button"
            aria-pressed={showAllCuratedVillages}
            onClick={() => setShowAllCuratedVillages((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
              showAllCuratedVillages
                ? "bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.villagesLayerBtn}</span>
          </button>

          <button
            type="button"
            aria-pressed={showSouthHotspotZone}
            onClick={() => setShowSouthHotspotZone((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] dark:focus-visible:ring-orange-400 ${
              showSouthHotspotZone
                ? "bg-orange-50 dark:bg-orange-950/60 text-[#EA580C] dark:text-[#FB923C] font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.hotspotZoneBtn}</span>
          </button>

          <button
            type="button"
            aria-pressed={showNearbyAttractions}
            onClick={() => setShowNearbyAttractions((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] dark:focus-visible:ring-orange-400 ${
              showNearbyAttractions
                ? "bg-orange-50 dark:bg-orange-950/80 text-[#EA580C] dark:text-[#FB923C] font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t.layerAttractionsBtn}</span>
            <span className="sm:hidden">POI</span>
          </button>

          <button
            type="button"
            aria-pressed={showAccommodations}
            onClick={() => setShowAccommodations((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 ${
              showAccommodations
                ? "bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t.layerStaysBtn}</span>
            <span className="sm:hidden">Stay</span>
          </button>

          <button
            type="button"
            aria-label={t.switchBasemapLabel}
            onClick={() => {
              setTileTheme((prev) =>
                prev === "osm-clean"
                  ? "carto-voyager"
                  : prev === "carto-voyager"
                  ? "carto-positron"
                  : prev === "carto-positron"
                  ? "carto-dark"
                  : "osm-clean"
              );
            }}
            className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-[#16231c] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
            title={t.switchBasemapLabel}
          >
            {tileTheme === "osm-clean"
              ? "OSM"
              : tileTheme === "carto-voyager"
              ? "Voyager"
              : tileTheme === "carto-positron"
              ? "Positron"
              : "Dark"}
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
          keepBuffer={8}
        />

        <MapViewportController
          focusCoords={focusCoords}
          allRouteCoords={allRouteCoords}
          isMobileActive={isMobileActive}
        />

        {/* Visualisasi Zona Konsentrasi Bali Selatan */}
        {showSouthHotspotZone && (
          <CircleMarker
            center={[-8.6785, 115.1585]}
            radius={26}
            pathOptions={{
              color: useDarkMapColors ? "#FB923C" : "#C85A32",
              fillColor: useDarkMapColors ? "#FB923C" : "#C85A32",
              fillOpacity: useDarkMapColors ? 0.22 : 0.14,
              weight: 1.5,
              dashArray: "4 4",
            }}
          >
            <Popup>
              <div className="p-1 max-w-[220px] text-stone-800 dark:text-stone-100">
                <p className="text-xs font-bold text-[#C85A32] dark:text-[#F28B66] mb-1">
                  {t.hotspotPopupTitle}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {t.hotspotPopupDesc}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Titik 28 Desa Wisata Terkurasi Lainnya */}
        {showAllCuratedVillages &&
          allVillages
            .filter((v) => !routeVillageIds.has(v.id))
            .map((village) => {
              const vText = getLocalizedVillageText(village, locale);
              return (
                <CircleMarker
                  key={village.id}
                  center={[village.lat, village.lng]}
                  radius={5.5}
                  pathOptions={{
                    color: useDarkMapColors ? "#08120E" : "#FFFFFF",
                    weight: 1.5,
                    fillColor: useDarkMapColors ? "#34D399" : "#0D4732",
                    fillOpacity: useDarkMapColors ? 0.8 : 0.65,
                  }}
                >
                  <Popup>
                    <div className="text-stone-900 dark:text-stone-100 min-w-[200px] max-w-[240px] space-y-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#0D4732] dark:text-emerald-300 inline-block">
                        {locale === "en"
                          ? village.regency
                          : `Kab. ${village.regency}`}
                      </span>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                        {village.name}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-snug">
                        {vText.highlights}
                      </p>
                      <div className="pt-1 border-t border-stone-100 dark:border-emerald-900/40 text-[11px] text-[#0D4732] dark:text-emerald-400 font-mono font-semibold tabular-nums">
                        {t.homestayNightPrefix}
                        {formatCurrency(village.avgHomestayPrice, locale)}
                        {t.nightSuffix}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

        {/* Titik Wisata Terdekat (Nearby Attractions POIs) */}
        {showNearbyAttractions &&
          allVillages.flatMap((v) =>
            (v.nearbyAttractions || []).map((poi) => {
              const poiName =
                locale === "en" && poi.nameEn ? poi.nameEn : poi.name;
              const desc =
                locale === "en" && poi.descriptionEn
                  ? poi.descriptionEn
                  : poi.description;
              const distKm =
                locale === "en"
                  ? `${poi.distanceKm} km`
                  : `${poi.distanceKm.toString().replace(".", ",")} km`;
              return (
                <CircleMarker
                  key={poi.id}
                  center={[poi.lat, poi.lng]}
                  radius={4.5}
                  pathOptions={{
                    color: useDarkMapColors ? "#FB923C" : "#EA580C",
                    fillColor: useDarkMapColors ? "#FB923C" : "#EA580C",
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-stone-900 dark:text-stone-100 min-w-[200px] max-w-[240px] space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950 text-[#EA580C] dark:text-[#FB923C]">
                          {poi.category}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                          {t.distanceFromVillage(poi.durationMinutes, distKm)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 dark:text-white">
                        {poiName}
                      </h4>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
                        {desc}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          )}

        {/* Titik Penginapan Warga & Eco-Lodge */}
        {showAccommodations &&
          allVillages.flatMap((v) =>
            (v.accommodations || []).map((stay) => {
              const stayName =
                locale === "en" && stay.nameEn ? stay.nameEn : stay.name;
              const features =
                locale === "en" && stay.featuresEn
                  ? stay.featuresEn
                  : stay.features;
              return (
                <CircleMarker
                  key={stay.id}
                  center={[stay.lat, stay.lng]}
                  radius={4.5}
                  pathOptions={{
                    color: useDarkMapColors ? "#34D399" : "#0D4732",
                    fillColor: useDarkMapColors ? "#34D399" : "#10B981",
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-stone-900 dark:text-stone-100 min-w-[200px] max-w-[240px] space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#0D4732] dark:text-emerald-300">
                          {stay.type}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                          {formatCurrency(stay.pricePerNightRp, locale)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 dark:text-white">
                        {stayName}
                      </h4>
                      {features && features.length > 0 && (
                        <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-snug">
                          {features.join(" • ")}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          )}

        {/* Pin Titik Kedatangan */}
        <Marker position={arrivalCoords} icon={createGateIcon()}>
          <Popup>
            <div className="text-stone-900 dark:text-stone-100 min-w-[180px]">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t.arrivalPopupLabel}
              </p>
              <p className="text-xs font-bold mt-0.5">{arrivalLabel}</p>
            </div>
          </Popup>
        </Marker>

        {/* Garis dari Pintu Kedatangan ke Destinasi Pertama Hari 1 */}
        {visibleDays.length > 0 &&
          visibleDays[0].dayNumber === 1 &&
          visibleDays[0].activities.length > 0 && (() => {
            const firstAct = visibleDays[0].activities[0];
            const gateTransit = estimateBaliTransit(
              arrivalCoords[0],
              arrivalCoords[1],
              firstAct.lat,
              firstAct.lng,
              locale
            );
            return (
              <Polyline
                positions={[
                  arrivalCoords,
                  [firstAct.lat, firstAct.lng],
                ]}
                pathOptions={{
                  color: useDarkMapColors ? "#34D399" : "#0D4732",
                  weight: 2.5,
                  dashArray: "6 8",
                  opacity: 0.8,
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs space-y-0.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {arrivalLabel} ➔ {firstAct.villageName}
                    </div>
                    <div className="font-mono text-[11px] text-[#0D4732] dark:text-emerald-400 font-bold tabular-nums">
                      {gateTransit.formattedSummary}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })()}

        {/* Polyline Jalur Harian & Pin Destinasi */}
        {visibleDays.map((day, dayIdx) => {
          const colorInfo = DAY_COLORS[day.dayNumber] || DAY_COLORS[1];
          const dayColor = useDarkMapColors
            ? colorInfo.darkHex
            : colorInfo.hex;

          const prevDay = dayIdx > 0 ? visibleDays[dayIdx - 1] : null;
          const prevLastAct =
            prevDay && prevDay.activities.length > 0
              ? prevDay.activities[prevDay.activities.length - 1]
              : null;

          return (
            <React.Fragment key={day.dayNumber}>
              {prevLastAct &&
                day.activities.length > 0 && (() => {
                  const nextAct = day.activities[0];
                  const interTransit = estimateBaliTransit(
                    prevLastAct.lat,
                    prevLastAct.lng,
                    nextAct.lat,
                    nextAct.lng,
                    locale
                  );
                  return (
                    <Polyline
                      positions={[
                        [prevLastAct.lat, prevLastAct.lng],
                        [nextAct.lat, nextAct.lng],
                      ]}
                      pathOptions={{
                        color: useDarkMapColors ? "#A8A29E" : "#78716C",
                        weight: 2.5,
                        dashArray: "4 7",
                        opacity: 0.8,
                      }}
                    >
                      <Tooltip sticky>
                        <div className="font-sans text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {prevLastAct.villageName} ➔ {nextAct.villageName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold tabular-nums">
                            {interTransit.formattedSummary}
                          </div>
                        </div>
                      </Tooltip>
                    </Polyline>
                  );
                })()}

              {/* Garis Leg Antar-Destinasi Harian dengan Tooltip Durasi */}
              {day.activities.map((act, actIdx) => {
                if (actIdx === 0) return null;
                const prevAct = day.activities[actIdx - 1];
                const legTransit = estimateBaliTransit(
                  prevAct.lat,
                  prevAct.lng,
                  act.lat,
                  act.lng,
                  locale
                );
                return (
                  <Polyline
                    key={`leg-${day.dayNumber}-${actIdx}`}
                    positions={[
                      [prevAct.lat, prevAct.lng],
                      [act.lat, act.lng],
                    ]}
                    pathOptions={{
                      color: dayColor,
                      weight: 4,
                      opacity: 0.95,
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-sans text-xs space-y-0.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {prevAct.villageName} ➔ {act.villageName}
                        </div>
                        <div className="font-mono text-[11px] text-[#0D4732] dark:text-emerald-400 font-bold tabular-nums">
                          {legTransit.formattedSummary}
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

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
                      isRedirected,
                      locale,
                      useDarkMapColors
                    )}
                    eventHandlers={{
                      click: () => {
                        onSelectActivity(activity);
                        setInspectorMinimized(false);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-stone-900 dark:text-stone-100 min-w-[225px] max-w-[265px] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: colorInfo.hex }}
                          >
                            {t.dayBtn(day.dayNumber)} ·{" "}
                            {formatTimeSlot(activity.timeSlot, locale)}
                          </span>
                          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                            {locale === "en"
                              ? activity.regency
                              : `Kab. ${activity.regency}`}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                          {activity.villageName}
                        </h4>
                        <p className="text-xs font-medium text-[#0D4732] dark:text-emerald-400">
                          {activity.activityTitle}
                        </p>

                        {activity.localUmkmSpot && (
                          <div className="bg-stone-50 dark:bg-[#162921] p-1.5 rounded text-[11px] text-stone-700 dark:text-stone-200 flex items-start gap-1.5">
                            <Store
                              className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>{activity.localUmkmSpot}</span>
                          </div>
                        )}

                        <div className="pt-1 border-t border-stone-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                          <span className="text-stone-500 dark:text-stone-400">
                            {t.spendToLocals}
                          </span>
                          <span className="font-mono font-bold text-[#0D4732] dark:text-emerald-400 tabular-nums">
                            {formatCurrency(
                              activity.estimatedLocalSpendRp,
                              locale
                            )}
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
        <div className="absolute bottom-2.5 sm:bottom-3.5 left-2.5 sm:left-3.5 right-2.5 sm:right-3.5 z-[500] pointer-events-none">
          <div className="bg-[#0D261C]/95 dark:bg-[#0E1F18]/95 backdrop-blur-md text-white border border-emerald-800/60 dark:border-emerald-500/30 rounded-2xl p-3 sm:p-3.5 shadow-xl pointer-events-auto transition-opacity">
            {inspectorMinimized ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold shrink-0">
                    {dayPrefix}
                    {activeStep.dayNumber}.{activeStep.stepNumber}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    {activeStep.activity.villageName} (
                    {activeStep.activity.regency})
                  </span>
                  {activeTransitEstimate && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-white/10 px-1.5 py-0.5 rounded tabular-nums">
                      <Car
                        className="w-2.5 h-2.5 text-emerald-400"
                        aria-hidden="true"
                      />
                      {activeTransitEstimate.formattedSummary}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStepNavigation("prev")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    aria-label={t.prevStopLabel}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepNavigation("next")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    aria-label={t.nextStopLabel}
                  >
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorMinimized(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    aria-label={t.expandPanelLabel}
                  >
                    <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {/* Thumbnail Foto Lanskap Desa */}
                <div className="hidden sm:block relative w-28 h-24 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-stone-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeVisualMeta.imageUrl}
                    alt={activeVisualMeta.altText}
                    width={112}
                    height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Detail & Awig-Awig Desa Aktif */}
                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          {t.dayBtn(activeStep.dayNumber)} ·{" "}
                          {formatTimeSlot(activeStep.activity.timeSlot, locale)}
                        </span>
                        <span className="text-[11px] text-emerald-200/80 font-mono">
                          {activeStep.activity.regency}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-black/50 border border-white/10 px-1.5 py-0.5 rounded">
                          <Mountain className="w-2.5 h-2.5" aria-hidden="true" />
                          {activeVisualMeta.elevationLabel}
                        </span>
                        <span
                          className="text-[10px] font-mono text-stone-300 bg-white/10 px-1.5 py-0.5 rounded tabular-nums"
                          title={t.quotaTooltip}
                        >
                          {t.quotaFilled(activeVisualMeta.quotaPercentage)}
                        </span>
                        {activeTransitEstimate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-200 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded tabular-nums">
                            <Car
                              className="w-3 h-3 text-emerald-400 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t.transitFromPrev(
                                activeTransitEstimate.formattedSummary
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <h4 className="text-sm font-display font-bold text-white truncate">
                          {activeStep.activity.villageName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums shrink-0">
                          {formatCurrency(
                            activeStep.activity.estimatedLocalSpendRp,
                            locale
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Step Navigator & Minimize */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepNavigation("prev")}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        aria-label={t.prevStopLabel}
                        title={t.prevStopLabel}
                      >
                        <ChevronLeft
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepNavigation("next")}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        aria-label={t.nextStopLabel}
                        title={t.nextStopLabel}
                      >
                        <ChevronRight
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectorMinimized(true)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        aria-label={t.minimizePanelLabel}
                        title={t.minimizePanelLabel}
                      >
                        <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Segmented Inspector Tab Bar */}
                  <div className="flex items-center gap-1 pt-1 pb-0.5">
                    <button
                      type="button"
                      onClick={() => setInspectorTab("overview")}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        inspectorTab === "overview"
                          ? "bg-white/20 text-white shadow-2xs"
                          : "text-emerald-200/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {t.tabOverview}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab("stays")}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        inspectorTab === "stays"
                          ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 shadow-2xs"
                          : "text-emerald-200/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {t.tabStays(activeAccommodations.length)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab("attractions")}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        inspectorTab === "attractions"
                          ? "bg-orange-500/30 text-orange-200 border border-orange-400/40 shadow-2xs"
                          : "text-emerald-200/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {t.tabAttractions(activeAttractions.length)}
                    </button>
                  </div>

                  {/* Tab Content 1: Awig-Awig & Etika Adat Kontekstual */}
                  {inspectorTab === "overview" && (
                    <div className="p-2 rounded-lg bg-white/10 border border-white/10 text-[11px] text-emerald-50 leading-snug flex items-start gap-2">
                      <ScrollText
                        className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="line-clamp-2 sm:line-clamp-none">
                        <strong className="text-amber-300">
                          {t.awigAwigPrefix}{" "}
                        </strong>
                        {activeVillageText?.customsNote ||
                          "Respect sacred temple areas and preserve local subak irrigation channels."}
                      </div>
                    </div>
                  )}

                  {/* Tab Content 2: Penginapan di Daerah Tersebut */}
                  {inspectorTab === "stays" && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {activeAccommodations.length === 0 ? (
                        <p className="text-[11px] text-emerald-200/60 italic p-1">
                          {t.emptyStays}
                        </p>
                      ) : (
                        activeAccommodations.map((stay) => {
                          const stayName =
                            locale === "en" && stay.nameEn
                              ? stay.nameEn
                              : stay.name;
                          const features =
                            locale === "en" && stay.featuresEn
                              ? stay.featuresEn
                              : stay.features;
                          return (
                            <div
                              key={stay.id}
                              className="p-2 rounded-lg bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white truncate">
                                    {stayName}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                                    {stay.type}
                                  </span>
                                </div>
                                {features && features.length > 0 && (
                                  <p className="text-[10px] text-emerald-200/80 truncate">
                                    {features.join(" • ")}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums shrink-0">
                                {formatCurrency(stay.pricePerNightRp, locale)}
                                <span className="text-[10px] text-emerald-200/60 font-sans font-normal ml-0.5">
                                  {t.perNightLabel}
                                </span>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Tab Content 3: Wisata Terdekat */}
                  {inspectorTab === "attractions" && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {activeAttractions.length === 0 ? (
                        <p className="text-[11px] text-emerald-200/60 italic p-1">
                          {t.emptyAttractions}
                        </p>
                      ) : (
                        activeAttractions.map((poi) => {
                          const poiName =
                            locale === "en" && poi.nameEn
                              ? poi.nameEn
                              : poi.name;
                          const desc =
                            locale === "en" && poi.descriptionEn
                              ? poi.descriptionEn
                              : poi.description;
                          const distKm =
                            locale === "en"
                              ? `${poi.distanceKm} km`
                              : `${poi.distanceKm
                                  .toString()
                                  .replace(".", ",")} km`;
                          return (
                            <div
                              key={poi.id}
                              className="p-2 rounded-lg bg-white/10 border border-white/10 space-y-0.5 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-white truncate">
                                    {poiName}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-[#FB923C] shrink-0">
                                    {poi.category}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-emerald-300 tabular-nums shrink-0">
                                  {t.distanceFromVillage(
                                    poi.durationMinutes,
                                    distKm
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-100/80 line-clamp-2">
                                {desc}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
