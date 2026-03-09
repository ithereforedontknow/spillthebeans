import { useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { suggestHours } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/Toast";
import { DAY_LABELS, type DayKey } from "@/types";
import { cn } from "@/lib/utils";

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

interface HoursSuggestionProps {
  spotId: string;
  userId: string;
  currentHours?: Record<string, string | null> | null;
}

export function HoursSuggestion({
  spotId,
  userId,
  currentHours,
}: HoursSuggestionProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  // Init hours state from current or empty
  const [hours, setHours] = useState<Record<DayKey, string | null>>(() => {
    const init: Record<string, string | null> = {};
    DAYS.forEach((d) => {
      init[d] = currentHours?.[d] ?? null;
    });
    return init as Record<DayKey, string | null>;
  });
  const [closed, setClosed] = useState<Record<DayKey, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DAYS.forEach((d) => {
      init[d] = currentHours?.[d] === null;
    });
    return init as Record<DayKey, boolean>;
  });

  const handleSubmit = async () => {
    setSaving(true);
    const hoursJson: Record<string, string | null> = {};
    DAYS.forEach((d) => {
      hoursJson[d] = closed[d] ? null : hours[d] || null;
    });
    try {
      await suggestHours({
        spot_id: spotId,
        suggested_by: userId,
        hours_json: hoursJson,
        note,
      });
      setSubmitted(true);
      toast("Hours suggestion submitted — thanks!");
    } catch (err: any) {
      toast(err.message ?? "Failed to submit.", "err");
    } finally {
      setSaving(false);
    }
  };

  if (submitted)
    return (
      <div className="flex items-center gap-2 text-amber font-mono text-xs py-2">
        <CheckCircle size={13} />
        Hours suggestion submitted.
      </div>
    );

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 font-mono text-xs border rounded px-3 py-1.5 transition-colors",
          open
            ? "border-amber/40 text-amber bg-amber/5"
            : "border-border text-dim hover:border-muted hover:text-body",
        )}
      >
        <Clock size={12} />
        Suggest correct hours
      </button>

      {open && (
        <div className="mt-3 card p-4 space-y-3 animate-fade-in">
          <p className="font-mono text-2xs text-dim uppercase tracking-widest">
            Suggest opening hours
          </p>
          <p className="text-xs text-dim">
            Use 24h format, e.g. <span className="font-mono">08:00-22:00</span>
          </p>

          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="font-mono text-xs text-dim w-8">
                  {DAY_LABELS[day]}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closed[day]}
                    onChange={(e) =>
                      setClosed((p) => ({ ...p, [day]: e.target.checked }))
                    }
                    className="accent-amber w-3 h-3"
                  />
                  <span className="font-mono text-2xs text-dim">Closed</span>
                </label>
                {!closed[day] && (
                  <input
                    value={hours[day] ?? ""}
                    onChange={(e) =>
                      setHours((p) => ({ ...p, [day]: e.target.value }))
                    }
                    placeholder="08:00-22:00"
                    className="input font-mono text-xs py-1 flex-1"
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="input-label">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Source of info, e.g. visited last week"
              className="input text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary btn-sm"
            >
              {saving ? "Submitting..." : "Submit suggestion"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
