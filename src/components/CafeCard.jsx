
import { useState } from 'react'
import { Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mediaUrl } from '../api/cafes'
import { getPostPreviewTags } from '../utils/postTags'

export default function CafeCard({
  cafe,
  isFavourite,
  onToggleFavourite
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const communityPosts = cafe.community_posts || []
  const previewPost = communityPosts[0]
  const image = previewPost?.image || previewPost?.images?.[0] || cafe.image
  const previewTags = previewPost
    ? getPostPreviewTags(previewPost.purposes || [], previewPost.attraction_factors || [])
    : null

  return (
    <article className="group overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-coffee-900/8">
      <div className="relative h-52 overflow-hidden">
        {image && !imageFailed ? (
          <img
            src={mediaUrl(image)}
            alt={cafe.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : <div className="grid size-full place-items-center bg-coffee-50 text-sm text-stone-500">No image available</div>}

        <button
          aria-label={`Toggle ${cafe.name} favourite`}
          onClick={() => onToggleFavourite(cafe.id)}
          className={`absolute right-3 top-3 rounded-full p-2.5 shadow-sm transition ${
            isFavourite
              ? 'bg-coffee-700 text-white'
              : 'bg-white text-coffee-700 hover:bg-coffee-50'
          }`}
        >
          <Heart
            size={18}
            fill={isFavourite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold text-coffee-900">
            {cafe.name}
          </h2>

          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-600">
            <Star size={15} fill="currentColor" />
            {cafe.rating == null ? '—' : Number(cafe.rating).toFixed(1)}
          </span>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <MapPin size={14} />
          {cafe.township || cafe.area}
        </p>

        {(cafe.address || cafe.street_address) && (
          <p className="mt-1 pl-5 text-xs text-stone-500">
            {cafe.address || cafe.street_address}
          </p>
        )}

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {cafe.description}
        </p>

        {previewPost && (
          <div className="mt-4 border-t border-coffee-100 pt-3">
            <p className="line-clamp-2 text-sm leading-6 text-stone-600">{previewPost.body}</p>
            {previewTags.purposes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                  {previewTags.purposes.map((purpose) => (
                    <span key={purpose} className="rounded-full bg-coffee-50 px-2.5 py-1 text-[11px] font-bold text-coffee-700">{purpose}</span>
                  ))}
              </div>
            )}
            {previewTags.factors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                  {previewTags.factors.map((factor) => (
                    <span key={factor} className="rounded-full border border-coffee-100 px-2.5 py-1 text-[11px] text-stone-600">{factor}</span>
                  ))}
                  {previewTags.remainingFactors > 0 && (
                    <span className="rounded-full bg-coffee-50 px-2.5 py-1 text-[11px] font-semibold text-coffee-700">+{previewTags.remainingFactors} more</span>
                  )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(cafe.tags || []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-coffee-50 px-2.5 py-1 text-[11px] font-bold text-coffee-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={previewPost ? `/community/post/${previewPost.id}` : `/cafe/${cafe.id}`}
          className="mt-5 block rounded-lg border border-coffee-700 px-3 py-2.5 text-center text-sm font-bold text-coffee-700 transition hover:bg-coffee-700 hover:text-white"
        >
          View details
        </Link>
      </div>
    </article>
  )
}
