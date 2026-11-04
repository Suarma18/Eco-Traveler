"use client";

import React, { useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import {
  BookOpen,
  ScrollText,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Waves,
  ChevronDown,
} from "lucide-react";

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
    <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 lg:p-6 shadow-xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            Panduan Etika Adat & Awig-Awig Desa Setempat (FR-05)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[65ch]">
            Setiap Desa Wisata di Bali diatur oleh hukum adat (Awig-Awig) dan
            filosofi Tri Hita Karana. Pahami panduan kontekstual berikut sebelum
            memasuki wilayah desa dalam rute Anda.
          </p>
        </div>

        <span className="text-[11px] font-mono text-amber-300 bg-amber-950/70 border border-amber-800/60 px-3 py-1 rounded-lg">
          {activeVillages.length} Desa Adat Terkait Rute
        </span>
      </div>

      {/* Accordion Rules from AI / Preset */}
      <div className="space-y-2.5">
        {itinerary.culturalEtiquette.map((rule, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-slate-900/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {idx === 0 ? (
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : idx === 1 ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Waves className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-slate-100">
                    {rule.ruleTitle}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/70 space-y-2.5">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rule.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">
                      Berlaku di:
                    </span>
                    {rule.applicableVillages.map((vName, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-200"
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

      {/* Detailed Village-by-Village Awig-Awig Cards for the Route */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          Rincian Spesifik Awig-Awig per Desa pada Rute Aktif:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeVillages.map((village) => (
            <div
              key={village.id}
              className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    {village.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {village.regency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Aturan Adat:</strong>{" "}
                  {village.customsNote}
                </p>
                {village.dressCode && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-emerald-300">Busana Pura:</strong>{" "}
                    {village.dressCode}
                  </p>
                )}
              </div>

              {village.sacredDaysNote && (
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{village.sacredDaysNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

