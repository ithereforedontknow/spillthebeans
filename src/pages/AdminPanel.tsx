import { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  FileText,
  Coffee,
  Flag,
  ShieldOff,
  AlertTriangle,
} from "lucide-react";
import {
  useSpotsAdmin,
  useCreateSpot,
  useUpdateSpot,
  useDeleteSpot,
} from "@/hooks/useSpots";
import { useAdminReviews, useDeleteReview } from "@/hooks/useReviews";
import { useToast } from "@/components/ui/Toast";
import { PageSpinner } from "@/components/ui/Spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { spotSchema } from "@/validation";
import {
  PH_CITIES,
  PRICE_LABELS,
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/types";
import type { DbSpot, SpotFormData } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { unflagReview, fetchFlaggedReviews } from "@/lib/supabase/queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REVIEWS_KEY } from "@/hooks/useReviews";

const EMPTY: SpotFormData = {
  name: "",
  address: "",
  city: "",
  description: "",
  lat: "",
  lng: "",
  image_url: "",
  google_maps_url: "",
  opening_hours: "",
  hours_json: "",
  price_range: "",
  slug: "",
  has_wifi: true,
  has_power: true,
  is_published: true,
  amenity_no_time_limit: false,
  amenity_standing_desk: false,
  amenity_outdoor_seating: false,
  amenity_open_24h: false,
  amenity_reservable: false,
  amenity_pet_friendly: false,
};

type Tab = "spots" | "reviews" | "flagged" | "stats";

export function AdminPanel() {
  const { data: spots = [], isLoading: spotsLoading } = useSpotsAdmin();
  const { data: reviews = [], isLoading: revLoading } = useAdminReviews();
  const { data: flagged = [], isLoading: flaggedLoading } = useQuery({
    queryKey: [...REVIEWS_KEY, "flagged"],
    queryFn: fetchFlaggedReviews,
  });
  const create = useCreateSpot();
  const update = useUpdateSpot();
  const del = useDeleteSpot();
  const delReview = useDeleteReview();
  const toast = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("spots");
  const [modal, setModal] = useState<{ open: boolean; spot: DbSpot | null }>({
    open: false,
    spot: null,
  });
  const [form, setForm] = useState<SpotFormData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [confirmReview, setConfirmReview] = useState<string | null>(null);
  const [unflagging, setUnflagging] = useState<string | null>(null);

  if (spotsLoading || revLoading) return <PageSpinner />;

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal({ open: true, spot: null });
  };
  const openEdit = (s: DbSpot) => {
    setForm({
      name: s.name,
      address: s.address,
      city: s.city,
      description: s.description ?? "",
      lat: s.lat?.toString() ?? "",
      lng: s.lng?.toString() ?? "",
      image_url: s.image_url ?? "",
      google_maps_url: s.google_maps_url ?? "",
      opening_hours: s.opening_hours ?? "",
      hours_json: s.hours_json ? JSON.stringify(s.hours_json) : "",
      price_range: s.price_range?.toString() ?? "",
      slug: s.slug ?? "",
      has_wifi: s.has_wifi,
      has_power: s.has_power,
      is_published: s.is_published,
      amenity_no_time_limit: s.amenity_no_time_limit,
      amenity_standing_desk: s.amenity_standing_desk,
      amenity_outdoor_seating: s.amenity_outdoor_seating,
      amenity_open_24h: s.amenity_open_24h,
      amenity_reservable: s.amenity_reservable,
      amenity_pet_friendly: s.amenity_pet_friendly,
    });
    setErrors({});
    setModal({ open: true, spot: s });
  };

  const handleSave = async () => {
    const parsed = spotSchema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        e[i.path[0] as string] = i.message;
      });
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      if (modal.spot) {
        await update.mutateAsync({ id: modal.spot.id, data: form });
        toast("Spot updated.");
      } else {
        await create.mutateAsync(form);
        toast("Spot created.");
      }
      setModal({ open: false, spot: null });
    } catch (err: any) {
      toast(err.message ?? "Error saving spot.", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpot = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast("Spot deleted.");
      setConfirm(null);
    } catch (err: any) {
      toast(err.message ?? "Error deleting.", "err");
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await delReview.mutateAsync(id);
      toast("Review deleted.");
      setConfirmReview(null);
      qc.invalidateQueries({ queryKey: [...REVIEWS_KEY, "flagged"] });
    } catch (err: any) {
      toast(err.message ?? "Error deleting review.", "err");
    }
  };

  const handleUnflag = async (id: string) => {
    setUnflagging(id);
    try {
      await unflagReview(id);
      qc.invalidateQueries({ queryKey: [...REVIEWS_KEY, "flagged"] });
      qc.invalidateQueries({ queryKey: [...REVIEWS_KEY, "admin"] });
      toast("Review unflagged.");
    } catch (err: any) {
      toast(err.message ?? "Failed to unflag.", "err");
    } finally {
      setUnflagging(null);
    }
  };

  const f =
    (key: keyof SpotFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "spots", label: "Spots", icon: Coffee, badge: spots.length },
    { id: "reviews", label: "Reviews", icon: FileText, badge: reviews.length },
    { id: "flagged", label: "Flagged", icon: Flag, badge: flagged.length },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-head">Admin</h1>
            <p className="font-mono text-2xs text-amber mt-1 uppercase tracking-widest">
              spillthebeans Management
            </p>
          </div>
          {tab === "spots" && (
            <button onClick={openCreate} className="btn-primary">
              <Plus size={14} />
              Add Spot
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors",
                tab === id ? "bg-card text-head" : "text-dim hover:text-body",
              )}
            >
              <Icon
                size={13}
                className={
                  id === "flagged" && (badge ?? 0) > 0 ? "text-amber" : ""
                }
              />
              {label}
              {badge !== undefined && (
                <span
                  className={cn(
                    "font-mono text-2xs px-1.5 py-0.5 rounded",
                    id === "flagged" && badge > 0
                      ? "bg-amber/20 text-amber"
                      : tab === id
                        ? "bg-muted text-body"
                        : "bg-raised text-dim",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Spots table ── */}
        {tab === "spots" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Name",
                    "City",
                    "Reviews",
                    "Status",
                    "Added",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 font-mono text-2xs text-dim uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {spots.map((s) => {
                  const rc = reviews.filter((r) => r.spot_id === s.id).length;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-raised transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {s.image_url ? (
                            <img
                              src={s.image_url}
                              alt=""
                              className="w-10 h-10 rounded object-cover shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center">
                              <Coffee size={14} className="text-dim" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-head">{s.name}</p>
                            <p className="font-mono text-2xs text-dim truncate max-w-[140px]">
                              {s.address}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-dim">
                        {s.city}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-dim">
                        {rc}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "font-mono text-2xs px-2 py-0.5 rounded border",
                            s.is_published
                              ? "bg-amber/10 text-amber border-amber/20"
                              : "bg-muted text-dim border-border",
                          )}
                        >
                          {s.is_published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-2xs text-dim">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="btn-ghost btn-sm"
                          >
                            <Edit3 size={13} />
                          </button>
                          {confirm === s.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDeleteSpot(s.id)}
                                className="btn-danger btn-sm"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirm(null)}
                                className="btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirm(s.id)}
                              className="btn-ghost btn-sm text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {spots.length === 0 && (
              <p className="text-center py-16 font-mono text-sm text-dim">
                No spots yet.
              </p>
            )}
          </div>
        )}

        {/* ── Reviews table ── */}
        {tab === "reviews" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Spot", "Score", "Flagged", "Date", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-3 font-mono text-2xs text-dim uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r: any) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "hover:bg-raised transition-colors",
                      r.is_flagged && "bg-amber/[0.03]",
                    )}
                  >
                    <td className="py-3 px-3 font-medium text-head">
                      {r.username}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-dim">
                      {r.spots?.name ?? "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm font-semibold text-amber">
                      {r.overall_score?.toFixed(1)}
                    </td>
                    <td className="py-3 px-3">
                      {r.is_flagged && (
                        <span className="flex items-center gap-1 font-mono text-2xs text-amber">
                          <Flag size={11} />
                          Flagged
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-2xs text-dim">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {confirmReview === r.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="btn-danger btn-sm"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmReview(null)}
                              className="btn-ghost btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmReview(r.id)}
                            className="btn-ghost btn-sm text-red-500 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Flagged reviews ── */}
        {tab === "flagged" && (
          <div>
            {flaggedLoading ? (
              <PageSpinner />
            ) : flagged.length === 0 ? (
              <div className="text-center py-20">
                <ShieldOff
                  size={28}
                  className="text-muted mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="font-display text-xl text-head mb-1">
                  No flagged reviews
                </p>
                <p className="font-mono text-xs text-dim">
                  Community reports will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {flagged.map((r: any) => (
                  <div key={r.id} className="card p-5 border-amber/20">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle
                            size={13}
                            className="text-amber shrink-0"
                          />
                          <span className="font-mono text-2xs text-amber uppercase tracking-widest">
                            Flagged
                          </span>
                          {r.flagged_at && (
                            <span className="font-mono text-2xs text-dim">
                              {formatDate(r.flagged_at)}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-head">{r.username}</p>
                        <p className="font-mono text-2xs text-dim">
                          On: {r.spots?.name ?? "—"} &middot; Score:{" "}
                          {r.overall_score?.toFixed(1)}
                        </p>
                        {r.flagged_reason && (
                          <p className="text-sm text-body mt-2 bg-raised rounded px-3 py-2 border border-border">
                            <span className="font-mono text-2xs text-dim block mb-1">
                              Report reason:
                            </span>
                            {r.flagged_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleUnflag(r.id)}
                          disabled={unflagging === r.id}
                          className="btn-secondary btn-sm font-mono"
                        >
                          <ShieldOff size={12} />
                          {unflagging === r.id ? "Clearing..." : "Clear flag"}
                        </button>
                        {confirmReview === r.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="btn-danger btn-sm"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmReview(null)}
                              className="btn-ghost btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmReview(r.id)}
                            className="btn-danger btn-sm"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Review body */}
                    <p className="text-sm text-body leading-relaxed line-clamp-3">
                      {r.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Total Spots", spots.length, Coffee],
              ["Published", spots.filter((s) => s.is_published).length, Coffee],
              ["Total Reviews", reviews.length, FileText],
              ["Flagged", flagged.length, Flag],
              ["Cities", new Set(spots.map((s) => s.city)).size, BarChart3],
              ["With Photos", spots.filter((s) => s.image_url).length, Coffee],
            ].map(([label, val, Icon]: any) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className="w-9 h-9 bg-amber/5 border border-amber/20 rounded flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-amber" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-amber">
                    {val}
                  </div>
                  <div className="font-mono text-2xs text-dim">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Spot form modal ── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="font-display text-xl text-head">
                {modal.spot ? "Edit Spot" : "New Spot"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo upload — at the top for visibility */}
              <div>
                <label className="input-label">Cover Photo</label>
                <ImageUpload
                  spotId={modal.spot?.id ?? "new-spot-temp"}
                  currentUrl={form.image_url || null}
                  onUploaded={(url) =>
                    setForm((p) => ({ ...p, image_url: url }))
                  }
                />
                <p className="font-mono text-2xs text-dim mt-1">
                  Or enter a URL below
                </p>
                <input
                  value={form.image_url}
                  onChange={f("image_url")}
                  placeholder="https://..."
                  className="input mt-1.5"
                />
                {errors.image_url && (
                  <p className="font-mono text-2xs text-red-400 mt-1">
                    {errors.image_url}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="input-label">Name *</label>
                <input
                  value={form.name}
                  onChange={f("name")}
                  placeholder="Craft Coffee Baguio"
                  className="input"
                />
                {errors.name && (
                  <p className="font-mono text-2xs text-red-400 mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* City + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">City *</label>
                  <select
                    value={form.city}
                    onChange={f("city")}
                    className="input"
                  >
                    <option value="">Select</option>
                    {PH_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="font-mono text-2xs text-red-400 mt-1">
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

              {/* Address */}
              <div>
                <label className="input-label">Address *</label>
                <input
                  value={form.address}
                  onChange={f("address")}
                  placeholder="123 Session Road"
                  className="input"
                />
                {errors.address && (
                  <p className="font-mono text-2xs text-red-400 mt-1">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={f("description")}
                  rows={2}
                  className="input resize-none"
                />
              </div>

              {/* Lat / Lng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Latitude</label>
                  <input
                    value={form.lat}
                    onChange={f("lat")}
                    placeholder="16.4023"
                    className="input font-mono"
                  />
                  {errors.lat && (
                    <p className="font-mono text-2xs text-red-400 mt-1">
                      {errors.lat}
                    </p>
                  )}
                </div>
                <div>
                  <label className="input-label">Longitude</label>
                  <input
                    value={form.lng}
                    onChange={f("lng")}
                    placeholder="120.5960"
                    className="input font-mono"
                  />
                  {errors.lng && (
                    <p className="font-mono text-2xs text-red-400 mt-1">
                      {errors.lng}
                    </p>
                  )}
                </div>
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="input-label">Google Maps URL</label>
                <input
                  value={form.google_maps_url}
                  onChange={f("google_maps_url")}
                  placeholder="https://maps.google.com/..."
                  className="input"
                />
              </div>

              {/* Opening hours */}
              <div>
                <label className="input-label">Opening Hours</label>
                <input
                  value={form.opening_hours}
                  onChange={f("opening_hours")}
                  placeholder="7am–10pm daily"
                  className="input"
                />
              </div>

              {/* Core feature checkboxes */}
              <div className="flex flex-wrap gap-5 pt-1">
                {(
                  [
                    ["has_wifi", "Has WiFi"],
                    ["has_power", "Has Power"],
                    ["is_published", "Published"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [key]: e.target.checked }))
                      }
                      className="w-3.5 h-3.5 rounded accent-amber"
                    />
                    <span className="font-mono text-xs text-body">{label}</span>
                  </label>
                ))}
              </div>

              {/* Slug override */}
              <div>
                <label className="input-label">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={f("slug")}
                  placeholder="auto-generated from name"
                  className="input font-mono text-sm"
                />
                <p className="font-mono text-2xs text-dim mt-1">
                  Leave blank to auto-generate. e.g. baguio-craft-coffee
                </p>
              </div>

              {/* Amenity checkboxes */}
              <div>
                <label className="input-label mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-3">
                  {AMENITY_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!form[key as keyof SpotFormData]}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, [key]: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 rounded accent-amber"
                      />
                      <span className="font-mono text-xs text-body">
                        {AMENITY_LABELS[key as AmenityKey]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setModal({ open: false, spot: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : modal.spot ? "Update" : "Create Spot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
