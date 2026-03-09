import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Users, FileText, Trophy } from "lucide-react";
import {
  fetchCitySpots,
  fetchCityStats,
  fetchCityTopReviewers,
} from "@/lib/supabase/queries";
import { useSpotReviews } from "@/hooks/useReviews";
import { SpotCard } from "@/components/spot/SpotCard";
import { Avatar } from "@/components/ui/Avatar";
import { PageSpinner } from "@/components/ui/Spinner";
import { computeSpotStats, weightedWorkScore, cn } from "@/lib/utils";
import type { DbSpot, DbReview } from "@/types";

export function CityPage() {
  const { city } = useParams<{ city: string }>();
  const cityName = city ? decodeURIComponent(city) : "";

  const { data: spots = [], isLoading: spotsLoading } = useQuery({
    queryKey: ["city-spots", cityName],
    queryFn: () => fetchCitySpots(cityName),
    enabled: !!cityName,
  });
  const { data: allStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["city-stats"],
    queryFn: fetchCityStats,
    staleTime: 5 * 60_000,
  });
  const { data: topReviewers = [] } = useQuery({
    queryKey: ["city-reviewers", cityName],
    queryFn: () => fetchCityTopReviewers(cityName),
    enabled: !!cityName,
  });

  const cityStats = allStats.find((s: any) => s.city === cityName);

  if (spotsLoading || statsLoading) return <PageSpinner />;
  if (!cityName)
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-head mb-4">
          City not found.
        </h2>
        <Link to="/cities" className="btn-secondary">
          All cities
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border bg-raised relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#4a7c3f 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center gap-2 mb-3">
            <Link
              to="/cities"
              className="font-mono text-2xs text-dim hover:text-body transition-colors"
            >
              Cities
            </Link>
            <span className="text-muted">/</span>
            <span className="font-mono text-2xs text-body">{cityName}</span>
          </div>

          <h1 className="font-display text-5xl text-head mb-4">{cityName}</h1>

          {cityStats && (
            <div className="flex flex-wrap gap-8 mt-6">
              {[
                [cityStats.spot_count, "Work spots", MapPin],
                [cityStats.review_count, "Reviews", FileText],
                [cityStats.reviewer_count, "Contributors", Users],
                [cityStats.avg_score ?? "—", "Avg score", Star],
              ].map(([val, label, Icon]: any) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber/10 border border-amber/20 rounded flex items-center justify-center">
                    <Icon size={15} className="text-amber" />
                  </div>
                  <div>
                    <div className="font-mono text-xl font-semibold text-amber leading-none">
                      {val}
                    </div>
                    <div className="font-mono text-2xs text-dim mt-0.5">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-4 gap-10">
          {/* Spots grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-head">Work spots</h2>
              <Link
                to={`/spots`}
                className="font-mono text-xs text-dim hover:text-body transition-colors"
              >
                Browse all →
              </Link>
            </div>

            {spots.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {spots.map((spot, i) => (
                  <div
                    key={spot.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
                  >
                    <SpotCardWithStats spot={spot} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <MapPin
                  size={28}
                  className="text-muted mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="font-display text-lg text-head mb-2">
                  No spots yet in {cityName}
                </p>
                <p className="text-sm text-dim mb-4">
                  Be the first to add one.
                </p>
                <Link to="/submit" className="btn-primary">
                  Submit a spot
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar: top reviewers + submit CTA */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Submit CTA */}
            <div className="card p-5 border-amber/20 bg-amber/5">
              <p className="font-display text-base text-head mb-1">
                Know a spot?
              </p>
              <p className="text-xs text-body mb-3 leading-relaxed">
                Help the {cityName} remote work community grow.
              </p>
              <Link to="/submit" className="btn-primary w-full text-xs">
                Submit a spot
              </Link>
            </div>

            {/* Top reviewers */}
            {topReviewers.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy size={14} className="text-amber" />
                  <p className="font-mono text-2xs text-dim uppercase tracking-widest">
                    Top reviewers
                  </p>
                </div>
                <div className="space-y-3">
                  {topReviewers.slice(0, 7).map((r: any, i: number) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="font-mono text-2xs text-muted w-4">
                        {i + 1}
                      </span>
                      <Avatar
                        name={r.username}
                        imageUrl={r.avatar_url}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-head truncate">
                          {r.username ?? "Anonymous"}
                        </p>
                        <p className="font-mono text-2xs text-dim">
                          {r.count} review{r.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function SpotCardWithStats({ spot }: { spot: DbSpot }) {
  const { data: reviews = [] } = useSpotReviews(spot.id);
  return <SpotCard spot={spot} reviews={reviews} />;
}
