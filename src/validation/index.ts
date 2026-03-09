import { z } from 'zod'

const ratingField = z.number().int().min(1).max(5)

export const reviewSchema = z.object({
  spot_id:             z.string().uuid('Select a valid spot'),
  body:                z.string().min(30, 'At least 30 characters').max(1000, 'Max 1000 characters'),
  wifi_quality:        ratingField,
  power_outlets:       ratingField,
  noise_level:         ratingField,
  laptop_friendliness: ratingField,
  coffee_quality:      ratingField,
  seating_comfort:     ratingField,
  tags:                z.array(z.string().max(32)).max(8),
})

export const spotSchema = z.object({
  name:            z.string().min(2).max(100),
  address:         z.string().min(5),
  city:            z.string().min(2),
  description:     z.string().max(500).optional().or(z.literal('')),
  lat:             z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid lat').optional().or(z.literal('')),
  lng:             z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid lng').optional().or(z.literal('')),
  image_url:       z.string().url().optional().or(z.literal('')),
  google_maps_url: z.string().url().optional().or(z.literal('')),
  opening_hours:   z.string().max(100).optional().or(z.literal('')),
  price_range:     z.string().optional(),
  has_wifi:        z.boolean(),
  has_power:       z.boolean(),
  is_published:    z.boolean(),
})

export const profileSchema = z.object({
  username:  z.string().min(3, 'Min 3 chars').max(30).regex(/^[a-z0-9_-]+$/, 'Lowercase, numbers, _ and - only'),
  bio:       z.string().max(200).optional().or(z.literal('')),
  city:      z.string().max(60).optional().or(z.literal('')),
  work_type: z.string().optional().or(z.literal('')),
})

export type ReviewInput  = z.infer<typeof reviewSchema>
export type SpotInput    = z.infer<typeof spotSchema>
export type ProfileInput = z.infer<typeof profileSchema>
