
import { useEffect, useState } from 'react'
import { Coffee, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import CafeCard from '../../components/CafeCard'
import { getCafes } from '../../api/cafes'

export default function Favourites({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load approved cafes from Laravel
  useEffect(() => {
    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        let page = 1
        let allCafes = []
        let hasMore = true

        // Load all available pages
        while (hasMore) {
          const result = await getCafes(page, 30)

          const formattedCafes = result.data.map((cafe) => ({
            ...cafe,
            area: cafe.area || cafe.township || '',
            address: cafe.street_address || '',
            tags: cafe.tags || [],
            lat: cafe.latitude,
            lng: cafe.longitude,
          }))

          allCafes = [...allCafes, ...formattedCafes]
          hasMore = result.meta.has_more
          page++
        }

        setCafes(allCafes)
      } catch (err) {
        console.error('Favourites loading error:', err)
        setError('Unable to load your favourite cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  const saved = cafes.filter((cafe) => favourites.includes(cafe.id))

  return (
    <main className="mx-auto min-h-[55vh] w-[min(1180px,92%)] py-14 sm:py-20">
      <p className="text-xs font-extrabold tracking-[0.18em] text-coffee-500 uppercase">
        Your saved places
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-tight">
        Favourites
      </h1>

      <p className="mt-3 text-stone-600">
        Keep your best café ideas in one easy list.
      </p>

      {loading && (
        <p className="mt-8 text-center text-stone-500">
          Loading your favourites...
        </p>
      )}

      {error && (
        <p className="mt-8 text-center text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {saved.length > 0 ? (
            <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isFavourite
                  onToggleFavourite={onToggleFavourite}
                />
              ))}
            </div>
          ) : (
            <section className="mt-9 rounded-3xl border border-dashed border-coffee-300 bg-white px-6 py-16 text-center">
              <span className="inline-grid size-14 place-items-center rounded-full bg-coffee-50 text-coffee-700">
                <Heart />
              </span>

              <h2 className="mt-4 text-xl font-extrabold">
                No favourites yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-600">
                Tap the heart on any café card to save it here for later.
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coffee-700 px-5 py-3 text-sm font-bold text-white hover:bg-coffee-900"
              >
                <Coffee size={16} />
                Discover cafés
              </Link>
            </section>
          )}
        </>
      )}
    </main>
  )
}
