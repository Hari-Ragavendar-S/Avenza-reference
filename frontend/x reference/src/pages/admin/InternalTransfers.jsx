import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

export default function AdminInternalTransfers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/wallet/admin/internal-transfers?page=${p}&limit=${LIMIT}`)
      setData(res)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handlePage = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totals = data?.totals
  const pagination = data?.pagination
  const transfers = data?.transfers || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Transfers"
        subtitle="All user-to-user internal fund transfers with 5% service fee"
      />

      {/* Totals bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Transfers</p>
          <p className="text-2xl font-bold text-white">{totals?.total_transfers ?? '—'}</p>
        </div>
        <div className="bg-[#0f1629] border border-blue-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-blue-400">
            ${totals ? totals.total_sent.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
        <div className="bg-[#0f1629] border border-orange-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Fees Collected (5%)</p>
          <p className="text-2xl font-bold text-orange-400">
            ${totals ? totals.total_fees_collected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
        <div className="bg-[#0f1629] border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Received by Users</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${totals ? totals.total_received_by_users.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-white font-semibold">Transfer Records</h3>
          {pagination && (
            <span className="text-slate-400 text-xs">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No internal transfers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800">
                  {['#', 'Sender', 'Recipient', 'Sent', 'Fee (5%)', 'Received', 'Date', 'Status'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, i) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-xs">{((page - 1) * LIMIT) + i + 1}</td>

                    {/* Sender */}
                    <td className="py-3 px-4">
                      <p className="text-white font-medium text-sm">{t.sender_name}</p>
                      <p className="text-blue-400 text-xs font-mono">{t.sender_fxu_id}</p>
                    </td>

                    {/* Recipient */}
                    <td className="py-3 px-4">
                      <p className="text-white font-medium text-sm">{t.recipient_name}</p>
                      <p className="text-emerald-400 text-xs font-mono">{t.recipient_fxu_id}</p>
                    </td>

                    {/* Sent */}
                    <td className="py-3 px-4">
                      <p className="text-white font-semibold">${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>

                    {/* Fee */}
                    <td className="py-3 px-4">
                      <p className="text-orange-400 font-semibold">+${t.service_fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>

                    {/* Received */}
                    <td className="py-3 px-4">
                      <p className="text-emerald-400 font-semibold">${t.net_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <br />
                      <span className="text-slate-600">{new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination — Previous / Next with page numbers */}
        {pagination && pagination.pages > 1 && (
          <div className="px-4 sm:px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-600 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= pagination.pages}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
