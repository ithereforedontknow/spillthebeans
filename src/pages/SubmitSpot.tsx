import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Wifi, Zap, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { submitSpot } from "@/lib/supabase/queries";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { PH_CITIES, PRICE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { uploadSpotImage } from "@/lib/supabase/queries";

const EMPTY = {
  name: "",
  address: "",
  city: "",
  description: "",
  lat: "",
  lng: "",
  image_url: "",
  google_maps_url: "",
  opening_hours: "",
  price_range: "",
  has_wifi: true,
  has_power: true,
};

export function SubmitSpot() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const f =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city) e.city = "City is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    if (!user || !profile) return;

    setSaving(true);
    try {
      await submitSpot({
        ...form,
        submitted_by: user.id,
        submitter_name:
          profile.username ?? user.email?.split("@")[0] ?? "Anonymous",
      });
      setSuccess(true);
    } catch (err: any) {
      toast(err.message ?? "Failed to submit spot.", "err");
    } finally {
      setSaving(false);
    }
  };

  if (success)
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <CheckCircle
            size={40}
            className="text-amber mx-auto mb-4"
            strokeWidth={1.5}
          />
          <h2 className="font-display text-2xl text-head mb-2">
            Spot submitted!
          </h2>
          <p className="text-sm text-body mb-6 leading-relaxed">
            Thanks for contributing to SpillTheBeans. Your submission will be
            reviewed by our team and published once verified.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/spots" className="btn-secondary">
              Browse spots
            </Link>
            <button
              onClick={() => {
                setForm(EMPTY);
                setSuccess(false);
              }}
              className="btn-primary"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-2">
            Community
          </p>
          <h1 className="font-display text-4xl text-head mb-2">
            Submit a spot
          </h1>
          <p className="text-sm text-body">
            Know a great work spot that's not on SpillTheBeans yet? Submit it
            and help other remote workers discover it. All submissions are
            reviewed before publishing.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Photo */}
        <div className="card p-6">
          <h2 className="font-display text-lg text-head mb-4">Photo</h2>
          <ImageUpload
            spotId={`submission-${user?.id ?? "anon"}`}
            currentUrl={form.image_url || null}
            onUploaded={(url) => setForm((p) => ({ ...p, image_url: url }))}
          />
          <p className="font-mono text-2xs text-dim mt-2">
            Optional but strongly encouraged.
          </p>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg text-head">Basic info</h2>

          <div>
            <label className="input-label">Spot name *</label>
            <input
              value={form.name}
              onChange={f("name")}
              placeholder="e.g. Craft Coffee Baguio"
              className="input"
            />
            {errors.name && (
              <p className="font-mono text-2xs text-red-500 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">City *</label>
              <select value={form.city} onChange={f("city")} className="input">
                <option value="">Select city</option>
                {PH_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="font-mono text-2xs text-red-500 mt-1">
                  {errors.city}
                </p>
              )}
            </div>
            <div>
              <label className="input-label">Price range</label>
              <select
                value={form.price_range}
                onChange={f("price_range")}
                className="input"
              >
                <option value="">Unknown</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {PRICE_LABELS[n]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Address *</label>
            <input
              value={form.address}
              onChange={f("address")}
              placeholder="Street address"
              className="input"
            />
            {errors.address && (
              <p className="font-mono text-2xs text-red-500 mt-1">
                {errors.address}
              </p>
            )}
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea
              value={form.description}
              onChange={f("description")}
              rows={3}
              placeholder="What makes this a good work spot? Any tips?"
              className="input resize-none"
            />
          </div>

          <div>
            <label className="input-label">Opening hours</label>
            <input
              value={form.opening_hours}
              onChange={f("opening_hours")}
              placeholder="e.g. 7am–10pm daily"
              className="input"
            />
          </div>

          <div>
            <label className="input-label">Google Maps URL</label>
            <input
              value={form.google_maps_url}
              onChange={f("google_maps_url")}
              placeholder="https://maps.google.com/..."
              className="input"
            />
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg text-head">
            Location coordinates
          </h2>
          <p className="text-sm text-dim -mt-2">
            Optional but helps with the map. Find these in Google Maps.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Latitude</label>
              <input
                value={form.lat}
                onChange={f("lat")}
                placeholder="16.4023"
                className="input font-mono"
              />
            </div>
            <div>
              <label className="input-label">Longitude</label>
              <input
                value={form.lng}
                onChange={f("lng")}
                placeholder="120.5960"
                className="input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card p-6">
          <h2 className="font-display text-lg text-head mb-4">Amenities</h2>
          <div className="flex gap-6">
            {(
              [
                ["has_wifi", "Has WiFi", Wifi],
                ["has_power", "Has Power Outlets", Zap],
              ] as const
            ).map(([key, label, Icon]) => (
              <label
                key={key}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors flex-1",
                  form[key]
                    ? "border-amber/40 bg-amber/5 text-head"
                    : "border-border text-dim hover:border-muted",
                )}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.checked }))
                  }
                  className="accent-amber w-3.5 h-3.5"
                />
                <Icon size={14} className={form[key] ? "text-amber" : ""} />
                <span className="font-mono text-xs">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-2xs text-dim max-w-xs">
            Your name will be credited as the contributor once the spot is
            published.
          </p>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? "Submitting..." : "Submit spot"}
          </button>
        </div>
      </div>
    </div>
  );
}
