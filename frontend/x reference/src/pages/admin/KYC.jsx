import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

const STATUS_STYLE = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function AdminKYC() {
  const [kycList, setKycList] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [msg, setMsg] = useState('')
  const [viewImage, setViewImage] = useState(null)

  const load = async (p = 1, f = filter) => {
    setLoading(true)
    try {
      const res = await api.get(`/kyc/admin/all?page=${p}&limit=5${f !== 'all' ? `&status=${f}` : ''}`)
      setKycList(res.kyc_list || [])
      setStats(res.stats || {})
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load(page, filter) }, [page, filter])

  const approve = async (id) => {
    setProcessing(true)
    try {
      await api.post(`/kyc/admin/${id}/approve`, {})
      setMsg('✅ KYC approved')
      setTimeout(() => setMsg(''), 3000)
      setSelected(null)
      load(page, filter)
    } catch (err) { setMsg(err.message) }
    finally { setProcessing(false) }
  }

  const reject = async (id) => {
    if (!rejectReason.trim()) { setMsg('Please enter a rejection reason'); return }
    setProcessing(true)
    try {
      await api.post(`/kyc/admin/${id}/reject?reason=${encodeURIComponent(rejectReason)}`, {})
      setMsg('KYC rejected — user notified')
      setTimeout(() => setMsg(''), 3000)
      setShowReject(false); setRejectReason(''); setSelected(null)
      load(page, filter)
    } catch (err) { setMsg(err.message) }
    finally { setProcessing(false) }
  }

  const getImageUrl = (kycId, side) =>
    `${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/kyc/image/${kycId}/${side}`

  return (
    <div className="space-y-6">
      <PageHeader title="KYC Verification" subtitle="Review and approve identity verification requests" />

      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="KYC Document" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Reject modal */}
      {showReject && selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white font-semibold mb-2">Reject KYC</h3>
            <p className="text-slate-400 text-sm mb-4">Provide a reason — the user will see this and can resubmit.</p>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Document is blurry, please resubmit a clearer photo..."
              className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowReject(false); setRejectReason('') }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => reject(selected.id)} disabled={processing || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {processing ? 'Rejecting...' : 'Reject & Notify'}
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
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-orange-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : kycList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No KYC submissions found.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {kycList.map(k => (
              <div key={k.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-semibold text-sm">{k.user_name}</p>
                      <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded-full">{k.user_fxu_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[k.status] || ''}`}>
                        {k.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{k.user_email}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {k.document_label} · Submitted {formatIST(k.submitted_at)}
                    </p>
                    {k.status === 'rejected' && k.rejection_reason && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-red-400 text-xs">Rejected: {k.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Document images — tap to view full screen */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setViewImage(getImageUrl(k.id, 'front'))}
                      className="relative w-20 h-14 sm:w-24 sm:h-16 bg-[#1a2035] border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors group">
                      <img src={getImageUrl(k.id, 'front')} alt="Front"
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </div>
                      <span className="absolute bottom-1 left-1 text-white text-xs bg-black/60 px-1 rounded">Front</span>
                    </button>
                    {k.has_back && (
                      <button onClick={() => setViewImage(getImageUrl(k.id, 'back'))}
                        className="relative w-20 h-14 sm:w-24 sm:h-16 bg-[#1a2035] border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors group">
                        <img src={getImageUrl(k.id, 'back')} alt="Back"
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </div>
                        <span className="absolute bottom-1 left-1 text-white text-xs bg-black/60 px-1 rounded">Back</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {k.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => approve(k.id)} disabled={processing}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                      ✓ Approve
                    </button>
                    <button onClick={() => { setSelected(k); setShowReject(true) }} disabled={processing}
                      className="flex-1 sm:flex-none bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 sm:px-5 py-4 border-t border-slate-800 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm font-medium rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Previous
            </button>
            <span className="text-slate-400 text-xs">Page {page} of {pagination.pages} · {pagination.total} total</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm font-medium rounded-xl transition-colors">
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
