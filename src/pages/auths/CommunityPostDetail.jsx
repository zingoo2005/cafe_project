import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, Pencil, Send, Star, Trash2, Flag } from 'lucide-react'
import { getCafeReviewTargets, mediaUrl, postApi, reviewApi } from '../../api/cafes'
import CafeReviewForm, { CafeReviewTags } from '../../components/CafeReviewForm'
import { getPostTagGroups } from '../../utils/postTags'

export default function CommunityPostDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [cafe, setCafe] = useState(null)
  const [cafeReviews, setCafeReviews] = useState([])
  const [myCafeReview, setMyCafeReview] = useState(null)
  const [cafeReviewCount, setCafeReviewCount] = useState(0)
  const [cafeReviewError, setCafeReviewError] = useState('')
  const [loadingCafeReviews, setLoadingCafeReviews] = useState(false)

  const loadCafeReviews = useCallback(async (postData) => {
    setCafe(null)
    setCafeReviews([])
    setMyCafeReview(null)
    setCafeReviewError('')
    if (!postData.cafe && !postData.cafe_name) return

    setLoadingCafeReviews(true)
    try {
      let matchingCafe = postData.cafe || null
      let exactMatches = []
      if (!matchingCafe) {
        const cafesResponse = await getCafeReviewTargets(postData.cafe_name)
        exactMatches = cafesResponse.data || []
        matchingCafe = exactMatches.find(
          (candidate) => postData.township && candidate.township?.toLocaleLowerCase() === postData.township.toLocaleLowerCase()
        ) || (exactMatches.length === 1 ? exactMatches[0] : null)
      }

      if (!matchingCafe) {
        setCafeReviewError(
          exactMatches.length > 1
            ? 'More than one café has this name, so reviews cannot be linked unambiguously.'
            : 'This café is not registered yet, so reviews are unavailable.'
        )
        return
      }

      const [reviewsResponse, myReviewResponse] = await Promise.all([
        reviewApi.list(matchingCafe.id),
        user ? reviewApi.mine(matchingCafe.id) : Promise.resolve({ data: { data: null } }),
      ])
      setCafe(matchingCafe)
      setCafeReviews(reviewsResponse.data?.data || [])
      setCafeReviewCount(reviewsResponse.data?.review_count || 0)
      const ownReview = myReviewResponse.data?.data || null
      setMyCafeReview(ownReview)
    } catch (requestError) {
      console.error('Café reviews could not be loaded from community post:', requestError)
      setCafeReviewError(requestError.message || 'Unable to load reviews for this café.')
    } finally {
      setLoadingCafeReviews(false)
    }
  }, [user])

  const loadPost = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await postApi.show(id)
      setPost(response.data)
      setTitle(response.data.title)
      setBody(response.data.body)
      loadCafeReviews(response.data)
    } catch (requestError) {
      setError(requestError.message || 'This post is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [id, loadCafeReviews])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  const isOwner = String(post?.user_id) === String(user?.id)
  const canEdit = isOwner || user?.role === 'admin'
  const tagGroups = getPostTagGroups(post?.purposes || [], post?.attraction_factors || [])

  async function savePost(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await postApi.update(id, {
        title: title.trim(),
        body: body.trim(),
      })
      setPost(response.data)
      setEditing(false)
      setNotice('Post updated.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to update this post.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePost() {
    if (!window.confirm('Delete this post?')) return
    try {
      await postApi.remove(id)
      navigate('/community', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this post.')
    }
  }

  async function reportPost(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await postApi.report(id, reportReason.trim())
      setReportReason('')
      setNotice('Thank you. Your report was sent to the moderation team.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to report this post.')
    }
  }

  async function refreshCafeReviews(savedReview = null) {
    if (!cafe) return
    const reviewsResponse = await reviewApi.list(cafe.id)
    setCafeReviews(reviewsResponse.data?.data || [])
    setCafeReviewCount(reviewsResponse.data?.review_count || 0)
    setMyCafeReview(savedReview)
  }

  if (loading) {
    return <main className="min-h-[60vh] py-20 text-center text-stone-500">Loading post...</main>
  }

  if (!post) {
    return (
      <main className="min-h-[60vh] px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#493124]">Post unavailable</h1>
        {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
        <Link to="/community" className="mt-6 inline-flex items-center gap-2 font-bold text-[#79543c]"><ArrowLeft size={18} />Back to Community</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-3 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/community" className="mb-5 inline-flex items-center gap-2 font-semibold text-[#79543c] hover:text-[#493124]"><ArrowLeft size={19} />Community</Link>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-green-800">{notice}</p>}
        <article className="overflow-hidden rounded-3xl border border-[#eee1d5] bg-white shadow-sm">
          {post.image && <img src={mediaUrl(post.image)} alt={post.cafe_name || post.title} className="max-h-[460px] w-full object-cover" />}
          <div className="p-5 sm:p-8">
            {editing ? (
              <form onSubmit={savePost} className="space-y-4">
                <label className="block text-sm font-bold text-[#493124]">Post title
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} className="mt-2 w-full rounded-xl border p-3" />
                </label>
                <label className="block text-sm font-bold text-[#493124]">Post content
                  <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={20000} rows={8} className="mt-2 w-full rounded-xl border p-3" />
                </label>
                <div className="flex gap-3">
                  <button disabled={saving} className="rounded-xl bg-[#79543c] px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-xl border px-5 py-3 font-bold">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {post.category && <span className="rounded-full bg-[#faf0e7] px-4 py-2 text-sm font-semibold text-[#79543c]">{post.category}</span>}
                    <h1 className="mt-4 text-3xl font-extrabold text-[#493124] sm:text-4xl">{post.cafe?.name || post.cafe_name || post.title}</h1>
                    {(post.cafe?.township || post.township) && <p className="mt-3 flex items-center gap-2 text-gray-500"><MapPin size={18} />{post.cafe?.township || post.township}</p>}
                    {post.cafe?.status === 'approved' && <Link to={`/cafe/${post.cafe.id}`} className="mt-2 inline-flex text-sm font-semibold text-[#79543c] hover:underline">View café details</Link>}
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>{post.user?.name || 'CafeMate User'}</span><span>·</span><CalendarDays size={15} />{new Date(post.created_at).toLocaleDateString()}
                      {post.rating && <><span>·</span><Star size={15} fill="currentColor" className="text-orange-500" />{post.rating}</>}
                    </p>
                  </div>
                  {canEdit && <div className="flex gap-2">
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold text-[#79543c]"><Pencil size={16} />Edit</button>
                    <button onClick={deletePost} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600"><Trash2 size={16} />Delete</button>
                  </div>}
                </div>
                <p className="mt-7 whitespace-pre-wrap leading-8 text-gray-700">{post.body}</p>
                {post.purposes?.length > 0 && (
                  <section className="mt-7">
                    <h2 className="text-lg font-extrabold text-[#493124]">Purpose Tags</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.purposes.map((purpose) => (
                        <span key={purpose} className="rounded-full bg-[#faf0e7] px-3 py-2 text-sm font-semibold text-[#79543c]">{purpose}</span>
                      ))}
                    </div>
                  </section>
                )}
                {tagGroups.length > 0 && (
                  <section className="mt-6">
                    <h2 className="text-lg font-extrabold text-[#493124]">Attraction Factors</h2>
                    <p className="mt-1 text-sm text-gray-500">Features liked about this café.</p>
                    <div className="mt-4 space-y-4">
                      {tagGroups.map(({ purpose, factors }) => (
                        <div key={purpose}>
                          <h3 className="mb-2 text-sm font-bold text-[#79543c]">{purpose}</h3>
                          <div className="flex flex-wrap gap-2">
                            {factors.map((factor) => (
                              <span key={factor} className="rounded-full border border-[#eee1d5] bg-white px-3 py-2 text-sm font-medium text-[#493124]">{factor}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </article>

        <section className="mt-6 rounded-3xl border border-[#eee1d5] bg-white p-5 sm:p-7">
          <h2 className="text-2xl font-extrabold text-[#493124]">
            {cafe ? `Reviews for ${cafe.name}` : 'Café reviews'}
          </h2>
          {loadingCafeReviews ? (
            <p className="mt-3 text-sm text-gray-500">Loading café reviews...</p>
          ) : cafe ? (
            <>
              <p className="mt-1 text-sm text-gray-500">
                {cafeReviewCount} {cafeReviewCount === 1 ? 'review' : 'reviews'}
                {cafe.reviews_avg_rating != null && ` · ${Number(cafe.reviews_avg_rating).toFixed(1)} average`}
              </p>
              {user ? (
                <CafeReviewForm
                  cafeId={cafe.id}
                  review={myCafeReview}
                  onSaved={refreshCafeReviews}
                  onDeleted={() => refreshCafeReviews(null)}
                />
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  <Link to="/login" className="font-bold text-[#79543c]">Sign in</Link> to write a café review.
                </p>
              )}
              {cafeReviewError && <p role="alert" className="mt-3 text-sm text-red-600">{cafeReviewError}</p>}
              <div className="mt-6 space-y-3">
                {cafeReviews.map((review) => (
                  <article key={review.id} className="rounded-xl bg-[#faf7f2] p-4">
                    <div className="flex justify-between gap-3">
                      <strong>{review.user?.name || 'CafeMate User'}</strong>
                      <span className="flex items-center gap-1 text-amber-600"><Star size={15} fill="currentColor" />{review.rating}</span>
                    </div>
                    {review.body && <p className="mt-2 text-sm leading-6 text-gray-600">{review.body}</p>}
                    <CafeReviewTags review={review} />
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              {cafeReviewError || 'This post does not identify a café for reviews.'}
            </p>
          )}
        </section>

        {user && !isOwner && user.role !== 'admin' && (
          <form onSubmit={reportPost} className="mt-6 rounded-3xl border border-[#eee1d5] bg-white p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#493124]"><Flag size={19} />Report this post</h2>
            <p className="mt-2 text-sm text-gray-500">Tell moderators why this post should be reviewed.</p>
            <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} required minLength={5} maxLength={2000} rows={3} className="mt-4 w-full rounded-xl border p-3" placeholder="Reason for reporting" />
            <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#79543c] px-5 py-3 font-bold text-white"><Send size={16} />Send report</button>
          </form>
        )}
      </div>
    </main>
  )
}
