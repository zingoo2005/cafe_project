
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Coffee,
  Heart,
  MapPin,
  Search,
  Star,
  Users,
} from 'lucide-react'
import { getCafes, mediaUrl, postApi } from '../../api/cafes'
import { getPostPreviewTags } from '../../utils/postTags'

const CAFE_TYPES = [
  { name: 'Study', icon: BookOpen },
  { name: 'Relax', icon: Coffee },
  { name: 'Meeting', icon: Users },
  { name: 'Dating', icon: Heart },
  { name: 'Work', icon: BriefcaseBusiness },
  { name: 'Event', icon: CalendarDays },
]

export default function Explore({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const navigate = useNavigate()

  const [cafes, setCafes] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')

  const [selectedTypes, setSelectedTypes] = useState([])
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
            area: cafe.area || '',
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
        setError(err.message || 'Unable to load cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  useEffect(() => {
    async function loadPosts() {
      try {
        setPostsLoading(true)
        setPostsError('')

        let page = 1
        let allPosts = []
        let lastPage = 1

        do {
          const result = await postApi.list(page)
          const paginator = result.data
          allPosts = allPosts.concat(paginator?.data || [])
          lastPage = paginator?.last_page || page
          page += 1
        } while (page <= lastPage)

        setPosts(allPosts)
      } catch (requestError) {
        console.error('Explore community post loading error:', requestError)
        setPostsError(requestError.message || 'Unable to load community posts.')
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [])

  // Get filter options from database records
  const townships = [
    ...new Set(cafes.map((cafe) => cafe.township).filter(Boolean)),
  ]

  const communityPostsByCafe = useMemo(() => {
    const normalize = (value) => String(value || '').trim().toLocaleLowerCase()
    const postsByCafeId = new Map()

    cafes.forEach((cafe) => {
      const relatedPosts = posts.filter((post) => {
        if (post.cafe_id != null) {
          return String(post.cafe_id) === String(cafe.id)
        }

        const postCafeName = post.cafe?.name || post.cafe_name || post.title
        const postTownship = post.cafe?.township || post.township
        const matchesName = normalize(postCafeName) === normalize(cafe.name)
        const matchesTownship =
          !postTownship ||
          !cafe.township ||
          normalize(postTownship) === normalize(cafe.township)

        return matchesName && matchesTownship
      })

      postsByCafeId.set(cafe.id, relatedPosts)
    })

    return postsByCafeId
  }, [cafes, posts])

  // Filter cafes and their community posts together
  const results = useMemo(() => {
    return cafes.filter((cafe) => {
      const cafePosts = communityPostsByCafe.get(cafe.id) || []
      const matchesType =
        selectedTypes.length === 0 ||
        cafePosts.some((post) =>
          (post.purposes || []).some((purpose) =>
            selectedTypes.some((type) =>
              type.toLocaleLowerCase() === String(purpose).toLocaleLowerCase()
            )
          )
        )

      const matchesTownship =
        township === 'All' || cafe.township === township

      const matchesSearch = cafe.name
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())

      return matchesType && matchesTownship && matchesSearch
    })
  }, [cafes, communityPostsByCafe, selectedTypes, township, search])

  function toggleCafeType(type) {
    setSelectedTypes((currentTypes) => currentTypes.includes(type)
      ? currentTypes.filter((currentType) => currentType !== type)
      : [...currentTypes, type])
  }

  // Open selected cafe on map
  function handleViewMap(cafe) {
    navigate('/map', {
      state: {
        selectedCafe: cafe,
      },
    })
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 sm:w-[92%] sm:px-0 sm:py-10">

      {/* Page Header */}
      <div>
        <p className="font-bold uppercase tracking-widest text-coffee-500">
          Siplap Mandalay
        </p>

        <h1 className="mt-2 text-2xl font-black text-coffee-900 sm:text-3xl">
          Explore Cafes
        </h1>

        <p className="mt-2 text-stone-600">
          Find the right cafe for your next visit in Mandalay.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mt-7 grid gap-3 md:grid-cols-2">

        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            type="text"
            placeholder="Search cafe name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-coffee-100 bg-white py-3 pl-10 pr-4 outline-none focus:border-coffee-500"
          />
        </div>

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

      <fieldset className="mt-5">
        <legend className="mb-3 text-sm text-stone-600">Select one or more purposes:</legend>
        <div className="flex flex-wrap gap-2">
          {CAFE_TYPES.map(({ name, icon: Icon }) => {
            const isSelected = selectedTypes.includes(name)

            return (
              <button
                key={name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleCafeType(name)}
                className={`inline-flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-2.5 text-base transition ${
                  isSelected
                    ? 'border-coffee-700 bg-coffee-50 text-coffee-900'
                    : 'border-[#dfcfc4] bg-white text-coffee-900 hover:bg-coffee-50'
                }`}
              >
                <Icon size={21} strokeWidth={1.8} />
                {name}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Results Count */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">
          {results.length} cafés · {results.reduce(
            (total, cafe) =>
              total + (communityPostsByCafe.get(cafe.id) || []).length,
            0
          )} community posts
        </p>

        <Link
          to="/map"
          className="flex w-fit items-center gap-2 font-semibold text-coffee-700 hover:text-coffee-900"
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
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">

            {results.map((cafe) => {
              const isFavourite = favourites.includes(cafe.id)
              const cafePosts = (communityPostsByCafe.get(cafe.id) || [])
                .filter((post) =>
                  selectedTypes.length === 0 ||
                  (post.purposes || []).some((purpose) =>
                    selectedTypes.some((type) =>
                      type.toLocaleLowerCase() === String(purpose).toLocaleLowerCase()
                    )
                  )
                )

              if (cafePosts.length > 0) {
                return cafePosts.map((post) => {
                  const previewTags = getPostPreviewTags(post.purposes || [], post.attraction_factors || [])
                  const image = post.image || post.images?.[0] || cafe.image

                  return (
                  <article
                    key={`cafe-${cafe.id}-post-${post.id}`}
                    className="min-w-0 overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <Link
                      to={`/community/post/${post.id}`}
                      className="block"
                    >
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
                        <h2 className="text-2xl font-extrabold text-coffee-900">
                          {cafe.name}
                        </h2>
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
                        <Heart
                          size={19}
                          className={isFavourite ? 'fill-red-500 text-red-500' : ''}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewMap(cafe)}
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
                <article
                  key={cafe.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Cafe Image */}
                  <div className="relative">
                    {cafe.image ? (
                      <img
                        src={mediaUrl(cafe.image)}
                        alt={cafe.name}
                        className="h-44 w-full object-cover sm:h-52"
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
                      {[...new Set([cafe.area, cafe.township].filter(Boolean))].join(', ')}
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
                      className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coffee-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-coffee-800 sm:px-4 sm:text-base"
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
                No cafés found
              </h2>

              <p className="mt-2 text-stone-500">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {postsLoading && (
            <p className="mt-6 text-center text-sm text-stone-500">
              Loading community posts...
            </p>
          )}
          {postsError && (
            <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
              {postsError}
            </p>
          )}
        </>
      )}

    </main>
  )
}
