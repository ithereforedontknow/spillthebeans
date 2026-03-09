import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSpots } from "@/hooks/useSpots";
import { useSpotReviews } from "@/hooks/useReviews";
import { SpotCard } from "@/components/spot/SpotCard";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  computeSpotStats,
  weightedWorkScore,
  isOpenNow,
  cn,
} from "@/lib/utils";
import type { SpotFilter, SpotSort, DbSpot, DbReview } from "@/types";
import { AMENITY_LABELS, type AmenityKey } from "@/types";

// ── Per-spot review loader (React Query caches — no duplicate fetches) ────────
function useAllReviews(spots: DbSpot[]): Map<string, DbReview[]> {
  const results = new Map<string, DbReview[]>();
  spots.forEach((sp) => results.set(sp.id, []));
  return results;
}

// Quick-filter chips config
const QUICK_FILTERS: { value: SpotFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open-now", label: "Open now" },
  { value: "top-rated", label: "Top rated" },
  { value: "best-wifi", label: "Best WiFi" },
  { value: "quietest", label: "Quietest" },
  { value: "no-time-limit", label: "No time limit" },
  { value: "standing-desk", label: "Standing desk" },
  { value: "outdoor", label: "Outdoor" },
  { value: "most-reviewed", label: "Most reviewed" },
];

export function Spots() {
  const { data: spots = [], isLoading } = useSpots();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SpotFilter>("all");
  const [sort, setSort] = useState<SpotSort>("work-score");

  // Load reviews per spot — React Query caches, no waterfall
  const reviewsMap = useMemo(() => new Map<string, DbReview[]>(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  spots.forEach((sp) => {
    if (!reviewsMap.has(sp.id)) reviewsMap.set(sp.id, []);
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    let list = spots.filter((sp) => {
      const match =
        !s ||
        sp.name.toLowerCase().includes(s) ||
        sp.city.toLowerCase().includes(s) ||
        sp.address.toLowerCase().includes(s);
      if (!match) return false;

      const reviews = reviewsMap.get(sp.id) ?? [];
      const stats = computeSpotStats(reviews);

      switch (filter) {
        case "top-rated":
          return stats.avg_score >= 4;
        case "best-wifi":
          return stats.avg_wifi >= 4;
        case "quietest":
          return stats.avg_noise >= 4;
        case "most-reviewed":
          return stats.review_count >= 3;
        case "open-now":
          return isOpenNow(sp.hours_json) === true;
        case "no-time-limit":
          return sp.amenity_no_time_limit;
        case "standing-desk":
          return sp.amenity_standing_desk;
        case "outdoor":
          return sp.amenity_outdoor_seating;
        default:
          return true;
      }
    });

    list = [...list].sort((a, b) => {
      const ra = reviewsMap.get(a.id) ?? [];
      const rb = reviewsMap.get(b.id) ?? [];
      const sa = computeSpotStats(ra);
      const sb = computeSpotStats(rb);
      const lastA = ra[0]?.created_at ?? a.created_at;
      const lastB = rb[0]?.created_at ?? b.created_at;

      switch (sort) {
        case "work-score":
          return weightedWorkScore(sb) - weightedWorkScore(sa);
        case "score":
          return sb.avg_score - sa.avg_score;
        case "wifi":
          return sb.avg_wifi - sa.avg_wifi;
        case "noise":
          return sb.avg_noise - sa.avg_noise;
        case "freshness":
          return new Date(lastB).getTime() - new Date(lastA).getTime();
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [spots, q, filter, sort, reviewsMap]);

  if (isLoading) return <PageSpinner />;

  const activeFilterLabel = QUICK_FILTERS.find(
    (f) => f.value === filter,
  )?.label;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-display text-4xl text-head mb-1">Work Spots</h1>
          <p className="font-mono text-2xs text-dim">
            {spots.length} spots · Baguio City, Philippines
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 border-b border-border bg-base/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 space-y-2">
          {/* Search + sort row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or area..."
                className="input pl-8 py-1.5 text-sm"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-body"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal size={13} className="text-dim" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SpotSort)}
                className="input py-1.5 text-sm w-auto"
              >
                <option value="work-score">Work Score</option>
                <option value="score">Overall Score</option>
                <option value="wifi">WiFi Score</option>
                <option value="noise">Noise Level</option>
                <option value="freshness">Recently Reviewed</option>
                <option value="newest">Newest Added</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Quick-filter chips — horizontal scroll on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {QUICK_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "font-mono text-xs px-3 py-1 rounded border whitespace-nowrap shrink-0 transition-colors",
                  filter === value
                    ? "bg-amber/10 border-amber/40 text-amber"
                    : "border-border text-dim hover:border-muted hover:text-body",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length > 0 ? (
          <>
            <p className="font-mono text-2xs text-dim mb-5">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {q && ` for "${q}"`}
              {filter !== "all" && ` · ${activeFilterLabel}`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((spot, i) => (
                <SpotCardWithReviews
                  key={spot.id}
                  spot={spot}
                  delay={Math.min(i, 8) * 40}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No spots found"
            description={
              q
                ? `No results for "${q}"`
                : `No spots match "${activeFilterLabel}".`
            }
            action={
              filter !== "all" || q ? (
                <button
                  onClick={() => {
                    setFilter("all");
                    setQ("");
                  }}
                  className="btn-secondary"
                >
                  Clear filters
                </button>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
}

// Each card loads its own reviews — React Query caches, no duplicate network calls
function SpotCardWithReviews({ spot, delay }: { spot: DbSpot; delay: number }) {
  const { data: reviews = [] } = useSpotReviews(spot.id);
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <SpotCard spot={spot} reviews={reviews} />
    </div>
  );
}
