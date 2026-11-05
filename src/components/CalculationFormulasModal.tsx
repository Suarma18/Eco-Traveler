"use client";

import React, { useEffect } from "react";
import { Locale } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import {
  X,
  TrendingUp,
  Store,
  ShieldCheck,
  Users,
  Info,
  Scale,
  Calculator,
} from "lucide-react";

interface CalculationFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export default function CalculationFormulasModal({
  isOpen,
  onClose,
  locale,
}: CalculationFormulasModalProps) {
  const t = UI_TEXT[locale];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1050] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain p-5 sm:p-6 shadow-2xl space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-emerald-900/30 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[#0D4732] dark:text-emerald-300 font-semibold mb-1.5">
              <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
              Subak Spatial Engine
            </span>
            <h3
              id="formula-modal-title"
              className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight"
            >
              {t.formulaModalTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {t.formulaModalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16231c] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] dark:focus-visible:ring-emerald-400 shrink-0"
            aria-label={t.closeModalLabel}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Notice Alert Box */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <Info
            className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p>{t.formulaNotice}</p>
        </div>

        {/* Section 1: Spread Score */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <TrendingUp className="w-4 h-4 text-[#0D4732] dark:text-emerald-400 shrink-0" />
            <span>{t.spreadScoreFormulaTitle}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/30 font-mono text-xs text-emerald-800 dark:text-emerald-300">
            {t.spreadScoreFormulaMath}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.spreadScoreFormulaDesc}
          </p>
        </div>

        {/* Section 2: Local Economic Retention (LBI) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Store className="w-4 h-4 text-[#EA580C] dark:text-[#FB923C] shrink-0" />
            <span>{t.lbiFormulaTitle}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111914] border border-slate-200/80 dark:border-emerald-900/30 font-mono text-xs text-emerald-800 dark:text-emerald-300">
            {t.lbiFormulaMath}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.lbiFormulaDesc}
          </p>
        </div>

        {/* Section 3: Direct Community Spend */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Users className="w-4 h-4 text-[#0D4732] dark:text-emerald-400 shrink-0" />
            <span>{t.directSpendFormulaTitle}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.directSpendFormulaDesc}
          </p>
        </div>

        {/* Section 4: Quota & Carrying Capacity */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16231c] border border-slate-200/80 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.quotaFormulaTitle}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.quotaFormulaDesc}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-emerald-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0D4732] text-white hover:bg-[#093223] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
          >
            {t.closeModalLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

