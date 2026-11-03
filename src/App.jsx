import { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
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

import Login from './pages/auths/login'
import Logout from './pages/auths/Logout'
import Register from './pages/auths/Register'

import AdminDashboard from './pages/AdminDashboard'

const storageKey = 'cafemate-favourites'
const sessionKey = 'cafemate-session'

function RoleRoute({ user, role, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/'}
        replace
      />
    )
  }

  return children
}

function MyReviews() {
  return (
    <main className="mx-auto min-h-[60vh] w-[92%] max-w-5xl py-12">
      <h1 className="text-3xl font-black text-coffee-900">
        My Reviews
      </h1>
      <p className="mt-3 text-stone-600">
        Your cafe reviews will appear here.
      </p>
    </main>
  )
}

function Settings() {
  return (
    <main className="mx-auto min-h-[60vh] w-[92%] max-w-5xl py-12">
      <h1 className="text-3xl font-black text-coffee-900">
        Settings
      </h1>
      <p className="mt-3 text-stone-600">
        Manage your account settings here.
      </p>
    </main>
  )
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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(sessionKey)
      const parsed = saved ? JSON.parse(saved) : null
      return parsed?.email ? parsed : null
    } catch {
      return null
    }
  })

  const [favourites, setFavourites] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favourites))
    } catch (error) {
      console.error('Unable to save favourites:', error)
    }
  }, [favourites])

  function toggleFavourite(id) {
    setFavourites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function handleLogin(userData) {
    try {
      localStorage.setItem(sessionKey, JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Unable to save login session:', error)
    }
  }

  function handleLogout() {
    localStorage.removeItem(sessionKey)
    setUser(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-coffee-50">
      <Navbar
        favouriteCount={favourites.length}
        user={user}
      />

      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route path="/explore/*" element={<Explore />} />
          <Route path="/map" element={<MapPage />} />

          {/* Community list */}
          <Route path="/community" element={<Community />} />

          {/* Create post */}
          <Route
            path="/community/create"
            element={
              <RoleRoute user={user} role="user">
                <CreatePost />
              </RoleRoute>
            }
          />

          {/* Individual community post and review page */}
          <Route
            path="/community/post/:id"
            element={<CommunityPostDetail />}
          />

          {/* Keep compatibility with other community URLs */}
          <Route path="/community/*" element={<Community />} />

          <Route
            path="/top-picks"
            element={
              <TopPicks
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route
            path="/bookmarks"
            element={
              <Bookmarks
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route
            path="/favourites"
            element={
              <Favourites
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route
            path="/cafe/:id"
            element={
              <CafeDetail
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <RoleRoute user={user} role="user">
                <Profile favourites={favourites} />
              </RoleRoute>
            }
          />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate
                  to={user.role === 'admin' ? '/admin' : '/'}
                  replace
                />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/logout"
            element={<Logout onLogout={handleLogout} />}
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate
                  to={user.role === 'admin' ? '/admin' : '/'}
                  replace
                />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/my-reviews"
            element={
              <RoleRoute user={user} role="user">
                <MyReviews />
              </RoleRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <RoleRoute user={user} role="user">
                <Settings />
              </RoleRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <RoleRoute user={user} role="admin">
                <AdminDashboard />
              </RoleRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <Footer />
    </div>
  )
}