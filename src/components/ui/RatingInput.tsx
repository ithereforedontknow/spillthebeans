import { cn } from "@/lib/utils";
import { RATING_LABELS, RATING_DESCRIPTIONS, type RatingKey } from "@/types";

interface RatingInputProps {
  ratingKey: RatingKey;
  value: number;
  onChange: (v: number) => void;
  error?: string;
}

export function RatingInput({
  ratingKey,
  value,
  onChange,
  error,
}: RatingInputProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-2xs text-dim uppercase tracking-widest">
            {RATING_LABELS[ratingKey]}
          </span>
          <p className="text-xs text-dim mt-0.5">
            {RATING_DESCRIPTIONS[ratingKey]}
          </p>
        </div>
        <span
          className={cn(
            "font-mono text-lg font-semibold leading-none",
            value > 0 ? "text-amber" : "text-muted",
          )}
        >
          {value > 0 ? value : "—"}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-7 rounded-sm transition-all duration-100 border",
              n <= value
                ? "bg-amber border-amber"
                : "bg-muted border-border hover:bg-raised hover:border-dim",
            )}
          />
        ))}
      </div>
      {error && <p className="text-2xs text-red-400 mt-1 font-mono">{error}</p>}
    </div>
  );
}
