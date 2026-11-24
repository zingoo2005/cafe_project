
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, authApi, myReviews, mediaUrl } from '../../api/cafes'
import { CafeReviewTags } from '../../components/CafeReviewForm'

const MANDALAY_BOUNDS = {
  south: 21.80,
  north: 22.10,
  west: 95.95,
  east: 96.25,
}

function isMandalayPosition(position) {
  return position &&
    position.latitude >= MANDALAY_BOUNDS.south &&
    position.latitude <= MANDALAY_BOUNDS.north &&
    position.longitude >= MANDALAY_BOUNDS.west &&
    position.longitude <= MANDALAY_BOUNDS.east
}

function normalizedAddressValue(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .replace(/\b(street|road|rd|st)\b/g, ' ')
    .replace(/[^a-z0-9]/g, '')
}

async function findVerifiedCafeLocation(name, streetAddress, township) {
  const address = [name, streetAddress, township, 'Mandalay', 'Myanmar']
    .filter(Boolean)
    .join(', ')

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'mm',
    })}`,
    { headers: { Accept: 'application/json' } }
  )

  if (!response.ok) {
    throw new Error('The map address service is unavailable. Please try again.')
  }

  const results = await response.json()
  const normalizedName = normalizedAddressValue(name)

  for (const result of results) {
    const latitude = Number(result.lat)
    const longitude = Number(result.lon)
    const position = { latitude, longitude }
    if (!isMandalayPosition(position)) continue

    const returnedName = normalizedAddressValue(
      result.namedetails?.name ||
      result.name ||
      result.display_name
    )
    const nameMatches =
      normalizedName.length >= 4 &&
      (returnedName.includes(normalizedName) || normalizedName.includes(returnedName))

    const returnedAddress = normalizedAddressValue(result.display_name)
    const streetNumbers = String(streetAddress || '').match(/\d+/g) || []
    const addressMatches =
      !streetAddress ||
      (streetNumbers.every((number) => returnedAddress.includes(number)) &&
        (normalizedAddressValue(streetAddress).length < 8 ||
          returnedAddress.includes(normalizedAddressValue(streetAddress))))

    if (nameMatches && addressMatches) {
      return {
        position,
        displayName: result.display_name,
      }
    }
  }

  return null
}

// ==========================================
// MY REVIEWS
// ==========================================

export function MyReviews() {
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    myReviews()
      .then((response) => setReviews(response.data?.data || []))
      .catch((requestError) =>
        setError(requestError.message || 'Unable to load reviews.')
      )
  }, [])

  return (
    <main className="mx-auto min-h-[60vh] w-[92%] max-w-5xl py-12">
      <h1 className="text-3xl font-black text-coffee-900">
        My Reviews
      </h1>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-coffee-100 bg-white p-5"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <Link
                to={`/cafe/${review.cafe_id}`}
                className="font-bold text-coffee-800"
              >
                {review.cafe?.name || 'Café'}
              </Link>

              <span className="font-bold text-amber-600">
                {review.rating} / 5
              </span>
            </div>

            {review.body && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                {review.body}
              </p>
            )}

            <CafeReviewTags review={review} />

            <p className="mt-2 text-xs text-stone-400">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </article>
        ))}

        {!error && reviews.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-stone-600">
            You haven’t written any café reviews yet.
          </p>
        )}
      </div>
    </main>
  )
}

// ==========================================
// SETTINGS
// ==========================================

export function Settings({ onLogout }) {
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()

    setError('')
    setNotice('')
    setSaving(true)

    try {
      const response = await authApi.changePassword(form)

      setNotice(`${response.message} Redirecting to sign in...`)

      setForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      })

      window.setTimeout(() => onLogout?.(), 800)
    } catch (requestError) {
      setError(requestError.message || 'Unable to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto min-h-[60vh] w-[92%] max-w-3xl py-12">
      <h1 className="text-3xl font-black text-coffee-900">
        Settings
      </h1>

      <p className="mt-3 text-stone-600">
        Change your account password.
      </p>

      <form
        onSubmit={submit}
        className="mt-7 space-y-4 rounded-2xl border border-coffee-100 bg-white p-6"
      >
        {[
          ['current_password', 'Current password'],
          ['password', 'New password'],
          ['password_confirmation', 'Confirm new password'],
        ].map(([name, label]) => (
          <label
            key={name}
            className="block text-sm font-bold text-stone-700"
          >
            {label}

            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={form[name]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        ))}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="text-sm text-green-700">
            {notice}
          </p>
        )}

        <button
          disabled={saving}
          className="rounded-xl bg-coffee-700 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </main>
  )
}

// ==========================================
// MY CAFES
// ==========================================

export function MyCafes() {
  const emptyForm = {
    name: '',
    township: '',
    area: '',
    type: '',
    street_address: '',
    description: '',
    tags: '',
    image: null,
    latitude: '',
    longitude: '',
  }

  const [cafes, setCafes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [imagePreview, setImagePreview] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [locationCandidate, setLocationCandidate] = useState(null)

  // Load user's café submissions
  async function loadCafes() {
    try {
      const response = await apiRequest('/my/cafes')
      setCafes(response.data?.data || [])
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to load café submissions.'
      )
    }
  }

  useEffect(() => {
    loadCafes()
  }, [])

  // Select image and show preview
  function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5MB or less.')
      event.target.value = ''
      return
    }

    setForm((current) => ({
      ...current,
      image: file,
    }))

    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  // Edit café
  function editCafe(cafe) {
    setEditingId(cafe.id)

    setForm({
      name: cafe.name || '',
      township: cafe.township || '',
      area: cafe.area || '',
      type: cafe.type || '',
      street_address: cafe.street_address || '',
      description: cafe.description || '',
      tags: (cafe.tags || []).join(', '),
      image: null,
      latitude: cafe.latitude || '',
      longitude: cafe.longitude || '',
    })

    setImagePreview(
      cafe.image ? mediaUrl(cafe.image) : ''
    )

    setNotice('')
    setError('')
    setLocationCandidate(null)
  }

  async function verifyCafeLocation() {
    if (!form.name.trim() || !form.township.trim()) {
      setError('Enter the café name and township before verifying the location.')
      return
    }

    if (!form.street_address.trim()) {
      setError('Enter the street number or road name so the correct café can be identified.')
      return
    }

    try {
      setGeocoding(true)
      setError('')
      setNotice('')
      setLocationCandidate(null)

      const candidate = await findVerifiedCafeLocation(
        form.name.trim(),
        form.street_address.trim(),
        form.township.trim()
      )

      if (!candidate) {
        setError(
          'No matching Mandalay café was found for this name and address. Verify the café name, street number, and township, then try again.'
        )
        return
      }

      setLocationCandidate(candidate)
      setForm((current) => ({
        ...current,
        latitude: candidate.position.latitude.toFixed(7),
        longitude: candidate.position.longitude.toFixed(7),
      }))
      setNotice('Location found. Confirm the address shown below before saving.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to verify this café location.')
    } finally {
      setGeocoding(false)
    }
  }

  // Submit or update café
  async function saveCafe(event) {
    event.preventDefault()

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    if (
      (form.latitude !== '' || form.longitude !== '') &&
      (!Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !isMandalayPosition({ latitude, longitude }))
    ) {
      setError('The saved coordinates are outside Mandalay. Verify the café address first.')
      return
    }

    if (form.latitude === '' || form.longitude === '') {
      setError('Verify the café name and street address using the map before submitting.')
      return
    }

    if (!editingId && !locationCandidate) {
      setError('Verify the café name and street address and confirm the matched Mandalay location before submitting.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const body = new FormData()

      body.append('name', form.name.trim())
      body.append('township', form.township.trim())
      body.append('type', form.type.trim())
      body.append('area', form.area.trim())
      body.append('street_address', form.street_address.trim())
      body.append('description', form.description.trim())

      form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => body.append('tags[]', tag))

      if (form.latitude) {
        body.append('latitude', form.latitude)
      }

      if (form.longitude) {
        body.append('longitude', form.longitude)
      }

      if (form.image) {
        body.append('image', form.image)
      }

      let response

      if (editingId) {
        // Laravel method spoofing for multipart PATCH
        body.append('_method', 'PATCH')

        response = await apiRequest(`/cafes/${editingId}`, {
          method: 'POST',
          body,
        })
      } else {
        response = await apiRequest('/cafes', {
          method: 'POST',
          body,
        })
      }

      setNotice(response.message || 'Café saved successfully.')

      setForm({ ...emptyForm })
      setImagePreview('')
      setEditingId(null)
      setLocationCandidate(null)

      await loadCafes()
    } catch (requestError) {
      setError(requestError.message || 'Unable to save this café.')
    } finally {
      setSaving(false)
    }
  }

  // Delete café
  async function deleteCafe(id) {
    if (!window.confirm('Delete this café submission?')) {
      return
    }

    try {
      await apiRequest(`/cafes/${id}`, {
        method: 'DELETE',
      })

      setNotice('Café submission deleted.')
      setError('')

      await loadCafes()
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this café.')
    }
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setImagePreview('')
    setError('')
    setNotice('')
    setLocationCandidate(null)
  }

  return (
    <main className="mx-auto min-h-[60vh] w-[92%] max-w-5xl py-12">

      <h1 className="text-3xl font-black text-coffee-900">
        My cafés
      </h1>

      <p className="mt-2 text-stone-600">
        Submissions remain hidden until an administrator approves them.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 text-green-700">
          {notice}
        </p>
      )}

      {/* CAFÉ FORM */}

      <form
        onSubmit={saveCafe}
        className="mt-6 grid gap-3 rounded-2xl border border-coffee-100 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="text-xl font-bold sm:col-span-2">
          {editingId ? 'Edit submission' : 'Submit a café'}
        </h2>

        {[
          ['name', 'Café name', true],
          ['township', 'Township', true],
          ['area', 'Area', false],
          ['type', 'Café type', true],
          ['street_address', 'Street address', false],
          ['tags', 'Tags (comma separated)', false],
          ['latitude', 'Latitude', false],
          ['longitude', 'Longitude', false],
        ].map(([name, label, required]) => (
          <label
            key={name}
            className="text-sm font-semibold text-stone-700"
          >
            {label}

            <input
              required={required}
              value={form[name]}
              onChange={(event) => {
                if (['name', 'township', 'area', 'street_address', 'latitude', 'longitude'].includes(name)) {
                  setLocationCandidate(null)
                }
                setForm((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))
              }}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </label>
        ))}

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={verifyCafeLocation}
            disabled={geocoding}
            className="w-full rounded-xl border border-coffee-300 px-4 py-3 font-bold text-coffee-800 hover:bg-coffee-50 disabled:opacity-50"
          >
            {geocoding ? 'Searching real Mandalay map locations...' : 'Verify café name and address'}
          </button>

          {locationCandidate && (
            <div role="status" className="mt-3 rounded-xl border border-green-300 bg-green-50 p-4">
              <p className="font-bold text-green-900">Verified map location</p>
              <p className="mt-1 text-sm text-stone-700">{locationCandidate.displayName}</p>
              <p className="mt-1 text-xs text-stone-500">
                {locationCandidate.position.latitude.toFixed(7)}, {locationCandidate.position.longitude.toFixed(7)}
              </p>
            </div>
          )}
        </div>

        {/* IMAGE UPLOAD */}

        <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
          Café Image

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="mt-2 w-full rounded-xl border p-3"
          />

          <span className="mt-1 block text-xs font-normal text-stone-500">
            JPG, PNG or WEBP. Maximum size: 5MB.
          </span>
        </label>

        {/* IMAGE PREVIEW */}

        {imagePreview && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-stone-700">
              Image Preview
            </p>

            <img
              src={imagePreview}
              alt="Café preview"
              className="h-52 w-full rounded-xl object-cover"
            />
          </div>
        )}

        {/* DESCRIPTION */}

        <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
          Description

          <textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-xl border p-3"
          />
        </label>

        {/* BUTTONS */}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-coffee-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Save changes'
                : 'Submit for approval'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border px-5 py-3 font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* CAFÉ SUBMISSION LIST */}

      <div className="mt-6 space-y-3">
        {cafes.map((cafe) => (
          <article
            key={cafe.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coffee-100 bg-white p-5"
          >
            <div className="flex items-center gap-4">

              {cafe.image && (
                <img
                  src={mediaUrl(cafe.image)}
                  alt={cafe.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              )}

              <div>
                <h3 className="font-bold">
                  {cafe.name}
                </h3>

                <p className="text-sm text-stone-500">
                  {cafe.township} · {cafe.type} · Status:
                  <span className="font-semibold capitalize">
                    {' '}{cafe.status}
                  </span>
                </p>

                {cafe.posts?.map((post) => (
                  <Link
                    key={post.id}
                    to={`/community/post/${post.id}`}
                    className="mt-1 block text-sm font-semibold text-coffee-700 hover:underline"
                  >
                    Community post: {post.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => editCafe(cafe)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => deleteCafe(cafe.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {cafes.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-stone-600">
            You haven't submitted any cafés yet.
          </p>
        )}
      </div>
    </main>
  )
}
