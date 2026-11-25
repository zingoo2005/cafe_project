import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Coffee,
  Search,
  MapPin,
  Navigation,
  LocateFixed,
  Star,
  Clock,
  Route,
  ArrowLeft,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { getCafes, mediaUrl } from "../../api/cafes";

/* =========================================================
   CONSTANTS
========================================================= */

const MANDALAY_CENTER = [21.9588, 96.0891];

const CACHE_KEY = "cafemate-geocode-cache";

const MANDALAY_BOUNDS = {
  minLat: 21.8,
  maxLat: 22.1,
  minLng: 95.95,
  maxLng: 96.25,
};

/* =========================================================
   HELPERS
========================================================= */

const isInsideMandalay = (lat, lng) => {
  return (
    lat >= MANDALAY_BOUNDS.minLat &&
    lat <= MANDALAY_BOUNDS.maxLat &&
    lng >= MANDALAY_BOUNDS.minLng &&
    lng <= MANDALAY_BOUNDS.maxLng
  );
};

const getCoordinates = (cafe) => {
  const lat = Number(
    cafe.lat ??
      cafe.latitude ??
      cafe.coordinates?.lat ??
      cafe.coordinates?.latitude
  );

  const lng = Number(
    cafe.lng ??
      cafe.longitude ??
      cafe.coordinates?.lng ??
      cafe.coordinates?.longitude
  );

  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
  ) {
    return { lat, lng };
  }

  return null;
};

const getCafeImage = (cafe) => {
  const image =
    cafe.image ||
    cafe.coverImage ||
    cafe.imageUrl ||
    cafe.photo ||
    cafe.thumbnail;

  if (!image) return null;

  return mediaUrl(image);
};

const getCafeCategory = (cafe) => {
  return cafe.type || cafe.category || "Coffee Shop";
};

const getCafeArea = (cafe) => {
  return cafe.area || cafe.township || cafe.location || "Mandalay";
};

/* =========================================================
   GEOCODING CACHE
========================================================= */

const getGeocodeCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

/* =========================================================
   AUTOMATIC LOCATION SEARCH
========================================================= */

const searchLocation = async (query) => {
  try {
    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "mm");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      return null;
    }

    const results = await response.json();

    if (!results.length) {
      return null;
    }

    for (const result of results) {
      const lat = Number(result.lat);
      const lng = Number(result.lon);

      if (isInsideMandalay(lat, lng)) {
        return {
          lat,
          lng,
          displayName: result.display_name,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

const searchCafeLocation = async (cafe) => {
  const cache = getGeocodeCache();
  const cacheKey = String(cafe.id);

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const queries = [
    `${cafe.name}, ${cafe.address || ""}, ${cafe.area || ""}, Mandalay, Myanmar`,
    `${cafe.name}, ${cafe.area || cafe.township || ""}, Mandalay, Myanmar`,
    `${cafe.address || ""}, ${cafe.area || cafe.township || ""}, Mandalay, Myanmar`,
  ].filter((query) => query.replace(/[, ]/g, "").length > 5);

  for (let i = 0; i < queries.length; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    const coordinates = await searchLocation(queries[i]);

    if (coordinates) {
      cache[cacheKey] = coordinates;

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cache)
      );

      return coordinates;
    }
  }

  return null;
};

/* =========================================================
   CUSTOM CAFE MARKER
========================================================= */

const createCafeIcon = (selected = false) => {
  return L.divIcon({
    className: "cafemate-marker-container",

    html: `
      <div class="cafemate-marker ${
        selected ? "cafemate-marker-selected" : ""
      }">
        <div class="cafemate-marker-inner">
          ☕
        </div>
      </div>
    `,

    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
};

/* =========================================================
   USER LOCATION MARKER
========================================================= */

const userLocationIcon = L.divIcon({
  className: "cafemate-user-marker-container",

  html: `
    <div class="cafemate-user-marker">
      <div class="cafemate-user-marker-pulse"></div>
      <div class="cafemate-user-marker-dot"></div>
    </div>
  `,

  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* =========================================================
   MAP CONTROLLER
========================================================= */

function MapController({ selectedCafe, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCafe?.coordinates) {
      map.flyTo(
        [
          selectedCafe.coordinates.lat,
          selectedCafe.coordinates.lng,
        ],
        16,
        { duration: 1.2 }
      );
    }
  }, [selectedCafe, map]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 15, {
        duration: 1.2,
      });
    }
  }, [userLocation, map]);

  return null;
}

/* =========================================================
   MAIN MAP PAGE
========================================================= */

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCafe, setSelectedCafe] = useState(null);

  const [userLocation, setUserLocation] = useState(null);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [locationError, setLocationError] = useState("");
  const [geocodingProgress, setGeocodingProgress] = useState("");

  /* =========================================================
     LOAD CAFES
  ========================================================= */

  useEffect(() => {
    loadCafes();
  }, []);

  const loadCafes = async () => {
    setLoading(true);

    try {
      const response = await getCafes();

      let cafeList = [];

      if (Array.isArray(response)) {
        cafeList = response;
      } else if (Array.isArray(response?.data)) {
        cafeList = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        cafeList = response.data.data;
      } else if (Array.isArray(response?.cafes)) {
        cafeList = response.cafes;
      }

      cafeList = cafeList.filter(
        (cafe) => cafe && cafe.name
      );

      const processedCafes = cafeList.map((cafe) => ({
        ...cafe,
        coordinates: getCoordinates(cafe),
      }));

      setCafes(processedCafes);

      /* Automatically locate cafes without coordinates */

      const missingCoordinates = processedCafes.filter(
        (cafe) => !cafe.coordinates
      );

      for (let i = 0; i < missingCoordinates.length; i++) {
        const cafe = missingCoordinates[i];

        setGeocodingProgress(
          `Finding cafe locations (${i + 1}/${missingCoordinates.length})`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 1100)
        );

        const coordinates = await searchCafeLocation(cafe);

        if (coordinates) {
          setCafes((previous) =>
            previous.map((item) =>
              String(item.id) === String(cafe.id)
                ? {
                    ...item,
                    coordinates,
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                  }
                : item
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to load cafes:", error);

      setLocationError(
        "Failed to load cafes. Please check your internet connection."
      );
    } finally {
      setLoading(false);
      setGeocodingProgress("");
    }
  };

  /* =========================================================
     SELECT CAFE FROM EXPLORE PAGE
  ========================================================= */

  useEffect(() => {
    const selectedFromExplore = location.state?.selectedCafe;

    if (!selectedFromExplore) return;

    const matchedCafe = cafes.find(
      (cafe) =>
        String(cafe.id) === String(selectedFromExplore.id)
    );

    if (matchedCafe) {
      setSelectedCafe(matchedCafe);
    } else {
      setSelectedCafe(selectedFromExplore);
    }
  }, [location.state, cafes]);

  /* =========================================================
     SEARCH CAFES
  ========================================================= */

  const filteredCafes = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return cafes;

    return cafes.filter((cafe) => {
      const text = [
        cafe.name,
        cafe.address,
        cafe.area,
        cafe.township,
        cafe.type,
        cafe.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(searchText);
    });
  }, [cafes, search]);

  const mappedCafes = filteredCafes.filter(
    (cafe) => cafe.coordinates
  );

  /* =========================================================
     GET USER LOCATION
  ========================================================= */

  const handleGetMyLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(coordinates);
        setLoadingLocation(false);
      },

      (error) => {
        setLoadingLocation(false);

        if (error.code === 1) {
          setLocationError(
            "Location permission denied. Please allow location access."
          );
        } else if (error.code === 2) {
          setLocationError(
            "Your location could not be detected."
          );
        } else {
          setLocationError(
            "Unable to get your location. Please try again."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* =========================================================
     GET ROUTE
  ========================================================= */

  const getRoute = async (cafe) => {
    if (!userLocation || !cafe.coordinates) return;

    setLoadingRoute(true);
    setRouteCoordinates([]);
    setRouteInfo(null);

    try {
      const start = `${userLocation[1]},${userLocation[0]}`;

      const end = `${cafe.coordinates.lng},${cafe.coordinates.lat}`;

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start};${end}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes?.length > 0) {
        const route = data.routes[0];

        const coordinates =
          route.geometry.coordinates.map((point) => [
            point[1],
            point[0],
          ]);

        setRouteCoordinates(coordinates);

        setRouteInfo({
          distance: (route.distance / 1000).toFixed(2),
          duration: Math.round(route.duration / 60),
        });
      } else {
        setLocationError("No route was found.");
      }
    } catch (error) {
      console.error("Route error:", error);

      setLocationError(
        "Failed to calculate route. Please try again."
      );
    } finally {
      setLoadingRoute(false);
    }
  };

  /* =========================================================
     SELECT CAFE
  ========================================================= */

  const handleSelectCafe = (cafe) => {
    setSelectedCafe(cafe);
    setRouteCoordinates([]);
    setRouteInfo(null);
  };

  /* =========================================================
     GOOGLE MAPS
  ========================================================= */

  const openGoogleMaps = (cafe) => {
    if (!cafe.coordinates) {
      const query = encodeURIComponent(
        `${cafe.name}, ${cafe.address || ""}, ${cafe.area || ""}, Mandalay, Myanmar`
      );

      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank"
      );

      return;
    }

    const destination =
      `${cafe.coordinates.lat},${cafe.coordinates.lng}`;

    let url;

    if (userLocation) {
      const origin =
        `${userLocation[0]},${userLocation[1]}`;

      url =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${origin}` +
        `&destination=${destination}` +
        `&travelmode=driving`;
    } else {
      url =
        `https://www.google.com/maps/search/?api=1` +
        `&query=${destination}`;
    }

    window.open(url, "_blank");
  };

  /* =========================================================
     CLEAR SELECTION
  ========================================================= */

  const clearSelectedCafe = () => {
    setSelectedCafe(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
  };

  /* =========================================================
     CSS
  ========================================================= */

  const styles = `
    .cafemate-marker-container {
      background: transparent;
      border: none;
    }

    .cafemate-marker {
      width: 42px;
      height: 42px;
      background: #8b5cf6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .2s ease;
    }

    .cafemate-marker-selected {
      background: #5b21b6;
      transform: scale(1.2);
      box-shadow: 0 0 0 8px rgba(139,92,246,.2);
    }

    .cafemate-marker-inner {
      font-size: 18px;
    }

    .cafemate-user-marker-container {
      background: transparent;
      border: none;
    }

    .cafemate-user-marker {
      position: relative;
      width: 28px;
      height: 28px;
    }

    .cafemate-user-marker-pulse {
      position: absolute;
      inset: 0;
      background: rgba(37,99,235,.25);
      border-radius: 50%;
      animation: cafemate-pulse 1.8s infinite;
    }

    .cafemate-user-marker-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      top: 7px;
      left: 7px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
    }

    @keyframes cafemate-pulse {
      0% {
        transform: scale(.7);
        opacity: 1;
      }

      100% {
        transform: scale(2.3);
        opacity: 0;
      }
    }

    .cafemate-map-popup {
      min-width: 180px;
    }

    .cafemate-map-popup h3 {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 700;
    }

    .cafemate-map-popup p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }

    .cafemate-scrollbar::-webkit-scrollbar {
      width: 5px;
    }

    .cafemate-scrollbar::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 10px;
    }

    .cafemate-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    @media (max-width: 900px) {
      .cafemate-map-layout {
        grid-template-columns: 1fr !important;
        height: auto !important;
      }

      .cafemate-map-sidebar {
        max-height: 500px;
      }

      .cafemate-map-container {
        height: 600px;
      }
    }
  `;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <style>{styles}</style>

      {/* HEADER */}

      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "24px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#593b2b",
            }}
          >
            <ArrowLeft size={26} />
          </button>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                color: "#172033",
                fontWeight: 750,
              }}
            >
              Mandalay Cafe Map
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 16,
              }}
            >
              Discover cafes around Mandalay
            </p>
          </div>
        </div>

        <button
          onClick={handleGetMyLocation}
          disabled={loadingLocation}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "15px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {loadingLocation ? (
            <Loader2 size={20} />
          ) : (
            <LocateFixed size={20} />
          )}

          {loadingLocation
            ? "Getting location..."
            : "My Location"}
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {locationError && (
        <div
          style={{
            margin: 20,
            padding: 15,
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: 12,
          }}
        >
          {locationError}
        </div>
      )}

      {/* MAIN LAYOUT */}

      <div
        className="cafemate-map-layout"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(320px, 430px) minmax(0, 1fr)",
          gap: 20,
          padding: 20,
          height: "calc(100vh - 140px)",
          minHeight: 650,
        }}
      >
        {/* SIDEBAR */}

        <div
          className="cafemate-map-sidebar"
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,.05)",
          }}
        >
          {/* SEARCH */}

          <div
            style={{
              padding: 20,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 15,
                padding: "14px 16px",
              }}
            >
              <Search color="#94a3b8" size={22} />

              <input
                type="text"
                placeholder="Search cafes in Mandalay..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: 16,
                  background: "transparent",
                }}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* CAFE COUNT */}

            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#64748b",
                }}
              >
                <Coffee size={18} />

                <span>
                  {filteredCafes.length} cafes found
                </span>
              </div>

              <span
                style={{
                  padding: "7px 13px",
                  background: "#f3e8ff",
                  color: "#9333ea",
                  borderRadius: 20,
                  fontSize: 13,
                }}
              >
                Mandalay
              </span>
            </div>

            {/* GEOCODING PROGRESS */}

            {geocodingProgress && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#7c3aed",
                  fontSize: 13,
                }}
              >
                <Loader2 size={15} />

                {geocodingProgress}
              </div>
            )}
          </div>

          {/* CAFE LIST */}

          <div
            className="cafemate-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
            }}
          >
            {loading && cafes.length === 0 ? (
              <div
                style={{
                  padding: 35,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <Loader2
                  size={30}
                  style={{
                    margin: "0 auto 12px",
                  }}
                />

                <p>Loading cafes...</p>
              </div>
            ) : filteredCafes.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#94a3b8",
                }}
              >
                <Coffee size={40} />

                <p>No cafes found.</p>
              </div>
            ) : (
              filteredCafes.map((cafe) => {
                const isSelected =
                  String(selectedCafe?.id) ===
                  String(cafe.id);

                const image = getCafeImage(cafe);

                return (
                  <button
                    key={cafe.id}
                    onClick={() => handleSelectCafe(cafe)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: isSelected
                        ? "2px solid #8b5cf6"
                        : "1px solid transparent",
                      background: isSelected
                        ? "#faf5ff"
                        : "#fff",
                      borderRadius: 16,
                      padding: 14,
                      display: "flex",
                      gap: 14,
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                  >
                    {/* IMAGE */}

                    <div
                      style={{
                        width: 90,
                        height: 90,
                        flexShrink: 0,
                        borderRadius: 14,
                        background: "#f1f5f9",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={cafe.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Coffee
                          size={32}
                          color="#94a3b8"
                        />
                      )}
                    </div>

                    {/* CAFE DETAILS */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <h3
                        style={{
                          margin: "3px 0 8px",
                          fontSize: 17,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {cafe.name}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          color: "#64748b",
                          fontSize: 14,
                        }}
                      >
                        <MapPin size={16} />

                        {getCafeArea(cafe)}
                      </div>

                      {cafe.rating && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 8,
                            color: "#f59e0b",
                          }}
                        >
                          <Star
                            size={15}
                            fill="#f59e0b"
                          />

                          <span
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                            }}
                          >
                            {cafe.rating}
                          </span>
                        </div>
                      )}

                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          padding: "5px 10px",
                          background: "#f3e8ff",
                          color: "#9333ea",
                          borderRadius: 20,
                          fontSize: 12,
                        }}
                      >
                        {getCafeCategory(cafe)}
                      </span>

                      {!cafe.coordinates && (
                        <div
                          style={{
                            marginTop: 5,
                            color: "#f59e0b",
                            fontSize: 12,
                          }}
                        >
                          Location not found
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* SELECTED CAFE DETAILS */}

          {selectedCafe && (
            <div
              style={{
                padding: 18,
                borderTop: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 17,
                    }}
                  >
                    {selectedCafe.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    {selectedCafe.address ||
                      getCafeArea(selectedCafe)}
                  </p>
                </div>

                <button
                  onClick={clearSelectedCafe}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    height: 25,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* ROUTE INFORMATION */}

              {routeInfo && (
                <div
                  style={{
                    display: "flex",
                    gap: 15,
                    marginTop: 14,
                    padding: 12,
                    background: "#eff6ff",
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <Route size={17} color="#2563eb" />

                    <strong
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "#2563eb",
                      }}
                    >
                      {routeInfo.distance} km
                    </strong>
                  </div>

                  <div>
                    <Clock size={17} color="#2563eb" />

                    <strong
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "#2563eb",
                      }}
                    >
                      {routeInfo.duration} min
                    </strong>
                  </div>
                </div>
              )}

              {/* ROUTE BUTTON */}

              {userLocation && selectedCafe.coordinates && (
                <button
                  onClick={() => getRoute(selectedCafe)}
                  disabled={loadingRoute}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    border: "none",
                    borderRadius: 12,
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  {loadingRoute ? (
                    <Loader2 size={18} />
                  ) : (
                    <Route size={18} />
                  )}

                  {loadingRoute
                    ? "Calculating route..."
                    : "Get Directions"}
                </button>
              )}

              {/* GOOGLE MAPS BUTTON */}

              <button
                onClick={() => openGoogleMaps(selectedCafe)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontWeight: 600,
                }}
              >
                <ExternalLink size={18} />

                Open in Google Maps
              </button>
            </div>
          )}
        </div>

        {/* MAP */}

        <div
          className="cafemate-map-container"
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            minHeight: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,.05)",
            position: "relative",
          }}
        >
          <MapContainer
            center={MANDALAY_CENTER}
            zoom={14}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 600,
            }}
          >
            {/* MAP TILES */}

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* MAP CONTROLLER */}

            <MapController
              selectedCafe={selectedCafe}
              userLocation={userLocation}
            />

            {/* CAFE MARKERS */}

            {mappedCafes.map((cafe) => {
              const isSelected =
                String(selectedCafe?.id) ===
                String(cafe.id);

              return (
                <Marker
                  key={cafe.id}
                  position={[
                    cafe.coordinates.lat,
                    cafe.coordinates.lng,
                  ]}
                  icon={createCafeIcon(isSelected)}
                  eventHandlers={{
                    click: () => handleSelectCafe(cafe),
                  }}
                >
                  <Popup>
                    <div className="cafemate-map-popup">
                      <h3>{cafe.name}</h3>

                      <p>
                        {cafe.address ||
                          getCafeArea(cafe)}
                      </p>

                      {cafe.rating && (
                        <p
                          style={{
                            marginTop: 5,
                            color: "#f59e0b",
                          }}
                        >
                          ⭐ {cafe.rating}
                        </p>
                      )}

                      <button
                        onClick={() => handleSelectCafe(cafe)}
                        style={{
                          marginTop: 10,
                          background: "#8b5cf6",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 12px",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        View Cafe Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* USER LOCATION */}

            {userLocation && (
              <Marker
                position={userLocation}
                icon={userLocationIcon}
              >
                <Popup>
                  <strong>My Current Location</strong>
                </Popup>
              </Marker>
            )}

            {/* ROUTE LINE */}

            {routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: "#2563eb",
                  weight: 6,
                  opacity: 0.85,
                }}
              />
            )}
          </MapContainer>

          {/* MAP COUNTER */}

          <div
            style={{
              position: "absolute",
              top: 15,
              right: 15,
              zIndex: 1000,
              background: "#fff",
              padding: "10px 15px",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,.12)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            📍 {mappedCafes.length} cafes on map
          </div>

          {/* NO LOCATION FOUND */}

          {!loading && mappedCafes.length === 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
                background: "#fff",
                borderRadius: 12,
                padding: 15,
                textAlign: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,.1)",
              }}
            >
              <p style={{ margin: 0 }}>
                Cafe locations could not be found.
                Please check cafe addresses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}