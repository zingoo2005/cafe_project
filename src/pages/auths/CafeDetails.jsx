import { useEffect, useState } from 'react'

import { ArrowLeft, Flag, Heart, MapPin, Star } from 'lucide-react'

import { Link, useParams } from 'react-router-dom'

import { getCafe, getCafeBadReviews, mediaUrl, reviewApi } from '../../api/cafes'

import CafeReviewForm, { CafeReviewTags } from '../../components/CafeReviewForm'


function normalizeStressValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return null

    const numeric = Number.parseFloat(trimmed.replace(/[^0-9.\-]/g, ''))

    if (!Number.isNaN(numeric)) {
      return numeric
    }

    const lower = trimmed.toLowerCase()

    if (/(low|calm|quiet|peaceful|relax|chill|easy)/.test(lower)) return 2
    if (/(moderate|normal|steady|balanced)/.test(lower)) return 3
    if (/(high|busy|crowded|loud|stressful|energetic|active)/.test(lower)) return 4
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeStressValue(item)

      if (normalized !== null) return normalized
    }
  }

  return null
}


function getStressMeta(cafe) {
  if (!cafe) return null

  const rawValue =
    cafe.stress ??
    cafe.stress_level ??
    cafe.stressLevel ??
    cafe.noise_level ??
    cafe.crowd_level ??
    cafe.ambience_level ??
    cafe.energy_level

  const normalized = normalizeStressValue(rawValue)

  if (normalized !== null) {
    const clamped = Math.min(Math.max(normalized, 1), 5)

    const label =
      clamped <= 2
        ? 'Low stress'
        : clamped === 3
          ? 'Moderate stress'
          : 'High stress'

    return {
      value: Number(clamped.toFixed(1)),
      label,
    }
  }

  const tagText = (cafe.tags || []).join(' ').toLowerCase()

  if (/(quiet|calm|peaceful|low stress|relaxing|slow)/.test(tagText)) {
    return { value: 2, label: 'Low stress' }
  }

  if (/(busy|crowded|loud|high stress|energetic|fast)/.test(tagText)) {
    return { value: 4, label: 'High stress' }
  }

  return null
}


export default function CafeDetail({
  favourites = [],
  onToggleFavourite = () => {},
  user = null,
}) {
  const { id } = useParams()

  const [cafe, setCafe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState(null)

  // Community Bad Reviews
  const [badReviews, setBadReviews] = useState([])


  useEffect(() => {
    async function loadCafe() {
      try {
        setLoading(true)
        setError('')

        const [
          cafeResult,
          reviewResult,
          myReviewResult,
          badReviewResult,
        ] = await Promise.all([
          getCafe(id),
          reviewApi.list(id),
          user
            ? reviewApi.mine(id)
            : Promise.resolve({ data: { data: null } }),
          getCafeBadReviews(id),
        ])

        const cafeData = cafeResult.data

        setCafe({
          ...cafeData,

          area: cafeData.area || cafeData.township || '',

          address: cafeData.street_address || '',

          tags: cafeData.tags || [],

          lat: cafeData.latitude == null ? null : Number(cafeData.latitude),

          lng: cafeData.longitude == null ? null : Number(cafeData.longitude),

          rating:
            cafeData.reviews_avg_rating == null
              ? cafeData.rating == null
                ? null
                : Number(cafeData.rating)
              : Number(cafeData.reviews_avg_rating),
        })


        // Normal Cafe Reviews
        const loadedReviews = reviewResult.data?.data || []

        setReviews(loadedReviews)


        // User's own review
        const ownReview = myReviewResult.data?.data

        setMyReview(ownReview || null)


        // ==========================================
        // FIXED: COMMUNITY BAD REVIEWS API RESPONSE
        // ==========================================

        const badReviewData =
          badReviewResult?.data?.data ??
          badReviewResult?.data ??
          badReviewResult

        setBadReviews(
          Array.isArray(badReviewData)
            ? badReviewData
            : []
        )

      } catch (err) {
        console.error('Cafe detail loading error:', err)

        setError('Unable to load café information. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafe()

  }, [id, user])


  async function refreshReviews(savedReview = null) {
    const result = await reviewApi.list(id)

    setReviews(result.data?.data || [])

    setMyReview(savedReview)

    setCafe((current) => ({
      ...current,
      rating: result.data.rating,
    }))
  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center text-stone-500">
        Loading café information...
      </main>
    )
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center">
        <p className="text-red-600">{error}</p>

        <Link
          to="/"
          className="mt-4 inline-block font-bold text-coffee-700"
        >
          Back to discover
        </Link>
      </main>
    )
  }


  // ==========================================
  // CAFE NOT FOUND
  // ==========================================

  if (!cafe) {
    return (
      <main className="mx-auto w-[min(1000px,92%)] py-20 text-center">
        <h1 className="text-2xl font-black text-coffee-900">
          Café not found
        </h1>

        <Link
          to="/"
          className="mt-4 inline-block font-bold text-coffee-700"
        >
          Back to discover
        </Link>
      </main>
    )
  }


  const favourite = favourites.includes(cafe.id)

  const stress = getStressMeta(cafe)


  return (
    <main className="mx-auto w-[min(1000px,92%)] py-10 sm:py-14">

      {/* BACK BUTTON */}

      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-coffee-700 hover:text-coffee-900"
      >
        <ArrowLeft size={17} />
        Back to discover
      </Link>


      {/* ==========================================
          CAFE INFORMATION
      ========================================== */}

      <article className="mt-6 overflow-hidden rounded-3xl border border-coffee-100 bg-white shadow-xl shadow-coffee-900/8">

        {/* Cafe Image */}

        {cafe.image ? (
          <img
            src={mediaUrl(cafe.image)}
            alt={cafe.name}
            className="h-72 w-full object-cover sm:h-105"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-coffee-50 sm:h-105">
            <span className="text-coffee-500">
              No image available
            </span>
          </div>
        )}


        <div className="p-6 sm:p-10">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

            <div>

              {/* Cafe Information */}

              <div className="flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-extrabold text-coffee-700">
                  {cafe.type}
                </span>


                {/* Rating */}

                {cafe.rating !== null && (
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                    <Star size={16} fill="currentColor" />
                    {cafe.rating} rating
                  </span>
                )}


                {/* Stress Level */}

                {stress && (
                  <span className="rounded-full border border-coffee-200 bg-coffee-50 px-3 py-1 text-xs font-extrabold text-coffee-700">
                    Stress: {stress.label}
                    {stress.value !== null && ` (${stress.value}/5)`}
                  </span>
                )}

              </div>


              {/* Cafe Name */}

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {cafe.name}
              </h1>


              {/* Location */}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">

                {cafe.area && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-coffee-100 bg-coffee-50 px-2.5 py-1.5">

                    <MapPin size={14} />

                    <span className="font-semibold text-stone-700">
                      Township:
                    </span>

                    {cafe.area}

                  </span>
                )}


                {cafe.address && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-coffee-100 bg-white px-2.5 py-1.5">

                    <span className="font-semibold text-stone-700">
                      Street:
                    </span>

                    {cafe.address}

                  </span>
                )}

              </div>

            </div>


            {/* Favourite Button */}

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


          {/* Why Visit */}

          <div className="mt-8 border-t border-coffee-100 pt-7">

            <h2 className="font-extrabold">
              Why visit?
            </h2>

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


      {/* ==========================================
          COMMUNITY POSTS
      ========================================== */}

      {cafe.community_posts?.length > 0 && (

        <section className="mt-6 rounded-3xl border border-coffee-100 bg-white p-6 sm:p-8">

          <h2 className="text-2xl font-black text-coffee-900">
            Community posts about {cafe.name}
          </h2>


          <div className="mt-4 space-y-3">

            {cafe.community_posts.map((post) => (

              <Link
                key={post.id}
                to={`/community/post/${post.id}`}
                className="block rounded-xl bg-coffee-50 p-4 transition hover:bg-coffee-100"
              >

                <h3 className="font-bold text-coffee-800">
                  {post.title}
                </h3>


                <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">
                  {post.body}
                </p>


                <p className="mt-2 text-xs text-stone-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>

              </Link>

            ))}

          </div>

        </section>

      )}


      {/* ==========================================
          COMMUNITY BAD REVIEWS
      ========================================== */}

      <section className="mt-6 rounded-3xl border border-red-200 bg-white p-6 sm:p-8">

        <div className="flex items-start gap-3">

          <div className="rounded-xl bg-red-100 p-3 text-red-600">
            <Flag size={22} />
          </div>

          <div>

            <h2 className="text-2xl font-black text-red-800">
              Community Bad Reviews
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Community reports reviewed by the administrator.
            </p>

          </div>

        </div>


        {/* Bad Reviews Exist */}

        {badReviews.length > 0 ? (

          <div className="mt-6 space-y-4">

            {badReviews.map((report) => (

              <article
                key={report.id}
                className="rounded-2xl border border-red-100 bg-red-50 p-5"
              >

                {/* Reporter */}

                <div className="flex flex-wrap items-center justify-between gap-2">

                  <p className="font-bold text-stone-800">
                    {report.reporter?.name || 'Community User'}
                  </p>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    Admin Reviewed
                  </span>

                </div>


                {/* Report Reason */}

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {report.reason}
                </p>


                {/* Original Post */}

                {report.post && (

                  <div className="mt-4 rounded-xl border border-red-100 bg-white p-4">

                    <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
                      Original Community Post
                    </p>


                    <h3 className="mt-2 font-bold text-stone-800">
                      {report.post.title}
                    </h3>


                    {report.post.body && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                        {report.post.body}
                      </p>
                    )}


                    <Link
                      to={`/community/post/${report.post.id}`}
                      className="mt-3 inline-block text-sm font-bold text-coffee-700 hover:underline"
                    >
                      View original post →
                    </Link>

                  </div>

                )}


                {/* Report Date */}

                <p className="mt-3 text-xs text-stone-400">
                  {report.created_at
                    ? new Date(report.created_at).toLocaleDateString()
                    : ''}
                </p>

              </article>

            ))}

          </div>

        ) : (

          /* No Bad Reviews */

          <div className="mt-6 rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-8 text-center">

            <Flag size={28} className="mx-auto text-red-300" />

            <h3 className="mt-3 font-bold text-stone-700">
              No community bad reviews yet
            </h3>

            <p className="mt-2 text-sm text-stone-500">
              Administrator-reviewed community reports will appear here.
            </p>

          </div>

        )}

      </section>


      {/* ==========================================
          CAFE REVIEWS
      ========================================== */}

      <section className="mt-6 rounded-3xl border border-coffee-100 bg-white p-6 sm:p-8">

        <h2 className="text-2xl font-black text-coffee-900">
          Café reviews
        </h2>


        {/* Review Count */}

        <p className="mt-1 text-sm text-stone-500">

          {reviews.length} review{reviews.length === 1 ? '' : 's'}

          {cafe.rating != null &&
            ` · ${Number(cafe.rating).toFixed(1)} average`}

        </p>


        {/* Review Form */}

        {user ? (

          <CafeReviewForm
            cafeId={id}
            review={myReview}
            onSaved={refreshReviews}
            onDeleted={() => refreshReviews(null)}
          />

        ) : (

          <p className="mt-4 text-sm text-stone-600">

            <Link
              to="/login"
              className="font-bold text-coffee-700"
            >
              Sign in
            </Link>{' '}

            to leave a review.

          </p>

        )}


        {/* Review List */}

        <div className="mt-6 space-y-3">

          {reviews.map((review) => (

            <article
              key={review.id}
              className="rounded-xl bg-coffee-50 p-4"
            >

              <div className="flex justify-between gap-3">

                <strong>
                  {review.user?.name || 'CafeMate User'}
                </strong>


                <span className="flex items-center gap-1 text-amber-600">

                  <Star size={15} fill="currentColor" />

                  {review.rating}

                </span>

              </div>


              {/* Review Text */}

              {review.body && (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {review.body}
                </p>
              )}


              {/* Review Tags */}

              <CafeReviewTags review={review} />

            </article>

          ))}

        </div>

      </section>

    </main>
  )
}