
import { useEffect, useState } from 'react'
import { Coffee, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import CafeCard from '../../components/CafeCard'
import { favoriteApi } from '../../api/cafes'

export default function Favourites({
  user,
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  // Load approved cafes from Laravel
  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true)
        setError('')
        const result = await favoriteApi.list(page)
        const favoritePage = result.data
        setCafes((favoritePage.data || []).map((cafe) => ({
            ...cafe,
            area: cafe.area || cafe.township || '',
            address: cafe.street_address || '',
            tags: cafe.tags || [],
            lat: cafe.latitude,
            lng: cafe.longitude,
          })))
        setLastPage(favoritePage.last_page || 1)
      } catch (err) {
        console.error('Favourites loading error:', err)
        setError('Unable to load your favourite cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (user) loadFavorites()
  }, [page, user])

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

      {user && loading && (
        <p className="mt-8 text-center text-stone-500">
          Loading your favourites...
        </p>
      )}

      {error && (
        <p className="mt-8 text-center text-red-600">
          {error}
        </p>
      )}

      {!user && (
        <section className="mt-9 rounded-3xl border border-dashed border-coffee-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-extrabold">Sign in to see your favourites</h2>
          <Link to="/login" className="mt-5 inline-flex rounded-xl bg-coffee-700 px-5 py-3 font-bold text-white">Sign in</Link>
        </section>
      )}

      {user && !loading && !error && (
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
          {lastPage > 1 && <div className="mt-6 flex justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Previous</button>
            <span className="py-2 text-sm text-stone-600">Page {page} of {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Next</button>
          </div>}
        </>
      )}
    </main>
  )
}
