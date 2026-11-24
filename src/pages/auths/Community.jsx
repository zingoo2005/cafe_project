import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Plus, Star, Trash2, User } from 'lucide-react'
import { mediaUrl, postApi } from '../../api/cafes'
import { getPostPreviewTags } from '../../utils/postTags'

function unwrapPage(response) {
  const page = response.data
  return {
    posts: page?.data || [],
    currentPage: page?.current_page || 1,
    lastPage: page?.last_page || 1,
    total: page?.total || 0,
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : ''
}

export default function Community({ user }) {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageRef = useRef(1)

  const loadPosts = useCallback(async (pageNumber = 1, { showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true)
      setError('')

      let result = unwrapPage(await postApi.list(pageNumber))
      if (pageNumber > result.lastPage) {
        result = unwrapPage(await postApi.list(result.lastPage))
      }

      setPosts(result.posts)
      setPage(result.currentPage)
      pageRef.current = result.currentPage
      setLastPage(result.lastPage)
      setTotal(result.total)
    } catch (requestError) {
      console.error('Community post loading failed:', requestError)
      setError(requestError.message || 'Unable to load community posts.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()

    const refreshPosts = () => {
      if (document.visibilityState === 'visible') {
        loadPosts(pageRef.current, { showLoading: false })
      }
    }
    const refreshInterval = window.setInterval(refreshPosts, 30000)
    window.addEventListener('focus', refreshPosts)

    return () => {
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', refreshPosts)
    }
  }, [loadPosts])

  async function deletePost(post) {
    if (!window.confirm('Delete this post?')) return
    try {
      await postApi.remove(post.id)
      setPosts((current) => current.filter((item) => item.id !== post.id))
      setTotal((current) => Math.max(0, current - 1))
      await loadPosts(page)
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this post.')
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#493124]">Cafe Community</h1>
            <p className="mt-2 text-gray-500">Share café experiences and discover new places.</p>
          </div>
          <Link
            to={user ? '/community/create' : '/login'}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5e42] px-6 py-3 font-bold text-white transition hover:bg-[#70472f]"
          >
            <Plus size={20} /> Add Post
          </Link>
        </div>

        <p className="mb-6 text-[#493124]"><strong>{total}</strong> {total === 1 ? 'post' : 'posts'} found</p>

        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

        {loading ? (
          <p className="py-16 text-center text-gray-500">Loading community posts...</p>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddc9b5] bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-[#493124]">No Posts Yet</h2>
            <p className="mt-3 text-gray-500">Be the first to share your café experience.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const isOwner = String(post.user_id) === String(user?.id)
                const canDelete = isOwner || user?.role === 'admin'
                const purposes = post.purposes || []
                const previewTags = getPostPreviewTags(purposes, post.attraction_factors || [])
                return (
                  <article key={post.id} className="overflow-hidden rounded-3xl border border-[#eee1d5] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-64 bg-[#eee4da]">
                      {post.image || post.images?.[0] ? (
                        <img src={mediaUrl(post.image || post.images[0])} alt={post.cafe_name || post.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">No Image Uploaded</div>
                      )}
                      {post.category && <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#79543c] shadow">{post.category}</span>}
                    </div>
                    <div className="p-7">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-2xl font-extrabold text-[#493124]">{post.cafe?.name || post.cafe_name || post.title}</h2>
                        {post.rating && <div className="flex shrink-0 items-center gap-1 font-bold text-orange-600"><Star size={17} fill="currentColor" />{post.rating}</div>}
                      </div>
                      {(post.cafe?.township || post.township) && <p className="mt-3 flex items-center gap-2 text-gray-500"><MapPin size={17} />{post.cafe?.township || post.township}</p>}
                      <p className="mt-5 min-h-[56px] whitespace-pre-line leading-7 text-gray-600">{post.body}</p>
                      {purposes.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{purposes.map((purpose) => <span key={purpose} className="rounded-full bg-[#faf0e7] px-3 py-1.5 text-xs font-bold text-[#79543c]">{purpose}</span>)}</div>}
                      {previewTags.factors.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{previewTags.factors.map((factor) => <span key={factor} className="rounded-full bg-[#faf4ef] px-2.5 py-1.5 text-xs font-medium text-[#79543c]">{factor}</span>)}{previewTags.remainingFactors > 0 && <span className="rounded-full bg-[#faf0e7] px-2.5 py-1.5 text-xs font-semibold text-[#79543c]">+{previewTags.remainingFactors} more</span>}</div>}
                      <div className="mt-5 flex items-center justify-between gap-2 text-sm text-gray-500">
                        <span className="flex min-w-0 items-center gap-2"><User size={17} /><span className="truncate">{post.user?.name || 'CafeMate User'}</span></span>
                        <span className="flex shrink-0 items-center gap-1"><CalendarDays size={15} />{formatDate(post.created_at)}</span>
                      </div>
                      <Link to={`/community/post/${post.id}`} className="mt-5 flex w-full items-center justify-center rounded-xl border border-[#79543c] py-3.5 font-bold text-[#79543c] transition hover:bg-[#79543c] hover:text-white">View details</Link>
                      {canDelete && <button type="button" onClick={() => deletePost(post)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete Post</button>}
                    </div>
                  </article>
                )
              })}
            </div>
            {lastPage > 1 && <div className="mt-8 flex items-center justify-center gap-4">
              <button disabled={page <= 1} onClick={() => loadPosts(page - 1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Previous</button>
              <span className="text-sm text-stone-600">Page {page} of {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => loadPosts(page + 1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Next</button>
            </div>}
          </>
        )}
      </div>
    </main>
  )
}
