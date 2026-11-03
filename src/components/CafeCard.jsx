
import { Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CafeCard({
  cafe,
  isFavourite,
  onToggleFavourite
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-coffee-900/8">
      <div className="relative h-52 overflow-hidden">
        <img
          src={cafe.image}
          alt={cafe.name}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />

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
            {cafe.rating}
          </span>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <MapPin size={14} />
          {cafe.area}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {cafe.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {cafe.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-coffee-50 px-2.5 py-1 text-[11px] font-bold text-coffee-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={`/cafe/${cafe.id}`}
          className="mt-5 block rounded-lg border border-coffee-700 px-3 py-2.5 text-center text-sm font-bold text-coffee-700 transition hover:bg-coffee-700 hover:text-white"
        >
          View details
        </Link>
      </div>
    </article>
  )
}
