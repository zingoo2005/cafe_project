import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { notificationApi } from '../../api/cafes'

function notificationRecords(response) {
  const data = response?.data?.data
  return Array.isArray(data) ? data : []
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.list()
      setError('')
      setNotifications(notificationRecords(response))
      setUnreadCount(response?.unread_count ?? 0)
    } catch (requestError) {
      console.error('Unable to load notifications:', requestError)
      setError(requestError.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    const interval = window.setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [loadNotifications])

  async function markAsRead(notification) {
    try {
      setBusyId(notification.id)
      await notificationApi.markRead(notification.id)
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString() }
            : item
        )
      )
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (requestError) {
      console.error('Unable to mark notification as read:', requestError)
      setError(requestError.message || 'Unable to update notification.')
    } finally {
      setBusyId('')
    }
  }

  async function markAllAsRead() {
    try {
      setBusyId('all')
      await notificationApi.markAllRead()
      const readAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((item) => ({ ...item, read_at: item.read_at || readAt }))
      )
      setUnreadCount(0)
    } catch (requestError) {
      console.error('Unable to mark notifications as read:', requestError)
      setError(requestError.message || 'Unable to update notifications.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#fbf6f0] px-4 py-10 text-[#38291f] sm:px-6">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#eadbcf] bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee3da] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-[#f7ece3] text-[#79543c]">
              <Bell size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-black">Notifications</h1>
              <p className="mt-1 text-sm text-[#8b7768]">
                Messages about your account and posts.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={busyId !== ''}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e7d4c4] px-3 py-2 text-sm font-semibold text-[#68452f] hover:bg-[#fbf5f0] disabled:opacity-50"
            >
              <CheckCheck size={17} />
              Mark all read
            </button>
          )}
        </header>

        {error && (
          <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="p-8 text-center text-sm text-stone-500">
            Loading notifications…
          </p>
        ) : notifications.length ? (
          <div className="divide-y divide-[#f1e9e3]">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex items-start gap-4 p-5 sm:px-7 ${
                  notification.read_at ? '' : 'bg-[#fffaf6]'
                }`}
              >
                <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#f7ece3] text-[#79543c]">
                  <Bell size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {notification.data?.message || 'You have a new notification.'}
                  </p>
                  {notification.created_at && (
                    <time
                      dateTime={notification.created_at}
                      className="mt-1 block text-xs text-stone-500"
                    >
                      {new Date(notification.created_at).toLocaleString()}
                    </time>
                  )}
                </div>
                {!notification.read_at && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notification)}
                    disabled={busyId !== ''}
                    aria-label="Mark notification as read"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[#68452f] hover:bg-[#f1e6dc] disabled:opacity-50"
                  >
                    <Check size={18} />
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Bell size={32} className="mx-auto text-[#b8a393]" />
            <h2 className="mt-3 font-bold">No notifications yet</h2>
            <p className="mt-1 text-sm text-stone-500">
              We’ll show you here when an admin reviews your reports or posts.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
