import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} Miliar`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Juta`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)} Ribu`;
  }
  return formatRupiah(amount);
}

export const DAY_COLORS: Record<
  number,
  { hex: string; label: string; bgClass: string; borderClass: string }
> = {
  1: {
    hex: "#2563EB", // Hari 1: Biru (sesuai PRD FR-03)
    label: "Hari 1 (Biru)",
    bgClass: "bg-blue-600",
    borderClass: "border-blue-400",
  },
  2: {
    hex: "#10B981", // Hari 2: Hijau (sesuai PRD FR-03)
    label: "Hari 2 (Hijau)",
    bgClass: "bg-emerald-500",
    borderClass: "border-emerald-400",
  },
  3: {
    hex: "#F59E0B", // Hari 3: Jingga (sesuai PRD FR-03)
    label: "Hari 3 (Jingga)",
    bgClass: "bg-amber-500",
    borderClass: "border-amber-400",
  },
  4: {
    hex: "#E11D48", // Hari 4: Terakota / Merah Muda
    label: "Hari 4 (Terakota)",
    bgClass: "bg-rose-600",
    borderClass: "border-rose-400",
  },
};

