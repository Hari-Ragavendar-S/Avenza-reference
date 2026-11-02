import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatIST } from '../../utils/dateFormatter'

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')
  const [txHash, setTxHash] = useState({})
  const [rejectNote, setRejectNote] = useState({})
  const [expanded, setExpanded] = useState({})
  const [copied, setCopied] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const load = async () => {
    try {
      const data = await api.get('/wallet/admin/withdrawals')
      setWithdrawals(data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const process = async (id, approve) => {
    try {
      const note = rejectNote[id] || ''
      const hash = txHash[id] || ''
      await api.post(`/wallet/admin/withdrawal/${id}/process?approve=${approve}${hash ? `&tx_hash=${encodeURIComponent(hash)}` : ''}${note ? `&note=${encodeURIComponent(note)}` : ''}`, {})
      setMsg(approve ? '✅ Withdrawal approved successfully' : '❌ Withdrawal rejected — amount refunded to user')
      setTimeout(() => setMsg(''), 4000)
      load()
    } catch (err) { setMsg(err.message) }
  }

  const copyAddress = (address, id) => {
    navigator.clipboard.writeText(address)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pending = withdrawals.filter((w) => w.status === 'pending').length
  const completed = withdrawals.filter((w) => w.status === 'completed').length
  const totalPaid = withdrawals.filter((w) => w.status === 'completed').reduce((s, w) => s + (w.net_amount || w.amount), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals Management" subtitle="Review and process withdrawal requests" />

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('approved') || msg.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-white">{withdrawals.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{completed}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Paid Out</p>
          <p className="text-2xl font-bold text-red-400">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'completed', 'rejected'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-orange-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {f} {f !== 'all' && `(${withdrawals.filter(w => w.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Withdrawal Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
            No withdrawals found.
          </div>
        ) : paged.map((w) => (
          <div key={w.id} className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">{w.user_name}</p>
                      <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded-full">{w.user_fxu_id}</span>
                      <Badge status={w.status === 'completed' ? 'Completed' : w.status === 'rejected' ? 'Rejected' : 'Pending'} />
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{w.user_email}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{formatIST(w.created_at)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-lg">${w.amount?.toFixed(2)}</p>
                  <p className="text-red-400 text-xs">Fee: ${w.withdrawal_fee?.toFixed(2)}</p>
                  <p className="text-emerald-400 text-xs font-semibold">Net: ${w.net_amount?.toFixed(2)}</p>
                </div>
              </div>

              {/* Wallet Address with Copy */}
              <div className="mt-4 bg-[#1a2035] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs mb-1">USDT Wallet Address (BEP-20)</p>
                  <p className="text-white font-mono text-sm truncate">{w.wallet_address}</p>
                </div>
                <button
                  onClick={() => copyAddress(w.wallet_address, w.id)}
                  className="flex-shrink-0 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied === w.id ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Purpose & Details */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#1a2035] rounded-lg p-2.5">
                  <p className="text-slate-500 mb-1">Network</p>
                  <p className="text-white">{w.network}</p>
                </div>
                <div className="bg-[#1a2035] rounded-lg p-2.5">
                  <p className="text-slate-500 mb-1">Token</p>
                  <p className="text-white">{w.token || 'USDT'}</p>
                </div>
                <div className="bg-[#1a2035] rounded-lg p-2.5">
                  <p className="text-slate-500 mb-1">Purpose</p>
                  <p className="text-white">{w.purpose || '—'}</p>
                </div>
              </div>
            </div>

            {/* Actions for pending */}
            {w.status === 'pending' && (
              <div className="border-t border-slate-800 p-5 bg-[#0a0e1a]/50">
                <p className="text-slate-400 text-xs mb-3 font-medium">Process Withdrawal</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-500 text-xs mb-1 block">Transaction Hash (optional)</label>
                    <input
                      type="text"
                      placeholder="0x... (enter after sending)"
                      value={txHash[w.id] || ''}
                      onChange={(e) => setTxHash({ ...txHash, [w.id]: e.target.value })}
                      className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs mb-1 block">Rejection Reason (if rejecting)</label>
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={rejectNote[w.id] || ''}
                      onChange={(e) => setRejectNote({ ...rejectNote, [w.id]: e.target.value })}
                      className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => process(w.id, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      ✓ Approve — Send ${w.net_amount?.toFixed(2)} USDT
                    </button>
                    <button
                      onClick={() => process(w.id, false)}
                      className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      ✗ Reject & Refund ${w.amount?.toFixed(2)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rejected info */}
            {w.status === 'rejected' && (
              <div className="border-t border-slate-800 px-5 py-3 bg-red-500/5">
                <p className="text-red-400 text-xs">Rejected — ${w.amount?.toFixed(2)} refunded to user's FXU Wallet</p>
                {w.admin_note && <p className="text-slate-500 text-xs mt-0.5">Reason: {w.admin_note}</p>}
              </div>
            )}

            {/* Completed info */}
            {w.status === 'completed' && (
              <div className="border-t border-slate-800 px-5 py-3 bg-emerald-500/5">
                <p className="text-emerald-400 text-xs">Approved — ${w.net_amount?.toFixed(2)} USDT sent to user</p>
                {w.tx_hash && <p className="text-slate-500 text-xs mt-0.5 font-mono">Tx: {w.tx_hash}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#0f1629] border border-slate-800 rounded-2xl px-5 py-4">
          <div className="text-slate-400 text-xs">
            Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium rounded-xl transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Previous
            </button>
            <span className="text-slate-400 text-xs px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium rounded-xl transition-colors">
              Next
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
