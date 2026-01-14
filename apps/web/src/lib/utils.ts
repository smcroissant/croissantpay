import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateApiKey(prefix: string = "mx"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${key}`;
}

export function generateWebhookId(platform: "apple" | "google"): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `wh_${platform}_${id}`;
}

export function formatCurrency(
  amountMicros: number,
  currencyCode: string
): string {
  const amount = amountMicros / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function parseISO8601Duration(duration: string): {
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
} {
  const match = duration.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/);
  if (!match) return {};
  
  return {
    years: match[1] ? parseInt(match[1]) : undefined,
    months: match[2] ? parseInt(match[2]) : undefined,
    weeks: match[3] ? parseInt(match[3]) : undefined,
    days: match[4] ? parseInt(match[4]) : undefined,
  };
}

export function formatDuration(duration: string): string {
  const { days, weeks, months, years } = parseISO8601Duration(duration);
  
  if (years) return `${years} year${years > 1 ? "s" : ""}`;
  if (months) return `${months} month${months > 1 ? "s" : ""}`;
  if (weeks) return `${weeks} week${weeks > 1 ? "s" : ""}`;
  if (days) return `${days} day${days > 1 ? "s" : ""}`;
  
  return duration;
}

