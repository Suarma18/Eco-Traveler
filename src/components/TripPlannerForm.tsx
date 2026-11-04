"use client";

import React from "react";
import {
  TripRequest,
  BudgetCategory,
  ArrivalGate,
} from "@/types/trip";
import {
  Calendar,
  Compass,
  PlaneLanding,
  Ship,
  Wallet,
  Sparkles,
  ShieldCheck,
  Trees,
  Landmark,
  Utensils,
  HeartPulse,
  Sprout,
  Loader2,
} from "lucide-react";

interface TripPlannerFormProps {
  value: TripRequest;
  onChange: (next: TripRequest) => void;
  onSubmit: (req: TripRequest) => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = [
  {
    id: "Nature",
    label: "Alam & Konservasi",
    sub: "Terumbu Biorock, Hutan Adat, Geopark",
    icon: Trees,
  },
  {
    id: "Culture",
    label: "Seni & Budaya Luhur",
    sub: "Desa Bali Aga, Tenun Gringsing & Songket",
    icon: Landmark,
  },
  {
    id: "Culinary",
    label: "Kuliner Tradisional",
    sub: "Garam Palung, Kopi Indikasi Geografis",
    icon: Utensils,
  },
  {
    id: "Wellness",
    label: "Kebugaran & Ekowisata",
    sub: "Air Panas Vulkanik, Yoga Lembah, Boreh",
    icon: HeartPulse,
  },
  {
    id: "Agriculture",
    label: "Agroturisme Subak",
    sub: "Sawah Beras Merah, Agroforestri Salak & Kakao",
    icon: Sprout,
  },
];

const BUDGET_OPTIONS: {
  id: BudgetCategory;
  label: string;
  sub: string;
  range: string;
}[] = [
  {
    id: "Backpacker",
    label: "Backpacker",
    sub: "Homestay Warga & Warung Desa",
    range: "~Rp 550rb / hari",
  },
  {
    id: "Moderate",
    label: "Menengah",
    sub: "Boutique Homestay & Lokakarya",
    range: "~Rp 750rb / hari",
  },
  {
    id: "Comfort",
    label: "Comfort Eco-Lodge",
    sub: "Eco-Lodge Komunitas & Pemandu Privat",
    range: "~Rp 1,05jt / hari",
  },
];

export default function TripPlannerForm({
  value,
  onChange,
  onSubmit,
  isLoading,
}: TripPlannerFormProps) {
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
    };
    onChange(updated);
    onSubmit(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 lg:p-6 shadow-xl space-y-5"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-md mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            Parameter Mesin Redistribusi
          </span>
          <h2 className="text-lg font-display font-bold text-slate-100">
            Konfigurasi Rute Wisatawan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mengalokasikan minimal 70% durasi ke kabupaten prioritas luar
            Sarbagita.
          </p>
        </div>
      </div>

      {/* Quick Jury Scenario Presets */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Skenario Uji Cepat (Demo Juri):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            className="text-left px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-700/70 transition-all group"
          >
            <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200 flex items-center justify-between">
              <span>Koridor Timur & Kaldera (3H)</span>
              <span className="font-mono text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded">
                Ngurah Rai
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Bangli → Karangasem → Buleleng + Capacity Guard
            </p>
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
            className="text-left px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-700/70 transition-all group"
          >
            <div className="text-xs font-semibold text-sky-300 group-hover:text-sky-200 flex items-center justify-between">
              <span>Lintas Barat & Pesisir Utara (4H)</span>
              <span className="font-mono text-[10px] bg-sky-900/60 px-1.5 py-0.5 rounded">
                Gilimanuk
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Jembrana → Pemuteran → Munduk → Tejakula
            </p>
          </button>
        </div>
      </div>

      {/* 1. Durasi Perjalanan (1-4 Hari) */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          Durasi Perjalanan (FR-01)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((day) => {
            const active = value.durationDays === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onChange({ ...value, durationDays: day })}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${
                  active
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/50"
                    : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {day} Hari
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Titik Kedatangan (Bandara Ngurah Rai vs Pelabuhan Gilimanuk) */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <PlaneLanding className="w-3.5 h-3.5 text-emerald-400" />
          Titik Kedatangan Wisatawan
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              id: "NgurahRaiAirport" as ArrivalGate,
              title: "Bandara Ngurah Rai",
              sub: "Gerbang Selatan (Bebas Transit Kuta)",
              icon: PlaneLanding,
            },
            {
              id: "GilimanukPort" as ArrivalGate,
              title: "Pelabuhan Gilimanuk",
              sub: "Gerbang Barat (Jembrana - Buleleng)",
              icon: Ship,
            },
          ].map((gate) => {
            const Icon = gate.icon;
            const active = value.arrivalGate === gate.id;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => onChange({ ...value, arrivalGate: gate.id })}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 active:scale-[0.99] ${
                  active
                    ? "bg-emerald-950/80 border-emerald-500 text-slate-100 shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <div>
                  <div className="text-xs font-bold">{gate.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {gate.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferensi Minat (Multi-Select) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Preferensi Minat (Multi-Select)
          </label>
          <span className="text-[11px] font-mono text-emerald-400">
            {value.interests.length} dipilih
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {INTEREST_OPTIONS.map((item) => {
            const Icon = item.icon;
            const selected = value.interests.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleInterest(item.id)}
                className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                  selected
                    ? "bg-emerald-950/75 border-emerald-500/90 text-slate-100"
                    : "bg-slate-950/60 border-slate-800/90 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      selected
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.sub}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                    selected
                      ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold"
                      : "border-slate-700"
                  }`}
                >
                  {selected ? "✓" : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Preferensi Anggaran */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          Preferensi Akomodasi & Anggaran
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BUDGET_OPTIONS.map((b) => {
            const active = value.budgetCategory === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange({ ...value, budgetCategory: b.id })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  active
                    ? "bg-emerald-950/80 border-emerald-500 text-slate-100"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold">{b.label}</div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  {b.range}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {b.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Anti-Overtourism Capacity Guard Toggle (FR-06) */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Anti-Overtourism Capacity Guard (FR-06)
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Otomatis geser rute ke Desa Penyangga (Buffer Village) bila kuota
              kunjungan desa penuh.
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={Boolean(value.simulateCapacityAlert)}
          onChange={(e) =>
            onChange({ ...value, simulateCapacityAlert: e.target.checked })
          }
          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
          aria-label="Aktifkan simulasi kuota kapasitas penuh"
        />
      </div>

      {/* Submit CTA (Max 3 words per design-taste rule) */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-display font-bold text-sm tracking-wide transition-all active:scale-[0.99] shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyusun Rute...</span>
          </>
        ) : (
          <>
            <Compass className="w-4 h-4" />
            <span>Susun Rute Pemerataan</span>
          </>
        )}
      </button>
    </form>
  );
}

