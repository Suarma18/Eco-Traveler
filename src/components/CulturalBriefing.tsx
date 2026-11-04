"use client";

import React, { useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import { ScrollText, ChevronDown, Sparkles, ShieldAlert } from "lucide-react";

interface CulturalBriefingProps {
  itinerary: ItineraryResponse;
  allVillages: DesaWisata[];
}

export default function CulturalBriefing({
  itinerary,
  allVillages,
}: CulturalBriefingProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const visitedIds = new Set(
    itinerary.days.flatMap((d) => d.activities.map((a) => a.villageId))
  );
  const activeVillages = allVillages.filter((v) => visitedIds.has(v.id));

  return (
    <section className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-[#C85A32]">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-stone-900 tracking-tight">
              Panduan Etika Adat Desa (Awig-Awig)
            </h3>
            <p className="text-[11px] text-stone-500">
              Protokol kesopanan & penghormatan kesucian kawasan Tri Hita Karana
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200/60">
          {activeVillages.length} Desa Terkait
        </span>
      </div>

      {/* Ringkasan Aturan Kontekstual */}
      <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden">
        {itinerary.culturalEtiquette.map((rule, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                aria-expanded={isOpen}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-stone-800">
                    {rule.ruleTitle}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-stone-600 leading-relaxed space-y-2.5 bg-[#FAF9F5]">
                  <p>{rule.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {rule.applicableVillages.map((vName, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-stone-200/80 text-stone-700"
                      >
                        {vName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ringkasan Busana & Pantangan Desa Kunjungan */}
      {activeVillages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {activeVillages.slice(0, 4).map((village) => (
            <div
              key={village.id}
              className="rounded-xl bg-[#FAF9F5] border border-stone-200/70 p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {village.name}
                </span>
                <span className="text-[10px] font-medium text-stone-500">
                  {village.regency}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug line-clamp-2">
                <span className="font-semibold text-stone-800">Etika & Busana:</span>{" "}
                {village.dressCode || village.customsNote}
              </p>
              {village.sacredDaysNote && (
                <div className="flex items-center gap-1 text-[10px] text-[#C85A32] font-medium pt-0.5">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    Hari Sakral: {village.sacredDaysNote}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
