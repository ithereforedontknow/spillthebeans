import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserPassport,
  fetchVisitedSpots,
  fetchPassportLeaderboard,
} from "@/lib/supabase/queries";
import { PageSpinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  BADGE_TIERS,
  BADGE_REQUIREMENTS,
  BADGE_DESCRIPTIONS,
  type BadgeTier,
} from "@/types";
import { MapPin, Lock, Trophy } from "lucide-react";

// Badge visual config
const BADGE_CONFIG: Record<
  BadgeTier,
  { color: string; bg: string; border: string; glyph: string }
> = {
  Newcomer: {
    color: "text-dim",
    bg: "bg-raised",
    border: "border-border",
    glyph: "○",
  },
  Explorer: {
    color: "text-body",
    bg: "bg-card",
    border: "border-muted",
    glyph: "◎",
  },
  Regular: {
    color: "text-amber",
    bg: "bg-amber/5",
    border: "border-amber/30",
    glyph: "◉",
  },
  Grinder: {
    color: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/50",
    glyph: "★",
  },
  Veteran: {
    color: "text-amber",
    bg: "bg-amber/15",
    border: "border-amber",
    glyph: "✦",
  },
};

export function Passport() {
  const { user, profile } = useAuth();

  const { data: passport, isLoading: passportLoading } = useQuery({
    queryKey: ["passport", user?.id],
    queryFn: () => fetchUserPassport(user!.id),
    enabled: !!user,
  });

  const { data: visited = [], isLoading: visitedLoading } = useQuery({
    queryKey: ["visited", user?.id],
    queryFn: () => fetchVisitedSpots(user!.id),
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["passport", "leaderboard"],
    queryFn: fetchPassportLeaderboard,
    staleTime: 5 * 60_000,
  });

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl text-head mb-3">
            Your Coffee Passport
          </h2>
          <p className="text-dim mb-6">
            Sign in to track the spots you've worked from.
          </p>
          <Link to="/login" className="btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );

  if (passportLoading || visitedLoading) return <PageSpinner />;

  const spotsVisited = passport?.spots_visited ?? 0;
  const currentTier = (passport?.badge_tier ?? "Newcomer") as BadgeTier;
  const nextTier = BADGE_TIERS[BADGE_TIERS.indexOf(currentTier) + 1] as
    | BadgeTier
    | undefined;
  const nextTarget = nextTier ? BADGE_REQUIREMENTS[nextTier] : null;
  const progress = nextTarget ? (spotsVisited / nextTarget) * 100 : 100;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border bg-raised relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#4a7c3f 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar
              name={profile?.username ?? user.email}
              imageUrl={profile?.avatar_url}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-1">
                Coffee Passport
              </p>
              <h1 className="font-display text-3xl text-head">
                {profile?.username ?? user.email?.split("@")[0]}
              </h1>

              {/* Current badge */}
              <div className="flex items-center gap-2 mt-3">
                <BadgePill tier={currentTier} />
                {passport?.avg_score_given && (
                  <span className="font-mono text-xs text-dim">
                    Avg score given:{" "}
                    <span className="text-amber">
                      {Number(passport.avg_score_given).toFixed(1)}
                    </span>
                  </span>
                )}
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono text-2xs text-dim">
                      Progress to <span className="text-body">{nextTier}</span>
                    </span>
                    <span className="font-mono text-2xs text-amber">
                      {spotsVisited} / {nextTarget}
                    </span>
                  </div>
                  <div className="score-bar-track h-1.5">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="font-mono text-2xs text-dim mt-1">
                    {nextTarget! - spotsVisited} more{" "}
                    {nextTarget! - spotsVisited === 1 ? "spot" : "spots"} to
                    reach {nextTier}
                  </p>
                </div>
              )}
              {!nextTier && (
                <p className="font-mono text-xs text-amber mt-2">
                  Maximum tier reached.
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                [spotsVisited.toString(), "Spots visited"],
                [(passport?.total_reviews ?? 0).toString(), "Reviews written"],
                [
                  passport?.avg_score_given
                    ? Number(passport.avg_score_given).toFixed(1)
                    : "—",
                  "Avg score",
                ],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-mono text-2xl font-semibold text-amber">
                    {v}
                  </div>
                  <div className="font-mono text-2xs text-dim mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Badge tiers */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-display text-xl text-head mb-4">Badge Tiers</h2>
          {BADGE_TIERS.map((tier) => {
            const req = BADGE_REQUIREMENTS[tier];
            const earned = spotsVisited >= req;
            const current = tier === currentTier;
            const cfg = BADGE_CONFIG[tier];

            return (
              <div
                key={tier}
                className={cn(
                  "card p-4 flex items-center gap-4 transition-all",
                  current && "border-amber/30",
                  !earned && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl border shrink-0",
                    earned ? cfg.bg : "bg-raised",
                    earned ? cfg.border : "border-border",
                  )}
                >
                  {earned ? (
                    <span className={cfg.color}>{cfg.glyph}</span>
                  ) : (
                    <Lock size={14} className="text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "font-medium",
                        earned ? "text-head" : "text-dim",
                      )}
                    >
                      {tier}
                    </p>
                    {current && (
                      <span className="font-mono text-2xs bg-amber/10 text-amber border border-amber/30 rounded px-1.5 py-0.5">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-2xs text-dim">
                    {BADGE_DESCRIPTIONS[tier]}
                  </p>
                </div>
                <span className="font-mono text-xs text-dim shrink-0">
                  {req === 0 ? "Free" : `${req}+ spots`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Visited spots grid + leaderboard */}
        <div className="lg:col-span-2 space-y-8">
          {/* Visited spots */}
          <div>
            <h2 className="font-display text-xl text-head mb-4">
              Spots Visited
              <span className="font-mono text-sm text-dim font-normal ml-2">
                ({spotsVisited})
              </span>
            </h2>
            {visited.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visited.map((v: any) => {
                  const spot = v.spots;
                  if (!spot) return null;
                  const img =
                    spot.image_url ??
                    `https://picsum.photos/seed/${spot.id}/240/160`;
                  return (
                    <Link
                      key={v.spot_id}
                      to={`/spot/${spot.slug ?? spot.id}`}
                      className="group card overflow-hidden hover:border-muted transition-colors"
                    >
                      <div className="aspect-video bg-raised overflow-hidden">
                        <img
                          src={img}
                          alt={spot.name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-head truncate group-hover:text-amber transition-colors">
                          {spot.name}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1 text-dim">
                            <MapPin size={10} />
                            <span className="font-mono text-2xs truncate">
                              {spot.city}
                            </span>
                          </div>
                          <span className="font-mono text-2xs text-amber font-semibold">
                            {v.overall_score?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <MapPin
                  size={24}
                  className="text-muted mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="font-display text-lg text-head mb-1">
                  No spots yet
                </p>
                <p className="text-sm text-dim mb-4">
                  Review a spot to start your passport.
                </p>
                <Link to="/spots" className="btn-primary btn-sm">
                  Browse spots
                </Link>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div>
              <h2 className="font-display text-xl text-head mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-amber" />
                Community Leaderboard
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-4 font-mono text-2xs text-dim uppercase tracking-widest">
                        #
                      </th>
                      <th className="text-left py-2.5 px-4 font-mono text-2xs text-dim uppercase tracking-widest">
                        User
                      </th>
                      <th className="text-left py-2.5 px-4 font-mono text-2xs text-dim uppercase tracking-widest">
                        Badge
                      </th>
                      <th className="text-right py-2.5 px-4 font-mono text-2xs text-dim uppercase tracking-widest">
                        Spots
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.slice(0, 10).map((entry: any, i: number) => (
                      <tr
                        key={entry.id}
                        className={cn(
                          "hover:bg-raised transition-colors",
                          entry.id === user.id && "bg-amber/5",
                        )}
                      >
                        <td className="py-3 px-4 font-mono text-xs text-dim w-8">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={entry.username}
                              imageUrl={entry.avatar_url}
                              size="xs"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                entry.id === user.id
                                  ? "text-amber font-medium"
                                  : "text-body",
                              )}
                            >
                              {entry.username ?? "Anonymous"}
                              {entry.id === user.id && " (you)"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <BadgePill
                            tier={entry.badge_tier as BadgeTier}
                            compact
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-amber">
                          {entry.spots_visited}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BadgePill({ tier, compact }: { tier: BadgeTier; compact?: boolean }) {
  const cfg = BADGE_CONFIG[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono rounded border",
        compact ? "text-2xs px-1.5 py-0.5" : "text-xs px-2.5 py-1",
        cfg.bg,
        cfg.border,
        cfg.color,
      )}
    >
      <span>{cfg.glyph}</span>
      {tier}
    </span>
  );
}
