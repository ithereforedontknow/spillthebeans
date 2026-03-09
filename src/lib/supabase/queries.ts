import { supabase } from "./client";
import type { SpotFormData, ReviewFormData, ProfileFormData } from "@/types";

// ── Spots ─────────────────────────────────────────────────────────────────────

export async function fetchSpots() {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("is_published", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchSpotsAdmin() {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchSpotById(id: string) {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// Fetch by slug (preferred for URLs) — falls back to UUID lookup
export async function fetchSpotBySlug(slug: string) {
  // Try slug first
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  // Fallback: if it looks like a UUID, try by id (handles old links)
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(slug)) return fetchSpotById(slug);
  return null;
}

function parseSpotForm(f: Partial<SpotFormData>) {
  let hours_json = null;
  if (f.hours_json) {
    try {
      hours_json = JSON.parse(f.hours_json);
    } catch {
      hours_json = null;
    }
  }
  return {
    name: f.name,
    address: f.address,
    city: f.city,
    description: f.description || null,
    lat: f.lat ? parseFloat(f.lat) : null,
    lng: f.lng ? parseFloat(f.lng) : null,
    image_url: f.image_url || null,
    google_maps_url: f.google_maps_url || null,
    opening_hours: f.opening_hours || null,
    hours_json,
    slug: f.slug || null,
    price_range: f.price_range ? parseInt(f.price_range) : null,
    has_wifi: f.has_wifi,
    has_power: f.has_power,
    is_published: f.is_published,
    amenity_no_time_limit: f.amenity_no_time_limit ?? false,
    amenity_standing_desk: f.amenity_standing_desk ?? false,
    amenity_outdoor_seating: f.amenity_outdoor_seating ?? false,
    amenity_open_24h: f.amenity_open_24h ?? false,
    amenity_reservable: f.amenity_reservable ?? false,
    amenity_pet_friendly: f.amenity_pet_friendly ?? false,
  };
}

// Fetch similar spots — same city, published, exclude self, up to 4
export async function fetchSimilarSpots(spotId: string, city: string) {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("city", city)
    .eq("is_published", true)
    .neq("id", spotId)
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function createSpot(f: SpotFormData) {
  const { data, error } = await supabase
    .from("spots")
    .insert(parseSpotForm(f))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpot(id: string, f: Partial<SpotFormData>) {
  const { data, error } = await supabase
    .from("spots")
    .update(parseSpotForm(f))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpot(id: string) {
  const { error } = await supabase.from("spots").delete().eq("id", id);
  if (error) throw error;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function calcOverall(r: ReviewFormData): number {
  const vals = [
    r.wifi_quality,
    r.power_outlets,
    r.noise_level,
    r.laptop_friendliness,
    r.coffee_quality,
    r.seating_comfort,
  ];
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export async function fetchReviewsBySpot(spotId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchReviewsByUser(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, spots(id,name,city)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllReviewsAdmin() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, spots(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function createReview(
  r: ReviewFormData & {
    user_id: string;
    username: string;
    avatar_url: string | null;
  },
) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({ ...r, overall_score: calcOverall(r) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReview(id: string, r: Partial<ReviewFormData>) {
  const patch = r.wifi_quality
    ? { ...r, overall_score: calcOverall(r as ReviewFormData) }
    : r;
  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function fetchSpotLikesByUser(userId: string) {
  const { data, error } = await supabase
    .from("spot_likes")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function fetchReviewLikesByUser(userId: string) {
  const { data, error } = await supabase
    .from("review_likes")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

async function toggleLike(table: string, match: Record<string, string>) {
  const { data: ex } = await (supabase.from(table as any).select("id") as any)
    .match(match)
    .maybeSingle();
  if (ex) {
    await (supabase.from(table as any).delete() as any).eq("id", ex.id);
    return false;
  }
  await (supabase.from(table as any).insert(match) as any);
  return true;
}

export const toggleSpotLike = (uid: string, sid: string) =>
  toggleLike("spot_likes", { user_id: uid, spot_id: sid });
export const toggleReviewLike = (uid: string, rid: string) =>
  toggleLike("review_likes", { user_id: uid, review_id: rid });

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  data: Partial<ProfileFormData>,
) {
  const { data: d, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...data }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return d;
}

// ── Phase 2: Image uploads ────────────────────────────────────────────────────

export async function uploadSpotImage(
  file: File,
  spotId: string,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${spotId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("spot-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("spot-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteSpotImage(path: string) {
  // path is the full public URL — extract the storage path
  const storagePath = path.split("/spot-images/")[1];
  if (!storagePath) return;
  const { error } = await supabase.storage
    .from("spot-images")
    .remove([storagePath]);
  if (error) throw error;
}

// ── Phase 2: Review flagging (via RPC) ───────────────────────────────────────

export async function flagReview(reviewId: string, reason: string) {
  const { error } = await supabase.rpc("flag_review", {
    review_id: reviewId,
    reason,
  });
  if (error) throw error;
}

export async function unflagReview(reviewId: string) {
  const { error } = await supabase.rpc("unflag_review", {
    review_id: reviewId,
  });
  if (error) throw error;
}

export async function fetchFlaggedReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, spots(name)")
    .eq("is_flagged", true)
    .order("flagged_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Phase 2: Passport ────────────────────────────────────────────────────────

export async function fetchUserPassport(userId: string) {
  const { data, error } = await supabase
    .from("user_passport")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPassportLeaderboard() {
  const { data, error } = await supabase
    .from("user_passport")
    .select("*")
    .gt("spots_visited", 0)
    .order("spots_visited", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

// Fetch all spots a user has reviewed (for passport spot grid)
export async function fetchVisitedSpots(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "spot_id, created_at, overall_score, spots(id, name, city, image_url)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Phase 4: Spot submissions ─────────────────────────────────────────────────

export async function submitSpot(data: {
  submitted_by: string;
  submitter_name: string;
  name: string;
  address: string;
  city: string;
  description: string;
  lat: string;
  lng: string;
  image_url: string;
  google_maps_url: string;
  opening_hours: string;
  price_range: string;
  has_wifi: boolean;
  has_power: boolean;
}) {
  const { error } = await supabase.from("spot_submissions").insert({
    ...data,
    lat: data.lat ? parseFloat(data.lat) : null,
    lng: data.lng ? parseFloat(data.lng) : null,
    price_range: data.price_range ? parseInt(data.price_range) : null,
    image_url: data.image_url || null,
    google_maps_url: data.google_maps_url || null,
    opening_hours: data.opening_hours || null,
    description: data.description || null,
  });
  if (error) throw error;
}

export async function fetchSubmissions(status?: string) {
  let q = supabase
    .from("spot_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function approveSubmission(id: string) {
  const { data, error } = await supabase.rpc("approve_submission", {
    submission_id: id,
  });
  if (error) throw error;
  return data as string; // returns new spot id
}

export async function rejectSubmission(id: string, note: string) {
  const { error } = await supabase
    .from("spot_submissions")
    .update({
      status: "rejected",
      admin_note: note,
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

// ── Phase 4: Spot updates / flags ─────────────────────────────────────────────

export async function reportSpotUpdate(data: {
  spot_id: string;
  reported_by: string;
  category: string;
  note: string;
}) {
  const { error } = await supabase.from("spot_updates").insert(data);
  if (error) throw error;
}

export async function fetchSpotUpdates(spotId: string) {
  const { data, error } = await supabase
    .from("spot_updates")
    .select("*")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchOpenUpdates() {
  const { data, error } = await supabase
    .from("spot_updates")
    .select("*, spots(name, city)")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolveSpotUpdate(
  id: string,
  action: "resolved" | "dismissed",
) {
  const { error } = await supabase
    .from("spot_updates")
    .update({
      status: action,
      resolved_by: (await supabase.auth.getUser()).data.user?.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

// ── Phase 4: Spot photo gallery ───────────────────────────────────────────────

export async function fetchSpotPhotos(spotId: string) {
  const { data, error } = await supabase
    .from("spot_photos")
    .select("*")
    .eq("spot_id", spotId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSpotPhoto(data: {
  spot_id: string;
  uploaded_by: string;
  url: string;
  caption?: string;
}) {
  const { error } = await supabase.from("spot_photos").insert(data);
  if (error) throw error;
}

export async function deleteSpotPhoto(id: string) {
  const { error } = await supabase.from("spot_photos").delete().eq("id", id);
  if (error) throw error;
}

export async function setFeaturedPhoto(photoId: string, spotId: string) {
  // Unfeature all others, then feature this one
  await supabase
    .from("spot_photos")
    .update({ is_featured: false })
    .eq("spot_id", spotId);
  const { error } = await supabase
    .from("spot_photos")
    .update({ is_featured: true })
    .eq("id", photoId);
  if (error) throw error;
}

// ── Phase 4: Hours suggestions ────────────────────────────────────────────────

export async function suggestHours(data: {
  spot_id: string;
  suggested_by: string;
  hours_json: object;
  note: string;
}) {
  const { error } = await supabase.from("hours_suggestions").insert(data);
  if (error) throw error;
}

export async function fetchHoursSuggestions(spotId?: string) {
  let q = supabase
    .from("hours_suggestions")
    .select("*, spots(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (spotId) q = q.eq("spot_id", spotId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function applyHoursSuggestion(
  id: string,
  spotId: string,
  hoursJson: object,
) {
  await supabase
    .from("spots")
    .update({ hours_json: hoursJson })
    .eq("id", spotId);
  const { error } = await supabase
    .from("hours_suggestions")
    .update({
      status: "applied",
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function dismissHoursSuggestion(id: string) {
  const { error } = await supabase
    .from("hours_suggestions")
    .update({
      status: "dismissed",
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

// ── Phase 4: Verified badge ───────────────────────────────────────────────────

export async function fetchSpotVerified(spotId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("spot_verified")
    .select("is_verified")
    .eq("spot_id", spotId)
    .single();
  if (error) return false;
  return data?.is_verified ?? false;
}

// ── Phase 4: City stats ───────────────────────────────────────────────────────

export async function fetchCityStats() {
  const { data, error } = await supabase.from("city_stats").select("*");
  if (error) throw error;
  return data;
}

export async function fetchCitySpots(city: string) {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("city", city)
    .eq("is_published", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchCityTopReviewers(city: string) {
  // Get reviewers who have reviewed spots in this city, ranked by count
  const { data, error } = await supabase
    .from("reviews")
    .select("user_id, username, avatar_url, spots!inner(city)")
    .eq("spots.city", city);
  if (error) throw error;
  // Aggregate client-side
  const counts = new Map<
    string,
    { username: string; avatar_url: string | null; count: number }
  >();
  (data ?? []).forEach((r: any) => {
    const existing = counts.get(r.user_id);
    if (existing) existing.count++;
    else
      counts.set(r.user_id, {
        username: r.username,
        avatar_url: r.avatar_url,
        count: 1,
      });
  });
  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
