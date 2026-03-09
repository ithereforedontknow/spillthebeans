import { useState } from "react";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { reportSpotUpdate } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/Toast";
import { UPDATE_CATEGORY_LABELS, type UpdateCategory } from "@/types";
import { cn } from "@/lib/utils";

interface SpotUpdateFlagProps {
  spotId: string;
  userId: string;
}

export function SpotUpdateFlag({ spotId, userId }: SpotUpdateFlagProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<UpdateCategory | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!category) return;
    setSaving(true);
    try {
      await reportSpotUpdate({
        spot_id: spotId,
        reported_by: userId,
        category,
        note,
      });
      setSubmitted(true);
      toast("Thanks for the report — we'll look into it.");
    } catch (err: any) {
      toast(err.message ?? "Failed to submit report.", "err");
    } finally {
      setSaving(false);
    }
  };

  if (submitted)
    return (
      <div className="flex items-center gap-2 text-amber font-mono text-xs py-2">
        <CheckCircle size={13} />
        Report submitted. Thanks for keeping info accurate.
      </div>
    );

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 font-mono text-xs border rounded px-3 py-1.5 transition-colors w-full justify-between",
          open
            ? "border-amber/40 text-amber bg-amber/5"
            : "border-border text-dim hover:border-muted hover:text-body",
        )}
      >
        <span className="flex items-center gap-1.5">
          <AlertCircle size={12} />
          Something's wrong here
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 card p-4 space-y-3 animate-fade-in">
          <p className="font-mono text-2xs text-dim uppercase tracking-widest">
            What's the issue?
          </p>

          <div className="grid grid-cols-1 gap-1.5">
            {(
              Object.entries(UPDATE_CATEGORY_LABELS) as [
                UpdateCategory,
                string,
              ][]
            ).map(([key, label]) => (
              <label
                key={key}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded border cursor-pointer transition-colors text-sm",
                  category === key
                    ? "border-amber/40 bg-amber/5 text-head"
                    : "border-border text-body hover:border-muted",
                )}
              >
                <input
                  type="radio"
                  name="update-category"
                  value={key}
                  checked={category === key}
                  onChange={() => setCategory(key)}
                  className="accent-amber"
                />
                {label}
              </label>
            ))}
          </div>

          <div>
            <label className="input-label">Additional notes (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Any extra context..."
              maxLength={400}
              className="input resize-none text-sm"
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
              disabled={!category || saving}
              className="btn-primary btn-sm disabled:opacity-40"
            >
              {saving ? "Sending..." : "Submit report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
