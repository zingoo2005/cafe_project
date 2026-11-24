
import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CafeCard from '../../components/CafeCard'
import { getCafes, mediaUrl, postApi } from '../../api/cafes'
import { getPostPreviewTags } from '../../utils/postTags'

const PER_PAGE = 9

export default function Home({ favourites = [], onToggleFavourite }) {
  const [cafes, setCafes] = useState([])
  const [totalCafes, setTotalCafes] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [communityPosts, setCommunityPosts] = useState([])

  // Load approved cafes from Laravel API
  useEffect(() => {
    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        // Load all approved cafes without search filters
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
        setError(err.message || 'Unable to load cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  // Load published community posts from Laravel API
  useEffect(() => {
    async function loadCommunityPosts() {
      try {
        let page = 1
        let lastPage = 1
        const allPosts = []

        do {
          const response = await postApi.list(page)
          const paginator = response.data
          allPosts.push(...(paginator?.data || []))
          lastPage = paginator?.last_page || page
          page += 1
        } while (page <= lastPage)

        setCommunityPosts(allPosts)
      } catch (requestError) {
        console.error('Community post loading error:', requestError)
        setCommunityPosts([])
      }
    }

    loadCommunityPosts()
  }, [])

  // Load more cafes
  async function handleShowMore() {
    try {
      setLoadingMore(true)
      setError('')

      const nextPage = currentPage + 1

      // Load next page without search filters
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
      setError(err.message || 'Unable to load more cafés. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Calculate cafe statistics
  const areas = [
    ...new Set(cafes.map((cafe) => cafe.area).filter(Boolean)),
  ]

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

  function getCommunityPostsForCafe(cafe) {
    const normalize = (value) => String(value || '').trim().toLocaleLowerCase()

    return communityPosts.filter((post) => {
      if (post.cafe_id != null) {
        return String(post.cafe_id) === String(cafe.id)
      }

      const postCafeName = post.cafe?.name || post.cafe_name || post.title
      const postTownship = post.cafe?.township || post.township
      return normalize(postCafeName) === normalize(cafe.name) &&
        (!postTownship || !cafe.township || normalize(postTownship) === normalize(cafe.township))
    })
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
              <span className="text-coffee-500">
                favourite café.
              </span>
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
                Discover cafés
                <ArrowDown size={16} />
              </a>

              <Link
                to="/favourites"
                className="rounded-xl border border-coffee-300 bg-white px-5 py-3 text-sm font-bold text-coffee-700 hover:bg-coffee-50"
              >
                View favourites
              </Link>
            </div>

            <div className="mt-10 flex gap-8 sm:gap-12">
              <Stat
                value={loading ? '...' : totalCafes}
                label="Approved cafés"
              />

              <Stat
                value={loading ? '...' : averageRating}
                label="Average rating"
              />

              <Stat
                value={loading ? '...' : areas.length}
                label="Mandalay areas"
              />
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
      <main
        id="discover"
        className="mx-auto w-[min(1180px,92%)] py-16 sm:py-20"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-coffee-500 uppercase">
              {cafes.length ? 'Find the right place' : 'From our community'}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-coffee-900 sm:text-4xl">
              {cafes.length ? 'Discover cafés' : 'Community café posts'}
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-stone-500">
            Explore cafés and find the perfect place for your next moment.
          </p>

        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-8 text-center text-stone-500">
            Loading cafés...
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-8 text-center text-red-600">
            {error}
          </p>
        )}

        {!loading && (
          <>
            {cafes.length > 0 ? (
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cafes.map((cafe) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={{ ...cafe, community_posts: getCommunityPostsForCafe(cafe) }}
                    isFavourite={favourites.includes(cafe.id)}
                    onToggleFavourite={onToggleFavourite}
                  />
                ))}
              </div>
            ) : communityPosts.length > 0 ? (
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {communityPosts.slice(0, 9).map((post) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}

            {/* Show More */}
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="rounded-xl bg-coffee-700 px-8 py-3 font-bold text-white transition hover:bg-coffee-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore
                    ? 'Loading...'
                    : 'Show More Cafés'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Latest Community Posts */}
      {cafes.length > 0 && <section className="mx-auto w-[min(1180px,92%)] pb-16">

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

        {/* Empty Community Posts */}
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

          /* Community Post Cards */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {communityPosts.slice(0, 3).map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}

          </div>
        )}

      </section>}
    </>
  )
}

function CommunityPostCard({ post }) {
  const previewTags = getPostPreviewTags(post.purposes || [], post.attraction_factors || [])

  return (
    <article className="overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      {post.image || post.images?.[0] ? (
        <img
          src={mediaUrl(post.image || post.images[0])}
          alt={post.cafe?.name || post.cafe_name || post.title || 'Community post'}
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
          {post.cafe?.name || post.cafe_name || post.title || 'Cafe Experience'}
        </h3>
        {(post.cafe?.township || post.township) && (
          <p className="mt-2 text-sm text-stone-500">
            {post.cafe?.township || post.township}
          </p>
        )}
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{post.body}</p>
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
        <p className="mt-4 text-sm text-stone-500">
          By @{String(post.user?.name || 'CafeMate User').replace(/^@/, '')}
        </p>
        <Link
          to={`/community/post/${post.id}`}
          className="mt-4 block rounded-xl border border-coffee-700 py-3 text-center font-bold text-coffee-700 transition hover:bg-coffee-700 hover:text-white"
        >
          View details
        </Link>
      </div>
    </article>
  )
}

// Statistics Component
function Stat({ value, label }) {
  return (
    <div>
      <strong className="block text-xl font-black text-coffee-900">
        {value}
      </strong>

      <span className="text-xs text-stone-500">
        {label}
      </span>
    </div>
  )
}
