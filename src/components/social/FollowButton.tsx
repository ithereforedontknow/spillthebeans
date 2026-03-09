import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { followUser, unfollowUser, fetchFollows } from "@/lib/supabase/queries";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "md";
  className?: string;
}

export function FollowButton({
  targetUserId,
  size = "md",
  className,
}: FollowButtonProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: follows = [] } = useQuery({
    queryKey: ["follows", user?.id],
    queryFn: () => fetchFollows(user!.id),
    enabled: !!user,
  });

  const isFollowing = follows.some((f: any) => f.following_id === targetUserId);

  const mutOpts = {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follows", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile-social", targetUserId] });
      qc.invalidateQueries({ queryKey: ["feed", user?.id] });
    },
  };

  const follow = useMutation({
    mutationFn: () => followUser(user!.id, targetUserId),
    ...mutOpts,
  });
  const unfollow = useMutation({
    mutationFn: () => unfollowUser(user!.id, targetUserId),
    ...mutOpts,
  });

  if (!user || user.id === targetUserId) return null;

  const isPending = follow.isPending || unfollow.isPending;

  return (
    <button
      onClick={() => (isFollowing ? unfollow.mutate() : follow.mutate())}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 font-mono rounded border transition-colors disabled:opacity-40",
        size === "sm" ? "text-2xs px-2.5 py-1" : "text-xs px-3.5 py-2",
        isFollowing
          ? "border-amber/40 text-amber bg-amber/5 hover:border-red-400/40 hover:text-red-400 hover:bg-red-400/5"
          : "border-border text-dim hover:border-muted hover:text-head",
        className,
      )}
    >
      {isFollowing ? (
        <>
          <UserCheck size={size === "sm" ? 10 : 12} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={size === "sm" ? 10 : 12} />
          Follow
        </>
      )}
    </button>
  );
}
