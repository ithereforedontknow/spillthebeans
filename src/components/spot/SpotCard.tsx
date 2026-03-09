import { Link } from "react-router-dom";
import { MapPin, Wifi, Zap, Clock } from "lucide-react";
import {
  cn,
  computeSpotStats,
  weightedWorkScore,
  freshnessLabel,
  freshnessColor,
  isOpenNow,
} from "@/lib/utils";
import { PRICE_LABELS, AMENITY_LABELS, type AmenityKey } from "@/types";
import type { DbSpot, DbReview } from "@/types";

interface SpotCardProps {
  spot: DbSpot;
  reviews?: DbReview[];
  className?: string;
}

export function SpotCard({ spot, reviews = [], className }: SpotCardProps) {
  const stats = computeSpotStats(reviews);
  const wScore = stats.review_count > 0 ? weightedWorkScore(stats) : null;
  const img = spot.image_url ?? `https://picsum.photos/seed/${spot.id}/480/320`;
  const spotUrl = `/spot/${spot.slug ?? spot.id}`;
  const lastReview = reviews[0]?.created_at ?? null;
  const openState = isOpenNow(spot.hours_json);

  // Collect set amenities
  const amenityKeys: AmenityKey[] = [
    "amenity_no_time_limit",
    "amenity_standing_desk",
    "amenity_outdoor_seating",
    "amenity_open_24h",
    "amenity_reservable",
    "amenity_pet_friendly",
  ];
  const activeAmenities = amenityKeys.filter(
    (k) => spot[k as keyof typeof spot],
  );

  return (
    <Link to={spotUrl} className="group block">
      <article
        className={cn(
          "card overflow-hidden hover:border-muted transition-colors duration-200",
          className,
        )}
      >
        {/* Image */}
        <div className="aspect-[16/9] bg-raised overflow-hidden relative">
          <img
            src={img}
            alt={spot.name}
            loading="lazy"
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-500"
          />
          {/* Weighted work score badge */}
          {wScore !== null && (
            <div className="absolute top-2 right-2 flex items-baseline gap-0.5 bg-base/85 backdrop-blur-sm border border-amber/30 rounded px-2 py-1">
              <span className="font-mono font-semibold text-amber text-sm leading-none">
                {wScore.toFixed(1)}
              </span>
              <span className="font-mono text-2xs text-dim leading-none">
                /5
              </span>
            </div>
          )}
          {/* Amenity + open state badges */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[60%]">
            {spot.has_wifi && (
              <span className="flex items-center bg-base/80 backdrop-blur-sm border border-border rounded px-1.5 py-0.5">
                <Wifi size={10} className="text-amber" />
              </span>
            )}
            {spot.has_power && (
              <span className="flex items-center bg-base/80 backdrop-blur-sm border border-border rounded px-1.5 py-0.5">
                <Zap size={10} className="text-amber" />
              </span>
            )}
            {openState === true && (
              <span className="font-mono text-2xs bg-base/80 backdrop-blur-sm border border-green-800 text-green-800 rounded px-1.5 py-0.5">
                Open
              </span>
            )}
            {openState === false && (
              <span className="font-mono text-2xs bg-base/80 backdrop-blur-sm border border-red-500 text-red-700 rounded px-1.5 py-0.5">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display text-head text-base leading-snug line-clamp-1 group-hover:text-amber transition-colors">
              {spot.name}
            </h3>
            {spot.price_range && (
              <span className="font-mono text-2xs text-dim shrink-0 mt-0.5">
                {PRICE_LABELS[spot.price_range]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-dim mb-2">
            <MapPin size={11} className="shrink-0" />
            <span className="text-xs truncate">{spot.city}</span>
          </div>

          {/* Amenity chips */}
          {activeAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {activeAmenities.slice(0, 3).map((k) => (
                <span key={k} className="tag text-2xs">
                  {AMENITY_LABELS[k]}
                </span>
              ))}
              {activeAmenities.length > 3 && (
                <span className="tag text-2xs">
                  +{activeAmenities.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats row */}
          {stats.review_count > 0 ? (
            <div className="flex items-end justify-between">
              <div className="flex gap-3">
                <StatChip label="WiFi" val={stats.avg_wifi} />
                <StatChip label="Power" val={stats.avg_power} />
                <StatChip label="Noise" val={stats.avg_noise} />
              </div>
              <div className="text-right">
                <div className="font-mono text-2xs text-dim">
                  {stats.review_count}{" "}
                  {stats.review_count === 1 ? "review" : "reviews"}
                </div>
                <div
                  className={cn(
                    "font-mono text-2xs",
                    freshnessColor(lastReview),
                  )}
                >
                  {freshnessLabel(lastReview)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-dim/60">
              <Clock size={10} />
              <p className="font-mono text-2xs">No reviews yet</p>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function StatChip({ label, val }: { label: string; val: number }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xs font-semibold text-amber">
        {val > 0 ? val.toFixed(1) : "—"}
      </div>
      <div className="font-mono text-2xs text-dim">{label}</div>
    </div>
  );
}
