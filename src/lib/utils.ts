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

// ── Phase 3 utilities ─────────────────────────────────────────────────────────

// Weighted work score — mirrors the Postgres function
// WiFi 2x, Power 1.5x, Laptop 1.5x, Noise 1x, Coffee 0.75x, Seating 0.75x
export function weightedWorkScore(r: {
  avg_wifi: number;
  avg_power: number;
  avg_noise: number;
  avg_laptop: number;
  avg_coffee: number;
  avg_seating: number;
}): number {
  const {
    avg_wifi,
    avg_power,
    avg_noise,
    avg_laptop,
    avg_coffee,
    avg_seating,
  } = r;
  if (!avg_wifi) return 0;
  const raw =
    (avg_wifi * 2 +
      avg_power * 1.5 +
      avg_laptop * 1.5 +
      avg_noise * 1 +
      avg_coffee * 0.75 +
      avg_seating * 0.75) /
    (2 + 1.5 + 1.5 + 1 + 0.75 + 0.75);
  return Math.round(raw * 10) / 10;
}

// Generate a URL slug from a spot name
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Parse "HH:MM-HH:MM" into minutes-since-midnight for comparison
function parseMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

// Check if a spot is open right now given its hours_json
export function isOpenNow(
  hoursJson: Record<string, string | null> | null | undefined,
): boolean | null {
  if (!hoursJson) return null; // unknown
  const days: Record<number, string> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  const now = new Date();
  const dayKey = days[now.getDay()];
  const hours = hoursJson[dayKey];
  if (hours === null || hours === undefined) return false; // closed today
  if (hours === "00:00-23:59") return true; // 24h
  const [open, close] = hours.split("-");
  if (!open || !close) return null;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = parseMinutes(open);
  const closeMins = parseMinutes(close);
  // Handle overnight (e.g. "22:00-02:00")
  if (closeMins < openMins) return nowMins >= openMins || nowMins < closeMins;
  return nowMins >= openMins && nowMins < closeMins;
}

// Human-readable "last reviewed" freshness
export function freshnessLabel(
  lastReviewedAt: string | null | undefined,
): string {
  if (!lastReviewedAt) return "Never reviewed";
  const days = Math.floor(
    (Date.now() - new Date(lastReviewedAt).getTime()) / 86400000,
  );
  if (days === 0) return "Reviewed today";
  if (days === 1) return "Reviewed yesterday";
  if (days < 7) return `Reviewed ${days}d ago`;
  if (days < 30) return `Reviewed ${Math.floor(days / 7)}w ago`;
  if (days < 365) return `Reviewed ${Math.floor(days / 30)}mo ago`;
  return `Reviewed ${Math.floor(days / 365)}y ago`;
}

export function freshnessColor(
  lastReviewedAt: string | null | undefined,
): string {
  if (!lastReviewedAt) return "text-dim/50";
  const days = Math.floor(
    (Date.now() - new Date(lastReviewedAt).getTime()) / 86400000,
  );
  if (days < 30) return "text-amber";
  if (days < 180) return "text-body";
  return "text-dim";
}
