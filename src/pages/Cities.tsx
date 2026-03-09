import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, FileText, Users, Star, ArrowRight } from "lucide-react";
import { fetchCityStats } from "@/lib/supabase/queries";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export function Cities() {
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["city-stats"],
    queryFn: fetchCityStats,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-2">
            Explore
          </p>
          <h1 className="font-display text-5xl text-head mb-3">Cities</h1>
          <p className="text-body text-sm max-w-lg">
            Remote work spots reviewed by the community, organised by city.
            SpillTheBeans started in Baguio — expanding nationwide.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {cities.length > 0 ? (
          <>
            {/* Leaderboard table */}
            <div className="mb-10">
              <h2 className="font-display text-xl text-head mb-4">
                Leaderboard
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "#",
                        "City",
                        "Spots",
                        "Reviews",
                        "Contributors",
                        "Avg Score",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 font-mono text-2xs text-dim uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(cities as any[]).map((city, i) => (
                      <tr
                        key={city.city}
                        className="hover:bg-raised transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-muted">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/city/${encodeURIComponent(city.city)}`}
                            className="font-medium text-head group-hover:text-amber transition-colors flex items-center gap-1.5"
                          >
                            {city.city}
                            <ArrowRight
                              size={12}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-body">
                          {city.spot_count}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-body">
                          {city.review_count}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-body">
                          {city.reviewer_count}
                        </td>
                        <td className="py-3 px-4">
                          {city.avg_score ? (
                            <span className="font-mono text-sm font-semibold text-amber">
                              {Number(city.avg_score).toFixed(1)}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-muted">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* City cards grid */}
            <h2 className="font-display text-xl text-head mb-4">
              Browse by city
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cities as any[]).map((city, i) => (
                <Link
                  key={city.city}
                  to={`/city/${encodeURIComponent(city.city)}`}
                  className="card p-5 hover:border-muted transition-colors group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg text-head group-hover:text-amber transition-colors">
                        {city.city}
                      </h3>
                      <p className="font-mono text-2xs text-dim">Philippines</p>
                    </div>
                    {city.avg_score && (
                      <div className="text-right">
                        <div className="font-mono text-lg font-semibold text-amber leading-none">
                          {Number(city.avg_score).toFixed(1)}
                        </div>
                        <div className="font-mono text-2xs text-dim">avg</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-muted" />
                      <span className="font-mono text-2xs text-dim">
                        {city.spot_count} spots
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText size={11} className="text-muted" />
                      <span className="font-mono text-2xs text-dim">
                        {city.review_count} reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={11} className="text-muted" />
                      <span className="font-mono text-2xs text-dim">
                        {city.reviewer_count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <MapPin
              size={32}
              className="text-muted mx-auto mb-4"
              strokeWidth={1.5}
            />
            <p className="font-display text-xl text-head mb-2">No cities yet</p>
            <p className="text-sm text-dim mb-6">
              Add some spots to get started.
            </p>
            <Link to="/submit" className="btn-primary">
              Submit a spot
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
