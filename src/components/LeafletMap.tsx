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
import {
  Compass,
  Layers,
  Navigation,
  ShieldAlert,
  Store,
  Sparkles,
  MapPin,
} from "lucide-react";

function createDayMarkerIcon(
  dayNumber: number,
  stepOrder: number,
  isSelected: boolean,
  isRedirected: boolean
) {
  const color = DAY_COLORS[dayNumber]?.hex || "#10B981";
  const scale = isSelected ? "scale(1.18)" : "scale(1)";
  const ring = isSelected
    ? `0 0 0 6px rgba(16, 185, 129, 0.35), 0 8px 20px rgba(0,0,0,0.45)`
    : `0 4px 12px rgba(0,0,0,0.35)`;
  const badgeHtml = isRedirected
    ? `<span style="position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:9999px;background:#F59E0B;border:2px solid #091510;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#091510;">!</span>`
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
        border: 3px solid #F8FAFC;
        box-shadow: ${ring};
        transform: ${scale};
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
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
        border-radius: 8px;
        background: #0F172A;
        border: 2px solid #38BDF8;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #38BDF8;
        font-size: 11px;
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
      map.flyTo(focusCoords, 12, { duration: 1.1 });
    }
  }, [focusCoords, map]);

  useEffect(() => {
    if (!focusCoords && allRouteCoords.length > 1) {
      const bounds = L.latLngBounds(allRouteCoords);
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 11 });
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
  arrivalLabel = "Bandara I Gusti Ngurah Rai (Selatan)",
}: LeafletMapProps) {
  const [showAllCuratedVillages, setShowAllCuratedVillages] = useState(true);
  const [showSouthHotspotZone, setShowSouthHotspotZone] = useState(true);

  const visibleDays = useMemo(() => {
    if (selectedDayFilter === null) return days;
    return days.filter((d) => d.dayNumber === selectedDayFilter);
  }, [days, selectedDayFilter]);

  const routeVillageIds = useMemo(() => {
    return new Set(
      days.flatMap((d) => d.activities.map((a) => a.villageId))
    );
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

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] rounded-2xl overflow-hidden border border-emerald-900/60 bg-slate-950 shadow-2xl">
      {/* Top Overlay Filter Bar */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter Hari & Legend */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 px-2.5 py-1.5 rounded-xl pointer-events-auto shadow-lg">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            Rute:
          </span>
          <button
            type="button"
            onClick={() => onSelectDayFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedDayFilter === null
                ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Semua Hari ({days.length}H)
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-950 font-semibold shadow-sm"
                    : "bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-800"
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

        {/* Layer Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 px-2.5 py-1.5 rounded-xl pointer-events-auto shadow-lg">
          <button
            type="button"
            onClick={() => setShowAllCuratedVillages((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showAllCuratedVillages
                ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>28 Desa Disparda</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSouthHotspotZone((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showSouthHotspotZone
                ? "bg-rose-950/80 text-rose-300 border border-rose-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Zona Jenuh Selatan</span>
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapViewportController
          focusCoords={focusCoords}
          allRouteCoords={allRouteCoords}
        />

        {/* Visualisasi Zona Jenuh Overtourism Bali Selatan (Kuta-Seminyak-Canggu) */}
        {showSouthHotspotZone && (
          <CircleMarker
            center={[-8.6785, 115.1585]}
            radius={28}
            pathOptions={{
              color: "#E11D48",
              fillColor: "#E11D48",
              fillOpacity: 0.16,
              weight: 1.5,
              dashArray: "4 4",
            }}
          >
            <Popup>
              <div className="p-1 max-w-[230px] text-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
                  Zona Konsentrasi Sarbagita (Bobot 0.2)
                </p>
                <p className="text-xs leading-relaxed">
                  Kawasan Kuta-Canggu-Seminyak menanggung beban kemacetan &
                  65,88% konsentrasi PDRB. Eco Traveler mengalihkan rute Anda ke
                  utara, timur, dan barat.
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Layer Seluruh 28 Desa Wisata Terkurasi (Non-Rute Aktif) */}
        {showAllCuratedVillages &&
          allVillages
            .filter((v) => !routeVillageIds.has(v.id))
            .map((village) => (
              <CircleMarker
                key={village.id}
                center={[village.lat, village.lng]}
                radius={6}
                pathOptions={{
                  color: "#0F172A",
                  weight: 1.5,
                  fillColor:
                    village.regency === "Badung" ||
                    village.regency === "Denpasar"
                      ? "#94A3B8"
                      : village.regency === "Gianyar" ||
                        village.regency === "Tabanan"
                      ? "#38BDF8"
                      : "#10B981",
                  fillOpacity: 0.78,
                }}
              >
                <Popup>
                  <div className="text-slate-900 min-w-[210px] max-w-[250px] space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Kab. {village.regency}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Zona {village.zone}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {village.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-snug">
                      {village.highlights}
                    </p>
                    <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                      <strong>UMKM:</strong> {village.localUmkm}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Homestay: ~{formatRupiah(village.avgHomestayPrice)}/malam
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

        {/* Pin Titik Kedatangan (Arrival Gate) */}
        <Marker position={arrivalCoords} icon={createGateIcon()}>
          <Popup>
            <div className="text-slate-900 min-w-[190px]">
              <p className="text-[10px] font-mono uppercase tracking-wider text-sky-700 font-bold">
                Titik Kedatangan Wisatawan
              </p>
              <p className="text-xs font-bold mt-0.5">{arrivalLabel}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Titik awal pergerakan menuju koridor Desa Wisata prioritas.
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Garis Penghubung dari Pintu Kedatangan ke Destinasi Pertama Hari 1 */}
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
                color: "#38BDF8",
                weight: 2.5,
                dashArray: "6 8",
                opacity: 0.75,
              }}
            />
          )}

        {/* Polyline Jalur Harian & Pin Destinasi per Hari */}
        {visibleDays.map((day, dayIdx) => {
          const dayColor = DAY_COLORS[day.dayNumber]?.hex || "#2563EB";
          const dayPositions: [number, number][] = day.activities.map((a) => [
            a.lat,
            a.lng,
          ]);

          // Hubungkan akhir hari sebelumnya ke awal hari berikutnya agar alur utuh
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
                    color: "#94A3B8",
                    weight: 2.5,
                    dashArray: "4 8",
                    opacity: 0.7,
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
                      click: () => onSelectActivity(activity),
                    }}
                  >
                    <Popup>
                      <div className="text-slate-900 min-w-[235px] max-w-[275px] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: dayColor }}
                          >
                            Hari {day.dayNumber} • {activity.timeSlot}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            Kab. {activity.regency}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-950 leading-snug">
                          {activity.villageName}
                        </h4>
                        <p className="text-xs font-medium text-emerald-800">
                          {activity.activityTitle}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {activity.description}
                        </p>

                        {activity.localUmkmSpot && (
                          <div className="bg-slate-100 p-1.5 rounded text-[11px] text-slate-700 flex items-start gap-1.5">
                            <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>
                              <strong>UMKM Warga:</strong>{" "}
                              {activity.localUmkmSpot}
                            </span>
                          </div>
                        )}

                        {isRedirected && (
                          <div className="bg-amber-50 border border-amber-300 p-1.5 rounded text-[11px] text-amber-900">
                            <strong>Anti-Overtourism Redirect:</strong> Dialihkan
                            dari {activity.originalSaturatedVillage} ke desa
                            penyangga ini.
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Estimasi Belanja Lokal:
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
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

      {/* Bottom Spatial Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 px-3 py-2 rounded-xl text-[11px] text-slate-300 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Kode Warna Rute:
          </span>
          {Object.entries(DAY_COLORS).map(([dayNum, info]) => (
            <span key={dayNum} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: info.hex }}
              />
              <span>{info.label}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Klik pin untuk detail UMKM & Adat
          </span>
          <span className="hidden sm:flex items-center gap-1 text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            Bobot Spasial 1.0 = Utara/Timur/Barat
          </span>
        </div>
      </div>
    </div>
  );
}
