import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Star, Users, UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchFeed,
  fetchSuggestedUsers,
  followUser,
  unfollowUser,
  fetchFollows,
} from "@/lib/supabase/queries";
import { Avatar } from "@/components/ui/Avatar";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatRelative, cn } from "@/lib/utils";
import type { FeedItem, SuggestedUser } from "@/types";

export function Feed() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const { data: feed = [], isLoading: feedLoading } = useQuery({
    queryKey: ["feed", user?.id, page],
    queryFn: () => fetchFeed(user!.id, page * 30),
    enabled: !!user,
  });
  const { data: suggested = [] } = useQuery({
    queryKey: ["suggested-users", user?.id],
    queryFn: () => fetchSuggestedUsers(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
  const { data: myFollows = [] } = useQuery({
    queryKey: ["follows", user?.id],
    queryFn: () => fetchFollows(user!.id),
    enabled: !!user,
  });

  const followingIds = new Set(myFollows.map((f: any) => f.following_id));

  const follow = useMutation({
    mutationFn: ({ uid }: { uid: string }) => followUser(user!.id, uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follows", user?.id] });
      qc.invalidateQueries({ queryKey: ["feed", user?.id] });
      qc.invalidateQueries({ queryKey: ["suggested-users", user?.id] });
    },
  });
  const unfollow = useMutation({
    mutationFn: ({ uid }: { uid: string }) => unfollowUser(user!.id, uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follows", user?.id] });
      qc.invalidateQueries({ queryKey: ["feed", user?.id] });
    },
  });

  const toggleFollow = (uid: string) => {
    if (followingIds.has(uid)) unfollow.mutate({ uid });
    else follow.mutate({ uid });
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl text-head mb-3">Your feed</h2>
          <p className="text-dim mb-6">
            Sign in to follow other nomads and see their reviews.
          </p>
          <Link to="/login" className="btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );

  if (feedLoading) return <PageSpinner />;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-display text-4xl text-head">Feed</h1>
          <p className="font-mono text-2xs text-dim mt-1">
            Reviews from people you follow · {myFollows.length} following
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {feed.length > 0 ? (
            <>
              {(feed as FeedItem[]).map((item, i) => (
                <FeedCard
                  key={`${item.id}-${i}`}
                  item={item}
                  isOwnItem={item.actor_id === user.id}
                  isFollowing={followingIds.has(item.actor_id)}
                  onToggleFollow={() => toggleFollow(item.actor_id)}
                />
              ))}
              <div className="flex gap-3 justify-center pt-4">
                {page > 0 && (
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-secondary btn-sm"
                  >
                    ← Newer
                  </button>
                )}
                {feed.length === 30 && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary btn-sm"
                  >
                    Older →
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <Users
                size={32}
                className="text-muted mx-auto mb-4"
                strokeWidth={1.5}
              />
              <p className="font-display text-xl text-head mb-2">
                Your feed is empty
              </p>
              <p className="text-sm text-dim mb-6">
                Follow other reviewers to see their activity here.
              </p>
              <Link to="/spots" className="btn-secondary btn-sm">
                Browse spots & reviewers
              </Link>
            </div>
          )}
        </div>

        {/* Suggested users sidebar */}
        <aside className="space-y-4">
          {suggested.length > 0 && (
            <div className="card p-5">
              <p className="font-mono text-2xs text-dim uppercase tracking-widest mb-4">
                People you might know
              </p>
              <div className="space-y-4">
                {(suggested as SuggestedUser[]).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar
                      name={u.username}
                      imageUrl={u.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-head truncate">
                        {u.username ?? "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {u.city && (
                          <span className="font-mono text-2xs text-dim flex items-center gap-0.5">
                            <MapPin size={9} />
                            {u.city}
                          </span>
                        )}
                        <span className="font-mono text-2xs text-dim">
                          {u.review_count} review
                          {u.review_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollow(u.id)}
                      className={cn(
                        "shrink-0 flex items-center gap-1 font-mono text-2xs px-2 py-1 rounded border transition-colors",
                        followingIds.has(u.id)
                          ? "border-amber/40 text-amber bg-amber/5"
                          : "border-border text-dim hover:border-muted hover:text-body",
                      )}
                    >
                      {followingIds.has(u.id) ? (
                        <>
                          <UserCheck size={11} />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={11} />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Following count card */}
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="font-mono text-2xl font-semibold text-amber">
                  {myFollows.length}
                </div>
                <div className="font-mono text-2xs text-dim mt-0.5">
                  Following
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-amber">
                  {feed.length}
                </div>
                <div className="font-mono text-2xs text-dim mt-0.5">
                  In feed
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FeedCard({
  item,
  isOwnItem,
  isFollowing,
  onToggleFollow,
}: {
  item: FeedItem;
  isOwnItem: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const spotUrl = `/spot/${item.spot_slug ?? item.spot_id}`;
  const long = item.body.length > 200;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="card p-5 animate-fade-up">
      {/* Actor + follow */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={item.actor_name}
            imageUrl={item.actor_avatar}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-head">{item.actor_name}</p>
            <p className="font-mono text-2xs text-dim">
              {formatRelative(item.created_at)}
            </p>
          </div>
        </div>
        {!isOwnItem && (
          <button
            onClick={onToggleFollow}
            className={cn(
              "flex items-center gap-1 font-mono text-2xs px-2.5 py-1 rounded border transition-colors",
              isFollowing
                ? "border-amber/40 text-amber bg-amber/5"
                : "border-border text-dim hover:border-muted hover:text-body",
            )}
          >
            {isFollowing ? (
              <>
                <UserCheck size={11} />
                Following
              </>
            ) : (
              <>
                <UserPlus size={11} />
                Follow
              </>
            )}
          </button>
        )}
      </div>

      {/* Spot link */}
      <Link to={spotUrl} className="group flex items-center gap-1.5 mb-2">
        <MapPin size={11} className="text-muted shrink-0" />
        <span className="font-mono text-xs text-dim group-hover:text-amber transition-colors">
          {item.spot_name}
        </span>
        <span className="font-mono text-2xs text-muted">
          · {item.spot_city}
        </span>
      </Link>

      {/* Score */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-mono text-lg font-semibold text-amber leading-none">
          {Number(item.score).toFixed(1)}
        </span>
        <span className="font-mono text-2xs text-dim">/5</span>
      </div>

      {/* Review body */}
      <p
        className={cn(
          "text-sm text-body leading-relaxed",
          !expanded && long && "line-clamp-3",
        )}
      >
        {item.body}
      </p>
      {long && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-2xs font-mono text-dim hover:text-body mt-1 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* CTA to full review */}
      <div className="mt-3 pt-3 border-t border-border">
        <Link
          to={spotUrl}
          className="font-mono text-2xs text-dim hover:text-amber transition-colors"
        >
          View spot →
        </Link>
      </div>
    </article>
  );
}
