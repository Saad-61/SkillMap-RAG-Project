import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clampScore(score: number) {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

export function formatScore(score: number) {
  const s = clampScore(score);
  return `${s.toFixed(0)}%`;
}

export function formatDateTime(isoOrMs: string | number) {
  const date = new Date(isoOrMs);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safeUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, "");
    const path = parsed.pathname.length > 1 ? parsed.pathname : "";
    return `${host}${path}`;
  } catch {
    return url;
  }
}

