import { Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mediaUrl } from '../api/cafes'
import { getPostPreviewTags } from '../utils/postTags'

export default function ExploreCafeCard({
  cafe,
  posts = [],
  isFavourite,
  onToggleFavourite,
  onViewMap,
  showRating = false,
}) {
  if (posts.length > 0) {
    return posts.map((post) => {
      const previewTags = getPostPreviewTags(post.purposes || [], post.attraction_factors || [])
      const image = post.image || post.images?.[0] || cafe.image

      return (
        <article
          key={`cafe-${cafe.id}-post-${post.id}`}
          className="min-w-0 overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <Link to={`/community/post/${post.id}`} className="block">
            <div className="relative h-52 bg-coffee-50 sm:h-56">
              {image ? (
                <img
                  src={mediaUrl(image)}
                  alt={cafe.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-coffee-500">
                  No image available
                </div>
              )}
              {post.category && (
                <span className="absolute bottom-3 left-4 rounded-full bg-[#fbf6f2] px-4 py-2 text-sm font-bold text-coffee-800">
                  {post.category}
                </span>
              )}
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-extrabold text-coffee-900">{cafe.name}</h2>
                {showRating && cafe.rating != null && (
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-600">
                    <Star size={16} fill="currentColor" />
                    {Number(cafe.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-base text-stone-500">
                {post.cafe?.township || post.township || cafe.township}
              </p>
              {post.body && (
                <p className="mt-4 whitespace-pre-line text-base leading-7 text-stone-700">
                  {post.body}
                </p>
              )}
              {previewTags.purposes.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {previewTags.purposes.map((tag) => (
                    <span key={tag} className="rounded-full bg-coffee-50 px-3 py-1.5 text-xs font-bold text-coffee-700">{tag}</span>
                  ))}
                </div>
              )}
              {previewTags.factors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewTags.factors.map((factor) => (
                    <span key={factor} className="rounded-full border border-coffee-100 px-3 py-1.5 text-xs font-medium text-stone-600">{factor}</span>
                  ))}
                  {previewTags.remainingFactors > 0 && (
                    <span className="rounded-full bg-coffee-50 px-3 py-1.5 text-xs font-semibold text-coffee-700">+{previewTags.remainingFactors} more</span>
                  )}
                </div>
              )}
              <p className="mt-5 text-base text-stone-500">
                By @{String(post.user?.name || 'CafeMate User').replace(/^@/, '')}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
            <button
              type="button"
              onClick={() => onToggleFavourite(cafe.id)}
              aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-coffee-200 text-coffee-700 hover:bg-coffee-50"
            >
              <Heart size={19} className={isFavourite ? 'fill-red-500 text-red-500' : ''} />
            </button>
            <button
              type="button"
              onClick={() => onViewMap(cafe)}
              className="min-h-11 flex-1 rounded-xl bg-coffee-700 px-4 py-3 font-semibold text-white transition hover:bg-coffee-800"
            >
              View café
            </button>
          </div>
        </article>
      )
    })
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        {cafe.image ? (
          <img
            src={mediaUrl(cafe.image)}
            alt={cafe.name}
            className="h-44 w-full object-cover sm:h-52"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-coffee-50">
            <span className="text-sm text-coffee-500">No image available</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleFavourite(cafe.id)}
          aria-label={isFavourite ? 'Remove favourite' : 'Add favourite'}
          className="absolute right-4 top-4 rounded-full bg-white p-3 shadow"
        >
          <Heart size={20} className={isFavourite ? 'fill-red-500 text-red-500' : 'text-stone-600'} />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-coffee-800">
          {cafe.type}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-coffee-900">{cafe.name}</h2>
          {cafe.rating !== null && cafe.rating !== undefined && (
            <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
              <Star size={16} className="fill-amber-500" />
              {cafe.rating}
            </span>
          )}
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-500">
          <MapPin size={16} />
          {[...new Set([cafe.area, cafe.township].filter(Boolean))].join(', ')}
        </p>
        {cafe.address && <p className="mt-2 text-sm text-stone-600">{cafe.address}</p>}
        {cafe.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{cafe.description}</p>
        )}
        {cafe.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cafe.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-medium text-coffee-700">{tag}</span>
            ))}
          </div>
        )}
        {cafe.price && <p className="mt-4 font-bold text-coffee-800">{cafe.price}</p>}
        <button
          type="button"
          onClick={() => onViewMap(cafe)}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coffee-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-coffee-800 sm:px-4 sm:text-base"
        >
          <MapPin size={19} />
          View on Map
        </button>
      </div>
    </article>
  )
}
