import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchSpotPhotos,
  addSpotPhoto,
  deleteSpotPhoto,
  setFeaturedPhoto,
  uploadSpotImage,
} from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { DbSpotPhoto } from "@/types";

interface SpotPhotoGalleryProps {
  spotId: string;
}

export function SpotPhotoGallery({ spotId }: SpotPhotoGalleryProps) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", spotId],
    queryFn: () => fetchSpotPhotos(spotId),
    enabled: !!spotId,
  });

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [captionFor, setCaptionFor] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["photos", spotId] });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Max 5 MB.", "err");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSpotImage(file, spotId);
      await addSpotPhoto({ spot_id: spotId, uploaded_by: user.id, url });
      invalidate();
      toast("Photo added.");
    } catch (err: any) {
      toast(err.message ?? "Upload failed.", "err");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpotPhoto(id);
      invalidate();
      toast("Photo removed.");
    } catch (err: any) {
      toast(err.message ?? "Failed.", "err");
    }
  };

  const handleFeature = async (photoId: string) => {
    try {
      await setFeaturedPhoto(photoId, spotId);
      invalidate();
      toast("Cover photo updated.");
    } catch (err: any) {
      toast(err.message ?? "Failed.", "err");
    }
  };

  const prev = () =>
    setLightbox((i) => (i !== null ? Math.max(0, i - 1) : null));
  const next = () =>
    setLightbox((i) =>
      i !== null ? Math.min(photos.length - 1, i + 1) : null,
    );

  if (photos.length === 0 && !user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-2xs text-dim uppercase tracking-widest">
          Photos {photos.length > 0 && `(${photos.length})`}
        </p>
        {user && (
          <label
            className={cn(
              "flex items-center gap-1.5 font-mono text-xs border rounded px-3 py-1 cursor-pointer transition-colors",
              uploading
                ? "border-border text-dim pointer-events-none opacity-60"
                : "border-border text-dim hover:border-muted hover:text-body",
            )}
          >
            <Plus size={11} />
            {uploading ? "Uploading..." : "Add photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={photo.url}
                alt={photo.caption ?? "Spot photo"}
                onClick={() => setLightbox(idx)}
                className="w-full h-full object-cover rounded cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
              />
              {/* Featured badge */}
              {photo.is_featured && (
                <div className="absolute top-1 left-1 bg-amber/90 rounded px-1 py-0.5">
                  <Star size={9} className="text-base fill-current" />
                </div>
              )}
              {/* Admin/owner controls */}
              {(isAdmin || photo.uploaded_by === user?.id) && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAdmin && !photo.is_featured && (
                    <button
                      onClick={() => handleFeature(photo.id)}
                      title="Set as cover"
                      className="w-6 h-6 bg-base/80 rounded flex items-center justify-center text-amber hover:bg-base transition-colors"
                    >
                      <Star size={10} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    title="Remove photo"
                    className="w-6 h-6 bg-base/80 rounded flex items-center justify-center text-red-500 hover:bg-base transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-2xs text-dim/60 py-3 text-center border border-dashed border-border rounded">
          No photos yet — be the first to add one
        </p>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-head/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-base/60 hover:text-base"
          >
            <X size={20} />
          </button>
          {lightbox > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-base/60 hover:text-base bg-head/40 rounded p-2"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-base/60 hover:text-base bg-head/40 rounded p-2"
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3"
          >
            <img
              src={photos[lightbox].url}
              alt={photos[lightbox].caption ?? ""}
              className="max-h-[78vh] rounded-lg object-contain"
            />
            {photos[lightbox].caption && (
              <p className="font-mono text-xs text-base/60">
                {photos[lightbox].caption}
              </p>
            )}
            <p className="font-mono text-2xs text-base/40">
              {lightbox + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
