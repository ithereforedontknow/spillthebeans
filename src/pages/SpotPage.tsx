import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, ArrowLeft, Wifi, Zap, ExternalLink, Bookmark } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSpot } from '@/hooks/useSpots'
import { useSpotReviews } from '@/hooks/useReviews'
import { useSpotLikes, useReviewLikes, useToggleSpotLike, useToggleReviewLike } from '@/hooks/useLikes'
import { ReviewCard } from '@/components/review/ReviewCard'
import { ScoreGrid } from '@/components/ui/ScoreBar'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { computeSpotStats, scoreLabel, cn, formatDate } from '@/lib/utils'
import { SpotPhotoUpload } from '@/components/spot/SpotPhotoUpload'
import { PRICE_LABELS } from '@/types'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#f0a500;border-radius:50%;border:2px solid #0c0b09;box-shadow:0 0 0 2px #f0a500;"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -16],
})

export function SpotPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const { data: spot, isLoading: spotLoading } = useSpot(id!)
  const { data: reviews = [], isLoading: revLoading } = useSpotReviews(id!)
  const { data: spotLikes = [] }   = useSpotLikes(user?.id)
  const { data: reviewLikes = [] } = useReviewLikes(user?.id)
  const toggleSpot   = useToggleSpotLike()
  const toggleReview = useToggleReviewLike()

  const stats = useMemo(() => computeSpotStats(reviews), [reviews])
  const isSpotSaved = spotLikes.some(l => l.spot_id === id)
  const likedReviewIds = new Set(reviewLikes.map(l => l.review_id))
  const hasReviewed    = reviews.some(r => r.user_id === user?.id)

  if (spotLoading || revLoading) return <PageSpinner />
  if (!spot) return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h2 className="font-display text-2xl text-head mb-4">Spot not found.</h2>
      <Link to="/spots" className="btn-secondary">Back to spots</Link>
    </div>
  )

  const img = spot.image_url ?? `https://picsum.photos/seed/${spot.id}/1200/600`

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-raised">
        <img src={img} alt={spot.name} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 btn-secondary btn-sm font-mono">
          <ArrowLeft size={13} />Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Identity card */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h1 className="font-display text-2xl text-head leading-tight">{spot.name}</h1>
                {user && (
                  <button
                    onClick={() => toggleSpot.mutate({ uid: user.id, sid: spot.id })}
                    className={cn('btn btn-sm border shrink-0 mt-0.5', isSpotSaved ? 'border-amber/50 text-amber bg-amber-subtle' : 'border-border text-dim hover:border-muted')}
                  >
                    <Bookmark size={13} className={isSpotSaved ? 'fill-current' : ''} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-dim text-sm mb-3">
                <MapPin size={12} className="shrink-0" />
                <span>{spot.address}, {spot.city}</span>
              </div>

              {spot.description && (
                <p className="text-sm text-body leading-relaxed mb-4">{spot.description}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {spot.has_wifi  && <span className="flex items-center gap-1 tag"><Wifi size={10} className="text-amber" />WiFi</span>}
                {spot.has_power && <span className="flex items-center gap-1 tag"><Zap  size={10} className="text-amber" />Power</span>}
                {spot.price_range && <span className="tag">{PRICE_LABELS[spot.price_range]}</span>}
                {spot.opening_hours && <span className="tag text-2xs">{spot.opening_hours}</span>}
              </div>

              {/* Overall score */}
              {stats.review_count > 0 && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-4xl font-semibold text-amber leading-none">{stats.avg_score.toFixed(1)}</span>
                  <span className="font-mono text-sm text-dim">/ 5 — {scoreLabel(stats.avg_score)}</span>
                </div>
              )}
              <p className="font-mono text-2xs text-dim mb-4">
                {stats.review_count > 0 ? `Based on ${stats.review_count} review${stats.review_count !== 1 ? 's' : ''}` : 'No reviews yet'}
              </p>

              {/* Community photo upload */}
              <SpotPhotoUpload spotId={spot.id} currentUrl={spot.image_url} isAdmin={isAdmin} />

              {spot.google_maps_url && (
                <a href={spot.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm w-full mb-3">
                  <ExternalLink size={12} />Open in Maps
                </a>
              )}

              {user && !hasReviewed && (
                <Link to="/review/new" state={{ spotId: spot.id }} className="btn-primary w-full">
                  Rate this spot
                </Link>
              )}
              {hasReviewed && (
                <div className="text-center py-2 font-mono text-2xs text-amber">You have reviewed this spot.</div>
              )}
            </div>

            {/* Score grid */}
            {stats.review_count > 0 && (
              <div className="card p-5">
                <p className="font-mono text-2xs text-dim uppercase tracking-widest mb-4">Work Scores</p>
                <ScoreGrid {...stats} />
              </div>
            )}

            {/* Score distribution */}
            {stats.review_count > 0 && (
              <div className="card p-5">
                <p className="font-mono text-2xs text-dim uppercase tracking-widest mb-4">Score Distribution</p>
                {[5, 4, 3, 2, 1].map(n => {
                  const count = stats.dist[n as 1|2|3|4|5]
                  const pct = (count / stats.review_count) * 100
                  return (
                    <div key={n} className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-2xs text-dim w-4">{n}</span>
                      <div className="flex-1 score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-2xs text-dim w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mini map */}
            {spot.lat && spot.lng && (
              <div className="card overflow-hidden">
                <div className="h-40">
                  <MapContainer center={[spot.lat, spot.lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[spot.lat, spot.lng]} icon={markerIcon}>
                      <Popup><b>{spot.name}</b></Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="px-3 py-2 border-t border-border">
                  <p className="font-mono text-2xs text-dim truncate">{spot.address}</p>
                </div>
              </div>
            )}
          </aside>

          {/* Reviews */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-head">
                Reviews <span className="font-mono text-sm text-dim font-normal">({stats.review_count})</span>
              </h2>
              {user && !hasReviewed && (
                <Link to="/review/new" state={{ spotId: spot.id }} className="btn-primary btn-sm">+ Add yours</Link>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    likeCount={reviewLikes.filter(l => l.review_id === rev.id).length}
                    isLiked={likedReviewIds.has(rev.id)}
                    isOwner={user?.id === rev.user_id}
                    isLoggedIn={!!user}
                    onLike={() => user && toggleReview.mutate({ uid: user.id, rid: rev.id })}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MapPin}
                title="No reviews yet"
                description={`Be the first to rate ${spot.name} for remote work.`}
                action={user ? <Link to="/review/new" state={{ spotId: spot.id }} className="btn-primary">Rate this spot</Link> : null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
