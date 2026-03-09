import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReviewsBySpot,
  fetchReviewsByUser,
  fetchAllReviewsAdmin,
  createReview,
  updateReview,
  deleteReview,
} from "@/lib/supabase/queries";
import type { ReviewFormData } from "@/types";

export const REVIEWS_KEY = ["reviews"] as const;

export const useSpotReviews = (spotId: string) =>
  useQuery({
    queryKey: [...REVIEWS_KEY, "spot", spotId],
    queryFn: () => fetchReviewsBySpot(spotId),
    enabled: !!spotId,
  });
export const useUserReviews = (uid?: string) =>
  useQuery({
    queryKey: [...REVIEWS_KEY, "user", uid],
    queryFn: () => fetchReviewsByUser(uid!),
    enabled: !!uid,
  });
export const useAdminReviews = () =>
  useQuery({
    queryKey: [...REVIEWS_KEY, "admin"],
    queryFn: fetchAllReviewsAdmin,
  });

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [...REVIEWS_KEY, "spot", v.spot_id] });
      qc.invalidateQueries({ queryKey: [...REVIEWS_KEY, "user", v.user_id] });
    },
  });
}
export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReviewFormData> }) =>
      updateReview(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
