import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  ArrowLeft,
  Wifi,
  Zap,
  ExternalLink,
  Bookmark,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSpotBySlug, useSimilarSpots } from "@/hooks/useSpots";
import { useSpotReviews } from "@/hooks/useReviews";
import {
  useSpotLikes,
  useReviewLikes,
  useToggleSpotLike,
  useToggleReviewLike,
} from "@/hooks/useLikes";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ScoreGrid } from "@/components/ui/ScoreBar";
import { SpotCard } from "@/components/spot/SpotCard";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  computeSpotStats,
  scoreLabel,
  weightedWorkScore,
  freshnessLabel,
  freshnessColor,
  isOpenNow,
  cn,
} from "@/lib/utils";
import { SpotPhotoUpload } from "@/components/spot/SpotPhotoUpload";
import {
  PRICE_LABELS,
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/types";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;background:#4a7c3f;border-radius:50%;border:2px solid #1a2314;box-shadow:0 0 0 2px #4a7c3f;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -16],
});

export function SpotPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: spot, isLoading: spotLoading } = useSpotBySlug(slug!);
  const { data: reviews = [], isLoading: revLoading } = useSpotReviews(
    spot?.id ?? "",
  );
  const { data: similar = [] } = useSimilarSpots(
    spot?.id ?? "",
    spot?.city ?? "",
  );
  const { data: spotLikes = [] } = useSpotLikes(user?.id);
  const { data: reviewLikes = [] } = useReviewLikes(user?.id);
  const toggleSpot = useToggleSpotLike();
  const toggleReview = useToggleReviewLike();

  const stats = useMemo(() => computeSpotStats(reviews), [reviews]);
  const wScore = stats.review_count > 0 ? weightedWorkScore(stats) : null;
  const isSpotSaved = spotLikes.some((l) => l.spot_id === spot?.id);
  const likedReviewIds = new Set(reviewLikes.map((l) => l.review_id));
  const hasReviewed = reviews.some((r) => r.user_id === user?.id);
  const lastReview = reviews[0]?.created_at ?? null;
  const openState = isOpenNow(spot?.hours_json);
  const activeAmenities = AMENITY_KEYS.filter(
    (k) => spot?.[k as keyof typeof spot],
  );

  if (spotLoading || revLoading) return <PageSpinner />;
  if (!spot)
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-head mb-4">
          Spot not found.
        </h2>
        <Link to="/spots" className="btn-secondary">
          Back to spots
        </Link>
      </div>
    );

  const img =
    spot.image_url ?? `https://picsum.photos/seed/${spot.id}/1200/600`;

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-raised">
        <img
          src={img}
          alt={spot.name}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 btn-secondary btn-sm font-mono"
        >
          <ArrowLeft size={13} />
          Back
        </button>
        {openState !== null && (
          <div
            className={cn(
              "absolute top-4 right-4 font-mono text-xs px-3 py-1 rounded border backdrop-blur-sm",
              openState
                ? "bg-base/80 border-green-800 text-green-800"
                : "bg-base/80 border-red-500 text-red-700",
            )}
          >
            {openState ? "● Open now" : "○ Closed"}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h1 className="font-display text-2xl text-head leading-tight">
                  {spot.name}
                </h1>
                {user && (
                  <button
                    onClick={() =>
                      toggleSpot.mutate({ uid: user.id, sid: spot.id })
                    }
                    className={cn(
                      "btn btn-sm border shrink-0 mt-0.5",
                      isSpotSaved
                        ? "border-amber/50 text-amber bg-amber/5"
                        : "border-border text-dim hover:border-muted",
                    )}
                  >
                    <Bookmark
                      size={13}
                      className={isSpotSaved ? "fill-current" : ""}
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-dim text-sm mb-3">
                <MapPin size={12} className="shrink-0" />
                <span>
                  {spot.address}, {spot.city}
                </span>
              </div>

              {spot.description && (
                <p className="text-sm text-body leading-relaxed mb-4">
                  {spot.description}
                </p>
              )}

              {/* Core feature tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {spot.has_wifi && (
                  <span className="flex items-center gap-1 tag">
                    <Wifi size={10} className="text-amber" />
                    WiFi
                  </span>
                )}
                {spot.has_power && (
                  <span className="flex items-center gap-1 tag">
                    <Zap size={10} className="text-amber" />
                    Power
                  </span>
                )}
                {spot.price_range && (
                  <span className="tag">{PRICE_LABELS[spot.price_range]}</span>
                )}
                {spot.opening_hours && (
                  <span className="flex items-center gap-1 tag">
                    <Clock size={10} />
                    {spot.opening_hours}
                  </span>
                )}
              </div>

              {/* Amenity tags */}
              {activeAmenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activeAmenities.map((k) => (
                    <span
                      key={k}
                      className="tag text-amber/80 border-amber/20 bg-amber/5"
                    >
                      {AMENITY_LABELS[k as AmenityKey]}
                    </span>
                  ))}
                </div>
              )}

              {/* Scores */}
              {stats.review_count > 0 && (
                <div className="flex items-end gap-4 mb-1">
                  <div>
                    <span className="font-mono text-4xl font-semibold text-amber leading-none">
                      {stats.avg_score.toFixed(1)}
                    </span>
                    <span className="font-mono text-sm text-dim ml-1.5">
                      / 5 — {scoreLabel(stats.avg_score)}
                    </span>
                  </div>
                  {wScore !== null && (
                    <div className="pb-0.5">
                      <div className="font-mono text-lg font-semibold text-amber/70 leading-none">
                        {wScore.toFixed(1)}
                      </div>
                      <div className="font-mono text-2xs text-dim">
                        work score
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-2xs text-dim">
                  {stats.review_count > 0
                    ? `${stats.review_count} review${stats.review_count !== 1 ? "s" : ""}`
                    : "No reviews yet"}
                </p>
                {lastReview && (
                  <span
                    className={cn(
                      "font-mono text-2xs",
                      freshnessColor(lastReview),
                    )}
                  >
                    {freshnessLabel(lastReview)}
                  </span>
                )}
              </div>

              <SpotPhotoUpload
                spotId={spot.id}
                currentUrl={spot.image_url}
                isAdmin={isAdmin}
              />

              {spot.google_maps_url && (
                <a
                  href={spot.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-sm w-full mt-3 mb-3"
                >
                  <ExternalLink size={12} />
                  Open in Maps
                </a>
              )}

              {user && !hasReviewed && (
                <Link
                  to="/review/new"
                  state={{ spotId: spot.id }}
                  className="btn-primary w-full mt-3"
                >
                  Rate this spot
                </Link>
              )}
              {hasReviewed && (
                <p className="text-center py-2 font-mono text-2xs text-amber">
                  You've reviewed this spot.
                </p>
              )}
            </div>

            {/* Detailed score breakdown */}
            {stats.review_count > 0 && (
              <div className="card p-5">
                <p className="font-mono text-2xs text-dim uppercase tracking-widest mb-4">
                  Work Scores
                </p>
                <ScoreGrid {...stats} />
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="font-mono text-2xs text-dim">
                    Weighted work score
                  </span>
                  <span className="font-mono text-sm font-semibold text-amber">
                    {wScore?.toFixed(1) ?? "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Score distribution */}
            {stats.review_count > 0 && (
              <div className="card p-5">
                <p className="font-mono text-2xs text-dim uppercase tracking-widest mb-4">
                  Score Distribution
                </p>
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = stats.dist[n as 1 | 2 | 3 | 4 | 5];
                  const pct = (count / stats.review_count) * 100;
                  return (
                    <div key={n} className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-2xs text-dim w-4">
                        {n}
                      </span>
                      <div className="flex-1 score-bar-track">
                        <div
                          className="score-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-2xs text-dim w-4 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mini map */}
            {spot.lat && spot.lng && (
              <div className="card overflow-hidden">
                <div className="h-40">
                  <MapContainer
                    center={[spot.lat, spot.lng]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[spot.lat, spot.lng]} icon={markerIcon}>
                      <Popup>
                        <b>{spot.name}</b>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="px-3 py-2 border-t border-border">
                  <p className="font-mono text-2xs text-dim truncate">
                    {spot.address}
                  </p>
                </div>
              </div>
            )}
          </aside>

          {/* ── Main: reviews + similar spots ── */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-2xl text-head">
                  Reviews{" "}
                  <span className="font-mono text-sm text-dim font-normal">
                    ({stats.review_count})
                  </span>
                </h2>
                {user && !hasReviewed && (
                  <Link
                    to="/review/new"
                    state={{ spotId: spot.id }}
                    className="btn-primary btn-sm"
                  >
                    + Add yours
                  </Link>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      likeCount={
                        reviewLikes.filter((l) => l.review_id === rev.id).length
                      }
                      isLiked={likedReviewIds.has(rev.id)}
                      isOwner={user?.id === rev.user_id}
                      isLoggedIn={!!user}
                      onLike={() =>
                        user &&
                        toggleReview.mutate({ uid: user.id, rid: rev.id })
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="No reviews yet"
                  description={`Be the first to rate ${spot.name} for remote work.`}
                  action={
                    user ? (
                      <Link
                        to="/review/new"
                        state={{ spotId: spot.id }}
                        className="btn-primary"
                      >
                        Rate this spot
                      </Link>
                    ) : null
                  }
                />
              )}
            </div>

            {/* Similar spots */}
            {similar.length > 0 && (
              <div>
                <h2 className="font-display text-xl text-head mb-4">
                  Other spots in {spot.city}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {similar.slice(0, 4).map((s) => (
                    <SpotCard key={s.id} spot={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
