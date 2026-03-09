// ── Work rating dimensions ────────────────────────────────────────────────────

export const RATING_KEYS = [
  'wifi_quality',
  'power_outlets',
  'noise_level',
  'laptop_friendliness',
  'coffee_quality',
  'seating_comfort',
] as const

export type RatingKey = typeof RATING_KEYS[number]

export const RATING_LABELS: Record<RatingKey, string> = {
  wifi_quality:        'WiFi',
  power_outlets:       'Power',
  noise_level:         'Noise Level',
  laptop_friendliness: 'Laptop Friendly',
  coffee_quality:      'Coffee',
  seating_comfort:     'Seating',
}

export const RATING_DESCRIPTIONS: Record<RatingKey, string> = {
  wifi_quality:        'Speed and reliability for calls and uploads',
  power_outlets:       'Number and accessibility of outlets per seat',
  noise_level:         'Ambient sound — lower score means quieter',
  laptop_friendliness: 'Table depth, screen glare, desk height',
  coffee_quality:      'Taste, variety, and consistency',
  seating_comfort:     'Chair support for multi-hour sessions',
}

// ── DB row types (mirror Supabase schema) ────────────────────────────────────

export interface DbSpot {
  id: string
  name: string
  address: string
  city: string
  description: string | null
  lat: number | null
  lng: number | null
  image_url: string | null
  google_maps_url: string | null
  opening_hours: string | null
  price_range: 1 | 2 | 3 | null
  has_wifi: boolean
  has_power: boolean
  is_published: boolean
  created_at: string
  created_by: string | null
}

export interface DbReview {
  id: string
  spot_id: string
  user_id: string
  username: string
  avatar_url: string | null
  body: string
  wifi_quality: number
  power_outlets: number
  noise_level: number
  laptop_friendliness: number
  coffee_quality: number
  seating_comfort: number
  overall_score: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface DbProfile {
  id: string
  username: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
  work_type: string | null
  is_admin: boolean
  created_at: string
}

export interface DbSpotLike   { id: string; user_id: string; spot_id: string;   created_at: string }
export interface DbReviewLike { id: string; user_id: string; review_id: string; created_at: string }

// ── Computed / enriched ───────────────────────────────────────────────────────

export interface SpotStats {
  review_count: number
  avg_score:    number
  avg_wifi:     number
  avg_power:    number
  avg_noise:    number
  avg_laptop:   number
  avg_coffee:   number
  avg_seating:  number
  dist: Record<1|2|3|4|5, number>
}

// ── Form data ─────────────────────────────────────────────────────────────────

export interface SpotFormData {
  name: string; address: string; city: string; description: string
  lat: string; lng: string; image_url: string; google_maps_url: string
  opening_hours: string; price_range: string
  has_wifi: boolean; has_power: boolean; is_published: boolean
}

export interface ReviewFormData {
  spot_id: string; body: string; tags: string[]
  wifi_quality: number; power_outlets: number; noise_level: number
  laptop_friendliness: number; coffee_quality: number; seating_comfort: number
}

export interface ProfileFormData {
  username: string; bio: string; city: string; work_type: string; avatar_url: string | null
}

// ── Filters ───────────────────────────────────────────────────────────────────

export type SpotFilter = 'all' | 'top-rated' | 'best-wifi' | 'quietest' | 'most-reviewed'
export type SpotSort   = 'score' | 'wifi' | 'noise' | 'name' | 'newest'

// ── Constants ────────────────────────────────────────────────────────────────

export const PH_CITIES = [
  'Baguio City', 'Manila', 'Makati', 'BGC / Taguig', 'Quezon City',
  'Pasig', 'Cebu City', 'Davao City', 'Iloilo City', 'Bacolod City',
  'San Fernando, La Union', 'Vigan City', 'Tagaytay', 'Dumaguete City',
  'Naga City', 'General Santos',
] as const

export const WORK_TYPES = [
  'Remote Worker', 'Freelancer', 'Student', 'Digital Nomad',
] as const

export const PRICE_LABELS: Record<number, string> = { 1: 'Budget', 2: 'Mid-range', 3: 'Premium' }

export const SUGGESTED_TAGS = [
  'fast wifi', 'standing desk', 'quiet', 'open late', 'great espresso',
  'rooftop', 'AC', 'study-friendly', 'good light', 'pet-friendly',
  'parking', 'no time limit', 'outdoor seating', 'co-working vibe',
]

// ── Phase 2 additions ─────────────────────────────────────────────────────────

// Flagging fields added to DbReview
export interface DbReviewFlagged extends DbReview {
  is_flagged:     boolean
  flagged_reason: string | null
  flagged_by:     string | null
  flagged_at:     string | null
}

// Passport / badge types
export const BADGE_TIERS = ['Newcomer', 'Explorer', 'Regular', 'Grinder', 'Veteran'] as const
export type BadgeTier = typeof BADGE_TIERS[number]

export const BADGE_REQUIREMENTS: Record<BadgeTier, number> = {
  Newcomer: 0,
  Explorer: 1,
  Regular:  5,
  Grinder:  10,
  Veteran:  25,
}

export const BADGE_DESCRIPTIONS: Record<BadgeTier, string> = {
  Newcomer: 'Just getting started',
  Explorer: 'Reviewed your first work spot',
  Regular:  'Reviewed 5 different spots',
  Grinder:  'Reviewed 10 different spots',
  Veteran:  'Reviewed 25 different spots',
}

export interface UserPassport {
  id:             string
  username:       string | null
  avatar_url:     string | null
  spots_visited:  number
  total_reviews:  number
  avg_score_given: number | null
  badge_tier:     BadgeTier
}
