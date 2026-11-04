"use client";

import React, { useState } from "react";
import { ItineraryResponse } from "@/types/trip";
import { DesaWisata } from "@/types/desa";
import { Locale } from "@/lib/utils";
import { UI_TEXT, getLocalizedVillageText } from "@/lib/i18n";
import { ScrollText, ChevronDown, Sparkles, ShieldAlert } from "lucide-react";

interface CulturalBriefingProps {
  itinerary: ItineraryResponse;
  allVillages: DesaWisata[];
  locale: Locale;
}

export default function CulturalBriefing({
  itinerary,
  allVillages,
  locale,
}: CulturalBriefingProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const t = UI_TEXT[locale];

  const visitedIds = new Set(
    itinerary.days.flatMap((d) => d.activities.map((a) => a.villageId))
  );
  const activeVillages = allVillages.filter((v) => visitedIds.has(v.id));

  return (
    <section className="bg-white dark:bg-[#101E18] border border-stone-200/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/40 flex items-center justify-center text-[#C85A32] dark:text-[#F28B66]">
            <ScrollText className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {t.etiquetteHeader}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {t.etiquetteSub}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40">
          {t.relatedVillagesBadge(activeVillages.length)}
        </span>
      </div>

      {/* Ringkasan Aturan Kontekstual */}
      <div className="divide-y divide-stone-100 dark:divide-emerald-900/30 border border-stone-200/80 dark:border-emerald-900/40 rounded-xl overflow-hidden">
        {itinerary.culturalEtiquette.map((rule, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white dark:bg-[#101E18]">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                aria-expanded={isOpen}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-[#162921] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D4732]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-3.5 h-3.5 text-[#C85A32] dark:text-[#F28B66] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {rule.ruleTitle}
                  </span>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-2.5 bg-[#FAF9F5] dark:bg-[#14251E]">
                  <p>{rule.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {rule.applicableVillages.map((vName, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-[#101E18] border border-stone-200/80 dark:border-emerald-900/40 text-stone-700 dark:text-stone-300"
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
          {activeVillages.slice(0, 4).map((village) => {
            const vText = getLocalizedVillageText(village, locale);
            return (
              <div
                key={village.id}
                className="rounded-xl bg-[#FAF9F5] dark:bg-[#14251E] border border-stone-200/70 dark:border-emerald-900/40 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {village.name}
                  </span>
                  <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                    {village.regency}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug line-clamp-2">
                  <span className="font-semibold text-stone-800 dark:text-stone-100">
                    {t.dressAndEtiquetteLabel}
                  </span>{" "}
                  {vText.dressCode}
                </p>
                {vText.sacredDaysNote && (
                  <div className="flex items-center gap-1 text-[10px] text-[#C85A32] dark:text-[#F28B66] font-medium pt-0.5">
                    <ShieldAlert
                      className="w-3 h-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {t.sacredDaysLabel} {vText.sacredDaysNote}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
