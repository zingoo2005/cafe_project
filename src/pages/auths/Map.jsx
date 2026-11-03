
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getCafes } from '../../api/cafes'

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Move map when selected cafe changes
function MapController({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        duration: 1.5,
      })
    }
  }, [position, map])

  return null
}

export default function MapPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedCafe = location.state?.selectedCafe

  const [cafes, setCafes] = useState([])
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load approved cafes from Laravel
  useEffect(() => {
    async function loadCafes() {
      try {
        setLoading(true)
        setError('')

        const result = await getCafes(1, 30)

        const formattedCafes = result.data.map((cafe) => ({
          ...cafe,
          area: cafe.area || cafe.township || '',
          address: cafe.street_address || '',
          lat: cafe.latitude == null ? null : Number(cafe.latitude),
          lng: cafe.longitude == null ? null : Number(cafe.longitude),
          tags: cafe.tags || [],
        }))

        setCafes(formattedCafes)
      } catch (err) {
        console.error('Map cafe loading error:', err)
        setError('Unable to load cafés. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCafes()
  }, [])

  // Check selected cafe coordinates
  useEffect(() => {
    if (!selectedCafe) {
      setPosition(null)
      return
    }

    const lat = Number(selectedCafe.lat ?? selectedCafe.latitude)
    const lng = Number(selectedCafe.lng ?? selectedCafe.longitude)

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      selectedCafe.lat !== null &&
      selectedCafe.latitude !== null &&
      selectedCafe.lng !== null &&
      selectedCafe.longitude !== null
    ) {
      setPosition([lat, lng])
    } else {
      setPosition(null)
    }
  }, [selectedCafe])

  // Select another cafe
  function handleSelectCafe(cafe) {
    navigate('/map', {
      state: {
        selectedCafe: cafe,
      },
    })
  }

  return (
    <main className="mx-auto min-h-screen w-[92%] max-w-7xl py-8">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-widest text-coffee-500">
            Siplap Mandalay
          </p>

          <h1 className="mt-2 text-3xl font-black text-coffee-900">
            Cafe Map
          </h1>

          <p className="mt-2 text-stone-600">
            Explore cafe locations in Mandalay.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-coffee-100 px-4 py-3 font-semibold text-coffee-800 hover:bg-coffee-50"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>

      {/* Selected Cafe */}
      {selectedCafe && (
        <div className="mb-5 rounded-2xl border border-coffee-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-coffee-900">
            {selectedCafe.name}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
            <MapPin size={16} />
            {selectedCafe.address || selectedCafe.street_address || 'Address not provided'}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            {selectedCafe.area || selectedCafe.township || ''}
          </p>
        </div>
      )}

      {/* Map Display */}
      {position ? (
        <div className="h-[550px] overflow-hidden rounded-2xl border border-coffee-100 shadow">
          <MapContainer
            center={position}
            zoom={16}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController position={position} />

            <Marker position={position}>
              <Popup>
                <strong>{selectedCafe?.name}</strong>
                <br />
                {selectedCafe?.address || selectedCafe?.street_address}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="font-bold">
            Cafe location not available
          </h2>

          <p className="mt-2 text-sm">
            Select a café with latitude and longitude coordinates to display its map marker.
          </p>
        </div>
      )}

      {/* Cafe List */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-coffee-900">
          Available Cafes
        </h2>

        {loading && (
          <p className="text-center text-stone-500">
            Loading cafés...
          </p>
        )}

        {error && (
          <p className="text-center text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cafes.map((cafe) => (
                <button
                  key={cafe.id}
                  type="button"
                  onClick={() => handleSelectCafe(cafe)}
                  className="rounded-xl border border-coffee-100 bg-white p-4 text-left transition hover:border-coffee-400 hover:bg-coffee-50"
                >
                  <h3 className="font-bold text-coffee-900">
                    {cafe.name}
                  </h3>

                  <p className="mt-1 text-sm text-stone-500">
                    {cafe.area}
                  </p>

                  <p className="mt-2 text-xs text-coffee-600">
                    {cafe.lat !== null && cafe.lng !== null
                      ? 'View on map'
                      : 'Map location unavailable'}
                  </p>
                </button>
              ))}
            </div>

            {cafes.length === 0 && (
              <p className="rounded-xl border border-dashed border-coffee-200 p-8 text-center text-stone-500">
                No approved cafés available yet.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}
