import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getNextMondayCountdown(): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const next = new Date(now);
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  next.setDate(now.getDate() + (day === 1 && now.getHours() < 8 ? 0 : daysUntilMonday));
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  const diff = next.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
