import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSpots } from "@/hooks/useSpots";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { RatingInput } from "@/components/ui/RatingInput";
import { useToast } from "@/components/ui/Toast";
import { reviewSchema } from "@/validation";
import { RATING_KEYS, SUGGESTED_TAGS } from "@/types";
import type { DbReview, RatingKey } from "@/types";
import { cn } from "@/lib/utils";

interface LocationState {
  spotId?: string;
  edit?: DbReview;
}

export function WriteReview() {
  const { user, profile } = useAuth();
  const { data: spots = [] } = useSpots();
  const create = useCreateReview();
  const update = useUpdateReview();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const toast = useToast();

  const editing = state?.edit;
  const [spotId, setSpotId] = useState(state?.spotId ?? editing?.spot_id ?? "");
  const [spotQ, setSpotQ] = useState("");
  const [body, setBody] = useState(editing?.body ?? "");
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    wifi_quality: editing?.wifi_quality ?? 0,
    power_outlets: editing?.power_outlets ?? 0,
    noise_level: editing?.noise_level ?? 0,
    laptop_friendliness: editing?.laptop_friendliness ?? 0,
    coffee_quality: editing?.coffee_quality ?? 0,
    seating_comfort: editing?.seating_comfort ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSpot = spots.find((s) => s.id === spotId);
  const filteredSpots = spots.filter((s) =>
    s.name.toLowerCase().includes(spotQ.toLowerCase()),
  );

  const allRated = RATING_KEYS.every((k) => ratings[k] > 0);
  const canSubmit = spotId && body.trim().length >= 30 && allRated;
  const isPending = create.isPending || update.isPending;

  const addTag = (t: string) => {
    const clean = t.trim();
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags((p) => [...p, clean]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    const payload = { spot_id: spotId, body: body.trim(), tags, ...ratings };
    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        e[i.path[0] as string] = i.message;
      });
      setErrors(e);
      return;
    }
    setErrors({});
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
        toast("Review updated.");
      } else {
        await create.mutateAsync({
          ...payload,
          user_id: user!.id,
          username:
            profile?.username ?? user!.email?.split("@")[0] ?? "Anonymous",
          avatar_url: profile?.avatar_url ?? null,
        });
        toast("Review published.");
      }
      navigate(
        selectedSpot
          ? `/spot/${selectedSpot.slug ?? selectedSpot.id}`
          : "/spots",
      );
    } catch (err: any) {
      toast(err.message ?? "Something went wrong", "err");
    }
  };

  return (
    <div className="min-h-screen bg-raised">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={
              selectedSpot
                ? `/spot/${selectedSpot.slug ?? selectedSpot.id}`
                : "/spots"
            }
            className="btn-ghost btn-sm mb-4 -ml-2 font-mono"
          >
            <ArrowLeft size={13} />
            Back
          </Link>
          <h1 className="font-display text-3xl text-head">
            {editing ? "Edit review" : "Rate a work spot"}
          </h1>
          <p className="text-sm text-dim mt-1">
            Rate each dimension 1–5. Your ratings help other nomads.
          </p>
        </div>

        <div className="space-y-5">
          {/* Spot selector */}
          <section className="card p-5">
            <p className="input-label">Spot</p>
            {selectedSpot ? (
              <div className="flex items-center justify-between p-3 bg-raised border border-amber/20 rounded">
                <div>
                  <p className="text-sm font-medium text-head">
                    {selectedSpot.name}
                  </p>
                  <p className="font-mono text-2xs text-dim">
                    {selectedSpot.city}
                  </p>
                </div>
                {!editing && (
                  <button
                    onClick={() => {
                      setSpotId("");
                      setSpotQ("");
                    }}
                    className="text-dim hover:text-body"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  value={spotQ}
                  onChange={(e) => setSpotQ(e.target.value)}
                  placeholder="Search for a spot..."
                  className="input"
                />
                {spotQ && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-2xl z-20 max-h-48 overflow-y-auto">
                    {filteredSpots.length > 0 ? (
                      filteredSpots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSpotId(s.id);
                            setSpotQ("");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-raised transition-colors"
                        >
                          <p className="text-sm text-head">{s.name}</p>
                          <p className="font-mono text-2xs text-dim">
                            {s.city}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-dim">
                        No spots found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.spot_id && (
              <p className="font-mono text-2xs text-red-400 mt-1">
                {errors.spot_id}
              </p>
            )}
          </section>

          {/* Work ratings */}
          <section className="card p-5">
            <p className="input-label mb-4">Work Ratings</p>
            <div className="space-y-6">
              {RATING_KEYS.map((key) => (
                <RatingInput
                  key={key}
                  ratingKey={key}
                  value={ratings[key]}
                  onChange={(v) => setRatings((p) => ({ ...p, [key]: v }))}
                  error={errors[key]}
                />
              ))}
            </div>
            {!allRated && (
              <p className="font-mono text-2xs text-dim mt-4">
                Rate all 6 dimensions to continue.
              </p>
            )}
          </section>

          {/* Written review */}
          <section className="card p-5">
            <p className="input-label">Your review</p>
            <div className="relative">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your experience working here. WiFi reliability, seat availability, power access, noise..."
                rows={5}
                maxLength={1000}
                className="input resize-none pb-7"
              />
              <span
                className={cn(
                  "absolute right-3 bottom-3 font-mono text-2xs",
                  body.length > 900 ? "text-amber" : "text-dim",
                )}
              >
                {body.length}/1000
              </span>
            </div>
            {errors.body && (
              <p className="font-mono text-2xs text-red-400 mt-1">
                {errors.body}
              </p>
            )}
          </section>

          {/* Tags */}
          <section className="card p-5">
            <p className="input-label">
              Tags{" "}
              <span className="normal-case font-sans font-normal text-dim text-xs">
                (optional, max 8)
              </span>
            </p>
            <div className="flex gap-2 mb-3">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Type and press Enter..."
                maxLength={32}
                className="input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="btn-secondary btn-sm font-mono"
              >
                Add
              </button>
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t))
                .slice(0, 8)
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="tag cursor-pointer hover:border-dim hover:text-body transition-colors"
                  >
                    + {t}
                  </button>
                ))}
            </div>
            {/* Selected */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 tag">
                    {t}
                    <button
                      onClick={() => setTags((p) => p.filter((x) => x !== t))}
                      className="hover:text-body"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="btn-primary w-full py-3 text-base disabled:opacity-40"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending
              ? editing
                ? "Updating..."
                : "Publishing..."
              : editing
                ? "Update Review"
                : "Publish Review"}
          </button>

          {!canSubmit && !isPending && (
            <p className="font-mono text-2xs text-dim text-center">
              {!spotId
                ? "Select a spot."
                : !allRated
                  ? "Rate all 6 dimensions."
                  : "Write at least 30 characters."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
