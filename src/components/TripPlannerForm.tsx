"use client";

import React, { useState } from "react";
import { TripRequest, BudgetCategory, ArrivalGate } from "@/types/trip";
import { Locale } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import { PRESET_1_SVG, PRESET_2_SVG } from "@/lib/village-media";
import {
  Loader2,
  Compass,
  PlaneLanding,
  Ship,
  Trees,
  Landmark,
  Utensils,
  HeartPulse,
  Sprout,
  Sparkles,
} from "lucide-react";

interface TripPlannerFormProps {
  value: TripRequest;
  onChange: (next: TripRequest) => void;
  onSubmit: (req: TripRequest) => void;
  isLoading: boolean;
  locale: Locale;
}

const INTEREST_OPTIONS = [
  {
    id: "Nature",
    labelId: "Alam & Konservasi",
    labelEn: "Nature & Reefs",
    icon: Trees,
  },
  {
    id: "Culture",
    labelId: "Seni & Budaya Adat",
    labelEn: "Heritage & Arts",
    icon: Landmark,
  },
  {
    id: "Culinary",
    labelId: "Kuliner Tradisional",
    labelEn: "Village Culinary",
    icon: Utensils,
  },
  {
    id: "Wellness",
    labelId: "Kebugaran & Ekowisata",
    labelEn: "Eco-Wellness",
    icon: HeartPulse,
  },
  {
    id: "Agriculture",
    labelId: "Agroturisme Subak",
    labelEn: "Subak Agro",
    icon: Sprout,
  },
];

const BUDGET_OPTIONS: {
  id: BudgetCategory;
  labelId: string;
  labelEn: string;
  subId: string;
  subEn: string;
  rangeId: string;
  rangeEn: string;
}[] = [
  {
    id: "Backpacker",
    labelId: "Backpacker",
    labelEn: "Backpacker",
    subId: "Homestay Warga",
    subEn: "Family Homestay",
    rangeId: "~Rp 550rb/hr",
    rangeEn: "~$35/day",
  },
  {
    id: "Moderate",
    labelId: "Menengah",
    labelEn: "Moderate",
    subId: "Pondok Desa",
    subEn: "Village Guest",
    rangeId: "~Rp 750rb/hr",
    rangeEn: "~$47/day",
  },
  {
    id: "Comfort",
    labelId: "Eco-Lodge",
    labelEn: "Eco-Lodge",
    subId: "Lodge Komunitas",
    subEn: "Community Lodge",
    rangeId: "~Rp 1,05jt/hr",
    rangeEn: "~$66/day",
  },
];

export default function TripPlannerForm({
  value,
  onChange,
  onSubmit,
  isLoading,
  locale,
}: TripPlannerFormProps) {
  const t = UI_TEXT[locale];

  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiChanges, setAiChanges] = useState<string[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const toggleInterest = (interestId: string) => {
    const exists = value.interests.includes(interestId);
    let nextInterests: string[];
    if (exists) {
      nextInterests =
        value.interests.length > 1
          ? value.interests.filter((i) => i !== interestId)
          : value.interests;
    } else {
      nextInterests = [...value.interests, interestId];
    }
    onChange({ ...value, interests: nextInterests });
  };

  const applyQuickScenario = (preset: Partial<TripRequest>) => {
    const updated: TripRequest = {
      ...value,
      ...preset,
      locale,
    };
    onChange(updated);
    onSubmit(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...value, locale });
  };

  const handleAiCustomize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiParsing) return;
    setIsAiParsing(true);
    setAiError(null);
    setAiChanges([]);
    setAiExplanation(null);

    try {
      const res = await fetch("/api/ai/parse-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim(), locale }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.parsed) {
        setAiError(
          data.error ||
            (locale === "en"
              ? "AI service is currently unavailable or API key is not configured. Please adjust parameters manually."
              : "Layanan AI sedang tidak tersedia atau kunci API belum dikonfigurasi. Silakan sesuaikan parameter secara manual.")
        );
        return;
      }

      const { days, arrival, focus, stay, explanation } = data.parsed;
      const changes: string[] = [];
      const nextReq: TripRequest = { ...value, locale };

      if (days !== null && days !== value.durationDays) {
        nextReq.durationDays = days;
        changes.push(
          locale === "en" ? `Duration: ${days} Days` : `Durasi: ${days} Hari`
        );
      }

      if (arrival !== null && arrival !== value.arrivalGate) {
        nextReq.arrivalGate = arrival;
        changes.push(
          locale === "en"
            ? `Gate: ${
                arrival === "GilimanukPort"
                  ? "Gilimanuk Port"
                  : "Ngurah Rai Airport"
              }`
            : `Pintu: ${
                arrival === "GilimanukPort"
                  ? "Pelabuhan Gilimanuk"
                  : "Bandara Ngurah Rai"
              }`
        );
      }

      if (focus !== null && Array.isArray(focus) && focus.length > 0) {
        const isDiff =
          focus.length !== value.interests.length ||
          focus.some((f: string) => !value.interests.includes(f));
        if (isDiff) {
          nextReq.interests = focus;
          changes.push(
            locale === "en"
              ? `Focus: ${focus.join(", ")}`
              : `Fokus: ${focus.join(", ")}`
          );
        }
      }

      if (stay !== null && stay !== value.budgetCategory) {
        nextReq.budgetCategory = stay;
        changes.push(
          locale === "en" ? `Stay: ${stay}` : `Akomodasi: ${stay}`
        );
      }

      setAiExplanation(explanation || null);
      setAiChanges(changes.length > 0 ? changes : [t.aiNoChangeNotice]);

      // Apply updated parameters and trigger deterministic engine recalculation
      onChange(nextReq);
      onSubmit(nextReq);
    } catch (err) {
      console.error("AI customize failed:", err);
      setAiError(
        locale === "en"
          ? "Network error connecting to AI. Please use the form controls below."
          : "Gangguan jaringan saat menghubungi AI. Silakan gunakan kontrol formulir di bawah."
      );
    } finally {
      setIsAiParsing(false);
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors"
    >
      {/* Visual Quick Scenario Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles
              className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]"
              aria-hidden="true"
            />
            {t.quickScenariosTitle}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.quickScenariosHint}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() =>
              applyQuickScenario({
                durationDays: 3,
                arrivalGate: "NgurahRaiAirport",
                interests: ["Culture", "Nature", "Culinary"],
                budgetCategory: "Moderate",
                simulateCapacityAlert: true,
              })
            }
            className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-emerald-900/40 bg-slate-50/80 dark:bg-[#16231c] p-2.5 text-left transition-colors hover:border-[#0D4732] dark:hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PRESET_1_SVG}
              alt={t.scenario1Title}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D4732] dark:group-hover:text-emerald-300 truncate">
                {t.scenario1Title}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {t.scenario1Sub}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              applyQuickScenario({
                durationDays: 4,
                arrivalGate: "GilimanukPort",
                interests: ["Nature", "Wellness", "Agriculture"],
                budgetCategory: "Backpacker",
                simulateCapacityAlert: false,
              })
            }
            className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-emerald-900/40 bg-slate-50/80 dark:bg-[#16231c] p-2.5 text-left transition-colors hover:border-[#0D4732] dark:hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PRESET_2_SVG}
              alt={t.scenario2Title}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D4732] dark:group-hover:text-emerald-300 truncate">
                {t.scenario2Title}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {t.scenario2Sub}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Baris 1: Durasi & Titik Kedatangan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.durationLabel}
          </legend>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#16231c] p-1 rounded-xl">
            {[1, 2, 3, 4].map((day) => {
              const active = value.durationDays === day;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, durationDays: day })}
                  className={`py-2.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                    active
                      ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {day} {locale === "en" ? (day === 1 ? "Day" : "Days") : "Hari"}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.arrivalLabel}
          </legend>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-[#16231c] p-1 rounded-xl">
            {[
              {
                id: "NgurahRaiAirport" as ArrivalGate,
                label: "Ngurah Rai",
                icon: PlaneLanding,
              },
              {
                id: "GilimanukPort" as ArrivalGate,
                label: "Gilimanuk",
                icon: Ship,
              },
            ].map((gate) => {
              const Icon = gate.icon;
              const active = value.arrivalGate === gate.id;
              return (
                <button
                  key={gate.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, arrivalGate: gate.id })}
                  className={`py-2.5 sm:py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                    active
                      ? "bg-[#0D261C] dark:bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{gate.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Baris 2: Minat Perjalanan */}
      <fieldset className="space-y-1.5">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.interestsLabel}
          </legend>
          <span className="text-[11px] font-mono text-[#0D4732] dark:text-emerald-400 font-semibold">
            {t.selectedCount(value.interests.length)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map((item) => {
            const Icon = item.icon;
            const selected = value.interests.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleInterest(item.id)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  selected
                    ? "bg-[#0D261C] dark:bg-emerald-700 text-white border-[#0D261C] dark:border-emerald-600 shadow-2xs"
                    : "bg-slate-50 dark:bg-[#16231c] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-emerald-900/40 hover:bg-slate-100 dark:hover:bg-[#1d2f26]"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 ${
                    selected
                      ? "text-emerald-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                />
                <span>{locale === "en" ? item.labelEn : item.labelId}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Baris 3: Kategori Anggaran */}
      <fieldset className="space-y-1.5">
        <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t.budgetLabel}
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {BUDGET_OPTIONS.map((b) => {
            const active = value.budgetCategory === b.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, budgetCategory: b.id })}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 ${
                  active
                    ? "bg-emerald-50/70 dark:bg-emerald-950/60 border-[#0D4732] dark:border-emerald-500 text-slate-900 dark:text-slate-100 ring-1 ring-[#0D4732]/10 dark:ring-emerald-400/20"
                    : "bg-slate-50/70 dark:bg-[#16231c] border-slate-200/80 dark:border-emerald-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#1d2f26]"
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {locale === "en" ? b.labelEn : b.labelId}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {locale === "en" ? b.subEn : b.subId}
                </div>
                <div className="text-[11px] font-mono font-semibold text-[#0D4732] dark:text-emerald-400 mt-0.5 tabular-nums">
                  {locale === "en" ? b.rangeEn : b.rangeId}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Baris 4: Proteksi Kuota Desa & Submit CTA */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            name="simulateCapacityAlert"
            checked={Boolean(value.simulateCapacityAlert)}
            onChange={(e) =>
              onChange({ ...value, simulateCapacityAlert: e.target.checked })
            }
            className="w-4 h-4 accent-[#0D261C] dark:accent-emerald-500 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
          />
          <span>{t.capacityGuardCheck}</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#0D261C] dark:bg-emerald-600 hover:bg-[#143628] dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-display font-semibold text-xs tracking-wide transition-colors active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                aria-hidden="true"
              />
              <span>{t.submitLoading}</span>
            </>
          ) : (
            <>
              <Compass
                className="w-3.5 h-3.5 text-emerald-300 dark:text-white"
                aria-hidden="true"
              />
              <span>{t.submitButton}</span>
            </>
          )}
        </button>
      </div>

      {/* 1B. Sesuaikan dengan AI Box */}
      <div className="pt-3 border-t border-slate-100 dark:border-emerald-900/30 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Sparkles
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>{t.aiCustomizeTitle}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {aiPrompt.length}/300
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={300}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAiCustomize(e);
                }
              }}
              placeholder={t.aiCustomizePlaceholder}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200 dark:border-emerald-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D4732] dark:focus-visible:ring-emerald-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAiCustomize}
            disabled={isAiParsing || !aiPrompt.trim()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
          >
            {isAiParsing ? (
              <>
                <Loader2
                  className="w-3.5 h-3.5 animate-spin"
                  aria-hidden="true"
                />
                <span>{t.aiCustomizing}</span>
              </>
            ) : (
              <>
                <Sparkles
                  className="w-3.5 h-3.5 text-emerald-200 dark:text-white"
                  aria-hidden="true"
                />
                <span>{t.aiCustomizeSubmit}</span>
              </>
            )}
          </button>
        </div>

        {/* Changed Parameter Chips & Feedback */}
        {aiChanges.length > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
            <div className="font-semibold text-[#0D4732] dark:text-emerald-300 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wide">
                {t.aiChangePrefix}
              </span>
              {aiChanges.map((ch, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white shadow-2xs"
                >
                  {ch}
                </span>
              ))}
            </div>
            {aiExplanation && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                &ldquo;{aiExplanation}&rdquo;
              </p>
            )}
          </div>
        )}

        {aiError && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2">
            {aiError}
          </p>
        )}
      </div>
    </form>
  );
}
