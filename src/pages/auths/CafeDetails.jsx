
import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, MapPin, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getCafes } from '../../api/cafes'
import ReviewFactors from './ReviewFactors'

export default function CafeDetail({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const { id } = useParams()

  const [cafe, setCafe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Find the selected cafe from Laravel
  useEffect(() => {
    async function loadCafe() {
      try {
        setLoading(true)
        setError('')

        let page = 1
        let foundCafe = null
        let hasMore = true

        while (hasMore && !foundCafe) {
          const result = await getCafes(page, 30)

          foundCafe = result.data.find(
            (item) => String(item.id) === String(id),
          )

          hasMore = result.meta.has_more
          page++
        }

        if (foundCafe) {
          setCafe({
            ...foundCafe,
            area: foundCafe.area || foundCafe.township || '',
            address: foundCafe.street_address || '',
            tags: foundCafe.tags || [],
            lat: foundCafe.latitude == null ? null : Number(foundCafe.latitude),
            lng: foundCafe.longitude == null ? null : Number(foundCafe.longitude),
            rating: foundCafe.rating == null ? null : Number(foundCafe.rating),
          })
        } else {
          setCafe(null)
        }
      } catch (err) {
        console.error('Cafe detail loading error:', err)
        setError('Unable to load café information. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafe()
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center text-stone-500">
        Loading café information...
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="mt-4 inline-block font-bold text-coffee-700">
          Back to discover
        </Link>
      </main>
    )
  }

  if (!cafe) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center">
        <h1 className="text-2xl font-black text-coffee-900">
          Café not found
        </h1>
        <Link to="/" className="mt-4 inline-block font-bold text-coffee-700">
          Back to discover
        </Link>
      </main>
    )
  }

  const favourite = favourites.includes(cafe.id)

  return (
    <main className="mx-auto w-[min(1000px,92%)] py-10 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-coffee-700 hover:text-coffee-900"
      >
        <ArrowLeft size={17} />
        Back to discover
      </Link>

      <article className="mt-6 overflow-hidden rounded-3xl border border-coffee-100 bg-white shadow-xl shadow-coffee-900/8">

        {cafe.image ? (
          <img
            src={cafe.image}
            alt={cafe.name}
            className="h-72 w-full object-cover sm:h-105"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-coffee-50 sm:h-105">
            <span className="text-coffee-500">No image available</span>
          </div>
        )}

        <div className="p-6 sm:p-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-extrabold text-coffee-700">
                  {cafe.type}
                </span>

                {cafe.rating !== null && (
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                    <Star size={16} fill="currentColor" />
                    {cafe.rating} rating
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {cafe.name}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
                <MapPin size={16} />
                {[cafe.address, cafe.area].filter(Boolean).join(', ')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleFavourite(cafe.id)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                favourite
                  ? 'bg-coffee-700 text-white'
                  : 'border border-coffee-200 text-coffee-700 hover:bg-coffee-50'
              }`}
            >
              <Heart
                size={17}
                fill={favourite ? 'currentColor' : 'none'}
              />
              {favourite ? 'Saved' : 'Save café'}
            </button>
          </div>

          {/* Cafe Description */}
          <p className="mt-8 max-w-2xl leading-8 text-stone-600">
            {cafe.description || 'No description available yet.'}
          </p>

          {/* Customer Review Factors */}
          <div className="mt-8">
            <ReviewFactors />
          </div>

          {/* Why Visit */}
          <div className="mt-8 border-t border-coffee-100 pt-7">
            <h2 className="font-extrabold">Why visit?</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {cafe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-coffee-50 px-3 py-2 text-sm font-bold text-coffee-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      </article>
    </main>
  )
}
