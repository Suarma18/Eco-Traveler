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
    return `Rp ${(amount / 1_000_000).toFixed(2)} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)} Rb`;
  }
  return formatRupiah(amount);
}

export const DAY_COLORS: Record<
  number,
  {
    hex: string;
    label: string;
    bgClass: string;
    borderClass: string;
    softBg: string;
    textClass: string;
  }
> = {
  1: {
    hex: "#0D4732", // Hari 1: Subak Deep Emerald
    label: "Hari 1",
    bgClass: "bg-[#0D4732]",
    borderClass: "border-[#0D4732]",
    softBg: "bg-emerald-50",
    textClass: "text-[#0D4732]",
  },
  2: {
    hex: "#C85A32", // Hari 2: Warm Terracotta
    label: "Hari 2",
    bgClass: "bg-[#C85A32]",
    borderClass: "border-[#C85A32]",
    softBg: "bg-orange-50",
    textClass: "text-[#C85A32]",
  },
  3: {
    hex: "#1D63B8", // Hari 3: Ocean Biorock Blue
    label: "Hari 3",
    bgClass: "bg-[#1D63B8]",
    borderClass: "border-[#1D63B8]",
    softBg: "bg-sky-50",
    textClass: "text-[#1D63B8]",
  },
  4: {
    hex: "#A16207", // Hari 4: Highland Ochre Gold
    label: "Hari 4",
    bgClass: "bg-amber-700",
    borderClass: "border-amber-700",
    softBg: "bg-amber-50",
    textClass: "text-amber-800",
  },
};
