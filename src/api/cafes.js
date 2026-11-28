const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const V1_API_URL = `${API_URL}/v1`
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')
const SESSION_KEY = 'cafemate-session'

// AUTH TOKEN

export function getToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.token || ''
  } catch {
    return ''
  }
}

// IMAGE URL

export function mediaUrl(path) {
  if (!path) return ''

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path
  }

  const cleanPath = String(path).replace(/^\/+/, '')

  return `${API_ORIGIN}/${/^(posts|avatars|cafes)\//.test(cleanPath) ? `storage/${cleanPath}` : cleanPath}`
}

// API REQUEST

async function requestFrom(
  baseUrl,
  path,
  { method = 'GET', body, token = getToken() } = {}
) {
  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let requestBody = body

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: requestBody,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Unable to reach the API. Confirm Laravel is running and check VITE_API_URL, VITE_API_PROXY_TARGET, and CORS settings.'
      )
    }

    throw error
  }

  const responseText = await response.text()
  let payload = {}

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText.replace(/^[\s\uFEFF]+/, ''))
    } catch {
      if (response.ok) {
        throw new Error(
          'The API returned invalid JSON. Check for output before the Laravel JSON response.'
        )
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem(SESSION_KEY)
      window.dispatchEvent(new Event('cafemate:unauthorized'))
    }

    const validationErrors = Object.values(payload.errors || {}).flat()

    const message = response.status === 502
      ? 'Cannot reach the Laravel API. Start it on http://127.0.0.1:8000 or check VITE_API_PROXY_TARGET, then restart Vite.'
      : validationErrors[0] || payload.message || `Request failed (${response.status})`

    throw new Error(message)
  }

  return payload
}

export const apiRequest = (path, options) =>
  requestFrom(API_URL, path, options)

const v1Request = (path, options) =>
  requestFrom(V1_API_URL, path, options)

// CAFES

export async function getCafes(page = 1, perPage = 9, filters = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  return v1Request(`/cafes?${params}`)
}

export const getMapCafes = (page = 1, perPage = 30) => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  return v1Request(`/map/cafes?${params}`)
}

export const getCafe = (id) =>
  v1Request(`/cafes/${id}`)

// COMMUNITY BAD REVIEWS
// Admin-kept reports for a specific cafe

export const getCafeBadReviews = (id) =>
  apiRequest(`/cafes/${id}/bad-reviews`)

export const getCafeReviewTargets = (name) => {
  const params = new URLSearchParams({ name })
  return apiRequest(`/cafe-review-targets?${params}`)
}

export const getCafeReviewOptions = () =>
  apiRequest('/cafe-review-options')

// AUTHENTICATION

export const authApi = {
  register: (body) =>
    v1Request('/register', {
      method: 'POST',
      body,
      token: '',
    }),

  login: (body) =>
    v1Request('/login', {
      method: 'POST',
      body,
      token: '',
    }),

  logout: () =>
    v1Request('/logout', {
      method: 'POST',
    }),

  me: () =>
    v1Request('/me'),

  updateProfile: (body) =>
    body instanceof FormData
      ? v1Request('/profile/avatar', {
          method: 'POST',
          body,
        })
      : v1Request('/profile', {
          method: 'PATCH',
          body,
        }),

  removeAvatar: () =>
    v1Request('/profile/avatar', {
      method: 'DELETE',
    }),

  changePassword: (body) =>
    v1Request('/me/password', {
      method: 'PATCH',
      body,
    }),
}

// FAVOURITES

export const favoriteApi = {
  list: (page = 1) =>
    apiRequest(`/favorites?page=${page}`),

  add: (id) =>
    apiRequest(`/cafes/${id}/favorite`, {
      method: 'POST',
    }),

  remove: (id) =>
    apiRequest(`/cafes/${id}/favorite`, {
      method: 'DELETE',
    }),
}

// COMMUNITY POSTS

export const postApi = {
  list: (page = 1) =>
    apiRequest(`/posts?page=${page}`),

  show: (id) =>
    apiRequest(`/posts/${id}`),

  create: (body) =>
    apiRequest('/posts', {
      method: 'POST',
      body,
    }),

  update: (id, body) =>
    apiRequest(`/posts/${id}`, {
      method: 'PATCH',
      body,
    }),

  remove: (id) =>
    apiRequest(`/posts/${id}`, {
      method: 'DELETE',
    }),

  report: (id, reason) =>
    apiRequest(`/posts/${id}/reports`, {
      method: 'POST',
      body: { reason },
    }),
}

// CAFE REVIEWS

export const reviewApi = {
  list: (cafeId) =>
    apiRequest(`/cafes/${cafeId}/reviews`),

  mine: (cafeId) =>
    apiRequest(`/cafes/${cafeId}/my-review`),

  create: (cafeId, body) =>
    apiRequest(`/cafes/${cafeId}/reviews`, {
      method: 'POST',
      body,
    }),

  update: (cafeId, body) =>
    apiRequest(`/cafes/${cafeId}/reviews`, {
      method: 'PATCH',
      body,
    }),

  remove: (id) =>
    apiRequest(`/reviews/${id}`, {
      method: 'DELETE',
    }),
}

export const myReviews = () =>
  apiRequest('/my/reviews')

export const notificationApi = {
  list: () =>
    apiRequest('/notifications'),

  markRead: (id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllRead: () =>
    apiRequest('/notifications/read-all', {
      method: 'PATCH',
    }),
}

// ADMIN

export const adminApi = {
  // User management
  users: () =>
    apiRequest('/admin/users'),

  setBan: (id, banned) =>
    apiRequest(`/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: { banned },
    }),

  setRole: (id, role) =>
    apiRequest(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),

  // Café management
  directoryCafes: async () => {
    let page = 1
    let lastPage = 1
    const cafes = []

    do {
      const response = await v1Request(`/admin/cafes?page=${page}&per_page=30`)
      cafes.push(...(Array.isArray(response.data) ? response.data : []))
      lastPage = response.meta?.last_page || page
      page += 1
    } while (page <= lastPage)

    return cafes
  },

  createCafe: (body) =>
    v1Request('/admin/cafes', {
      method: 'POST',
      body,
    }),

  updateCafe: (id, body) =>
    v1Request(`/admin/cafes/${id}`, {
      method: 'PATCH',
      body,
    }),

  deleteCafe: (id) =>
    v1Request(`/admin/cafes/${id}`, {
      method: 'DELETE',
    }),

  // Pending cafe approvals
  pendingCafes: () =>
    apiRequest('/admin/cafes/pending'),

  reviewCafe: (id, status) =>
    apiRequest(`/admin/cafes/${id}/approval`, {
      method: 'PATCH',
      body: { status },
    }),

  // Community post approval
  pendingPosts: () =>
    apiRequest('/admin/posts/pending'),

  posts: () =>
    apiRequest('/admin/posts'),

  deletePost: (id) =>
    apiRequest(`/admin/posts/${id}`, {
      method: 'DELETE',
    }),

  approvePost: (id, notes = '') =>
    apiRequest(`/admin/posts/${id}/moderation`, {
      method: 'PATCH',
      body: {
        action: 'approve',
        notes,
      },
    }),

  rejectPost: (id, notes = '') =>
    apiRequest(`/admin/posts/${id}/moderation`, {
      method: 'PATCH',
      body: {
        action: 'reject',
        notes,
      },
    }),

  // Post reports
  reports: () =>
    apiRequest('/admin/reports'),

  moderatePost: (id, action, notes = '') =>
    apiRequest(`/admin/posts/${id}/moderation`, {
      method: 'PATCH',
      body: { action, notes },
    }),

  // Moderation history
  history: () =>
    apiRequest('/admin/moderation/history'),
}