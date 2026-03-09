import { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, Edit3, Flag, X, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn, formatRelative } from "@/lib/utils";
import { flagReview } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/Toast";
import type { DbReview } from "@/types";

interface ReviewCardProps {
  review: DbReview;
  spotName?: string;
  likeCount: number;
  isLiked: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  onLike: () => void;
  showSpot?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  spotName,
  likeCount,
  isLiked,
  isOwner,
  isLoggedIn,
  onLike,
  showSpot,
  className,
}: ReviewCardProps) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState((review as any).is_flagged ?? false);

  const long = review.body.length > 240;

  const handleFlag = async () => {
    if (!reason.trim()) return;
    setFlagging(true);
    try {
      await flagReview(review.id, reason.trim());
      setFlagged(true);
      setFlagOpen(false);
      setReason("");
      toast("Review reported. Thanks for helping keep SpillTheBeans accurate.");
    } catch (err: any) {
      toast(err.message ?? "Could not submit report.", "err");
    } finally {
      setFlagging(false);
    }
  };

  return (
    <article className={cn("card p-5 animate-fade-up", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={review.username}
            imageUrl={review.avatar_url}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-head">{review.username}</p>
            <p className="font-mono text-2xs text-dim">
              {formatRelative(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-semibold text-amber">
            {review.overall_score.toFixed(1)}
          </span>
          <span className="font-mono text-2xs text-dim">/5</span>
        </div>
      </div>

      {showSpot && spotName && (
        <p className="font-mono text-2xs text-amber mb-2 uppercase tracking-widest">
          {spotName}
        </p>
      )}

      {/* Body */}
      <p
        className={cn(
          "text-sm text-body leading-relaxed",
          !expanded && long && "line-clamp-3",
        )}
      >
        {review.body}
      </p>
      {long && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-2xs font-mono text-dim hover:text-body mt-1 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Score mini-grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 pt-4 border-t border-border">
        <ScoreBar
          ratingKey="wifi_quality"
          value={review.wifi_quality}
          size="sm"
        />
        <ScoreBar
          ratingKey="power_outlets"
          value={review.power_outlets}
          size="sm"
        />
        <ScoreBar
          ratingKey="noise_level"
          value={review.noise_level}
          size="sm"
        />
        <ScoreBar
          ratingKey="laptop_friendliness"
          value={review.laptop_friendliness}
          size="sm"
        />
        <ScoreBar
          ratingKey="coffee_quality"
          value={review.coffee_quality}
          size="sm"
        />
        <ScoreBar
          ratingKey="seating_comfort"
          value={review.seating_comfort}
          size="sm"
        />
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {review.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all",
              isLiked
                ? "border-amber/40 text-amber bg-amber/5"
                : "border-border text-dim hover:border-muted hover:text-body",
            )}
          >
            <ThumbsUp size={12} />
            {likeCount > 0 ? likeCount : "Helpful"}
          </button>

          {/* Flag button — only for logged-in non-owners, not already flagged */}
          {isLoggedIn &&
            !isOwner &&
            (flagged ? (
              <span className="flex items-center gap-1 px-3 py-1.5 font-mono text-xs text-amber/80">
                <Flag size={11} />
                Reported
              </span>
            ) : (
              <button
                onClick={() => setFlagOpen((p) => !p)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all",
                  flagOpen
                    ? "border-amber/40 text-amber bg-amber/5"
                    : "border-border text-dim hover:border-muted hover:text-body",
                )}
              >
                <Flag size={11} />
                {flagOpen ? "Cancel" : "Report"}
              </button>
            ))}
        </div>

        {isOwner && (
          <Link
            to="/review/new"
            state={{ edit: review }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-border text-dim hover:border-muted hover:text-body transition-all"
          >
            <Edit3 size={12} />
            Edit
          </Link>
        )}
      </div>

      {/* Flag / report form */}
      {flagOpen && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <p className="font-mono text-2xs text-dim mb-2">
            What's wrong with this review?
          </p>
          <div className="flex gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Spam, inaccurate, offensive..."
              maxLength={200}
              className="input flex-1 text-sm"
            />
            <button
              onClick={handleFlag}
              disabled={flagging || !reason.trim()}
              className="btn-secondary btn-sm font-mono shrink-0 disabled:opacity-40"
            >
              {flagging ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Flag size={12} />
              )}
              Submit
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
