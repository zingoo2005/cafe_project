
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  Coffee,
  CalendarDays,
  Flag,
  House,
  LogOut,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  Users,
  MessageSquare,
  UserRoundPlus,
  UserRound,
  Zap,
  CheckCircle,
  X,
  XCircle,
} from 'lucide-react'

import { adminApi, mediaUrl } from '../api/cafes'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: House },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'cafes', label: 'Café management', icon: Store },
  { id: 'posts', label: 'Posts', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'history', label: 'Activity history', icon: ShieldCheck },
]

function records(response) {
  const data = response?.data?.data
  return Array.isArray(data) ? data : []
}

function relativeTime(value) {
  if (!value) return 'Date unavailable'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Date unavailable'

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function AdminDashboard({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const [users, setUsers] = useState([])
  const [cafes, setCafes] = useState([])
  const [directoryCafes, setDirectoryCafes] = useState([])
  const [posts, setPosts] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [reports, setReports] = useState([])
  const [history, setHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loadRequestId = useRef(0)
  const [cafeDraft, setCafeDraft] = useState(null)
  const [cafeSaving, setCafeSaving] = useState(false)

  // LOAD ADMIN DATA
  const loadData = useCallback(async ({ showLoading = true } = {}) => {
    const requestId = ++loadRequestId.current

    try {
      if (showLoading) setLoading(true)
      setError('')

      const [
        userResult,
        cafeResult,
        directoryCafeResult,
        postResult,
        allPostResult,
        reportResult,
        historyResult,
      ] = await Promise.all([
        adminApi.users(),
        adminApi.pendingCafes(),
        adminApi.directoryCafes(),
        adminApi.pendingPosts(),
        adminApi.posts(),
        adminApi.reports(),
        adminApi.history(),
      ])

      if (requestId !== loadRequestId.current) return

      setUsers(records(userResult))
      setCafes(records(cafeResult))
      setDirectoryCafes(directoryCafeResult)
      setPosts(records(postResult))
      setAllPosts(records(allPostResult))
      setReports(records(reportResult))
      setHistory(records(historyResult))
    } catch (requestError) {
      if (requestId !== loadRequestId.current) return

      console.error('Admin dashboard load failed:', requestError)

      setError(
        requestError.message || 'Unable to load admin data.'
      )
    } finally {
      if (requestId === loadRequestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const refreshInterval = window.setInterval(() => {
      loadData({ showLoading: false })
    }, 30000)

    return () => window.clearInterval(refreshInterval)
  }, [loadData])

  // COMMON ACTION HANDLER
  async function runAction(id, action, successMessage) {
    try {
      setBusyId(id)
      setError('')
      setNotice('')

      await action()

      setNotice(successMessage)

      await loadData()
    } catch (requestError) {
      setError(
        requestError.message || 'The action could not be completed.'
      )
    } finally {
      setBusyId(null)
    }
  }

  // APPROVE POST
  function handleApprovePost(post) {
    runAction(
      post.id,
      () => adminApi.approvePost(post.id, 'Approved by admin'),
      'Community post approved successfully.'
    )
  }

  // REJECT POST
  function handleRejectPost(post) {
    const confirmed = window.confirm(
      `Are you sure you want to reject "${post.title}"?`
    )

    if (!confirmed) return

    runAction(
      post.id,
      () => adminApi.rejectPost(
        post.id,
        'Rejected by admin'
      ),
      'Community post rejected.'
    )
  }

  function handleDeletePost(post) {
    const confirmed = window.confirm(
      `Delete "${post.title}"? Its linked café record and image will also be removed if nothing else uses that café. The post owner will be notified. This cannot be undone.`
    )

    if (!confirmed) return

    async function deletePost() {
      try {
        setBusyId(post.id)
        setError('')
        setNotice('')

        await adminApi.deletePost(post.id)
        setPosts((current) => current.filter((item) => item.id !== post.id))
        setAllPosts((current) => current.filter((item) => item.id !== post.id))
        setNotice('Post permanently deleted. Unused linked café data was removed, and the author has been notified.')

        await loadData()
      } catch (requestError) {
        setError(requestError.message || 'The post could not be deleted.')
      } finally {
        setBusyId(null)
      }
    }

    deletePost()
  }

  function openCafeForm(cafe = null) {
    setCafeDraft({
      id: cafe?.id || null,
      name: cafe?.name || '',
      township: cafe?.township || '',
      type: cafe?.type || 'Coffee',
      area: cafe?.area || '',
      street_address: cafe?.street_address || '',
      description: cafe?.description || '',
      image: cafe?.image || '',
      phone: cafe?.phone || '',
      website: cafe?.website || '',
      latitude: cafe?.latitude ?? '',
      longitude: cafe?.longitude ?? '',
      status: cafe?.status || 'approved',
      tags: Array.isArray(cafe?.tags) ? cafe.tags.join(', ') : '',
    })
    setError('')
  }

  async function saveCafe(event) {
    event.preventDefault()
    if (!cafeDraft) return

    const body = {
      name: cafeDraft.name.trim(),
      township: cafeDraft.township.trim(),
      type: cafeDraft.type.trim(),
      area: cafeDraft.area.trim() || null,
      street_address: cafeDraft.street_address.trim() || null,
      description: cafeDraft.description.trim() || null,
      image: cafeDraft.image.trim() || null,
      phone: cafeDraft.phone.trim() || null,
      website: cafeDraft.website.trim() || null,
      latitude: cafeDraft.latitude === '' ? null : Number(cafeDraft.latitude),
      longitude: cafeDraft.longitude === '' ? null : Number(cafeDraft.longitude),
      status: cafeDraft.status,
      tags: cafeDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }

    try {
      setCafeSaving(true)
      setError('')
      setNotice('')
      if (cafeDraft.id) {
        await adminApi.updateCafe(cafeDraft.id, body)
        setNotice('Café updated.')
      } else {
        await adminApi.createCafe(body)
        setNotice('Café created.')
      }
      setCafeDraft(null)
      await loadData()
    } catch (requestError) {
      setError(requestError.message || 'Unable to save café.')
    } finally {
      setCafeSaving(false)
    }
  }

  function deleteCafe(cafe) {
    if (!window.confirm(`Delete "${cafe.name}"? This will remove it from café listings.`)) return

    runAction(
      cafe.id,
      () => adminApi.deleteCafe(cafe.id),
      'Café deleted.'
    )
  }

  const openReportCount = reports.filter((report) => {
    const status = String(report.status || '').toLowerCase()
    return status === 'open' || status === 'pending' || !status
  }).length
  const pendingCount = cafes.length + posts.length + openReportCount
  const activityItems = [
    ...cafes.map((cafe) => ({
      id: `cafe-${cafe.id}`,
      icon: Store,
      text: `Café approval needed: ${cafe.name}`,
      detail: [cafe.type, cafe.township].filter(Boolean).join(' · ') ||
        'Awaiting admin review',
      date: cafe.created_at,
      tone: 'amber',
      tab: 'cafes',
    })),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      icon: MessageSquareText,
      text: `Post approval needed: ${post.title || 'Community post'}`,
      detail: post.user?.name
        ? `Submitted by ${post.user.name}`
        : 'Submitted by a user',
      date: post.created_at,
      tone: 'amber',
      tab: 'posts',
    })),
    ...reports.filter((report) => {
      const status = String(report.status || '').toLowerCase()
      return status === 'open' || status === 'pending' || !status
    }).map((report) => ({
      id: `report-${report.id}`,
      icon: Flag,
      text: `Reported post needs review: ${report.post?.title || 'Community post'}`,
      detail: report.reporter?.name
        ? `Reported by ${report.reporter.name}`
        : 'User report submitted',
      date: report.created_at,
      tone: 'amber',
      tab: 'reports',
    })),
  ]
    .sort((first, second) =>
      (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0)
    )

  const cafeShare = pendingCount ? cafes.length / pendingCount : 0
  const postShare = pendingCount ? posts.length / pendingCount : 0
  const reportShare = pendingCount ? openReportCount / pendingCount : 0
  const queueGradient = pendingCount
    ? `conic-gradient(#4b9348 0% ${cafeShare * 100}%, #f5bb64 ${cafeShare * 100}% ${(cafeShare + postShare) * 100}%, #c9a58d ${(cafeShare + postShare) * 100}% ${(cafeShare + postShare + reportShare) * 100}%, #eadfd6 ${(cafeShare + postShare + reportShare) * 100}% 100%)`
    : '#eadfd6'
  const notificationCount = activityItems.length

  function showNotifications() {
    setActiveTab('notifications')
    setNotificationsOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#fbf5f0] text-[#2f1e15]">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col bg-gradient-to-b from-[#4a2d1d] via-[#5a3825] to-[#3c2418] px-4 py-6 text-white md:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <Coffee size={34} strokeWidth={1.8} />
            <div>
              <p className="text-xl font-black leading-5">SipLab</p>
              <p className="mt-1 text-[9px] font-bold tracking-[0.3em] text-[#d3b9a2]">
                MANDALAY
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  activeTab === id
                    ? 'bg-[#a66d46] text-white shadow-lg'
                    : 'text-[#f2e7df] hover:bg-white/10'
                }`}
              >
                <Icon size={19} />
                <span className="flex-1">{label}</span>
                {id === 'cafes' && cafes.length > 0 && (
                  <span className="rounded-full bg-[#ffe0b4] px-2 py-0.5 text-xs font-black text-[#70411e]">
                    {cafes.length}
                  </span>
                )}
                {id === 'notifications' && notificationCount > 0 && (
                  <span className="rounded-full bg-[#ffe0b4] px-2 py-0.5 text-xs font-black text-[#70411e]">
                    {notificationCount}
                  </span>
                )}
              </button>
            ))}

          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#f2e7df] transition hover:bg-white/10"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#eadfd6] bg-[#fffaf6]/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a17d65]">
                  SipLab Management
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  {activeTab === 'dashboard'
                    ? 'Admin Dashboard'
                    : tabs.find((tab) => tab.id === activeTab)?.label}
                </h1>
                <p className="mt-1 hidden text-sm text-[#8b7b70] sm:block">
                  Manage users, cafés, posts and platform activity.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  aria-label="Refresh dashboard data"
                  className="grid size-10 place-items-center rounded-full border border-[#eadfd6] bg-white text-[#65442f] transition hover:bg-[#f7ece3] disabled:opacity-50"
                >
                  <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((open) => !open)}
                    aria-label="Open notifications"
                    aria-expanded={notificationsOpen}
                    className="relative grid size-10 place-items-center rounded-full text-[#65442f] transition hover:bg-[#f7ece3]"
                  >
                    <Bell size={21} />
                    {notificationCount > 0 && (
                      <span className="absolute right-1 top-1 size-2.5 rounded-full bg-red-500 ring-2 ring-[#fffaf6]" />
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#eee2d9] bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-[#f0e8e2] px-4 py-3">
                        <h2 className="font-black">Notifications</h2>
                        <span className="text-xs text-[#766a93]">
                          {notificationCount} needing attention
                        </span>
                      </div>
                      {activityItems.length ? (
                        <div className="divide-y divide-[#f1e9e3]">
                          {activityItems.slice(0, 4).map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab(item.tab)
                                    setNotificationsOpen(false)
                                  }}
                                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-[#fbf5f0]"
                                >
                                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f7ece3] text-[#79543c]">
                                    <Icon size={17} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-5">{item.text}</p>
                                    {item.detail && (
                                      <p className="mt-1 truncate text-xs text-stone-500">
                                        {item.detail}
                                      </p>
                                    )}
                                    <p className="mt-1 text-xs text-stone-500">{relativeTime(item.date)}</p>
                                  </div>
                                </button>
                              )
                            })}
                        </div>
                      ) : (
                        <p className="px-4 py-6 text-sm text-stone-500">
                          No café or post approvals currently need review.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          showNotifications()
                        }}
                        className="flex w-full items-center justify-center gap-2 border-t border-[#f0e8e2] px-4 py-3 text-sm font-bold text-[#68452f] hover:bg-[#fbf5f0]"
                      >
                        View all notifications <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <span className="grid size-10 place-items-center rounded-full bg-[#f0d7c0] text-[#6b4937]">
                    <Users size={20} />
                  </span>
                  <span className="max-w-32 truncate text-sm font-bold">
                    {user?.name || 'Administrator'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[#765b48] hover:bg-[#f7ece3] sm:hidden"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#eadfd6] bg-white px-4 py-3 md:hidden">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  activeTab === id
                    ? 'bg-[#6b4937] text-white'
                    : 'bg-[#f7eee7] text-[#65442f]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">

        {/* MESSAGES */}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-green-50 p-4 text-green-800"
          >
            {notice}
          </p>
        )}

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Registered users',
                  value: users.length,
                  icon: Users,
                  note: 'Platform accounts',
                  iconStyle: 'bg-[#f3e5d8] text-[#704a32]',
                },
                {
                  label: 'Café approvals',
                  value: cafes.length,
                  icon: Store,
                  note: 'Waiting for review',
                  iconStyle: 'bg-[#f7ead8] text-[#98602d]',
                },
                {
                  label: 'Pending posts',
                  value: posts.length,
                  icon: MessageSquareText,
                  note: 'Community submissions',
                  iconStyle: 'bg-[#e9eee5] text-[#4f7f49]',
                },
                {
                  label: 'Open reports',
                  value: openReportCount,
                  icon: Flag,
                  note: 'Flagged content',
                  iconStyle: 'bg-[#fde7d9] text-[#a45f34]',
                },
              ].map(({ label, value, icon: Icon, note, iconStyle }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-[#f0e5dc] bg-white p-5 shadow-[0_6px_18px_rgba(80,48,29,0.06)] sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <span className={`grid size-12 place-items-center rounded-2xl ${iconStyle}`}>
                      <Icon size={24} />
                    </span>
                    <ChartNoAxesCombined size={19} className="text-[#8eaa83]" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#79695d]">{label}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-3xl font-black tracking-tight">{loading ? '—' : value}</p>
                    <p className="pb-1 text-xs text-[#8b7b70]">{note}</p>
                  </div>
                </article>
              ))}
            </section>

            {loading && (
              <p className="rounded-xl border border-[#f0e5dc] bg-white px-5 py-3 text-sm text-stone-500">
                Loading the latest platform data…
              </p>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(250px,0.8fr)]">
              <section className="overflow-hidden rounded-2xl border border-[#f0e5dc] bg-white shadow-[0_6px_18px_rgba(80,48,29,0.06)]">
                <div className="flex items-center justify-between border-b border-[#f2e9e2] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Store size={22} className="text-[#704a32]" />
                    <div>
                      <h2 className="font-black sm:text-lg">Recent Café Approvals</h2>
                      <p className="mt-0.5 text-xs text-[#8b7b70]">Review new café submissions</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cafes')}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#704a32] hover:underline"
                  >
                    View all <ChevronRight size={16} />
                  </button>
                </div>

                <div className="divide-y divide-[#f2e9e2] px-4 sm:px-5">
                  {cafes.slice(0, 3).map((cafe) => (
                    <div key={cafe.id} className="flex flex-wrap items-center gap-3 py-4">
                      {cafe.image ? (
                        <img
                          src={mediaUrl(cafe.image)}
                          alt={cafe.name}
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-[#f7eee7] text-[#8a654b]">
                          <Coffee size={25} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{cafe.name}</p>
                        <p className="mt-1 truncate text-sm text-[#766a93]">
                          {cafe.type || 'Café'}{cafe.township ? ` · ${cafe.township}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#fff0d6] px-3 py-1 text-xs font-bold text-[#a75c13]">
                        Pending
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === cafe.id}
                          onClick={() =>
                            runAction(
                              cafe.id,
                              () => adminApi.reviewCafe(cafe.id, 'approved'),
                              'Café approved.'
                            )
                          }
                          className="rounded-lg bg-[#4c9148] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#3d7c3a] disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === cafe.id}
                          onClick={() =>
                            runAction(
                              cafe.id,
                              () => adminApi.reviewCafe(cafe.id, 'rejected'),
                              'Café rejected.'
                            )
                          }
                          className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {!cafes.length && (
                    <p className="py-8 text-center text-sm text-stone-500">
                      No cafés are waiting for approval.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#f0e5dc] bg-white p-5 shadow-[0_6px_18px_rgba(80,48,29,0.06)] sm:p-6">
                <div className="flex items-center gap-3">
                  <Zap size={21} className="text-[#9a6b28]" />
                  <h2 className="font-black sm:text-lg">Quick Actions</h2>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    { label: 'Review café approvals', tab: 'cafes', icon: Store },
                    { label: 'Manage users', tab: 'users', icon: UserRoundPlus },
                    { label: 'Review pending posts', tab: 'posts', icon: MessageSquareText },
                    { label: 'Handle reports', tab: 'reports', icon: Flag },
                  ].map(({ label, tab, icon: Icon }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="flex items-center gap-3 rounded-xl border border-[#e7d4c4] px-4 py-3 text-left text-sm font-bold text-[#422d20] transition hover:bg-[#fbf5f0]"
                    >
                      <Icon size={19} />
                      <span className="flex-1">{label}</span>
                      <ChevronRight size={16} className="text-[#927661]" />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
              <section className="rounded-2xl border border-[#f0e5dc] bg-white p-5 shadow-[0_6px_18px_rgba(80,48,29,0.06)] sm:p-6">
                <div className="flex items-center gap-3">
                  <Activity size={21} className="text-[#704a32]" />
                  <h2 className="font-black sm:text-lg">Review Queue</h2>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                  <div
                    className="grid size-40 shrink-0 place-items-center rounded-full p-4"
                    style={{ background: queueGradient }}
                    role="img"
                    aria-label={`${pendingCount} items in the review queue`}
                  >
                    <div className="grid size-full place-content-center rounded-full bg-white text-center">
                      <span className="text-3xl font-black">{loading ? '—' : pendingCount}</span>
                      <span className="text-xs font-semibold text-[#7d6a5b]">To review</span>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {[
                      ['Café approvals', cafes.length, 'bg-[#4b9348]', 'cafes'],
                      ['Pending posts', posts.length, 'bg-[#f5bb64]', 'posts'],
                      ['Open reports', openReportCount, 'bg-[#c9a58d]', 'reports'],
                    ].map(([label, count, color, tab]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className="flex items-center gap-2 text-left hover:text-[#704a32]"
                      >
                        <span className={`size-3 rounded-full ${color}`} />
                        <span>{label}</span>
                        <strong className="ml-auto">{loading ? '—' : count}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#f0e5dc] bg-white p-5 shadow-[0_6px_18px_rgba(80,48,29,0.06)] sm:p-6">
                <div className="flex items-center gap-3">
                  <Activity size={21} className="text-[#704a32]" />
                  <h2 className="font-black sm:text-lg">Needs Your Attention</h2>
                </div>
                {activityItems.length ? (
                  <div className="mt-3 divide-y divide-[#f2e9e2]">
                    {activityItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.id} className="flex items-center gap-3 py-3">
                          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${
                            item.tone === 'green'
                              ? 'bg-[#e9f1e2] text-[#4b9348]'
                              : 'bg-[#f7ece3] text-[#79543c]'
                          }`}>
                            <Icon size={17} />
                          </span>
                          <p className="min-w-0 flex-1 text-sm font-medium">{item.text}</p>
                          <span className="shrink-0 text-xs text-[#766a93]">
                            {relativeTime(item.date)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-stone-500">
                    No pending café or post approvals.
                  </p>
                )}
              </section>
            </div>
          </div>
        ) : loading ? (
          <p className="py-16 text-center text-stone-500">
            {activeTab === 'notifications'
              ? 'Loading updates from the server...'
              : 'Loading admin data...'}
          </p>
        ) : (

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E8DED5] bg-white">

            {/* LIVE ADMIN UPDATES */}
            {activeTab === 'notifications' && (
              <>
                <div className="border-b border-[#f0e5dc] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Bell size={22} className="text-[#704a32]" />
                    <div>
                      <h2 className="text-xl font-black">Notifications</h2>
                      <p className="mt-1 text-sm text-stone-500">
                        Live updates from server records. No sample notifications are shown.
                      </p>
                    </div>
                  </div>
                </div>

                {activityItems.length ? (
                  <div className="divide-y divide-[#f1e9e3]">
                    {activityItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.tab)}
                          className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#fbf7f3] sm:px-6"
                        >
                          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${
                            item.tone === 'green'
                              ? 'bg-[#e9f1e2] text-[#4b9348]'
                              : item.tone === 'red'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-[#fff0d6] text-[#a75c13]'
                          }`}>
                            <Icon size={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{item.text}</span>
                            <span className="mt-1 block text-xs text-stone-500">
                              {relativeTime(item.date)}
                            </span>
                          </span>
                          <span className="hidden items-center gap-1 text-sm font-semibold text-[#704a32] sm:flex">
                            View <ChevronRight size={16} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-6 py-14 text-center">
                    <Bell size={32} className="mx-auto text-[#b8a393]" />
                    <h3 className="mt-3 font-bold">No notifications</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      There are no matching records from the server right now.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <>
                <div className="border-b p-5">
                  <h2 className="text-xl font-black">
                    User management
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Ban accounts or change platform roles.
                  </p>
                </div>

                <div className="divide-y">

                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-5"
                    >
                      <div>
                        <p className="font-bold">{user.name}</p>

                        <p className="text-sm text-stone-500">
                          {user.email} · {user.role}
                          {user.banned_at ? ' · Banned' : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          disabled={busyId === user.id}
                          onClick={() =>
                            runAction(
                              user.id,
                              () => adminApi.setBan(
                                user.id,
                                !user.banned_at
                              ),
                              user.banned_at
                                ? 'User unbanned.'
                                : 'User banned.'
                            )
                          }
                          className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                          {user.banned_at ? 'Unban' : 'Ban'}
                        </button>

                      </div>
                    </div>
                  ))}

                  {!users.length && (
                    <p className="p-6 text-stone-500">
                      No users found.
                    </p>
                  )}

                </div>
              </>
            )}

            {/* CAFE MANAGEMENT */}
            {activeTab === 'cafes' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
                  <div>
                    <h2 className="text-xl font-black">Café database</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Create, edit, approve, reject, and remove café records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCafeForm()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#79543c] px-4 py-3 text-sm font-bold text-white hover:bg-[#60412f]"
                  >
                    <Plus size={17} />
                    Add café
                  </button>
                </div>

                {cafeDraft && (
                  <form onSubmit={saveCafe} className="border-b bg-[#fffaf6] p-5 sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black">
                        {cafeDraft.id ? 'Edit café' : 'Create café'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCafeDraft(null)}
                        aria-label="Close café form"
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                      >
                        <X size={19} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['name', 'Café name', true],
                        ['township', 'Township', true],
                        ['type', 'Type', true],
                        ['area', 'Area'],
                        ['street_address', 'Street address'],
                        ['phone', 'Phone'],
                        ['website', 'Website URL'],
                        ['image', 'Image URL or storage path'],
                        ['latitude', 'Latitude'],
                        ['longitude', 'Longitude'],
                      ].map(([name, label, required]) => (
                        <label key={name} className="grid gap-1.5 text-sm font-semibold text-stone-700">
                          {label}
                          <input
                            type={name === 'latitude' || name === 'longitude' ? 'number' : 'text'}
                            step={name === 'latitude' || name === 'longitude' ? 'any' : undefined}
                            required={Boolean(required)}
                            value={cafeDraft[name]}
                            onChange={(event) => setCafeDraft((current) => ({
                              ...current,
                              [name]: event.target.value,
                            }))}
                            className="min-w-0 rounded-lg border border-[#e4d7cc] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#9b6b4c]"
                          />
                        </label>
                      ))}
                      <label className="grid gap-1.5 text-sm font-semibold text-stone-700">
                        Status
                        <select
                          value={cafeDraft.status}
                          onChange={(event) => setCafeDraft((current) => ({
                            ...current,
                            status: event.target.value,
                          }))}
                          className="rounded-lg border border-[#e4d7cc] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#9b6b4c]"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold text-stone-700 sm:col-span-2 lg:col-span-3">
                        Tags (comma-separated)
                        <input
                          type="text"
                          value={cafeDraft.tags}
                          onChange={(event) => setCafeDraft((current) => ({
                            ...current,
                            tags: event.target.value,
                          }))}
                          className="rounded-lg border border-[#e4d7cc] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#9b6b4c]"
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold text-stone-700 sm:col-span-2 lg:col-span-3">
                        Description
                        <textarea
                          rows={3}
                          value={cafeDraft.description}
                          onChange={(event) => setCafeDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))}
                          className="resize-y rounded-lg border border-[#e4d7cc] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#9b6b4c]"
                        />
                      </label>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCafeDraft(null)}
                        className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={cafeSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#79543c] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#60412f] disabled:opacity-50"
                      >
                        <Save size={16} />
                        {cafeSaving ? 'Saving...' : 'Save café'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y">
                  {directoryCafes.map((cafe) => (
                    <div
                      key={cafe.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-5"
                    >
                      <div className="flex items-center gap-4">
                        {cafe.image && (
                          <img
                            src={mediaUrl(cafe.image)}
                            alt={cafe.name}
                            className="size-20 rounded-xl object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold">{cafe.name}</p>
                          <p className="text-sm text-stone-500">
                            {cafe.type} · {cafe.township}
                            {cafe.area ? `, ${cafe.area}` : ''}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{cafe.description}</p>
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            cafe.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : cafe.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cafe.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cafe.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === cafe.id}
                              onClick={() => runAction(
                                cafe.id,
                                () => adminApi.updateCafe(cafe.id, { status: 'approved' }),
                                'Café approved.'
                              )}
                              className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === cafe.id}
                              onClick={() => runAction(
                                cafe.id,
                                () => adminApi.updateCafe(cafe.id, { status: 'rejected' }),
                                'Café rejected.'
                              )}
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busyId === cafe.id}
                          onClick={() => openCafeForm(cafe)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#d6c5b7] px-3 py-2 text-sm font-semibold text-[#64452f] hover:bg-[#fbf5f0] disabled:opacity-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === cafe.id}
                          onClick={() => deleteCafe(cafe)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {!directoryCafes.length && (
                    <p className="p-6 text-stone-500">
                      No café records found.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* COMMUNITY POST APPROVALS */}
            {activeTab === 'posts' && (
              <>
                <div className="border-b p-5">
                  <h2 className="text-xl font-black">
                    Community posts
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Review submissions and manage posts shared by users.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {allPosts.map((post) => {
                    const postImage = post.image || post.images?.[0]

                    return (
                      <article
                        key={post.id}
                        className="overflow-hidden rounded-3xl border border-[#eee1d5] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-56 bg-[#eee4da]">
                          {postImage ? (
                            <img
                              src={mediaUrl(postImage)}
                              alt={post.cafe_name || post.title || 'Community post'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-stone-500">
                              No image available
                            </div>
                          )}
                          {post.category && (
                            <span className="absolute bottom-3 left-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#79543c] shadow">
                              {post.category}
                            </span>
                          )}
                          <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                            post.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-white text-[#4f7f49]'
                          }`}>
                            {post.status || 'Post'}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-extrabold text-[#493124]">
                              {post.cafe_name || post.title || 'Community post'}
                            </h3>
                            {post.rating != null && (
                              <span className="flex shrink-0 items-center gap-1 font-bold text-orange-600">
                                <Star size={16} fill="currentColor" />
                                {post.rating}
                              </span>
                            )}
                          </div>
                          {post.township && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                              <MapPin size={16} />
                              {post.township}
                            </p>
                          )}
                          <p className="mt-4 min-h-14 whitespace-pre-line leading-6 text-stone-600">
                            {post.body}
                          </p>
                          {Array.isArray(post.purposes) && post.purposes.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {post.purposes.map((purpose, index) => (
                                <span
                                  key={`${purpose}-${index}`}
                                  className="rounded-full bg-[#faf0e7] px-3 py-1.5 text-xs font-bold text-[#79543c]"
                                >
                                  {purpose}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-5 flex items-center justify-between gap-2 text-sm text-stone-500">
                            <span className="flex min-w-0 items-center gap-2">
                              <UserRound size={16} />
                              <span className="truncate">{post.user?.name || 'Unknown user'}</span>
                            </span>
                            {post.created_at && (
                              <span className="flex shrink-0 items-center gap-1">
                                <CalendarDays size={14} />
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/community/post/${post.id}`}
                            className="mt-5 flex w-full items-center justify-center rounded-xl border border-[#79543c] py-3 font-bold text-[#79543c] transition hover:bg-[#79543c] hover:text-white"
                          >
                            View details
                          </Link>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {post.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === post.id}
                                  onClick={() => handleApprovePost(post)}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-3 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
                                >
                                  <CheckCircle size={17} />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === post.id}
                                  onClick={() => handleRejectPost(post)}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  <XCircle size={17} />
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              disabled={busyId === post.id}
                              onClick={() => handleDeletePost(post)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              {busyId === post.id ? 'Deleting...' : 'Delete Post'}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}

                  {!allPosts.length && (
                    <div className="col-span-full p-10 text-center">
                      <CheckCircle
                        size={42}
                        className="mx-auto text-green-600"
                      />

                      <h3 className="mt-3 font-bold">
                        No community posts found
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        There are no posts to display.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && (
              <>
                <div className="border-b p-5">
                  <h2 className="text-xl font-black">
                    Reported posts
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Review report reasons, then keep or remove the post.
                  </p>
                </div>

                <div className="divide-y">
                  {reports.map((report) => (
                    <div key={report.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-bold">
                            {report.post?.title || 'Post unavailable'}
                            <span className="ml-2 text-xs font-normal text-stone-500">
                              Report {report.status || 'open'}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-stone-500">
                            Reported by {report.reporter?.name || 'Unknown'}
                          </p>
                          <p className="mt-3 rounded-xl bg-[#FBF6F1] p-3 text-sm">
                            {report.reason}
                          </p>
                        </div>
                        {(report.status === 'open' || report.status === 'pending' || !report.status) && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === report.post_id}
                              onClick={() =>
                                runAction(
                                  report.post_id,
                                  () => adminApi.moderatePost(report.post_id, 'keep'),
                                  'Post kept; reports resolved.'
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                              Keep post
                            </button>
                            <button
                              type="button"
                              disabled={busyId === report.post_id}
                              onClick={() =>
                                runAction(
                                  report.post_id,
                                  () => adminApi.moderatePost(report.post_id, 'remove'),
                                  'Post removed.'
                                )
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Remove post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {!reports.length && (
                    <p className="p-6 text-stone-500">No reports found.</p>
                  )}
                </div>
              </>
            )}

            {/* MODERATION HISTORY */}
            {activeTab === 'history' && (
              <>
                <div className="border-b p-5">
                  <h2 className="text-xl font-black">
                    Moderation history
                  </h2>
                </div>

                <div className="divide-y">

                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap justify-between gap-3 p-5"
                    >
                      <div>
                        <p className="font-bold capitalize">
                          {item.action} post #{item.post_id}
                        </p>

                        <p className="text-sm text-stone-500">
                          Moderator: {item.admin_name || 'Unknown'}
                          {' · '}
                          {new Date(item.created_at).toLocaleString()}
                        </p>

                        {item.notes && (
                          <p className="mt-2 text-sm">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/community/post/${item.post_id}`}
                        className="text-sm font-bold text-[#79543c]"
                      >
                        View post
                      </Link>
                    </div>
                  ))}

                  {!history.length && (
                    <p className="p-6 text-stone-500">
                      No moderation actions yet.
                    </p>
                  )}

                </div>
              </>
            )}

          </section>
        )}

          </div>
        </div>
      </div>
    </main>
  )
}
