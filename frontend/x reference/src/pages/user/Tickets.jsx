import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatIST } from '../../utils/dateFormatter'

const CATEGORIES = ['Deposit', 'Withdrawal', 'Technical', 'Account', 'Referral', 'KYC', 'Other']
const STATUS_COLOR = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export default function UserTickets() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [viewImage, setViewImage] = useState(null)

  // New ticket form
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Deposit')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)
  const fileRef = useRef()
  const replyFileRef = useRef()
  const [replyImage, setReplyImage] = useState(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/tickets/my?page=${p}&limit=5`)
      setTickets(res.tickets || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const openTicket = async (t) => {
    setSelected(t)
    setDetailLoading(true)
    try {
      const detail = await api.get(`/tickets/my/${t.id}`)
      setSelectedDetail(detail)
    } catch {} finally { setDetailLoading(false) }
  }

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('subject', subject)
      fd.append('category', category)
      fd.append('message', message)
      if (image) fd.append('image', image)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/tickets/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fxu_access_token')}` },
        body: fd,
      })
      if (!res.ok) throw new Error('Failed')
      setShowNew(false); setSubject(''); setCategory('Deposit'); setMessage(''); setImage(null)
      load(1); setPage(1)
    } catch {} finally { setSubmitting(false) }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedDetail) return
    setReplying(true)
    try {
      const fd = new FormData()
      fd.append('message', replyText)
      if (replyImage) fd.append('image', replyImage)
      await fetch(`${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/tickets/my/${selectedDetail.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fxu_access_token')}` },
        body: fd,
      })
      setReplyText(''); setReplyImage(null)
      const detail = await api.get(`/tickets/my/${selectedDetail.id}`)
      setSelectedDetail(detail)
      load(page)
    } catch {} finally { setReplying(false) }
  }

  const getImageUrl = (msgId) =>
    `${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/tickets/message/${msgId}/image`

  return (
    <div className="space-y-6">
      <PageHeader title="Support" subtitle="Get help from our support team"
        action={
          <button onClick={() => setShowNew(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            + New Ticket
          </button>
        }
      />

      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Attachment" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* New ticket form */}
      {showNew && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">New Support Ticket</h3>
            <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Message</label>
              <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Attachment (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0])} />
              <button onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 bg-[#1a2035] border border-slate-700 hover:border-slate-600 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                {image ? image.name : 'Attach Image'}
              </button>
            </div>
          </div>
          <button onClick={submitTicket} disabled={submitting || !subject.trim() || !message.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket list */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white font-semibold">My Tickets</h3>
            <span className="text-slate-500 text-xs">{pagination.total} total</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No tickets yet. Create one above.</div>
          ) : (
            <div className="divide-y divide-slate-800/50 flex-1">
              {tickets.map(t => (
                <button key={t.id} onClick={() => openTicket(t)}
                  className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${selected?.id === t.id ? 'bg-slate-800/30' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-1">{t.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[t.status] || STATUS_COLOR.open}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono">{t.ticket_ref}</span>
                    <span>·</span>
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{t.message_count} msg{t.message_count !== 1 ? 's' : ''}</span>
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

        {/* Ticket detail */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {detailLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedDetail ? (
            <>
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{selectedDetail.subject}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedDetail.ticket_ref} · {selectedDetail.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[selectedDetail.status] || STATUS_COLOR.open}`}>
                    {selectedDetail.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {selectedDetail.messages?.map(msg => (
                  <div key={msg.id} className={`rounded-xl p-3.5 ${msg.is_admin ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-[#1a2035]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.is_admin ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {msg.is_admin ? 'S' : msg.sender_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-400 text-xs">{msg.is_admin ? 'Support Agent' : 'You'} · {formatIST(msg.created_at)}</span>
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
              {selectedDetail.status !== 'closed' && (
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <div className="flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                      placeholder="Type your reply..."
                      className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
                    <input ref={replyFileRef} type="file" accept="image/*" className="hidden" onChange={e => setReplyImage(e.target.files[0])} />
                    <button onClick={() => replyFileRef.current.click()}
                      className={`p-2.5 rounded-xl border transition-colors ${replyImage ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-[#1a2035] border-slate-700 text-slate-400 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button onClick={sendReply} disabled={replying || !replyText.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
                  {replyImage && <p className="text-blue-400 text-xs">📎 {replyImage.name}</p>}
                </div>
              )}
              {selectedDetail.status === 'closed' && (
                <div className="p-4 border-t border-slate-800 text-center text-slate-500 text-xs">
                  This ticket is closed. Create a new ticket if you need further help.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-6">
              <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-center">Select a ticket to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
