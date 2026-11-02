import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

const typeColors = {
  trade: 'bg-blue-500/20 text-blue-400',
  deposit: 'bg-emerald-500/20 text-emerald-400',
  system: 'bg-purple-500/20 text-purple-400',
  referral: 'bg-yellow-500/20 text-yellow-400',
  commission: 'bg-yellow-500/20 text-yellow-400',
  investment: 'bg-cyan-500/20 text-cyan-400',
  withdrawal: 'bg-red-500/20 text-red-400',
  level: 'bg-blue-500/20 text-blue-400',
  award: 'bg-emerald-500/20 text-emerald-400',
  wallet: 'bg-purple-500/20 text-purple-400',
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/notifications/?limit=50')
        setNotifications(data.notifications || [])
        setUnread(data.unread_count || 0)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all', {})
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      setUnread(0)
    } catch {}
  }

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`, {})
      setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n))
      setUnread((u) => Math.max(0, u - 1))
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        action={unread > 0 && (
          <button onClick={markAllRead} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Mark all as read</button>
        )}
      />

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {notifications.map((n) => (
              <div key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-500/5 hover:bg-blue-500/8' : 'hover:bg-slate-800/20'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || 'bg-slate-700 text-slate-400'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-slate-600 text-xs mt-1">{formatIST(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
