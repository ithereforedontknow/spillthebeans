import { cn } from "@/lib/utils";
import { RATING_LABELS, type RatingKey } from "@/types";

interface ScoreBarProps {
  label?: string;
  ratingKey?: RatingKey;
  value: number; // 0–5
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreBar({
  label,
  ratingKey,
  value,
  showValue = true,
  size = "md",
  className,
}: ScoreBarProps) {
  const displayLabel = label ?? (ratingKey ? RATING_LABELS[ratingKey] : "");
  const pct = Math.min((value / 5) * 100, 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {displayLabel && (
        <span
          className={cn(
            "font-mono text-dim shrink-0",
            size === "sm" ? "text-2xs w-16" : "text-xs w-24",
          )}
        >
          {displayLabel}
        </span>
      )}
      <div className="flex-1 score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {showValue && (
        <span
          className={cn(
            "font-mono font-semibold text-amber shrink-0 tabular-nums",
            size === "sm"
              ? "text-2xs w-6 text-right"
              : "text-xs w-7 text-right",
          )}
        >
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}

interface ScoreGridProps {
  avg_wifi: number;
  avg_power: number;
  avg_noise: number;
  avg_laptop: number;
  avg_coffee: number;
  avg_seating: number;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreGrid({
  size = "md",
  className,
  ...scores
}: ScoreGridProps) {
  const rows: { key: RatingKey; val: number }[] = [
    { key: "wifi_quality", val: scores.avg_wifi },
    { key: "power_outlets", val: scores.avg_power },
    { key: "noise_level", val: scores.avg_noise },
    { key: "laptop_friendliness", val: scores.avg_laptop },
    { key: "coffee_quality", val: scores.avg_coffee },
    { key: "seating_comfort", val: scores.avg_seating },
  ];

  return (
    <div className={cn("space-y-2.5", className)}>
      {rows.map((r) => (
        <ScoreBar key={r.key} ratingKey={r.key} value={r.val} size={size} />
      ))}
    </div>
  );
}
