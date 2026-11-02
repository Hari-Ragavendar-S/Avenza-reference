import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatISTDate } from '../../utils/dateFormatter'

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [s, u, dep, wit] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=5'),
        api.get('/wallet/admin/deposits?status=pending'),
        api.get('/wallet/admin/withdrawals?status=pending'),
      ])
      setStats(s)
      setUsers(u)
      setDeposits(dep)
      setWithdrawals(wit)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const confirmDeposit = (d, approve) => {
    setConfirm({
      title: approve ? 'Approve Deposit?' : 'Reject Deposit?',
      message: `${approve ? 'Approve' : 'Reject'} deposit of $${d.amount.toLocaleString()} for user #${d.user_id}?`,
      danger: !approve,
      confirmLabel: approve ? 'Approve' : 'Reject',
      action: async () => {
        await api.post(`/wallet/admin/deposit/${d.id}/confirm?approve=${approve}`, {})
        setMsg(approve ? '✅ Deposit approved' : '❌ Deposit rejected')
        setTimeout(() => setMsg(''), 3000)
        setConfirm(null)
        load()
      }
    })
  }

  const confirmWithdrawal = (w, approve) => {
    setConfirm({
      title: approve ? 'Approve Withdrawal?' : 'Reject Withdrawal?',
      message: `${approve ? 'Approve' : 'Reject'} withdrawal of $${w.amount.toLocaleString()} for user #${w.user_id}?${!approve ? ' Amount will be refunded to user wallet.' : ''}`,
      danger: !approve,
      confirmLabel: approve ? 'Approve' : 'Reject',
      action: async () => {
        await api.post(`/wallet/admin/withdrawal/${w.id}/process?approve=${approve}`, {})
        setMsg(approve ? '✅ Withdrawal approved' : '❌ Withdrawal rejected — refunded')
        setTimeout(() => setMsg(''), 3000)
        setConfirm(null)
        load()
      }
    })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform overview</p>
      </div>

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      {msg && <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>{msg}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={(stats?.total_users || 0).toLocaleString()} sub={`${stats?.active_users || 0} active`} color="blue"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard title="Total Deposits" value={`$${(stats?.total_deposit_amount || 0).toLocaleString()}`} sub={`${stats?.total_deposits || 0} transactions`} color="green"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} />
        <StatCard title="Active Investments" value={(stats?.active_investments || 0).toLocaleString()} sub={`$${(stats?.total_invested || 0).toLocaleString()} locked`} color="purple"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Pending Actions" value={(stats?.pending_deposits || 0) + (stats?.pending_withdrawals || 0)} sub="Deposits + withdrawals" color="yellow"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      {/* Pending deposits */}
      {deposits.length > 0 && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white font-semibold">Pending Deposits</h3>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-full">{deposits.length} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['User ID', 'Token', 'Amount', 'Tx Hash', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">#{d.user_id}</td>
                    <td className="py-3 px-4 text-white">{d.token}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">+${d.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{d.tx_hash?.slice(0, 14)}...</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatISTDate(d.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => confirmDeposit(d, true)}
                          className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors">Approve</button>
                        <button onClick={() => confirmDeposit(d, false)}
                          className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending withdrawals */}
      {withdrawals.length > 0 && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white font-semibold">Pending Withdrawals</h3>
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">{withdrawals.length} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['User ID', 'Token', 'Amount', 'Wallet Address', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">#{w.user_id}</td>
                    <td className="py-3 px-4 text-white">{w.token}</td>
                    <td className="py-3 px-4 text-red-400 font-semibold">-${w.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{w.wallet_address?.slice(0, 14)}...</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatISTDate(w.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                          <button onClick={() => confirmWithdrawal(w, true)}
                            className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors">Approve</button>
                          <button onClick={() => confirmWithdrawal(w, false)}
                            className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors">Reject</button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent users */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Users</h3>
          <a href="/admin/users" className="text-orange-400 text-xs hover:text-orange-300">View all</a>
        </div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-slate-500 text-xs">{u.fxu_id} · Level {u.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">${(u.balance || 0).toLocaleString()}</p>
                <Badge status={u.is_suspended ? 'Suspended' : u.is_active ? 'Active' : 'Inactive'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
