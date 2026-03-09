import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ThumbsUp, Edit3 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { cn, formatRelative } from '@/lib/utils'
import type { DbReview } from '@/types'

interface ReviewCardProps {
  review: DbReview
  spotName?: string
  likeCount: number
  isLiked: boolean
  isOwner: boolean
  onLike: () => void
  showSpot?: boolean
  className?: string
}

export function ReviewCard({ review, spotName, likeCount, isLiked, isOwner, onLike, showSpot, className }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const long = review.body.length > 240

  return (
    <article className={cn('card p-5 animate-fade-up', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={review.username} imageUrl={review.avatar_url} size="sm" />
          <div>
            <p className="text-sm font-medium text-head">{review.username}</p>
            <p className="font-mono text-2xs text-dim">{formatRelative(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-semibold text-amber">{review.overall_score.toFixed(1)}</span>
          <span className="font-mono text-2xs text-dim">/5</span>
        </div>
      </div>

      {showSpot && spotName && (
        <p className="font-mono text-2xs text-amber mb-2 uppercase tracking-widest">{spotName}</p>
      )}

      {/* Body */}
      <p className={cn('text-sm text-body leading-relaxed', !expanded && long && 'line-clamp-3')}>
        {review.body}
      </p>
      {long && (
        <button onClick={() => setExpanded(p => !p)} className="text-2xs font-mono text-dim hover:text-body mt-1 transition-colors">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Ratings mini-grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 pt-4 border-t border-border">
        <ScoreBar ratingKey="wifi_quality"        value={review.wifi_quality}        size="sm" />
        <ScoreBar ratingKey="power_outlets"       value={review.power_outlets}       size="sm" />
        <ScoreBar ratingKey="noise_level"         value={review.noise_level}         size="sm" />
        <ScoreBar ratingKey="laptop_friendliness" value={review.laptop_friendliness} size="sm" />
        <ScoreBar ratingKey="coffee_quality"      value={review.coffee_quality}      size="sm" />
        <ScoreBar ratingKey="seating_comfort"     value={review.seating_comfort}     size="sm" />
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {review.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <button
          onClick={onLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all',
            isLiked ? 'border-amber/50 text-amber bg-amber-subtle' : 'border-border text-dim hover:border-muted hover:text-body'
          )}
        >
          <ThumbsUp size={12} />
          {likeCount > 0 ? likeCount : 'Helpful'}
        </button>

        {isOwner && (
          <Link to="/review/new" state={{ edit: review }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-border text-dim hover:border-muted hover:text-body transition-all">
            <Edit3 size={12} />Edit
          </Link>
        )}
      </div>
    </article>
  )
}
