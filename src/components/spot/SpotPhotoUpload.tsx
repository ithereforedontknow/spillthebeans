import { useState } from "react";
import { Camera } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { updateSpot } from "@/lib/supabase/queries";
import { useQueryClient } from "@tanstack/react-query";
import { SPOTS_KEY } from "@/hooks/useSpots";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface SpotPhotoUploadProps {
  spotId: string;
  currentUrl: string | null;
  isAdmin: boolean;
}

export function SpotPhotoUpload({
  spotId,
  currentUrl,
  isAdmin,
}: SpotPhotoUploadProps) {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleUploaded = async (url: string) => {
    try {
      await updateSpot(spotId, { image_url: url } as any);
      qc.invalidateQueries({ queryKey: [...SPOTS_KEY, spotId] });
      qc.invalidateQueries({ queryKey: SPOTS_KEY });
      toast("Photo updated for this spot.");
      setOpen(false);
    } catch (err: any) {
      toast(err.message ?? "Failed to update spot photo.", "err");
    }
  };

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
        <Camera size={12} />
        {isAdmin ? "Update photo" : "Add / suggest photo"}
      </button>

      {open && (
        <div className="mt-3 card p-4">
          <p className="input-label mb-3">
            {isAdmin
              ? "Replace spot cover photo"
              : "Suggest a photo for this spot"}
          </p>
          <ImageUpload
            spotId={spotId}
            currentUrl={currentUrl}
            onUploaded={handleUploaded}
          />
          {!isAdmin && (
            <p className="font-mono text-2xs text-dim mt-2">
              Your photo will be used as the spot cover immediately.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
