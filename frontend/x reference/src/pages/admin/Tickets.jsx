import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

const STATUS_COLOR = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyImage, setReplyImage] = useState(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [closing, setClosing] = useState(false)
  const [viewImage, setViewImage] = useState(null)
  const [msg, setMsg] = useState('')
  const replyFileRef = useRef()

  const load = async (p = 1, f = filter) => {
    setLoading(true)
    try {
      const res = await api.get(`/tickets/admin/all?page=${p}&limit=5${f !== 'all' ? `&status=${f}` : ''}`)
      setTickets(res.tickets || [])
      setStats(res.stats || {})
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load(page, filter) }, [page, filter])

  const openTicket = async (t) => {
    setSelected(t); setDetailLoading(true)
    try {
      const d = await api.get(`/tickets/admin/${t.id}`)
      setDetail(d)
    } catch {} finally { setDetailLoading(false) }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !detail) return
    setReplying(true)
    try {
      const fd = new FormData()
      fd.append('message', replyText)
      if (replyImage) fd.append('image', replyImage)
      await fetch(`${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/tickets/admin/${detail.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fxu_access_token')}` },
        body: fd,
      })
      setReplyText(''); setReplyImage(null)
      const d = await api.get(`/tickets/admin/${detail.id}`)
      setDetail(d)
      load(page, filter)
    } catch {} finally { setReplying(false) }
  }

  const closeTicket = async () => {
    if (!detail) return
    setClosing(true)
    try {
      await api.post(`/tickets/admin/${detail.id}/close`, {})
      setShowCloseConfirm(false)
      setMsg('✅ Ticket closed')
      setTimeout(() => setMsg(''), 3000)
      const d = await api.get(`/tickets/admin/${detail.id}`)
      setDetail(d)
      load(page, filter)
    } catch (err) { setMsg(err.message) }
    finally { setClosing(false) }
  }

  const getImageUrl = (msgId) =>
    `${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/tickets/message/${msgId}/image`

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Manage all customer support requests" />

      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Attachment" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Close confirm */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Close Ticket?</h3>
            <p className="text-slate-400 text-sm mb-5">This will close the ticket and notify the user. They can open a new ticket if needed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={closeTicket} disabled={closing} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {closing ? 'Closing...' : 'Close Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Open', value: stats.open, color: 'text-blue-400' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-purple-400' },
          { label: 'Closed', value: stats.closed, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'closed'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-orange-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {f === 'in_progress' ? 'In Progress' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white font-semibold">Tickets</h3>
            <span className="text-slate-500 text-xs">{pagination.total} total</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No tickets found.</div>
          ) : (
            <div className="divide-y divide-slate-800/50 flex-1">
              {tickets.map(t => (
                <button key={t.id} onClick={() => openTicket(t)}
                  className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${selected?.id === t.id ? 'bg-slate-800/30' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-medium line-clamp-1">{t.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[t.status] || STATUS_COLOR.open}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{t.user_name} · <span className="font-mono text-blue-400">{t.user_fxu_id}</span></p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-mono">{t.ticket_ref}</span>
                    <span>·</span><span>{t.category}</span>
                    <span>·</span><span>{t.message_count} msg{t.message_count !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">{formatIST(t.created_at)}</p>
                </button>
              ))}
            </div>
          )}
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Previous
              </button>
              <span className="text-slate-500 text-xs">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg transition-colors">
                Next
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {detailLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detail ? (
            <>
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{detail.subject}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{detail.user_name} · <span className="font-mono text-blue-400">{detail.user_fxu_id}</span> · {detail.user_email}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{detail.ticket_ref} · {detail.category}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[detail.status] || STATUS_COLOR.open}`}>
                      {detail.status.replace('_', ' ')}
                    </span>
                    {detail.status !== 'closed' && (
                      <button onClick={() => setShowCloseConfirm(true)}
                        className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg transition-colors">
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {detail.messages?.map(msg => (
                  <div key={msg.id} className={`rounded-xl p-3.5 ${msg.is_admin ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[#1a2035]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.is_admin ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {msg.is_admin ? 'A' : msg.sender_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-400 text-xs">{msg.is_admin ? 'Admin' : msg.sender_name} · {formatIST(msg.created_at)}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{msg.message}</p>
                    {msg.has_image && (
                      <button onClick={() => setViewImage(getImageUrl(msg.id))}
                        className="mt-2 flex items-center gap-1.5 text-blue-400 text-xs hover:text-blue-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        View Attachment
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {detail.status !== 'closed' && (
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <div className="flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                      placeholder="Type admin reply..."
                      className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <input ref={replyFileRef} type="file" accept="image/*" className="hidden" onChange={e => setReplyImage(e.target.files[0])} />
                    <button onClick={() => replyFileRef.current.click()}
                      className={`p-2.5 rounded-xl border transition-colors ${replyImage ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#1a2035] border-slate-700 text-slate-400 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button onClick={sendReply} disabled={replying || !replyText.trim()}
                      className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
                  {replyImage && <p className="text-orange-400 text-xs">📎 {replyImage.name}</p>}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-6">
              <p className="text-sm">Select a ticket to respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
