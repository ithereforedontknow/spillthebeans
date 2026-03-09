import { Link } from 'react-router-dom'
import { MapPin, Wifi, Zap } from 'lucide-react'
import { cn, computeSpotStats, scoreLabel } from '@/lib/utils'
import { PRICE_LABELS } from '@/types'
import type { DbSpot, DbReview } from '@/types'

interface SpotCardProps {
  spot: DbSpot
  reviews?: DbReview[]
  className?: string
}

export function SpotCard({ spot, reviews = [], className }: SpotCardProps) {
  const stats = computeSpotStats(reviews)
  const img   = spot.image_url ?? `https://picsum.photos/seed/${spot.id}/480/320`

  return (
    <Link to={`/spot/${spot.id}`} className="group block">
      <article className={cn('card overflow-hidden hover:border-muted transition-colors duration-200', className)}>
        {/* Image */}
        <div className="aspect-[16/9] bg-raised overflow-hidden relative">
          <img
            src={img} alt={spot.name} loading="lazy"
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-500"
          />
          {/* Score overlay */}
          {stats.review_count > 0 && (
            <div className="absolute top-2 right-2 flex items-baseline gap-1 bg-base/80 backdrop-blur-sm border border-border rounded px-2 py-1">
              <span className="font-mono font-semibold text-amber text-sm">{stats.avg_score.toFixed(1)}</span>
              <span className="font-mono text-2xs text-dim">/5</span>
            </div>
          )}
          {/* Amenity badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {spot.has_wifi  && <span className="flex items-center gap-1 bg-base/80 backdrop-blur-sm border border-border rounded px-1.5 py-0.5"><Wifi  size={10} className="text-amber" /></span>}
            {spot.has_power && <span className="flex items-center gap-1 bg-base/80 backdrop-blur-sm border border-border rounded px-1.5 py-0.5"><Zap   size={10} className="text-amber" /></span>}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display text-head text-base leading-snug line-clamp-1 group-hover:text-amber transition-colors">
              {spot.name}
            </h3>
            {spot.price_range && (
              <span className="font-mono text-2xs text-dim shrink-0 mt-0.5">{PRICE_LABELS[spot.price_range]}</span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-dim mb-3">
            <MapPin size={11} className="shrink-0" />
            <span className="text-xs truncate">{spot.city}</span>
          </div>

          {/* Stats row */}
          {stats.review_count > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <StatChip label="WiFi"   val={stats.avg_wifi}    />
                <StatChip label="Power"  val={stats.avg_power}   />
                <StatChip label="Noise"  val={stats.avg_noise}   />
              </div>
              <span className="font-mono text-2xs text-dim">
                {stats.review_count} {stats.review_count === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : (
            <p className="font-mono text-2xs text-dim/60">No reviews yet</p>
          )}
        </div>
      </article>
    </Link>
  )
}

function StatChip({ label, val }: { label: string; val: number }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xs font-semibold text-amber">{val > 0 ? val.toFixed(1) : '—'}</div>
      <div className="font-mono text-2xs text-dim">{label}</div>
    </div>
  )
}
