import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Star,
  BookOpen,
  Coffee,
  Users,
  Heart,
  BriefcaseBusiness,
  CalendarDays,
  Wifi,
  Plug,
  Armchair,
  Music,
  VolumeX,
  Utensils,
  Check,
  MessageCircle,
} from 'lucide-react'

const POSTS_KEY = 'cafemate-community-posts'
const REVIEWS_KEY = 'cafemate-community-reviews'
const SESSION_KEY = 'cafemate-session'

const purposeOptions = [
  { name: 'Study', icon: BookOpen },
  { name: 'Relax', icon: Coffee },
  { name: 'Meeting', icon: Users },
  { name: 'Dating', icon: Heart },
  { name: 'Work', icon: BriefcaseBusiness },
  { name: 'Event', icon: CalendarDays },
]

const factorSuggestions = {
  Study: [
    'Quiet Environment',
    'Fast Wi-Fi',
    'Power Outlets',
    'Comfortable Seating',
    'Large Study Tables',
  ],
  Relax: [
    'Peaceful Atmosphere',
    'Good Music',
    'Cozy Ambience',
    'Comfortable Seating',
    'Nice Interior',
  ],
  Meeting: [
    'Large Tables',
    'Group Seating',
    'Friendly Staff',
    'Spacious Environment',
    'Easy Conversation',
  ],
  Dating: [
    'Romantic Atmosphere',
    'Beautiful Interior',
    'Cozy Seating',
    'Good Music',
    'Nice Lighting',
  ],
  Work: [
    'Fast Wi-Fi',
    'Power Outlets',
    'Quiet Environment',
    'Comfortable Seating',
    'Work-Friendly Tables',
  ],
  Event: [
    'Spacious Environment',
    'Group Seating',
    'Beautiful Interior',
    'Friendly Staff',
    'Photo-Friendly Space',
  ],
}

const factorIcons = {
  'Quiet Environment': VolumeX,
  'Fast Wi-Fi': Wifi,
  'Power Outlets': Plug,
  'Comfortable Seating': Armchair,
  'Good Music': Music,
  'Large Tables': Users,
  'Group Seating': Users,
  'Peaceful Atmosphere': Coffee,
  'Cozy Ambience': Coffee,
  'Friendly Staff': Heart,
  'Spacious Environment': Users,
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function getUserId(user) {
  return String(
    user?.id ||
    user?.email ||
    user?.username ||
    ''
  )
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString()
}

function getReviewFactorList(review) {
  if (Array.isArray(review.attractionFactors)) {
    return review.attractionFactors
  }

  if (review.factorSelections) {
    return Object.values(review.factorSelections).flat()
  }

  return []
}

export default function CommunityPostDetail() {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [reviews, setReviews] = useState([])
  const [currentUser, setCurrentUser] = useState(
    () => readJSON(SESSION_KEY, null)
  )

  const [selectedPurposes, setSelectedPurposes] = useState([])
  const [selectedFactors, setSelectedFactors] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeInsight, setActiveInsight] = useState('purpose')

  const userId = getUserId(currentUser)

  function loadPageData() {
    const allPosts = readJSON(POSTS_KEY, [])
    const foundPost = allPosts.find(
      (item) => String(item.id) === String(id)
    )

    const allReviews = readJSON(REVIEWS_KEY, [])

    setPost(foundPost || null)
    setReviews(
      allReviews.filter(
        (review) => String(review.postId) === String(id)
      )
    )
    setCurrentUser(readJSON(SESSION_KEY, null))
  }

  useEffect(() => {
    loadPageData()
  }, [id])

  const myReview = reviews.find(
    (review) => String(review.authorId) === userId
  )

  // Load the current user's previous review for editing.
  useEffect(() => {
    if (!myReview) {
      setSelectedPurposes([])
      setSelectedFactors({})
      return
    }

    setSelectedPurposes(myReview.purposes || [])

    if (myReview.factorSelections) {
      setSelectedFactors(myReview.factorSelections)
    } else {
      setSelectedFactors({})
    }
  }, [myReview?.id, myReview?.updatedAt])

  const visibleFactors = useMemo(() => {
    return selectedPurposes.reduce((all, purpose) => {
      all[purpose] = factorSuggestions[purpose] || []
      return all
    }, {})
  }, [selectedPurposes])

  function togglePurpose(purpose) {
    setSelectedPurposes((current) => {
      const exists = current.includes(purpose)

      if (exists) {
        setSelectedFactors((old) => {
          const updated = { ...old }
          delete updated[purpose]
          return updated
        })

        return current.filter((item) => item !== purpose)
      }

      return [...current, purpose]
    })

    setMessage('')
    setError('')
  }

  function toggleFactor(purpose, factor) {
    setSelectedFactors((current) => {
      const currentList = current[purpose] || []
      const exists = currentList.includes(factor)

      return {
        ...current,
        [purpose]: exists
          ? currentList.filter((item) => item !== factor)
          : [...currentList, factor],
      }
    })

    setMessage('')
    setError('')
  }

  const selectedFactorCount = Object.values(selectedFactors)
    .flat()
    .length

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const user = readJSON(SESSION_KEY, null)
    const authorId = getUserId(user)

    if (!authorId) {
      setError('Please log in before submitting a review.')
      return
    }

    if (!selectedPurposes.length) {
      setError('Please choose at least one visit purpose.')
      return
    }

    if (!selectedFactorCount) {
      setError('Please select at least one Attraction Factor.')
      return
    }

    const existingReviews = readJSON(REVIEWS_KEY, [])

    const previousReview = existingReviews.find(
      (review) =>
        String(review.postId) === String(id) &&
        String(review.authorId) === authorId
    )

    const factorSelections = {}

    selectedPurposes.forEach((purpose) => {
      factorSelections[purpose] = selectedFactors[purpose] || []
    })

    const allSelectedFactors = [
      ...new Set(Object.values(factorSelections).flat()),
    ]

    const reviewData = {
      id: previousReview?.id ||
        `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId: id,
      authorId,
      authorUsername:
        user.username ||
        user.name ||
        user.email?.split('@')[0] ||
        'user',
      purposes: selectedPurposes,
      factorSelections,
      attractionFactors: allSelectedFactors,
      createdAt: previousReview?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedReviews = previousReview
      ? existingReviews.map((review) =>
          review.id === previousReview.id
            ? reviewData
            : review
        )
      : [...existingReviews, reviewData]

    try {
      localStorage.setItem(
        REVIEWS_KEY,
        JSON.stringify(updatedReviews)
      )

      setReviews(
        updatedReviews.filter(
          (review) => String(review.postId) === String(id)
        )
      )

      setMessage(
        previousReview
          ? 'Your review has been updated successfully!'
          : 'Your review has been submitted successfully!'
      )
    } catch {
      setError('Could not save your review. Please try again.')
    }
  }

  const purposeCounts = purposeOptions.map((purpose) => {
    const count = reviews.filter((review) =>
      (review.purposes || []).includes(purpose.name)
    ).length

    return {
      name: purpose.name,
      count,
      percent: reviews.length
        ? Math.round((count / reviews.length) * 100)
        : 0,
      icon: purpose.icon,
    }
  })

  const factorCounts = useMemo(() => {
    const counts = {}

    reviews.forEach((review) => {
      const factors = [...new Set(getReviewFactorList(review))]

      factors.forEach((factor) => {
        counts[factor] = (counts[factor] || 0) + 1
      })
    })

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: reviews.length
          ? Math.round((count / reviews.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [reviews])

  if (!post) {
    return (
      <main className="min-h-screen bg-[#faf7f2] px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#493124]">
            Post Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            This community post may have been deleted or is unavailable.
          </p>

          <Link
            to="/community"
            className="mt-6 inline-flex items-center gap-2 font-bold text-[#79543c]"
          >
            <ArrowLeft size={18} />
            Back to Community
          </Link>
        </div>
      </main>
    )
  }

  const cafeName =
    post.cafeName || post.name || 'Cafe Experience'

  const location =
    post.location ||
    [post.address, post.area].filter(Boolean).join(', ')

  const postFactors = Array.isArray(post.attractionFactors)
    ? post.attractionFactors
    : []

  return (
    <main className="min-h-screen bg-[#faf7f2] px-3 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">

        {/* Back link */}
        <Link
          to="/community"
          className="mb-5 inline-flex items-center gap-2 font-semibold text-[#79543c] hover:text-[#493124]"
        >
          <ArrowLeft size={19} />
          Community
        </Link>

        {/* Cafe information */}
        <section className="grid gap-6 rounded-3xl border border-[#eee1d5] bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-7">

          <div className="min-h-[250px] overflow-hidden rounded-2xl bg-[#eee4da]">
            {post.image ? (
              <img
                src={post.image}
                alt={cafeName}
                className="h-full max-h-[390px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[250px] items-center justify-center text-gray-400">
                No Cafe Photo
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              {post.category && (
                <span className="rounded-full bg-[#faf0e7] px-4 py-2 text-sm font-semibold text-[#79543c]">
                  {post.category}
                </span>
              )}

              {post.rating != null && (
                <span className="flex items-center gap-1 font-bold text-orange-600">
                  <Star size={18} fill="currentColor" />
                  {post.rating}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold text-[#493124] sm:text-4xl">
              {cafeName}
            </h1>

            {location && (
              <p className="mt-3 flex items-center gap-2 text-gray-500">
                <MapPin size={19} />
                {location}
              </p>
            )}

            <p className="mt-3 text-sm text-gray-500">
              Posted by @
              {String(
                post.authorUsername || post.authorName || 'user'
              ).replace(/^@/, '')}
              {post.createdAt && ` · ${formatDate(post.createdAt)}`}
            </p>

            <p className="mt-5 whitespace-pre-wrap leading-7 text-gray-600">
              {post.content || post.description || 'No description provided.'}
            </p>

            {postFactors.length > 0 && (
              <div className="mt-5">
                <h2 className="font-bold text-[#493124]">
                  Post Attraction Factors
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Factors shared by the post creator.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {postFactors.map((factor, index) => (
                    <span
                      key={`${factor}-${index}`}
                      className="rounded-full bg-[#faf0e7] px-3 py-2 text-sm font-semibold text-[#79543c]"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main review and insights */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]">

          {/* Review form */}
          <section className="rounded-3xl border border-[#eee1d5] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#eee1d5] pb-5">
              <MessageCircle size={28} className="text-[#79543c]" />
              <div>
                <h2 className="text-2xl font-extrabold text-[#493124]">
                  Write a Community Review
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tell others how you use this cafe.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Purpose selection */}
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9b633b] font-bold text-white">
                    1
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[#493124]">
                      What do you use this café for?
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select all that apply.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {purposeOptions.map((purpose) => {
                    const Icon = purpose.icon
                    const checked = selectedPurposes.includes(purpose.name)

                    return (
                      <button
                        key={purpose.name}
                        type="button"
                        onClick={() => togglePurpose(purpose.name)}
                        aria-pressed={checked}
                        className={`flex min-h-[62px] items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-left font-semibold transition ${
                          checked
                            ? 'border-[#9b633b] bg-[#fbebdc] text-[#68432d]'
                            : 'border-[#e7ddd5] bg-white text-[#493124] hover:border-[#c7a58d]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={21} />
                          {purpose.name}
                        </span>

                        {checked && (
                          <Check size={19} className="shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic attraction factors */}
              <div className="mt-8 border-t border-[#eee1d5] pt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9b633b] font-bold text-white">
                    2
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[#493124]">
                      Attraction Factors
                    </h3>
                    <p className="text-sm text-gray-500">
                      Suggested factors based on your selected purposes.
                    </p>
                  </div>
                </div>

                {selectedPurposes.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[#ddc9b5] bg-[#faf7f2] p-5 text-center text-sm text-gray-500">
                    Choose one or more purposes above to see suitable Attraction Factors.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {selectedPurposes.map((purpose) => {
                      const Icon =
                        purposeOptions.find((item) => item.name === purpose)?.icon ||
                        Coffee

                      return (
                        <div
                          key={purpose}
                          className="rounded-2xl border border-[#e7ddd5] bg-[#faf7f2] p-4"
                        >
                          <div className="mb-3 flex items-center gap-2 font-bold text-[#493124]">
                            <Icon size={21} />
                            {purpose}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(visibleFactors[purpose] || []).map((factor) => {
                              const checked = (
                                selectedFactors[purpose] || []
                              ).includes(factor)

                              const FactorIcon = factorIcons[factor]

                              return (
                                <button
                                  key={factor}
                                  type="button"
                                  onClick={() =>
                                    toggleFactor(purpose, factor)
                                  }
                                  aria-pressed={checked}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                    checked
                                      ? 'border-[#a66d43] bg-[#f8e5d4] text-[#68432d]'
                                      : 'border-[#ded4cc] bg-white text-[#493124] hover:border-[#b88a68]'
                                  }`}
                                >
                                  {FactorIcon && (
                                    <FactorIcon size={16} />
                                  )}
                                  {factor}
                                  {checked && <Check size={15} />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-[#eee1d5] pt-4 text-sm text-gray-600">
                  <span>
                    Selected: {selectedPurposes.length} purposes
                  </span>
                  <span>
                    {selectedFactorCount} attraction factors
                  </span>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#895735] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#68432d]"
              >
                {myReview ? 'Update My Review' : 'Submit Review'}
              </button>

              {myReview && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  You have already reviewed this cafe. Submitting again updates your existing review.
                </p>
              )}
            </form>
          </section>

          {/* Community insights */}
          <aside className="space-y-6">

            {/* Purpose insights */}
            <section className="rounded-3xl border border-[#eee1d5] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <MessageCircle size={25} className="text-[#79543c]" />
                <h2 className="text-xl font-extrabold text-[#493124]">
                  Community Insights
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f4ebe4] p-1">
                <button
                  type="button"
                  onClick={() => setActiveInsight('purpose')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeInsight === 'purpose'
                      ? 'bg-[#895735] text-white'
                      : 'text-[#493124]'
                  }`}
                >
                  By Purpose
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInsight('factor')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeInsight === 'factor'
                      ? 'bg-[#895735] text-white'
                      : 'text-[#493124]'
                  }`}
                >
                  By Attraction Factor
                </button>
              </div>

              {activeInsight === 'purpose' ? (
                <div className="mt-5">
                  <h3 className="mb-4 font-bold text-[#493124]">
                    How people use this café
                  </h3>

                  {purposeCounts.map((item) => {
                    const Icon = item.icon

                    return (
                      <div
                        key={item.name}
                        className="mb-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 font-medium text-[#493124]">
                            <Icon size={18} />
                            {item.name}
                          </span>
                          <span className="text-gray-600">
                            {item.percent}% ({item.count})
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[#eee8e3]">
                          <div
                            className="h-full rounded-full bg-[#a66d43] transition-all"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <h3 className="mb-4 font-bold text-[#493124]">
                    Most selected factors
                  </h3>

                  {factorCounts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No attraction factor reviews yet.
                    </p>
                  ) : (
                    factorCounts.slice(0, 8).map((item) => (
                      <div
                        key={item.name}
                        className="mb-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-[#493124]">
                            {item.name}
                          </span>
                          <span className="text-gray-600">
                            {item.percent}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[#eee8e3]">
                          <div
                            className="h-full rounded-full bg-[#a66d43]"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <p className="mt-5 border-t border-[#eee1d5] pt-4 text-xs text-gray-500">
                Based on {reviews.length} community review(s). Percentages can add up to more than 100% because people can select multiple purposes and factors.
              </p>
            </section>

            {/* Top attraction factors */}
            <section className="rounded-3xl border border-[#eee1d5] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-extrabold text-[#493124]">
                Top Attraction Factors
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Most selected factors from community reviews.
              </p>

              {factorCounts.length === 0 ? (
                <p className="mt-5 text-sm text-gray-500">
                  No factors selected yet. Be the first to review this cafe.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {factorCounts.slice(0, 6).map((item) => {
                    const Icon = factorIcons[item.name] || Utensils

                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 border-b border-[#eee1d5] pb-3 last:border-0"
                      >
                        <span className="flex items-center gap-3 text-sm font-medium text-[#493124]">
                          <Icon size={19} className="text-[#895735]" />
                          {item.name}
                        </span>
                        <span className="shrink-0 font-semibold text-[#493124]">
                          {item.percent}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* Community reviews */}
        <section className="mt-6 rounded-3xl border border-[#eee1d5] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-2xl font-extrabold text-[#493124]">
            Community Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No community reviews yet. Be the first to share how you use this cafe!
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl bg-[#faf7f2] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[#493124]">
                      @{String(review.authorUsername || 'user').replace(/^@/, '')}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(review.updatedAt || review.createdAt)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#493124]">
                    Visit Purposes
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(review.purposes || []).map((purpose) => (
                      <span
                        key={purpose}
                        className="rounded-full bg-[#f0dfd1] px-3 py-1.5 text-sm text-[#68432d]"
                      >
                        {purpose}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#493124]">
                    Attraction Factors
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {getReviewFactorList(review).map((factor) => (
                      <span
                        key={factor}
                        className="rounded-full bg-white px-3 py-1.5 text-sm text-[#79543c]"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}