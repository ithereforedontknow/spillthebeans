import { supabase } from './client'
import type { SpotFormData, ReviewFormData, ProfileFormData } from '@/types'

// ── Spots ─────────────────────────────────────────────────────────────────────

export async function fetchSpots() {
  const { data, error } = await supabase
    .from('spots').select('*').eq('is_published', true).order('name')
  if (error) throw error
  return data
}

export async function fetchSpotsAdmin() {
  const { data, error } = await supabase
    .from('spots').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSpotById(id: string) {
  const { data, error } = await supabase.from('spots').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

function parseSpotForm(f: Partial<SpotFormData>) {
  return {
    name: f.name, address: f.address, city: f.city,
    description:     f.description     || null,
    lat:             f.lat             ? parseFloat(f.lat)       : null,
    lng:             f.lng             ? parseFloat(f.lng)       : null,
    image_url:       f.image_url       || null,
    google_maps_url: f.google_maps_url || null,
    opening_hours:   f.opening_hours   || null,
    price_range:     f.price_range     ? parseInt(f.price_range) : null,
    has_wifi:  f.has_wifi,
    has_power: f.has_power,
    is_published: f.is_published,
  }
}

export async function createSpot(f: SpotFormData) {
  const { data, error } = await supabase.from('spots').insert(parseSpotForm(f)).select().single()
  if (error) throw error
  return data
}

export async function updateSpot(id: string, f: Partial<SpotFormData>) {
  const { data, error } = await supabase.from('spots').update(parseSpotForm(f)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSpot(id: string) {
  const { error } = await supabase.from('spots').delete().eq('id', id)
  if (error) throw error
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function calcOverall(r: ReviewFormData): number {
  const vals = [r.wifi_quality, r.power_outlets, r.noise_level, r.laptop_friendliness, r.coffee_quality, r.seating_comfort]
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export async function fetchReviewsBySpot(spotId: string) {
  const { data, error } = await supabase
    .from('reviews').select('*').eq('spot_id', spotId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchReviewsByUser(userId: string) {
  const { data, error } = await supabase
    .from('reviews').select('*, spots(id,name,city)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllReviewsAdmin() {
  const { data, error } = await supabase
    .from('reviews').select('*, spots(name)').order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return data
}

export async function createReview(
  r: ReviewFormData & { user_id: string; username: string; avatar_url: string | null }
) {
  const { data, error } = await supabase
    .from('reviews').insert({ ...r, overall_score: calcOverall(r) }).select().single()
  if (error) throw error
  return data
}

export async function updateReview(id: string, r: Partial<ReviewFormData>) {
  const patch = r.wifi_quality
    ? { ...r, overall_score: calcOverall(r as ReviewFormData) }
    : r
  const { data, error } = await supabase.from('reviews').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function fetchSpotLikesByUser(userId: string) {
  const { data, error } = await supabase.from('spot_likes').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function fetchReviewLikesByUser(userId: string) {
  const { data, error } = await supabase.from('review_likes').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

async function toggleLike(table: string, match: Record<string, string>) {
  const { data: ex } = await (supabase.from(table as any).select('id') as any)
    .match(match).maybeSingle()
  if (ex) { await (supabase.from(table as any).delete() as any).eq('id', ex.id); return false }
  await (supabase.from(table as any).insert(match) as any)
  return true
}

export const toggleSpotLike   = (uid: string, sid: string) => toggleLike('spot_likes',   { user_id: uid, spot_id: sid })
export const toggleReviewLike = (uid: string, rid: string) => toggleLike('review_likes', { user_id: uid, review_id: rid })

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function upsertProfile(userId: string, data: Partial<ProfileFormData>) {
  const { data: d, error } = await supabase
    .from('profiles').upsert({ id: userId, ...data }, { onConflict: 'id' }).select().single()
  if (error) throw error
  return d
}
