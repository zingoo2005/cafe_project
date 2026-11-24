
import { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import Footer from './components/footer'
import Navbar from './components/Navbar'

import CafeDetail from './pages/auths/CafeDetails'
import Favourites from './pages/auths/Favourites'
import Home from './pages/auths/Home'
import Profile from './pages/auths/Profile'
import Explore from './pages/auths/Explore'
import MapPage from './pages/auths/Map'
import Community from './pages/auths/Community'
import CommunityPostDetail from './pages/auths/CommunityPostDetail'
import CreatePost from './pages/auths/CreatePost'
import TopPicks from './pages/auths/TopPicks'
import Bookmarks from './pages/auths/Bookmarks'
import Notifications from './pages/auths/Notifications'

import Login from './pages/auths/login'
import Logout from './pages/auths/Logout'
import Register from './pages/auths/Register'

import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import { MyCafes, MyReviews, Settings } from './pages/auths/AccountPages'

import { authApi, favoriteApi } from './api/cafes'

const sessionKey = 'cafemate-session'

// Normalize API response into a user session
function normalizeAuthResponse(response) {
  const payloads = [
    response,
    response?.data,
    response?.user,
    response?.payload,
    response?.data?.data,
    response?.data?.user,
    response?.payload?.data,
    response?.payload?.user,
  ].filter((payload) => payload && typeof payload === 'object')
  const userData = payloads.find((payload) => payload.name && payload.email)
  const token = payloads
    .map((payload) => payload.token ?? payload.access_token)
    .find(Boolean)

  if (!userData || !userData.name || !userData.email || !token) {
    throw new Error(
      'The API response did not include a user and authentication token. Check the Laravel login or register response.'
    )
  }

  return {
    ...userData,
    displayName: userData.name,
    token,
  }
}

function RoleRoute({ user, role, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/'}
        replace
      />
    )
  }

  return children
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-[92%] max-w-5xl flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-coffee-500">
        CafeMate Mandalay
      </p>

      <h1 className="mt-4 text-5xl font-black text-coffee-900">
        404
      </h1>

      <p className="mt-4 text-stone-600">
        Sorry, the page you are looking for could not be found.
      </p>

      <a
        href="/"
        className="mt-6 rounded-xl bg-coffee-700 px-6 py-3 font-semibold text-white transition hover:bg-coffee-800"
      >
        Back to Home
      </a>
    </main>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminArea = location.pathname === '/admin'

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(sessionKey)
      const parsed = saved ? JSON.parse(saved) : null

      return parsed?.email && parsed?.token ? parsed : null
    } catch {
      return null
    }
  })

  const [favourites, setFavourites] = useState([])
  const accessToken = user?.token

  // Refresh user session and favourites
  useEffect(() => {
    if (!accessToken) return

    let active = true

    async function refreshSession() {
      try {
        const profile = await authApi.me()

        if (!active) return

        const profileData =
          profile?.data?.data ??
          profile?.data ??
          profile?.user

        if (!profileData?.name || !profileData?.email) {
          throw new Error('Invalid user profile response.')
        }

        const session = {
          ...profileData,
          displayName: profileData.name,
          token: accessToken,
        }

        localStorage.setItem(sessionKey, JSON.stringify(session))
        setUser(session)

        let currentPage = 1
        let favoriteIds = []
        let lastPage = 1

        do {
          const favoriteResponse = await favoriteApi.list(currentPage)

          if (!active) return

          const page =
            favoriteResponse?.data?.data ??
            favoriteResponse?.data

          favoriteIds = favoriteIds.concat(
            (page?.data || []).map((cafe) => cafe.id)
          )

          lastPage = page?.last_page || currentPage
          currentPage += 1
        } while (active && currentPage <= lastPage)

        if (active) {
          setFavourites(favoriteIds)
        }
      } catch (error) {
        if (!active) return

        console.error('Session validation failed:', error)

        localStorage.removeItem(sessionKey)
        setUser(null)
        setFavourites([])
      }
    }

    refreshSession()

    return () => {
      active = false
    }
  }, [accessToken])

  // Handle unauthorized API responses
  useEffect(() => {
    function clearUnauthorizedSession() {
      localStorage.removeItem(sessionKey)
      setUser(null)
      setFavourites([])
      navigate('/login', { replace: true })
    }

    window.addEventListener(
      'cafemate:unauthorized',
      clearUnauthorizedSession
    )

    return () => {
      window.removeEventListener(
        'cafemate:unauthorized',
        clearUnauthorizedSession
      )
    }
  }, [navigate])

  // Login and registration
  function handleLogin(authResponse, expectedRole) {
    const userData = normalizeAuthResponse(authResponse)

    if (expectedRole && userData.role !== expectedRole) {
      throw new Error(
        expectedRole === 'admin'
          ? 'This account does not have administrator access. Use the user login page.'
          : 'This is an administrator account. Use the admin login page.'
      )
    }

    localStorage.setItem(sessionKey, JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  // Update profile
  function handleProfileUpdated(profile) {
    const profileData = profile?.data?.data ?? profile?.data ?? profile

    if (!profileData?.name) {
      console.error('Invalid profile update response:', profile)
      return
    }

    const updatedUser = {
      ...user,
      ...profileData,
      displayName: profileData.name,
      token: user?.token,
    }

    localStorage.setItem(sessionKey, JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  // Logout
  async function handleLogout() {
    try {
      if (user?.token) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Server logout failed:', error)
    } finally {
      localStorage.removeItem(sessionKey)
      setUser(null)
      setFavourites([])
      navigate('/login', { replace: true })
    }
  }

  // Toggle favourite
  async function toggleFavourite(id) {
    if (!user) {
      navigate('/login')
      return
    }

    const wasFavourite = favourites.includes(id)

    try {
      if (wasFavourite) {
        await favoriteApi.remove(id)

        setFavourites((current) =>
          current.filter((item) => item !== id)
        )
      } else {
        await favoriteApi.add(id)

        setFavourites((current) =>
          current.includes(id) ? current : [...current, id]
        )
      }
    } catch (error) {
      console.error('Unable to update favorite:', error)

      window.alert(
        error.message || 'Unable to update this favorite.'
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-coffee-50">
      {!isAdminArea && (
        <Navbar
          favouriteCount={favourites.length}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                key={location.search}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route
            path="/explore/*"
            element={
              <Explore
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route path="/map" element={<MapPage />} />

          {/* Community */}
          <Route
            path="/community"
            element={<Community user={user} />}
          />

          {/* Create Post */}
          <Route
            path="/community/create"
            element={
              <RoleRoute user={user}>
                <CreatePost user={user} />
              </RoleRoute>
            }
          />

          {/* Community Post Detail */}
          <Route
            path="/community/post/:id"
            element={<CommunityPostDetail user={user} />}
          />

          <Route
            path="/community/*"
            element={<Community user={user} />}
          />

          {/* Top Picks */}
          <Route
            path="/top-picks"
            element={
              <TopPicks
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          {/* Bookmarks */}
          <Route
            path="/bookmarks"
            element={
              <Bookmarks
                user={user}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          {/* Favourites */}
          <Route
            path="/favourites"
            element={
              <Favourites
                user={user}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          {/* Cafe Detail */}
          <Route
            path="/cafe/:id"
            element={
              <CafeDetail
                user={user}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          {/* User Profile */}
          <Route
            path="/profile"
            element={
              <RoleRoute user={user} role="user">
                <Profile
                  user={user}
                  onUserUpdated={handleProfileUpdated}
                  favourites={favourites}
                />
              </RoleRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <RoleRoute user={user} role="user">
                <Notifications />
              </RoleRoute>
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate
                  to={user.role === 'admin' ? '/admin' : '/'}
                  replace
                />
              ) : (
                <Login onLogin={handleLogin} expectedRole="user" />
              )
            }
          />

          {/* Logout */}
          <Route
            path="/logout"
            element={<Logout onLogout={handleLogout} />}
          />

          {/* Register */}
          <Route
            path="/register"
            element={
              user ? (
                <Navigate
                  to={user.role === 'admin' ? '/admin' : '/'}
                  replace
                />
              ) : (
                <Register onRegister={handleLogin} />
              )
            }
          />

          {/* My Reviews */}
          <Route
            path="/my-reviews"
            element={
              <RoleRoute user={user} role="user">
                <MyReviews />
              </RoleRoute>
            }
          />

          {/* My Cafes */}
          <Route
            path="/my/cafes"
            element={
              <RoleRoute user={user} role="user">
                <MyCafes />
              </RoleRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <RoleRoute user={user} role="user">
                <Settings onLogout={handleLogout} />
              </RoleRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : user ? (
                <Navigate to="/login" replace />
              ) : (
                <AdminLogin onLogin={handleLogin} />
              )
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!isAdminArea && <Footer />}
    </div>
  )
}
