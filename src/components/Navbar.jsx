
import { useState } from 'react'
import {
  Coffee,
  House,
  Compass,
  MapPin,
  Users,
  Star,
  Bookmark,
  Bell,
  Search,
  ChevronDown,
  UserRound,
  Settings,
  ShieldCheck,
  LogOut,
  FileText,
  Grid2X2,
  Menu,
  X,
} from 'lucide-react'

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { mediaUrl } from '../api/cafes'

// Explore dropdown: only All Cafes and By Township
const exploreItems = [
  { label: 'All Cafes', to: '/', icon: Grid2X2 },
  { label: 'By Township', to: '/explore/township', icon: MapPin },
]

// Profile dropdown items
const profileItems = [
  { label: 'My Profile', to: '/profile', icon: UserRound },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'My Cafés', to: '/my/cafes', icon: Coffee },
  { label: 'My Reviews', to: '/my-reviews', icon: FileText },
  { label: 'My Bookmarks', to: '/favourites', icon: Bookmark },
  { label: 'Settings', to: '/settings', icon: Settings },
]

// Reusable dropdown component (Explore only)
function Dropdown({ label, icon: Icon, items, open, toggle, close }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs transition lg:text-sm ${
          open
            ? 'bg-[#f3e5d5] text-[#68452f]'
            : 'text-stone-800 hover:bg-[#f8f0e8]'
        }`}
      >
        <Icon size={16} />
        {label}

        <ChevronDown
          size={13}
          className={open ? 'rotate-180 transition' : 'transition'}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-[#eee2d6] bg-white p-2 shadow-xl">
          {items.map(({ label: name, to, icon: ItemIcon }) => (
            <Link
              key={name}
              to={to}
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-[#f8f0e8]"
            >
              <ItemIcon size={17} />
              {name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar({
  favouriteCount = 0,
  user = null,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')

  const navigate = useNavigate()

  // Close all menus
  function closeMenus() {
    setMobileOpen(false)
    setDropdown('')
    setProfileOpen(false)
  }

  // Search cafes
  function handleSearch(event) {
    event.preventDefault()

    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`)
      closeMenus()
    }
  }

  // Logout
  function handleLogout() {
    closeMenus()

    if (onLogout) {
      onLogout()
      return
    }

    navigate('/logout')
  }

  const homeLink = [
    { label: 'Home', to: '/', icon: House },
  ]

  const otherLinks = [
    { label: 'Map', to: '/map', icon: MapPin },
    { label: 'Top Picks', to: '/top-picks', icon: Star },
    { label: 'Bookmarks', to: '/favourites', icon: Bookmark },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-[#eadfd3] bg-[#fffdf9]/95 backdrop-blur-xl">

      <div className="mx-auto flex min-h-[76px] w-[98%] max-w-[1600px] items-center justify-between gap-2 px-2 py-3 lg:gap-3">

        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMenus}
          className="flex shrink-0 items-center gap-2 text-[#553724]"
        >
          <Coffee size={34} strokeWidth={1.8} />

          <div>
            <span className="block text-base font-black tracking-tight lg:text-lg">
              SipLab
            </span>

            <span className="block text-[8px] font-bold tracking-[0.25em] text-[#8d705c]">
              MANDALAY
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden min-w-0 items-center justify-center gap-0.5 xl:flex">

          {/* Home */}
          {homeLink.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end
              onClick={closeMenus}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs lg:text-sm ${
                  isActive
                    ? 'bg-[#f3e5d5] text-[#68452f]'
                    : 'text-stone-800 hover:bg-[#f8f0e8]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {/* Explore Dropdown */}
          <Dropdown
            label="Explore"
            icon={Compass}
            items={exploreItems}
            open={dropdown === 'explore'}
            toggle={() => {
              setDropdown(dropdown === 'explore' ? '' : 'explore')
              setProfileOpen(false)
            }}
            close={closeMenus}
          />

          {/* Map */}
          <NavLink
            to="/map"
            onClick={closeMenus}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs lg:text-sm ${
                isActive
                  ? 'bg-[#f3e5d5] text-[#68452f]'
                  : 'text-stone-800 hover:bg-[#f8f0e8]'
              }`
            }
          >
            <MapPin size={16} />
            Map
          </NavLink>

          {/* Community: direct link, no dropdown */}
          <NavLink
            to="/community"
            onClick={closeMenus}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs lg:text-sm ${
                isActive
                  ? 'bg-[#f3e5d5] text-[#68452f]'
                  : 'text-stone-800 hover:bg-[#f8f0e8]'
              }`
            }
          >
            <Users size={16} />
            Community
          </NavLink>

          {/* Top Picks and Bookmarks */}
          {otherLinks.slice(1).map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={closeMenus}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs lg:text-sm ${
                  isActive
                    ? 'bg-[#f3e5d5] text-[#68452f]'
                    : 'text-stone-800 hover:bg-[#f8f0e8]'
                }`
              }
            >
              <Icon size={16} />
              {label}

              {label === 'Bookmarks' && favouriteCount > 0 && (
                <span className="rounded-full bg-[#ead8c5] px-1.5 text-[10px]">
                  {favouriteCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Search, Profile and Mobile Menu */}
        <div className="flex items-center gap-2">

          {/* Desktop Search */}
          <form
            onSubmit={handleSearch}
            className="hidden w-36 shrink-0 items-center gap-2 rounded-full bg-[#f0ece7] px-3 py-2 xl:flex xl:w-44"
          >
            
          </form>

          {/* Logged-in User */}
          {user ? (
            <div className="relative hidden shrink-0 xl:block">

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setDropdown('')
                }}
                aria-label="Open profile menu"
                className="flex items-center gap-1.5 rounded-full p-1.5 hover:bg-[#f8f0e8]"
              >
                {user?.avatar ? (
                  <img
                    src={mediaUrl(user.avatar)}
                    alt="Profile"
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-[#ead8c5] text-[#68452f]">
                    <UserRound size={17} />
                  </span>
                )}

                <ChevronDown size={14} />
              </button>

              {/* Profile Menu */}
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#eee2d6] bg-white p-2 shadow-xl">

                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={closeMenus} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-[#f8f0e8]">
                      <ShieldCheck size={16} />Admin dashboard
                    </Link>
                  )}
                  {profileItems.map(({ label, to, icon: Icon }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-[#f8f0e8]"
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))}

                  <div className="my-2 border-t border-stone-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-[#f8f0e8]"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (

            /* Login and Register */
            <div className="hidden shrink-0 items-center gap-1 xl:flex">
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-xs font-semibold text-[#553724] hover:bg-[#f8f0e8]"
              >
                User Login
              </Link>

              

              <Link
                to="/register"
                className="rounded-full bg-[#553724] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#3d2719]"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="rounded-xl p-2 text-[#553724] hover:bg-[#f3e5d5] xl:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-[#eadfd3] bg-white px-4 py-4 shadow-lg xl:hidden">

          {/* Mobile Search */}
          <form
            onSubmit={handleSearch}
            className="mb-4 flex items-center gap-3 rounded-xl bg-[#f5f0eb] px-4 py-2.5"
          >
            <Search size={17} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cafes..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>

          <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">

            {/* Home */}
            {homeLink.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                end
                onClick={closeMenus}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    isActive
                      ? 'bg-[#f3e5d5] text-[#68452f]'
                      : 'text-stone-700 hover:bg-[#f8f0e8]'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}

            {/* Explore Heading */}
            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              Explore
            </p>

            {/* Explore Links: only All Cafes and By Township */}
            {exploreItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-[#f8f0e8]"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}

            {/* Community: direct link */}
            <NavLink
              to="/community"
              onClick={closeMenus}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  isActive
                    ? 'bg-[#f3e5d5] font-semibold text-[#68452f]'
                    : 'text-stone-700 hover:bg-[#f8f0e8]'
                }`
              }
            >
              <Users size={17} />
              Community
            </NavLink>

            {/* Map, Top Picks and Bookmarks */}
            {otherLinks.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                onClick={closeMenus}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    isActive
                      ? 'bg-[#f3e5d5] font-semibold text-[#68452f]'
                      : 'text-stone-700 hover:bg-[#f8f0e8]'
                  }`
                }
              >
                <Icon size={17} />
                {label}

                {label === 'Bookmarks' && favouriteCount > 0 && (
                  <span className="ml-auto rounded-full bg-[#ead8c5] px-2 text-xs">
                    {favouriteCount}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="my-2 border-t border-stone-100" />

            {/* Logged-in Mobile Profile Menu */}
            {user ? (
              <>
                {profileItems.map(({ label, to, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-[#f8f0e8]"
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-[#f8f0e8]"
                >
                  <LogOut size={17} />
                  Log Out
                </button>
              </>
            ) : (

              /* Mobile Login and Register */
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="flex-1 rounded-xl bg-[#f8f0e8] px-3 py-2.5 text-center text-sm font-semibold text-[#553724]"
                >
                  User Login
                </Link>

                <Link
                  to="/admin"
                  onClick={closeMenus}
                  className="flex-1 rounded-xl bg-[#f8f0e8] px-3 py-2.5 text-center text-sm font-semibold text-[#553724]"
                >
                  Admin Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="flex-1 rounded-xl bg-[#553724] px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
