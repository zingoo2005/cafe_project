
import { ArrowDown, Coffee, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CafeCard from '../../components/CafeCard'
import { getCafes } from '../../api/cafes'

const amenities = ['Wi-Fi', 'Power outlets', 'Quiet', 'Outdoor seating']
const PER_PAGE = 9
const POSTS_KEY = 'cafemate-community-posts'

export default function Home({ favourites = [], onToggleFavourite }) {
  const [cafes, setCafes] = useState([])
  const [totalCafes, setTotalCafes] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [communityPosts, setCommunityPosts] = useState([])

  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All areas')
  const [need, setNeed] = useState('All types')
  const [selectedAmenities, setSelectedAmenities] = useState([])

  // Load approved cafes from Laravel
  useEffect(() => {
    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        const result = await getCafes(1, PER_PAGE)

        const formattedCafes = result.data.map((cafe) => ({
          ...cafe,
          area: cafe.area || cafe.township || '',
          address: cafe.street_address || '',
          tags: cafe.tags || [],
          lat: cafe.latitude,
          lng: cafe.longitude,
        }))

        setCafes(formattedCafes)
        setTotalCafes(result.meta.total)
        setCurrentPage(result.meta.current_page)
        setHasMore(result.meta.has_more)
      } catch (err) {
        console.error('Cafe loading error:', err)
        setError('Unable to load cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  // Load community posts from localStorage
  useEffect(() => {
    function loadCommunityPosts() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(POSTS_KEY) || '[]'
        )

        const publicPosts = Array.isArray(saved)
          ? saved
              .filter((post) => post.visibility !== 'Private')
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) -
                  new Date(a.createdAt || 0)
              )
          : []

        setCommunityPosts(publicPosts)
      } catch (err) {
        console.error('Community posts loading error:', err)
        setCommunityPosts([])
      }
    }

    loadCommunityPosts()

    window.addEventListener('storage', loadCommunityPosts)

    return () => {
      window.removeEventListener('storage', loadCommunityPosts)
    }
  }, [])

  // Load more cafes
  async function handleShowMore() {
    try {
      setLoadingMore(true)
      setError('')

      const nextPage = currentPage + 1
      const result = await getCafes(nextPage, PER_PAGE)

      const formattedCafes = result.data.map((cafe) => ({
        ...cafe,
        area: cafe.area || cafe.township || '',
        address: cafe.street_address || '',
        tags: cafe.tags || [],
        lat: cafe.latitude,
        lng: cafe.longitude,
      }))

      setCafes((previousCafes) => [
        ...previousCafes,
        ...formattedCafes,
      ])

      setCurrentPage(result.meta.current_page)
      setTotalCafes(result.meta.total)
      setHasMore(result.meta.has_more)
    } catch (err) {
      console.error('Loading more cafes error:', err)
      setError('Unable to load more cafés. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  const results = useMemo(
    () =>
      cafes.filter((cafe) => {
        const tags = cafe.tags || []

        const text =
          `${cafe.name} ${cafe.area} ${cafe.type} ${tags.join(' ')}`.toLowerCase()

        return (
          text.includes(query.toLowerCase()) &&
          (area === 'All areas' || cafe.area === area) &&
          (need === 'All types' || cafe.type === need) &&
          selectedAmenities.every((item) => tags.includes(item))
        )
      }),
    [cafes, query, area, need, selectedAmenities],
  )

  const areas = [...new Set(cafes.map((cafe) => cafe.area).filter(Boolean))]
  const types = [...new Set(cafes.map((cafe) => cafe.type).filter(Boolean))]

  const ratedCafes = cafes.filter(
    (cafe) => cafe.rating !== null && cafe.rating !== undefined,
  )

  const averageRating = ratedCafes.length
    ? (
        ratedCafes.reduce(
          (total, cafe) => total + Number(cafe.rating),
          0,
        ) / ratedCafes.length
      ).toFixed(1)
    : '—'

  function toggleAmenity(item) {
    setSelectedAmenities((items) =>
      items.includes(item)
        ? items.filter((value) => value !== item)
        : [...items, item],
    )
  }

  function resetFilters() {
    setQuery('')
    setArea('All areas')
    setNeed('All types')
    setSelectedAmenities([])
  }

  return (
    <>
      {/* Hero Section */}
      <section className="overflow-hidden bg-[radial-gradient(circle_at_88%_15%,#ecd7c4_0%,transparent_28%),linear-gradient(#fcf7f2,#fcf7f2)] py-16 sm:py-22">
        <div className="mx-auto grid w-[min(1180px,92%)] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="mb-3 text-xs font-extrabold tracking-[0.2em] text-coffee-500 uppercase">
              Your Mandalay café guide
            </p>

            <h1 className="max-w-xl text-4xl font-black tracking-tight text-coffee-900 sm:text-6xl">
              Find your next{' '}
              <span className="text-coffee-500">favourite café.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-stone-600">
              Find places to work, study, meet friends, and slow down over good
              coffee—right here in Mandalay.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#discover"
                className="inline-flex items-center gap-2 rounded-xl bg-coffee-700 px-5 py-3 text-sm font-bold text-white hover:bg-coffee-900"
              >
                Discover cafés <ArrowDown size={16} />
              </a>

              <Link
                to="/favourites"
                className="rounded-xl border border-coffee-300 bg-white px-5 py-3 text-sm font-bold text-coffee-700 hover:bg-coffee-50"
              >
                View favourites
              </Link>
            </div>

            <div className="mt-10 flex gap-8 sm:gap-12">
              <Stat value={loading ? '...' : totalCafes} label="Approved cafés" />
              <Stat value={loading ? '...' : averageRating} label="Average rating" />
              <Stat value={loading ? '...' : areas.length} label="Mandalay areas" />
            </div>
          </div>

          <img
            className="h-78 w-full rounded-3xl object-cover shadow-2xl shadow-coffee-900/15 sm:h-105"
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1500&q=85"
            alt="A warm café interior"
          />
        </div>
      </section>

      {/* Cafe Discovery Section */}
      <main id="discover" className="mx-auto w-[min(1180px,92%)] py-16 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-coffee-500 uppercase">
              Find the right place
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Discover cafés
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-stone-500">
            Use a few details to find a café that fits your moment.
          </p>
        </div>

        <section
          className="mt-8 rounded-2xl border border-coffee-100 bg-white p-5 shadow-lg shadow-coffee-900/5 sm:p-7"
          aria-label="Café filters"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <label className="block text-xs font-extrabold tracking-wide text-coffee-900">
              SEARCH
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 w-full rounded-lg border border-coffee-100 bg-coffee-50 px-3.5 py-3 text-sm font-normal outline-none focus:border-coffee-500"
                placeholder="Name, area, or feature"
              />
            </label>

            <Select
              label="AREA"
              value={area}
              onChange={setArea}
              options={['All areas', ...areas]}
            />

            <Select
              label="WHAT ARE YOU LOOKING FOR?"
              value={need}
              onChange={setNeed}
              options={['All types', ...types]}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-extrabold tracking-wide text-coffee-900">
              AMENITIES
            </span>

            {amenities.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  selectedAmenities.includes(item)
                    ? 'border-coffee-700 bg-coffee-700 text-white'
                    : 'border-coffee-100 bg-coffee-50 text-coffee-700 hover:border-coffee-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('results')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 rounded-lg bg-coffee-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-coffee-900"
            >
              <Search size={16} />
              Search cafés
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-coffee-100 px-4 py-2.5 text-sm font-bold text-coffee-700 hover:bg-coffee-50"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </section>

        <div id="results" className="mt-9 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            <strong className="text-coffee-900">{results.length}</strong>{' '}
            cafés shown from {totalCafes} approved cafés
          </p>
          <SlidersHorizontal size={18} className="text-coffee-500" />
        </div>

        {loading && (
          <p className="mt-8 text-center text-stone-500">
            Loading cafés...
          </p>
        )}

        {error && (
          <p className="mt-8 text-center text-red-600">
            {error}
          </p>
        )}

        {!loading && (
          <>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isFavourite={favourites.includes(cafe.id)}
                  onToggleFavourite={onToggleFavourite}
                />
              ))}
            </div>

            {!results.length && (
              <div className="mt-5 rounded-2xl border border-dashed border-coffee-300 bg-white px-6 py-14 text-center">
                <Coffee className="mx-auto text-coffee-500" />
                <h3 className="mt-3 font-extrabold">
                  No cafés match these filters
                </h3>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 text-sm font-bold text-coffee-700 underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="rounded-xl bg-coffee-700 px-8 py-3 font-bold text-white transition hover:bg-coffee-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? 'Loading...' : 'Show More Cafés'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Latest Community Posts */}
      <section className="mx-auto w-[min(1180px,92%)] pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-coffee-500 uppercase">
              From our community
            </p>
            <h2 className="mt-2 text-3xl font-black text-coffee-900">
              Latest Community Posts
            </h2>
          </div>

          <Link
            to="/community"
            className="rounded-xl bg-coffee-700 px-5 py-3 text-center text-sm font-bold text-white hover:bg-coffee-900"
          >
            View All Posts
          </Link>
        </div>

        {communityPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-coffee-200 bg-white p-8 text-center text-stone-500">
            No community posts yet. Be the first to share!
            <div>
              <Link
                to="/community/create"
                className="mt-4 inline-block font-bold text-coffee-700 underline"
              >
                Create a Post
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communityPosts.slice(0, 3).map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.cafeName || 'Community post'}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-coffee-50 text-stone-400">
                    No Image Uploaded
                  </div>
                )}

                <div className="p-5">
                  {post.category && (
                    <span className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-bold text-coffee-700">
                      {post.category}
                    </span>
                  )}

                  <h3 className="mt-3 text-xl font-extrabold text-coffee-900">
                    {post.cafeName || 'Cafe Experience'}
                  </h3>

                  {post.location && (
                    <p className="mt-2 text-sm text-stone-500">
                      {post.location}
                    </p>
                  )}

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                    {post.content}
                  </p>

                  <p className="mt-4 text-sm text-stone-500">
                    By @{String(
                      post.authorUsername || post.authorName || 'user'
                    ).replace(/^@/, '')}
                  </p>

                  <Link
                    to={`/community/post/${post.id}`}
                    className="mt-4 block rounded-xl border border-coffee-700 py-3 text-center font-bold text-coffee-700 transition hover:bg-coffee-700 hover:text-white"
                  >
                    View Post
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-xs font-extrabold tracking-wide text-coffee-900">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-coffee-100 bg-coffee-50 px-3.5 py-3 text-sm font-normal outline-none focus:border-coffee-500"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <strong className="block text-xl font-black text-coffee-900">
        {value}
      </strong>
      <span className="text-xs text-stone-500">{label}</span>
    </div>
  )
}
