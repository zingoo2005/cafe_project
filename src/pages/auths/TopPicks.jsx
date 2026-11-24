
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExploreCafeCard from '../../components/ExploreCafeCard'
import { getCafes, postApi } from '../../api/cafes'
import { groupCommunityPostsByCafe } from '../../utils/communityPosts'

export default function TopPicks({
  favourites = [],
  onToggleFavourite = () => {},
}) {
  const navigate = useNavigate()
  const [topCafes, setTopCafes] = useState([])
  const [communityPostsByCafe, setCommunityPostsByCafe] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [postsError, setPostsError] = useState('')

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

        let page = 1
        let lastPage = 1
        const posts = []

        try {
          do {
            const response = await postApi.list(page)
            const paginator = response.data
            posts.push(...(paginator?.data || []))
            lastPage = paginator?.last_page || page
            page += 1
          } while (page <= lastPage)

          setPostsError('')
          setCommunityPostsByCafe(groupCommunityPostsByCafe(sortedCafes, posts))
        } catch (postsRequestError) {
          console.error('Top Picks community post loading error:', postsRequestError)
          setPostsError('Unable to load community post details.')
          setCommunityPostsByCafe(new Map())
        }

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

  function handleViewMap(cafe) {
    navigate('/map', { state: { selectedCafe: cafe } })
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 sm:w-[92%] sm:px-0 sm:py-10">
      <h1 className="text-2xl font-black text-coffee-900 sm:text-3xl">
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
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {topCafes.map((cafe) => (
              <ExploreCafeCard
                key={cafe.id}
                cafe={cafe}
                posts={communityPostsByCafe.get(cafe.id) || []}
                isFavourite={favourites.includes(cafe.id)}
                onToggleFavourite={onToggleFavourite}
                onViewMap={handleViewMap}
                showRating
              />
            ))}
          </div>

          {postsError && (
            <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
              {postsError}
            </p>
          )}

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
