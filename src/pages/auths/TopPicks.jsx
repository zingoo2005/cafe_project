
import { useEffect, useState } from 'react'
import CafeCard from '../../components/CafeCard'
import { getCafes } from '../../api/cafes'

export default function TopPicks({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const [topCafes, setTopCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTopCafes() {
      try {
        setLoading(true)
        setError('')

        // Load up to 30 approved cafés
        const result = await getCafes(1, 30)

        const formattedCafes = result.data.map((cafe) => ({
          ...cafe,
          area: cafe.area || cafe.township || '',
          address: cafe.street_address || '',
          tags: cafe.tags || [],
          lat: cafe.latitude,
          lng: cafe.longitude,
        }))

        // Sort cafés by rating (highest first)
        const sortedCafes = formattedCafes.sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
        )

        setTopCafes(sortedCafes)
      } catch (err) {
        console.error('Top Picks loading error:', err)
        setError('Unable to load top cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadTopCafes()
  }, [])

  return (
    <main className="mx-auto w-[92%] max-w-7xl py-10">
      <h1 className="text-3xl font-black text-coffee-900">
        Top Picks
      </h1>

      <p className="mt-2 text-stone-600">
        Discover approved cafés ranked by their ratings.
      </p>

      {loading && (
        <p className="mt-8 text-center text-stone-500">
          Loading top cafés...
        </p>
      )}

      {error && (
        <p className="mt-8 text-center text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topCafes.map((cafe) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                isFavourite={favourites.includes(cafe.id)}
                onToggleFavourite={onToggleFavourite}
              />
            ))}
          </div>

          {topCafes.length === 0 && (
            <p className="mt-10 text-center text-stone-500">
              No approved cafés available yet.
            </p>
          )}
        </>
      )}
    </main>
  )
}
