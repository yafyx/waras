import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

export function timeAgo(date: Date | string | undefined): string {
  if (!date) return "";

  // Ensure we have a valid Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if dateObj is a valid Date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "";
  }

  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

  // Only use "baru saja" for timestamps in the last 10 seconds
  if (seconds < 10) return "baru saja";

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";
  interval = seconds / 60;

  // Use minutes for anything less than an hour but more than 10 seconds
  return Math.max(1, Math.floor(interval)) + " menit lalu";
}
