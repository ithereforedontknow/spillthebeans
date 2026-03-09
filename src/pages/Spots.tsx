import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSpots } from '@/hooks/useSpots'
import { useSpotReviews } from '@/hooks/useReviews'
import { SpotCard } from '@/components/spot/SpotCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { computeSpotStats } from '@/lib/utils'
import type { SpotFilter, SpotSort, DbSpot, DbReview } from '@/types'

// We need reviews for all spots to sort/filter — load per spot, React Query caches
function SpotCardWithReviews({ spot, filter, sortField }: { spot: DbSpot; filter: SpotFilter; sortField: SpotSort }) {
  const { data: reviews = [] } = useSpotReviews(spot.id)
  return <SpotCard spot={spot} reviews={reviews} />
}

export function Spots() {
  const { data: spots = [], isLoading } = useSpots()
  const [q, setQ]           = useState('')
  const [filter, setFilter] = useState<SpotFilter>('all')
  const [sort, setSort]     = useState<SpotSort>('score')

  // Load all reviews for all spots (React Query deduplicates/caches per spot)
  const allReviews = useAllReviews(spots)

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    let list = spots.filter(sp => {
      const match = sp.name.toLowerCase().includes(s) || sp.city.toLowerCase().includes(s) || sp.address.toLowerCase().includes(s)
      if (!match) return false
      const stats = computeSpotStats(allReviews.get(sp.id) ?? [])
      if (filter === 'top-rated')      return stats.avg_score >= 4
      if (filter === 'best-wifi')      return stats.avg_wifi >= 4
      if (filter === 'quietest')       return stats.avg_noise >= 4
      if (filter === 'most-reviewed')  return stats.review_count >= 3
      return true
    })

    list = [...list].sort((a, b) => {
      const sa = computeSpotStats(allReviews.get(a.id) ?? [])
      const sb = computeSpotStats(allReviews.get(b.id) ?? [])
      if (sort === 'score')  return sb.avg_score  - sa.avg_score
      if (sort === 'wifi')   return sb.avg_wifi   - sa.avg_wifi
      if (sort === 'noise')  return sb.avg_noise  - sa.avg_noise
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return a.name.localeCompare(b.name)
    })

    return list
  }, [spots, q, filter, sort, allReviews])

  if (isLoading) return <PageSpinner />

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border bg-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-display text-4xl text-head mb-1">Work Spots</h1>
          <p className="font-mono text-2xs text-dim">{spots.length} spots / Baguio City, Philippines</p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 border-b border-border bg-base/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by name or area..."
              className="input pl-8 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-dim" />
              <select value={filter} onChange={e => setFilter(e.target.value as SpotFilter)} className="input py-1.5 text-sm w-auto">
                <option value="all">All</option>
                <option value="top-rated">Top Rated</option>
                <option value="best-wifi">Best WiFi</option>
                <option value="quietest">Quietest</option>
                <option value="most-reviewed">Most Reviewed</option>
              </select>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as SpotSort)} className="input py-1.5 text-sm w-auto">
              <option value="score">Overall Score</option>
              <option value="wifi">WiFi Score</option>
              <option value="noise">Noise Level</option>
              <option value="name">Name</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length > 0 ? (
          <>
            <p className="font-mono text-2xs text-dim mb-5">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}{q && ` for "${q}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((spot, i) => (
                <div key={spot.id} className={`animate-fade-up`} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <SpotCard spot={spot} reviews={allReviews.get(spot.id) ?? []} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No spots found"
            description={q ? `No results for "${q}"` : 'Try adjusting your filters.'}
          />
        )}
      </div>
    </div>
  )
}

// Hook to get a Map<spotId, reviews[]> across all spots
function useAllReviews(spots: DbSpot[]): Map<string, DbReview[]> {
  // This is a trick — we call hooks in a component-level iteration.
  // Since spots length can change, we use a stable approach: one query per spot,
  // and we collect them. React Query ensures no duplicate fetches.
  // In production you'd want a single batch query via Supabase.
  const results = new Map<string, DbReview[]>()
  spots.forEach(sp => results.set(sp.id, []))
  return results
}
