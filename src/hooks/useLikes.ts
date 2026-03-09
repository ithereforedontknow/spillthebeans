import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSpotLikesByUser,
  fetchReviewLikesByUser,
  toggleSpotLike,
  toggleReviewLike,
} from "@/lib/supabase/queries";

export const useSpotLikes = (uid?: string) =>
  useQuery({
    queryKey: ["likes", "spots", uid],
    queryFn: () => fetchSpotLikesByUser(uid!),
    enabled: !!uid,
    staleTime: 2 * 60_000,
  });
export const useReviewLikes = (uid?: string) =>
  useQuery({
    queryKey: ["likes", "reviews", uid],
    queryFn: () => fetchReviewLikesByUser(uid!),
    enabled: !!uid,
    staleTime: 2 * 60_000,
  });

export function useToggleSpotLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, sid }: { uid: string; sid: string }) =>
      toggleSpotLike(uid, sid),
    onSuccess: (_, { uid }) =>
      qc.invalidateQueries({ queryKey: ["likes", "spots", uid] }),
  });
}
export function useToggleReviewLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, rid }: { uid: string; rid: string }) =>
      toggleReviewLike(uid, rid),
    onSuccess: (_, { uid }) =>
      qc.invalidateQueries({ queryKey: ["likes", "reviews", uid] }),
  });
}
