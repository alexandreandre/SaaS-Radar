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

const CARD_DANGLING_WORDS = new Set([
  "a",
  "à",
  "au",
  "aux",
  "ce",
  "ces",
  "cette",
  "d",
  "de",
  "des",
  "du",
  "en",
  "et",
  "l",
  "la",
  "le",
  "les",
  "ou",
  "pour",
  "que",
  "qui",
  "un",
  "une",
  "avec",
  "sans",
  "afin",
  "font",
  "sont",
  "est",
]);

const CARD_DANGLING_PHRASES = [
  "afin de",
  "afin d'",
  "qui font des",
  "qui font",
  "qui est",
  "qui sont",
  "pour les",
  "pour le",
  "pour la",
  "pour un",
  "pour une",
  "avec des",
  "avec les",
  "avec un",
  "au royaume-uni qui",
];

function normalizeCardWord(word: string): string {
  return word.toLowerCase().replace(/[''‑—–-]/g, "");
}

function trimRelativeClauseIfTruncated(original: string, excerpt: string): string {
  if (excerpt.length >= original.length) return excerpt;
  const match = excerpt.match(/^(.*?)\s+qui\s/i);
  if (match && match[1].length >= 20) return match[1].trim();
  return excerpt;
}

/** Retire les fins de phrase coupées au milieu d'une proposition. */
function trimCardDanglingEnding(text: string): string {
  let result = text.trim();
  if (!result) return result;

  for (const phrase of CARD_DANGLING_PHRASES) {
    const suffix = ` ${phrase}`;
    if (result.toLowerCase().endsWith(suffix)) {
      result = result.slice(0, -suffix.length).trim();
    }
  }

  const words = result.split(/\s+/);
  while (words.length > 3) {
    const last = normalizeCardWord(words[words.length - 1] ?? "");
    if (CARD_DANGLING_WORDS.has(last)) {
      words.pop();
      continue;
    }
    break;
  }

  return words.join(" ").trim();
}

/** Coupe un texte carte au mot ou à la ponctuation — sans « … », phrase naturelle. */
export function excerptForCard(text: string, maxLength = 110): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length <= maxLength) return trimCardDanglingEnding(trimmed);

  const firstSentence = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  if (firstSentence && firstSentence[1].length <= maxLength) {
    return trimCardDanglingEnding(firstSentence[1].replace(/[.!?]$/, "").trim());
  }

  const window = trimmed.slice(0, maxLength);
  const punctBreak = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
    window.lastIndexOf(" — "),
    window.lastIndexOf(" - "),
    window.lastIndexOf(", ")
  );
  if (punctBreak >= maxLength * 0.4) {
    const end = trimmed[punctBreak] === "," ? punctBreak : punctBreak + 1;
    return trimRelativeClauseIfTruncated(
      trimmed,
      trimCardDanglingEnding(trimmed.slice(0, end).trim())
    );
  }

  const lastSpace = window.lastIndexOf(" ");
  const cut = (lastSpace > 0 ? window.slice(0, lastSpace) : window).trim();
  return trimRelativeClauseIfTruncated(
    trimmed,
    trimCardDanglingEnding(cut)
  );
}

export function getMidnightCountdown(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function getEndOfWeekCountdown(): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const end = new Date(now);
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 7);
  }
  const diff = end.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
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
