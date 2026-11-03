
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Star, Heart, Search } from 'lucide-react'
import { getCafes } from '../../api/cafes'

export default function Explore({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const navigate = useNavigate()

  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [purpose, setPurpose] = useState('All')
  const [township, setTownship] = useState('All')
  const [search, setSearch] = useState('')

  // Load all approved cafes from Laravel
  useEffect(() => {
    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        let page = 1
        let allCafes = []
        let hasMore = true

        while (hasMore) {
          const result = await getCafes(page, 30)

          const formattedCafes = result.data.map((cafe) => ({
            ...cafe,
            area: cafe.area || cafe.township || '',
            address: cafe.street_address || '',
            tags: cafe.tags || [],
            lat: cafe.latitude == null ? null : Number(cafe.latitude),
            lng: cafe.longitude == null ? null : Number(cafe.longitude),
            rating: cafe.rating == null ? null : Number(cafe.rating),
          }))

          allCafes = [...allCafes, ...formattedCafes]

          hasMore = result.meta.has_more
          page++
        }

        setCafes(allCafes)
      } catch (err) {
        console.error('Explore cafe loading error:', err)
        setError('Unable to load cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  // Get filter options from database records
  const purposes = [
    ...new Set(cafes.map((cafe) => cafe.type).filter(Boolean)),
  ]

  const townships = [
    ...new Set(cafes.map((cafe) => cafe.area).filter(Boolean)),
  ]

  // Filter cafes
  const results = useMemo(() => {
    return cafes.filter((cafe) => {
      const matchesPurpose =
        purpose === 'All' || cafe.type === purpose

      const matchesTownship =
        township === 'All' || cafe.area === township

      const searchText =
        `${cafe.name} ${cafe.area} ${cafe.type || ''}`.toLowerCase()

      const matchesSearch = searchText.includes(search.toLowerCase())

      return matchesPurpose && matchesTownship && matchesSearch
    })
  }, [cafes, purpose, township, search])

  // Open selected cafe on map
  function handleViewMap(cafe) {
    navigate('/map', {
      state: {
        selectedCafe: cafe,
      },
    })
  }

  return (
    <main className="mx-auto min-h-screen w-[92%] max-w-7xl py-10">

      {/* Page Header */}
      <div>
        <p className="font-bold uppercase tracking-widest text-coffee-500">
          Siplap Mandalay
        </p>

        <h1 className="mt-2 text-3xl font-black text-coffee-900">
          Explore Cafes
        </h1>

        <p className="mt-2 text-stone-600">
          Find the right cafe for your next visit in Mandalay.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mt-7 grid gap-3 md:grid-cols-3">

        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            type="text"
            placeholder="Search cafe name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-coffee-100 bg-white py-3 pl-10 pr-4 outline-none focus:border-coffee-500"
          />
        </div>

        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="rounded-xl border border-coffee-100 bg-white p-3 outline-none"
        >
          <option value="All">All cafe types</option>

          {purposes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={township}
          onChange={(e) => setTownship(e.target.value)}
          className="rounded-xl border border-coffee-100 bg-white p-3 outline-none"
        >
          <option value="All">All townships</option>

          {townships.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      {/* Results Count */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {results.length} cafés found
        </p>

        <Link
          to="/map"
          className="flex items-center gap-2 font-semibold text-coffee-700 hover:text-coffee-900"
        >
          <MapPin size={18} />
          Open Map
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-10 text-center text-stone-500">
          Loading cafés...
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-10 text-center text-red-600">
          {error}
        </p>
      )}

      {/* Cafe Cards */}
      {!loading && !error && (
        <>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {results.map((cafe) => {
              const isFavourite = favourites.includes(cafe.id)

              return (
                <article
                  key={cafe.id}
                  className="overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Cafe Image */}
                  <div className="relative">
                    {cafe.image ? (
                      <img
                        src={cafe.image}
                        alt={cafe.name}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-coffee-50">
                        <span className="text-sm text-coffee-500">
                          No image available
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleFavourite(cafe.id)}
                      aria-label={
                        isFavourite
                          ? 'Remove favourite'
                          : 'Add favourite'
                      }
                      className="absolute right-4 top-4 rounded-full bg-white p-3 shadow"
                    >
                      <Heart
                        size={20}
                        className={
                          isFavourite
                            ? 'fill-red-500 text-red-500'
                            : 'text-stone-600'
                        }
                      />
                    </button>

                    <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-coffee-800">
                      {cafe.type}
                    </span>
                  </div>

                  {/* Cafe Information */}
                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold text-coffee-900">
                        {cafe.name}
                      </h2>

                      {cafe.rating !== null && (
                        <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star
                            size={16}
                            className="fill-amber-500"
                          />
                          {cafe.rating}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                      <MapPin size={16} />
                      {cafe.area}
                    </p>

                    <p className="mt-2 text-sm text-stone-600">
                      {cafe.address}
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
                      {cafe.description}
                    </p>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cafe.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-medium text-coffee-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price, if available */}
                    {cafe.price && (
                      <p className="mt-4 font-bold text-coffee-800">
                        {cafe.price}
                      </p>
                    )}

                    {/* View on Map */}
                    <button
                      type="button"
                      onClick={() => handleViewMap(cafe)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-coffee-700 px-4 py-3 font-semibold text-white transition hover:bg-coffee-800"
                    >
                      <MapPin size={19} />
                      View on Map
                    </button>

                  </div>
                </article>
              )
            })}

          </div>

          {/* No Results */}
          {results.length === 0 && (
            <div className="py-16 text-center">
              <h2 className="text-xl font-bold text-coffee-900">
                No cafes found
              </h2>

              <p className="mt-2 text-stone-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </>
      )}

    </main>
  )
}
