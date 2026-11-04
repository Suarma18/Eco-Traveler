"use client";

import React from "react";
import { TripRequest, BudgetCategory, ArrivalGate } from "@/types/trip";
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
}

const INTEREST_OPTIONS = [
  { id: "Nature", label: "Alam & Konservasi", icon: Trees },
  { id: "Culture", label: "Seni & Budaya Adat", icon: Landmark },
  { id: "Culinary", label: "Kuliner Tradisional", icon: Utensils },
  { id: "Wellness", label: "Kebugaran & Ekowisata", icon: HeartPulse },
  { id: "Agriculture", label: "Agroturisme Subak", icon: Sprout },
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
    sub: "Homestay Warga",
    range: "~Rp 550rb/hr",
  },
  {
    id: "Moderate",
    label: "Menengah",
    sub: "Boutique Desa",
    range: "~Rp 750rb/hr",
  },
  {
    id: "Comfort",
    label: "Eco-Lodge",
    sub: "Lodge Komunitas",
    range: "~Rp 1,05jt/hr",
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
      className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4"
    >
      {/* Visual Quick Scenario Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Sparkles
              className="w-3.5 h-3.5 text-[#C85A32]"
              aria-hidden="true"
            />
            Kurasi Ekspedisi Cepat
          </span>
          <span className="text-[11px] text-stone-500">
            Klik untuk muat instan
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
            className="group relative overflow-hidden rounded-xl border border-stone-200/90 bg-stone-50 p-2.5 text-left transition-colors hover:border-[#0D4732] hover:bg-emerald-50/30 cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=240&q=80"
              alt="Koridor Timur dan Kaldera"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-900 group-hover:text-[#0D4732] truncate">
                Timur & Kaldera Batur (3H)
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                Sidemen · Undisan · Tejakula
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
            className="group relative overflow-hidden rounded-xl border border-stone-200/90 bg-stone-50 p-2.5 text-left transition-colors hover:border-[#0D4732] hover:bg-emerald-50/30 cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=240&q=80"
              alt="Lintas Barat dan Pesisir Utara"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-900 group-hover:text-[#0D4732] truncate">
                Lintas Barat & Biorock (4H)
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                Jembrana · Pemuteran · Munduk
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Baris 1: Durasi & Titik Kedatangan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold text-stone-700">
            Durasi Perjalanan
          </legend>
          <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
            {[1, 2, 3, 4].map((day) => {
              const active = value.durationDays === day;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, durationDays: day })}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                    active
                      ? "bg-[#0D261C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {day} Hari
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold text-stone-700">
            Pintu Kedatangan
          </legend>
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl">
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
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                    active
                      ? "bg-[#0D261C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
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
          <legend className="text-xs font-semibold text-stone-700">
            Fokus Pengalaman Desa
          </legend>
          <span className="text-[11px] font-mono text-[#0D4732] font-semibold">
            {value.interests.length} dipilih
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  selected
                    ? "bg-[#0D261C] text-white border-[#0D261C] shadow-2xs"
                    : "bg-stone-50 text-stone-700 border-stone-200/90 hover:bg-stone-100"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 ${
                    selected ? "text-emerald-300" : "text-stone-500"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Baris 3: Kategori Anggaran */}
      <fieldset className="space-y-1.5">
        <legend className="block text-xs font-semibold text-stone-700">
          Preferensi Menginap & Anggaran
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
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] ${
                  active
                    ? "bg-emerald-50/70 border-[#0D4732] text-stone-900"
                    : "bg-stone-50/60 border-stone-200/80 text-stone-600 hover:bg-stone-100/70"
                }`}
              >
                <div className="text-xs font-bold text-stone-900">
                  {b.label}
                </div>
                <div className="text-[10px] text-stone-500">{b.sub}</div>
                <div className="text-[11px] font-mono font-semibold text-[#0D4732] mt-0.5 tabular-nums">
                  {b.range}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Baris 4: Proteksi Kuota Desa & Submit CTA */}
      <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
          <input
            type="checkbox"
            name="simulateCapacityAlert"
            checked={Boolean(value.simulateCapacityAlert)}
            onChange={(e) =>
              onChange({ ...value, simulateCapacityAlert: e.target.checked })
            }
            className="w-4 h-4 accent-[#0D261C] rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732]"
          />
          <span>Aktifkan proteksi kuota & pengalihan Desa Penyangga</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-[#0D261C] hover:bg-[#143628] disabled:opacity-60 text-white font-display font-semibold text-xs tracking-wide transition-colors active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4732] focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                aria-hidden="true"
              />
              <span>Menyusun rute…</span>
            </>
          ) : (
            <>
              <Compass
                className="w-3.5 h-3.5 text-emerald-300"
                aria-hidden="true"
              />
              <span>Susun Rute Pemerataan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
