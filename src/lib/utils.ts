import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DbReview, SpotStats } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function computeSpotStats(reviews: DbReview[]): SpotStats {
  const n = reviews.length;
  if (!n)
    return {
      review_count: 0,
      avg_score: 0,
      avg_wifi: 0,
      avg_power: 0,
      avg_noise: 0,
      avg_laptop: 0,
      avg_coffee: 0,
      avg_seating: 0,
      dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

  const avg = (key: keyof DbReview) =>
    Math.round((reviews.reduce((s, r) => s + (r[key] as number), 0) / n) * 10) /
    10;

  const dist = reviews.reduce(
    (a, r) => {
      const k = Math.round(r.overall_score) as 1 | 2 | 3 | 4 | 5;
      a[k]++;
      return a;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  return {
    review_count: n,
    avg_score: avg("overall_score"),
    avg_wifi: avg("wifi_quality"),
    avg_power: avg("power_outlets"),
    avg_noise: avg("noise_level"),
    avg_laptop: avg("laptop_friendliness"),
    avg_coffee: avg("coffee_quality"),
    avg_seating: avg("seating_comfort"),
    dist,
  };
}

export function scoreLabel(s: number) {
  if (s >= 4.5) return "Excellent";
  if (s >= 4.0) return "Great";
  if (s >= 3.0) return "Good";
  if (s >= 2.0) return "Fair";
  return "Poor";
}
