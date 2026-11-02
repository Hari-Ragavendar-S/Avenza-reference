import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatISTDate } from '../../utils/dateFormatter'

const PER_PAGE = 5

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = async () => {
    try {
      const data = await api.get('/wallet/admin/deposits')
      setDeposits(data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = deposits.filter((d) => {
    const matchFilter = filter === 'all' || d.status === filter
    const matchSearch = !search || String(d.user_id).includes(search) || d.tx_hash?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = deposits.reduce((s, d) => s + d.amount, 0)
  const completed = deposits.filter((d) => d.status === 'completed').length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Deposits Management" subtitle="All platform deposits" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Deposits</p>
          <p className="text-2xl font-bold text-white">{deposits.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-emerald-400">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-white">{completed}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{deposits.filter((d) => d.status === 'pending').length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'completed', 'pending'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-orange-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search user ID or tx hash..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 bg-[#0f1629] border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500" />
      </div>

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-xs">{filtered.length} deposits</p>
          <p className="text-slate-500 text-xs">Page {page} of {totalPages || 1}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['User ID', 'Token', 'Amount', 'Tx Hash', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No deposits found.</td></tr>
              ) : paged.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-xs">#{d.user_id}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">{d.token}</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">+${d.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-xs">{d.tx_hash?.slice(0, 14)}...</a>
                  </td>
                  <td className="py-3 px-4"><Badge status={d.status === 'completed' ? 'Completed' : 'Pending'} /></td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{formatISTDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-xl transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Previous
            </button>
            <span className="text-slate-400 text-xs">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-xl transition-colors">
              Next
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
