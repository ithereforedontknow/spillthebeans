import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserReviews } from "@/hooks/useReviews";
import { useSpotLikes } from "@/hooks/useLikes";
import { useSpots } from "@/hooks/useSpots";
import { Avatar } from "@/components/ui/Avatar";
import { ReviewCard } from "@/components/review/ReviewCard";
import { SpotCard } from "@/components/spot/SpotCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { FileText, Bookmark, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "reviews" | "saved";

export function Profile() {
  const { user, profile, loading } = useAuth();
  const { data: reviews = [] } = useUserReviews(user?.id);
  const { data: spotLikes = [] } = useSpotLikes(user?.id);
  const { data: spots = [] } = useSpots();
  const [tab, setTab] = useState<Tab>("reviews");

  if (loading) return <PageSpinner />;
  if (!user)
    return (
      <div className="text-center py-20">
        <Link to="/login" className="btn-primary">
          Sign in
        </Link>
      </div>
    );

  const savedSpots = spots.filter((s) =>
    spotLikes.some((l) => l.spot_id === s.id),
  );
  const avgScore = reviews.length
    ? (
        reviews.reduce((s, r) => s + r.overall_score, 0) / reviews.length
      ).toFixed(1)
    : "—";

  const tabs = [
    {
      id: "reviews" as Tab,
      label: "Reviews",
      count: reviews.length,
      icon: FileText,
    },
    {
      id: "saved" as Tab,
      label: "Saved",
      count: savedSpots.length,
      icon: Bookmark,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar
              name={profile?.username ?? user.email}
              imageUrl={profile?.avatar_url}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl text-head">
                {profile?.username ?? user.email?.split("@")[0]}
              </h1>
              {profile?.work_type && (
                <p className="font-mono text-2xs text-amber mt-1 uppercase tracking-widest">
                  {profile.work_type}
                </p>
              )}
              {profile?.city && (
                <div className="flex items-center gap-1.5 text-dim text-sm mt-1">
                  <MapPin size={12} />
                  {profile.city}
                </div>
              )}
              {profile?.bio && (
                <p className="text-sm text-body mt-2 max-w-md">{profile.bio}</p>
              )}
              <Link
                to="/settings"
                className="btn-secondary btn-sm mt-3 font-mono"
              >
                Edit profile
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-border max-w-xs">
            {[
              [reviews.length.toString(), "Reviews"],
              [
                new Set(reviews.map((r) => r.spot_id)).size.toString(),
                "Spots visited",
              ],
              [avgScore.toString(), "Avg score given"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-mono text-xl font-semibold text-amber">
                  {v}
                </div>
                <div className="font-mono text-2xs text-dim mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 border-b border-border bg-base/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors",
                tab === id ? "bg-card text-head" : "text-dim hover:text-body",
              )}
            >
              <Icon size={13} />
              {label}
              <span
                className={cn(
                  "font-mono text-2xs px-1.5 py-0.5 rounded",
                  tab === id ? "bg-muted text-body" : "bg-raised text-dim",
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === "reviews" &&
          (reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  spotName={(r as any).spots?.name}
                  showSpot
                  likeCount={0}
                  isLiked={false}
                  isOwner={true}
                  onLike={() => {}}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No reviews yet"
              description="Rate a work spot and help fellow nomads."
              action={
                <Link to="/spots" className="btn-primary">
                  Browse spots
                </Link>
              }
            />
          ))}
        {tab === "saved" &&
          (savedSpots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedSpots.map((s) => (
                <SpotCard key={s.id} spot={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="No saved spots"
              description="Bookmark spots you want to work from."
              action={
                <Link to="/spots" className="btn-primary">
                  Explore spots
                </Link>
              }
            />
          ))}
      </div>
    </div>
  );
}
