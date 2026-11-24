import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ChevronRight,
  Coffee,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Star,
  X,
} from 'lucide-react'
import { getCafes, mediaUrl } from '../../api/cafes'

const MANDALAY_CENTER = [21.9588, 96.0891]
const MANDALAY_BOUNDS = [[21.80, 95.95], [22.10, 96.25]]

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createCoffeeMarker(selected = false) {
  return L.divIcon({
    className: 'mandalay-coffee-marker',
    html: `<div class="${selected ? 'mandalay-marker mandalay-marker-selected' : 'mandalay-marker'}"><span>☕</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 38],
    popupAnchor: [0, -34],
  })
}

function createUserMarker() {
  return L.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-location-dot"><span></span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function getDistanceKm(firstPosition, secondPosition) {
  if (!firstPosition || !secondPosition) return null

  const earthRadiusKm = 6371
  const toRadians = (degrees) => degrees * Math.PI / 180
  const [latitude1, longitude1] = firstPosition
  const [latitude2, longitude2] = secondPosition
  const latitudeDelta = toRadians(latitude2 - latitude1)
  const longitudeDelta = toRadians(longitude2 - longitude1)

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getCafeImage(cafe) {
  return mediaUrl(cafe?.image) || cafe?.image_url || ''
}

function cafeMatchesCategory(cafe, category) {
  if (category === 'All') return true

  const values = [
    ...(Array.from(cafe?.tags || [], (tag) => tag?.name || tag)),
    ...(Array.from(cafe?.review_purposes || [], (purpose) => purpose?.name || purpose)),
  ]

  return values.some((value) =>
    String(value).toLocaleLowerCase().includes(category.toLocaleLowerCase())
  )
}

function getCafePosition(cafe) {
  if (cafe?.latitude == null || cafe?.longitude == null) return null

  const latitude = Number(cafe.latitude)
  const longitude = Number(cafe.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null
}

function getDirectionsUrl(cafe, origin = null) {
  const position = getCafePosition(cafe)
  if (!position) return null

  const originParam = origin
    ? `&origin=${encodeURIComponent(origin.join(','))}`
    : ''

  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(position.join(','))}`
}

function isInsideMandalay(position) {
  if (!position) return false

  const [latitude, longitude] = position
  return (
    latitude >= MANDALAY_BOUNDS[0][0] &&
    latitude <= MANDALAY_BOUNDS[1][0] &&
    longitude >= MANDALAY_BOUNDS[0][1] &&
    longitude <= MANDALAY_BOUNDS[1][1]
  )
}

async function geocodeCafe(cafe) {
  const savedPosition = getCafePosition(cafe)
  if (savedPosition && isInsideMandalay(savedPosition)) {
    return { position: savedPosition, approximate: false }
  }

  const cacheKey = `siplap-cafe-location-${cafe.id}`
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
    if (cached?.position && isInsideMandalay(cached.position)) return cached
  } catch {
    // Continue with live geocoding if cache data is unavailable.
  }

  const address = [
    cafe.name,
    cafe.street_address,
    cafe.area,
    cafe.township,
    'Mandalay',
    'Myanmar',
  ].filter(Boolean).join(', ')

  const queries = [
    address,
    [cafe.name, cafe.street_address, cafe.township, 'Mandalay', 'Myanmar'].filter(Boolean).join(', '),
    [cafe.name, cafe.township, 'Mandalay', 'Myanmar'].filter(Boolean).join(', '),
  ]

  for (const query of [...new Set(queries)]) {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        countrycodes: 'mm',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) continue

      const results = await response.json()
      const mandalayResult = results.find((result) => {
        const position = [Number(result.lat), Number(result.lon)]
        return isInsideMandalay(position)
      })

      if (mandalayResult) {
        const result = {
          position: [Number(mandalalayResult.lat), Number(mandalalayResult.lon)],
          approximate: query !== address,
          resolvedAddress: mandalayResult.display_name || '',
        }
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result))
        } catch {
          // The resolved location is still usable without a cache.
        }
        return result
      }
    } catch (geocodingError) {
      console.warn('Café geocoding failed:', cafe.name, geocodingError)
    }
  }

  return null
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

function MapController({ selectedPosition, positions, routePositions, userPosition, centerOnUser }) {
  const map = useMap()

  useEffect(() => {
    if (routePositions.length > 1) {
      map.fitBounds(routePositions, { padding: [55, 55], maxZoom: 15 })
    } else if (centerOnUser && userPosition) {
      map.flyTo(userPosition, 16, { duration: 1.2 })
    } else if (selectedPosition) {
      map.flyTo(selectedPosition, 16, { duration: 1.2 })
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 14 })
    } else if (positions.length === 1) {
      map.setView(positions[0], 14)
    } else {
      map.setView(MANDALAY_CENTER, 12)
    }
  }, [map, positions, selectedPosition, routePositions, userPosition, centerOnUser])

  return null
}

export default function MapPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [cafes, setCafes] = useState([])
  const [selectedCafeId, setSelectedCafeId] = useState(
    () => location.state?.selectedCafe?.id ?? null
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userPosition, setUserPosition] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [centerOnUser, setCenterOnUser] = useState(false)
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.')
      return undefined
    }

    setLocationStatus('Finding your location...')

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition = [position.coords.latitude, position.coords.longitude]
        setUserPosition(nextPosition)
        setLocationStatus('')
      },
      (locationError) => {
        setLocationStatus(
          locationError.code === locationError.PERMISSION_DENIED
            ? 'Location permission denied.'
            : 'Unable to determine your location.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    let active = true

    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        const allCafes = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const result = await getCafes(page, 30)
          allCafes.push(...(result.data || []))
          hasMore = Boolean(result.meta?.has_more)
          page += 1
        }

        const geocodedCafes = await Promise.all(
          allCafes.map(async (cafe) => {
            const locationData = await geocodeCafe(cafe)
            if (!locationData) return null

            return {
              ...cafe,
              latitude: locationData.position[0],
              longitude: locationData.position[1],
              _locationApproximate: locationData.approximate,
              _resolvedAddress: locationData.resolvedAddress,
            }
          })
        )

        if (active) setCafes(geocodedCafes.filter(Boolean))
      } catch (requestError) {
        console.error('Map café loading error:', requestError)
        if (active) setError(requestError.message || 'Unable to load cafés. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCafes()
    return () => {
      active = false
    }
  }, [])

  const filteredCafes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    const matches = cafes.filter((cafe) => {
      const matchesCategory = cafeMatchesCategory(cafe, category)
      if (!matchesCategory) return false
      if (!query) return true

      return `${cafe.name} ${cafe.street_address || ''} ${cafe.area || ''} ${cafe.township || ''}`
        .toLocaleLowerCase()
        .includes(query)
    })

    if (!userPosition) return matches

    return [...matches].sort((first, second) => {
      const firstDistance = getDistanceKm(userPosition, getCafePosition(first))
      const secondDistance = getDistanceKm(userPosition, getCafePosition(second))
      return (firstDistance ?? Infinity) - (secondDistance ?? Infinity)
    })
  }, [cafes, category, search, userPosition])

  const selectedCafe = filteredCafes.find(
    (cafe) => String(cafe.id) === String(selectedCafeId)
  ) || null
  const selectedPosition = useMemo(() => getCafePosition(selectedCafe), [selectedCafe])
  const positions = useMemo(
    () => filteredCafes.map(getCafePosition).filter(Boolean),
    [filteredCafes]
  )
  const routePositions = useMemo(
    () => route?.geometry || [],
    [route]
  )

  useEffect(() => {
    if (!selectedCafe || !userPosition) {
      setRoute(null)
      setRouteError('')
      return
    }

    const destination = getCafePosition(selectedCafe)
    if (!destination) {
      setRoute(null)
      setRouteError('This café has no saved map location.')
      return
    }

    let active = true
    const controller = new AbortController()

    async function loadRoute() {
      try {
        setRouteLoading(true)
        setRouteError('')

        const coordinates = `${userPosition[1]},${userPosition[0]};${destination[1]},${destination[0]}`
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`,
          { signal: controller.signal }
        )

        if (!response.ok) throw new Error('The routing service could not calculate this route.')

        const payload = await response.json()
        const routeData = payload.routes?.[0]
        if (!routeData) throw new Error('No route was found to this café.')

        if (active) {
          setRoute({
            geometry: routeData.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
            distance: routeData.distance,
            duration: routeData.duration,
            steps: routeData.legs?.flatMap((leg) => leg.steps || []) || [],
          })
        }
      } catch (requestError) {
        if (active && requestError.name !== 'AbortError') {
          setRoute(null)
          setRouteError(requestError.message || 'Unable to calculate directions.')
        }
      } finally {
        if (active) setRouteLoading(false)
      }
    }

    loadRoute()

    return () => {
      active = false
      controller.abort()
    }
  }, [selectedCafe, userPosition])

  function handleSelectCafe(cafe) {
    setSelectedCafeId(cafe.id)
    navigate('/map', { replace: true, state: { selectedCafe: cafe } })
  }

  function handleLocateUser() {
    setCenterOnUser(true)

    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude])
        setLocationStatus('')
        setCenterOnUser(true)
      },
      () => setLocationStatus('Unable to get your current location.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  function handleClearRoute() {
    setSelectedCafeId(null)
    setRoute(null)
    setRouteError('')
    navigate('/map', { replace: true, state: null })
  }

  return (
    <main className="mandalay-map-layout min-h-[620px] bg-coffee-50 lg:h-[calc(100vh-72px)]">
      <aside className="mandalay-cafe-panel">
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-[25px] font-black leading-tight text-coffee-900">
            Cafés in Mandalay
          </h1>
          <p className="mt-1 text-sm text-stone-500">Explore popular coffee shops on the map.</p>

          <button
            type="button"
            onClick={handleLocateUser}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-coffee-100 bg-white px-4 py-2.5 text-sm font-bold text-coffee-800 transition hover:bg-coffee-100"
          >
            <LocateFixed size={17} />
            Use my current location
          </button>
          {locationStatus && (
            <p className="mt-2 text-xs text-stone-500">{locationStatus}</p>
          )}

          <label className="relative mt-4 block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <span className="sr-only">Search café or area</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#fffaf6] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-coffee-300"
              placeholder="Search café or area..."
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {['All', 'Study', 'Work', 'Relax'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === item
                    ? 'bg-[#6f442c] text-white'
                    : 'border border-stone-200 bg-white text-coffee-900 hover:bg-coffee-100'
                }`}
              >
                {item === 'All' ? `All (${cafes.length})` : item}
              </button>
            ))}
          </div>
        </div>

        <div className="mandalay-cafe-list">
          {loading && <p className="px-5 py-8 text-center text-sm text-stone-500">Loading cafés...</p>}
          {error && <p role="alert" className="px-5 py-8 text-center text-sm text-red-600">{error}</p>}

          {!loading && !error && filteredCafes.map((cafe) => {
            const isSelected = String(cafe.id) === String(selectedCafeId)
            const rating = Number(cafe.rating)
            const distance = getDistanceKm(userPosition, getCafePosition(cafe))

            return (
              <button
                key={cafe.id}
                type="button"
                onClick={() => handleSelectCafe(cafe)}
                aria-pressed={isSelected}
                className={`mandalay-cafe-row ${isSelected ? 'mandalay-cafe-row-selected' : ''}`}
              >
                {getCafeImage(cafe) ? (
                  <img
                    src={getCafeImage(cafe)}
                    alt=""
                    className="h-[72px] w-[94px] shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-[72px] w-[94px] shrink-0 place-items-center rounded-lg bg-coffee-100 text-coffee-700">
                    <Coffee size={24} />
                  </span>
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[15px] font-black text-coffee-900">{cafe.name}</span>
                  <span className="mt-1 flex items-start gap-1 text-xs leading-5 text-stone-600">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {[cafe.street_address, cafe.area, cafe.township].filter(Boolean).join(', ') || 'Mandalay'}
                    </span>
                  </span>
                  {distance != null && (
                    <span className="mt-1 block text-xs font-semibold text-coffee-600">
                      {distance < 1
                        ? `${Math.round(distance * 1000)} m away`
                        : `${distance.toFixed(1)} km away`}
                    </span>
                  )}
                  {Number.isFinite(rating) && rating > 0 && (
                    <span className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star size={14} fill="currentColor" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                </span>
                <ChevronRight size={20} className="shrink-0 text-coffee-900" />
              </button>
            )
          })}

          {!loading && !error && filteredCafes.length === 0 && (
            <p className="mx-5 mt-4 rounded-xl border border-dashed border-coffee-100 p-6 text-center text-sm text-stone-500">
              {cafes.length === 0
                ? 'No cafés have exact map coordinates yet. Add latitude and longitude in the café data first.'
                : 'No cafés match your search.'}
            </p>
          )}
        </div>
      </aside>

      <section className="mandalay-map-panel">
        <MapContainer
          center={selectedPosition || MANDALAY_CENTER}
          zoom={selectedPosition ? 16 : 12}
          maxBounds={MANDALAY_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            selectedPosition={selectedPosition}
            positions={positions}
            routePositions={routePositions}
            userPosition={userPosition}
            centerOnUser={centerOnUser}
          />
          {userPosition && (
            <Marker position={userPosition} icon={createUserMarker()} zIndexOffset={1000}>
              <Popup>Your current location</Popup>
            </Marker>
          )}
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#6f442c', weight: 6, opacity: 0.9 }}
            />
          )}
          {filteredCafes.map((cafe) => {
            const position = getCafePosition(cafe)
            if (!position) return null
            const isSelected = String(cafe.id) === String(selectedCafeId)
            const rating = Number(cafe.rating)

            return (
              <Marker
                key={cafe.id}
                position={position}
                icon={createCoffeeMarker(isSelected)}
                eventHandlers={{ click: () => handleSelectCafe(cafe) }}
              >
                <Popup maxWidth={260} minWidth={240}>
                  <div className="mandalay-map-popup">
                    {getCafeImage(cafe) && (
                      <img src={getCafeImage(cafe)} alt="" className="mandalay-popup-image" />
                    )}
                    <div className="min-w-0">
                      <strong className="block text-sm leading-5 text-coffee-900">{cafe.name}</strong>
                      <span className="mt-1 block text-xs leading-4 text-stone-600">
                        {[cafe.street_address, cafe.area, cafe.township, 'Mandalay']
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      {!cafe.street_address && cafe._resolvedAddress && (
                        <span className="mt-1 block text-[11px] leading-4 text-stone-500">
                          {cafe._resolvedAddress}
                        </span>
                      )}
                      {cafe._locationApproximate && (
                        <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                          Nearest known street location
                        </span>
                      )}
                      {Number.isFinite(rating) && rating > 0 && (
                        <span className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star size={13} fill="currentColor" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      <a
                        href={getDirectionsUrl(cafe, userPosition)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-coffee-700"
                      >
                        <ExternalLink size={12} />
                        Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {selectedCafe && (
          <div className="mandalay-route-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-coffee-500">Directions to</p>
                <h2 className="mt-1 text-base font-black text-coffee-900">{selectedCafe.name}</h2>
              </div>
              <button
                type="button"
                onClick={handleClearRoute}
                aria-label="Clear route"
                className="rounded-full p-1 text-stone-500 hover:bg-coffee-50"
              >
                <X size={18} />
              </button>
            </div>

            {!userPosition && (
              <p className="mt-3 text-sm text-stone-600">
                Allow location access to calculate your route.
              </p>
            )}
            {routeLoading && <p className="mt-3 text-sm text-stone-600">Calculating route...</p>}
            {routeError && <p role="alert" className="mt-3 text-sm text-red-600">{routeError}</p>}

            {route && (
              <>
                <div className="mt-3 flex items-center gap-4 text-sm font-bold text-coffee-800">
                  <span><Navigation size={14} className="mr-1 inline" />{formatDistance(route.distance)}</span>
                  <span>{formatDuration(route.duration)}</span>
                  <a
                    href={getDirectionsUrl(selectedCafe, userPosition)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-coffee-700"
                  >
                    Open navigation
                    <ExternalLink size={13} />
                  </a>
                </div>
                <ol className="mandalay-route-steps">
                  {route.steps.map((step, index) => (
                    <li key={`${step.name}-${index}`}>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-coffee-100 text-xs font-bold text-coffee-800">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-coffee-900">
                          {step.maneuver?.instruction || 'Continue'}
                        </span>
                        <span className="text-xs text-stone-500">
                          {formatDistance(step.distance)}
                          {step.name ? ` • ${step.name}` : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
