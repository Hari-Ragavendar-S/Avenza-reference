import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

const PAGE_SIZE = 5

export default function AdminFXUWallet() {
  const [settings, setSettings] = useState({})
  const [deposits, setDeposits] = useState([])
  const [users, setUsers] = useState({}) // map user_id → {name, fxu_id}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [usdtAddr, setUsdtAddr] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmModal, setConfirmModal] = useState(false)
  const [pendingAddr, setPendingAddr] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, dep, allUsers] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/wallet/admin/deposits'),
          api.get('/admin/users?limit=500'),
        ])
        setSettings(s)
        setUsdtAddr(s.platform_usdt_address || s.usdt_receiver_address || '')
        setDeposits(dep)
        // Build user map for quick lookup
        const map = {}
        ;(allUsers || []).forEach(u => { map[u.id] = { name: u.name, fxu_id: u.fxu_id } })
        setUsers(map)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const promptSaveAddress = () => { setPendingAddr(usdtAddr); setConfirmModal(true) }

  const saveAddress = async () => {
    setConfirmModal(false); setSaving(true)
    try {
      await api.post(`/admin/settings?key=platform_usdt_address&value=${encodeURIComponent(pendingAddr)}`, {})
      await api.post(`/admin/settings?key=usdt_receiver_address&value=${encodeURIComponent(pendingAddr)}`, {})
      setMsg('✅ USDT receiver address saved successfully')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) { setMsg(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const completedDeposits = deposits.filter(d => d.status === 'completed')
  const totalReceived = completedDeposits.reduce((s, d) => s + d.amount, 0)

  const todayIST = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  const todayCount = deposits.filter(d =>
    new Date(d.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) === todayIST
  ).length

  const filtered = deposits.filter(d => {
    if (!search) return true
    const u = users[d.user_id]
    const s = search.toLowerCase()
    return (
      String(d.user_id).includes(s) ||
      d.tx_hash?.toLowerCase().includes(s) ||
      u?.name?.toLowerCase().includes(s) ||
      u?.fxu_id?.toLowerCase().includes(s)
    )
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="FXU Wallet Management" subtitle="USDT receiver address and all auto-confirmed deposits" />

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* Confirm address modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Update Receiver Address?</h3>
                <p className="text-slate-400 text-xs mt-0.5">This affects all future USDT deposits</p>
              </div>
            </div>
            <div className="bg-[#1a2035] rounded-xl p-3 mb-4">
              <p className="text-slate-400 text-xs mb-1">New Address:</p>
              <p className="text-white font-mono text-sm break-all">{pendingAddr}</p>
            </div>
            <p className="text-yellow-400 text-xs mb-5">⚠️ All user USDT deposits will be sent to this address. Double-check before confirming.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={saveAddress} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Yes, Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Received</p>
          <p className="text-2xl font-bold text-emerald-400">${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Deposits</p>
          <p className="text-2xl font-bold text-white">{deposits.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-blue-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Today (IST)</p>
          <p className="text-2xl font-bold text-blue-400">{todayCount}</p>
        </div>
        <div className="bg-[#0f1629] border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Network</p>
          <p className="text-lg font-bold text-yellow-400">BSC · USDT</p>
        </div>
      </div>

      {/* Receiver address config */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5 sm:p-6">
        <h3 className="text-white font-semibold mb-1">USDT Receiver Address (BEP-20)</h3>
        <p className="text-slate-400 text-sm mb-4">All user USDT deposits are sent to this address automatically on-chain.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={usdtAddr} onChange={e => setUsdtAddr(e.target.value)} placeholder="0x..."
            className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-orange-500" />
          <button onClick={promptSaveAddress} disabled={saving || !usdtAddr}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
            {saving ? 'Saving...' : 'Save Address'}
          </button>
        </div>
        <div className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <p className="text-orange-400 text-xs">All USDT deposits are automatic — no admin approval needed. Funds are credited to user FXU wallets instantly after BSC blockchain confirmation.</p>
        </div>
      </div>

      {/* All deposits table */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-white font-semibold">All USDT Deposits</h3>
            <p className="text-slate-400 text-xs mt-0.5">Auto-confirmed on BSC blockchain</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="text" placeholder="Search name, FXU ID, tx hash..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500 w-full sm:w-56" />
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap">
              {filtered.length} records
            </span>
          </div>
        </div>

        {/* Mobile cards / Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800">
                {['#', 'User', 'Amount', 'Tx Hash', 'Status', 'Date (IST)'].map(h => (
                  <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No deposits found.</td></tr>
              ) : paged.map((d, i) => {
                const u = users[d.user_id]
                return (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-600 text-xs">{((page - 1) * PAGE_SIZE) + i + 1}</td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm font-medium">{u?.name || `User #${d.user_id}`}</p>
                      <p className="text-blue-400 text-xs font-mono">{u?.fxu_id || `#${d.user_id}`}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-emerald-400 font-bold">+${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <p className="text-slate-500 text-xs">{d.token} · BSC</p>
                    </td>
                    <td className="py-3 px-4">
                      <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-mono text-xs transition-colors">
                        {d.tx_hash?.slice(0, 12)}...{d.tx_hash?.slice(-6)}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full">
                        Confirmed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{formatIST(d.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-800/50">
          {paged.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No deposits found.</div>
          ) : paged.map(d => {
            const u = users[d.user_id]
            return (
              <div key={d.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{u?.name || `User #${d.user_id}`}</p>
                    <p className="text-blue-400 text-xs font-mono">{u?.fxu_id || `#${d.user_id}`}</p>
                  </div>
                  <p className="text-emerald-400 font-bold">+${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noreferrer"
                    className="text-blue-400 font-mono">{d.tx_hash?.slice(0, 14)}...</a>
                  <span className="text-slate-500">{formatIST(d.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination — always visible at bottom */}
        <div className="px-4 sm:px-5 py-4 border-t border-slate-800 flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>
          <span className="text-slate-400 text-xs">
            {filtered.length === 0 ? 'No records' : `Page ${page} of ${Math.max(1, totalPages)} · ${filtered.length} total`}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors">
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
