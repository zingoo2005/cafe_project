import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Star,
  Heart,
  Plus,
  CalendarDays,
  User,
} from 'lucide-react'

const POSTS_KEY = 'cafemate-community-posts'
const SESSION_KEY = 'cafemate-session'
const REVIEWS_KEY = 'cafemate-community-reviews'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function getUserId(user) {
  return user
    ? String(user.id || user.email || user.username || '')
    : ''
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString()
}

export default function Community() {
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(
    () => readJSON(SESSION_KEY, null)
  )

  const userId = getUserId(currentUser)

  function loadPosts() {
    const saved = readJSON(POSTS_KEY, [])
    setPosts(Array.isArray(saved) ? saved : [])
    setCurrentUser(readJSON(SESSION_KEY, null))
  }

  useEffect(() => {
    loadPosts()

    window.addEventListener('storage', loadPosts)

    return () => {
      window.removeEventListener('storage', loadPosts)
    }
  }, [])

  const visiblePosts = posts
    .filter((post) => {
      const isOwner =
        userId &&
        String(post.authorId || '') === userId

      return post.visibility !== 'Private' || isOwner
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )

  function savePosts(updatedPosts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts))
    setPosts(updatedPosts)
  }

  function handleLike(postId) {
    if (!userId) {
      alert('Please log in to like posts.')
      return
    }

    const updated = posts.map((post) => {
      if (String(post.id) !== String(postId)) return post

      const likes = Array.isArray(post.likes) ? post.likes : []
      const alreadyLiked = likes.some(
        (id) => String(id) === userId
      )

      return {
        ...post,
        likes: alreadyLiked
          ? likes.filter((id) => String(id) !== userId)
          : [...likes, userId],
      }
    })

    savePosts(updated)
  }

  function handleDelete(postId) {
    const post = posts.find(
      (item) => String(item.id) === String(postId)
    )

    if (!post || String(post.authorId || '') !== userId) return

    if (!window.confirm('Delete this post?')) return

    const updatedPosts = posts.filter(
      (item) => String(item.id) !== String(postId)
    )

    savePosts(updatedPosts)

    // Also remove reviews belonging to the deleted post.
    const reviews = readJSON(REVIEWS_KEY, [])
    localStorage.setItem(
      REVIEWS_KEY,
      JSON.stringify(
        reviews.filter(
          (review) => String(review.postId) !== String(postId)
        )
      )
    )
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#493124]">
              Cafe Community
            </h1>
            <p className="mt-2 text-gray-500">
              Share your cafe experiences and discover new places.
            </p>
          </div>

          <Link
            to="/community/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5e42] px-6 py-3 font-bold text-white transition hover:bg-[#70472f]"
          >
            <Plus size={20} />
            Add Post
          </Link>
        </div>

        <p className="mb-6 text-[#493124]">
          <strong>{visiblePosts.length}</strong>{' '}
          {visiblePosts.length === 1 ? 'post' : 'posts'} found
        </p>

        {visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddc9b5] bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf0e5] text-[#a77952]">
              <Plus size={32} />
            </div>

            <h2 className="text-2xl font-bold text-[#493124]">
              No Posts Yet
            </h2>

            <p className="mt-3 text-gray-500">
              Be the first to share your cafe experience!
            </p>

            <Link
              to="/community/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8b5e42] px-6 py-3 font-semibold text-white hover:bg-[#70472f]"
            >
              <Plus size={19} />
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post) => {
              const likes = Array.isArray(post.likes)
                ? post.likes
                : []

              const isLiked = likes.some(
                (id) => String(id) === userId
              )

              const isOwner =
                userId &&
                String(post.authorId || '') === userId

              const factors = Array.isArray(post.attractionFactors)
                ? post.attractionFactors
                : []

              const reviews = readJSON(REVIEWS_KEY, []).filter(
                (review) => String(review.postId) === String(post.id)
              )

              const purposes = [
                ...new Set(reviews.flatMap((review) => review.purposes || [])),
              ]

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-[#eee1d5] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 bg-[#eee4da]">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.cafeName || 'Cafe'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No Image Uploaded
                      </div>
                    )}

                    {post.category && (
                      <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#79543c] shadow">
                        {post.category}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      aria-label="Like post"
                      className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#79543c] shadow-md"
                    >
                      <Heart
                        size={23}
                        fill={isLiked ? '#e87979' : 'none'}
                        color={isLiked ? '#e87979' : '#79543c'}
                      />
                    </button>
                  </div>

                  <div className="p-7">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl font-extrabold text-[#493124]">
                        {post.cafeName || 'Cafe Experience'}
                      </h2>

                      {post.rating != null && (
                        <div className="flex shrink-0 items-center gap-1 font-bold text-orange-600">
                          <Star size={19} fill="currentColor" />
                          {post.rating}
                        </div>
                      )}
                    </div>

                    {post.location && (
                      <div className="mt-4 flex items-center gap-2 text-gray-500">
                        <MapPin size={19} />
                        <span>{post.location}</span>
                      </div>
                    )}

                    <p className="mt-5 min-h-[56px] leading-7 text-gray-600">
                      {post.content}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {post.category && (
                        <span className="rounded-full bg-[#faf4ef] px-3 py-2 text-sm font-semibold text-[#79543c]">
                          {post.category}
                        </span>
                      )}

                      {factors.map((factor, index) => (
                        <span
                          key={`${post.id}-factor-${index}`}
                          className="rounded-full bg-[#faf4ef] px-3 py-2 text-sm font-semibold text-[#79543c]"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>

                    {purposes.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9b7a62]">
                          Community uses
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {purposes.map((purpose) => (
                            <span
                              key={purpose}
                              className="rounded-full bg-[#f2e8df] px-3 py-1.5 text-sm text-[#79543c]"
                            >
                              {purpose}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-2 text-sm text-gray-500">
                      <span className="flex min-w-0 items-center gap-2">
                        <User size={17} />
                        <span className="truncate">
                          @{String(
                            post.authorUsername || post.authorName || 'user'
                          ).replace(/^@/, '')}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1">
                        <CalendarDays size={15} />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                      <span>
                        <Heart size={15} className="mr-1 inline" />
                        {likes.length} Likes
                      </span>
                      <span>{reviews.length} Reviews</span>
                    </div>

                    <Link
                      to={`/community/post/${post.id}`}
                      className="mt-5 flex w-full items-center justify-center rounded-xl border border-[#79543c] py-3.5 font-bold text-[#79543c] transition hover:bg-[#79543c] hover:text-white"
                    >
                      View Details & Write Review
                    </Link>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                      >
                        Delete Post
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}