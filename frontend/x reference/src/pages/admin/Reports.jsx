import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatDateIST, getTodayIST, formatDateForInput } from '../../utils/dateFormatter'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

// Confirmation Modal Component
function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-scale-in">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
            <svg className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
            <p className="text-slate-400 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminReports() {
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // New state for date-based reports
  const [selectedDate, setSelectedDate] = useState(getTodayIST())
  const [dateSummary, setDateSummary] = useState(null)
  const [userWiseData, setUserWiseData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingDateReport, setLoadingDateReport] = useState(false)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([api.get('/admin/stats'), api.get('/admin/reports/summary')])
        setStats(s)
        setSummary(r)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    loadDateReport()
  }, [selectedDate, currentPage])

  const loadDateReport = async () => {
    setLoadingDateReport(true)
    try {
      const [dateSum, userWise] = await Promise.all([
        api.get(`/admin/reports/date-summary?date=${selectedDate}`),
        api.get(`/admin/reports/user-wise?date=${selectedDate}&page=${currentPage}&limit=5`)
      ])
      setDateSummary(dateSum)
      setUserWiseData(userWise.users)
      setTotalPages(userWise.pagination.total_pages)
    } catch (err) {
      console.error('Failed to load date report:', err)
    } finally {
      setLoadingDateReport(false)
    }
  }

  const handleStopROI = (userId, userName) => {
    setConfirm({
      title: `Stop ROI for ${userName}?`,
      message: `This will prevent ROI credits for ${userName} until you activate it again. Are you sure?`,
      danger: true,
      action: async () => {
        try {
          await api.post(`/admin/users/${userId}/stop-roi`, {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to stop ROI: ' + err.message)
        }
      }
    })
  }

  const handleActivateROI = (userId, userName) => {
    setConfirm({
      title: `Activate ROI for ${userName}?`,
      message: `This will resume ROI credits for ${userName}.`,
      danger: false,
      action: async () => {
        try {
          await api.post(`/admin/users/${userId}/activate-roi`, {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to activate ROI: ' + err.message)
        }
      }
    })
  }

  const handleStopLevelIncome = (userId, userName) => {
    setConfirm({
      title: `Stop Level Income for ${userName}?`,
      message: `This will prevent level income credits for ${userName} until you activate it again. Are you sure?`,
      danger: true,
      action: async () => {
        try {
          await api.post(`/admin/users/${userId}/stop-level-income`, {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to stop level income: ' + err.message)
        }
      }
    })
  }

  const handleActivateLevelIncome = (userId, userName) => {
    setConfirm({
      title: `Activate Level Income for ${userName}?`,
      message: `This will resume level income credits for ${userName}.`,
      danger: false,
      action: async () => {
        try {
          await api.post(`/admin/users/${userId}/activate-level-income`, {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to activate level income: ' + err.message)
        }
      }
    })
  }

  const handleStopROIAll = () => {
    setConfirm({
      title: '⚠️ Stop ROI for ALL Users?',
      message: 'This will stop ROI credits for ALL users globally. This is a critical action. Are you absolutely sure?',
      danger: true,
      action: async () => {
        try {
          await api.post('/admin/stop-roi-all', {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to stop ROI for all: ' + err.message)
        }
      }
    })
  }

  const handleActivateROIAll = () => {
    setConfirm({
      title: 'Activate ROI for ALL Users?',
      message: 'This will resume ROI credits for all users globally.',
      danger: false,
      action: async () => {
        try {
          await api.post('/admin/activate-roi-all', {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to activate ROI for all: ' + err.message)
        }
      }
    })
  }

  const handleStopLevelIncomeAll = () => {
    setConfirm({
      title: '⚠️ Stop Level Income for ALL Users?',
      message: 'This will stop level income credits for ALL users globally. This is a critical action. Are you absolutely sure?',
      danger: true,
      action: async () => {
        try {
          await api.post('/admin/stop-level-income-all', {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to stop level income for all: ' + err.message)
        }
      }
    })
  }

  const handleActivateLevelIncomeAll = () => {
    setConfirm({
      title: 'Activate Level Income for ALL Users?',
      message: 'This will resume level income credits for all users globally.',
      danger: false,
      action: async () => {
        try {
          await api.post('/admin/activate-level-income-all', {})
          loadDateReport()
          setConfirm(null)
        } catch (err) {
          alert('Failed to activate level income for all: ' + err.message)
        }
      }
    })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const pieData = [
    { name: 'Total Invested', value: summary?.total_invested || 0 },
    { name: 'Profit Paid', value: summary?.total_roi_paid || 0 },
    { name: 'Commissions', value: summary?.total_commissions || 0 },
    { name: 'Withdrawals', value: summary?.total_withdrawals || 0 },
  ]

  const barData = [
    { name: 'Deposits', value: summary?.total_deposits || 0 },
    { name: 'Withdrawals', value: summary?.total_withdrawals || 0 },
    { name: 'Invested', value: summary?.total_invested || 0 },
    { name: 'Profit Paid', value: summary?.total_roi_paid || 0 },
    { name: 'Commissions', value: summary?.total_commissions || 0 },
  ]

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Reports & Analytics" subtitle="Platform analytics and financial overview" />
        
        {/* Global Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {dateSummary?.global_roi_stopped ? (
            <button onClick={handleActivateROIAll} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              ▶ Activate ROI (All)
            </button>
          ) : (
            <button onClick={handleStopROIAll} className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              ⏸ Stop ROI (All)
            </button>
          )}
          
          {dateSummary?.global_level_income_stopped ? (
            <button onClick={handleActivateLevelIncomeAll} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              ▶ Activate Level (All)
            </button>
          ) : (
            <button onClick={handleStopLevelIncomeAll} className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              ⏸ Stop Level (All)
            </button>
          )}
        </div>
      </div>

      {/* Global Status Indicators */}
      {(dateSummary?.global_roi_stopped || dateSummary?.global_level_income_stopped) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold mb-1">Global Controls Active</h4>
              <div className="space-y-1 text-sm">
                {dateSummary?.global_roi_stopped && (
                  <p className="text-red-300">• ROI is stopped for all users globally</p>
                )}
                {dateSummary?.global_level_income_stopped && (
                  <p className="text-red-300">• Level income is stopped for all users globally</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Deposits', value: `$${(summary?.total_deposits || 0).toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Total Withdrawals', value: `$${(summary?.total_withdrawals || 0).toLocaleString()}`, color: 'text-red-400' },
          { label: 'Total Invested', value: `$${(summary?.total_invested || 0).toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Profit Paid Out', value: `$${(summary?.total_roi_paid || 0).toLocaleString()}`, color: 'text-purple-400' },
          { label: 'Commissions Paid', value: `$${(summary?.total_commissions || 0).toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Net Balance', value: `$${(summary?.net_balance || 0).toLocaleString()}`, color: 'text-white' },
          { label: 'Total Users', value: (stats?.total_users || 0).toLocaleString(), color: 'text-white' },
          { label: 'Active Users', value: (stats?.active_users || 0).toLocaleString(), color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-5">Financial Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-5">Fund Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v) => [`$${v.toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">${d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Date-Based Reports Section */}
      <div className="bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">📅 Date-Based Reports</h3>
        
        {/* Date Picker */}
        <div className="mb-6">
          <label className="text-slate-400 text-sm mb-2 block">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setCurrentPage(1)
            }}
            max={getTodayIST()}
            className="bg-[#0f1629] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 w-full sm:w-auto"
          />
        </div>

        {/* Date Summary Stats */}
        {dateSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Deposits', value: `$${dateSummary.total_deposits.toLocaleString()}`, icon: '💰', color: 'emerald' },
              { label: 'Total Withdrawals', value: `$${dateSummary.total_withdrawals.toLocaleString()}`, icon: '💸', color: 'red' },
              { label: 'Total ROI Credited', value: `$${dateSummary.total_roi_credited.toLocaleString()}`, icon: '📈', color: 'blue' },
              { label: "Today's ROI", value: `$${dateSummary.today_roi.toLocaleString()}`, icon: '🎯', color: 'purple' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0f1629] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                </div>
                <p className={`text-xl font-bold text-${stat.color}-400`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* User-Wise Report Table */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h4 className="text-white font-semibold">User-Wise Breakdown</h4>
            <p className="text-slate-400 text-xs mt-1">Showing data for {formatDateIST(selectedDate, false)}</p>
          </div>

          {loadingDateReport ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userWiseData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No data available for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['User', 'ROI Earned', 'Level Income', 'Awards', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userWiseData.map((user) => (
                    <tr key={user.user_id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-blue-400 font-mono text-xs">{user.fxu_id}</p>
                          <p className="text-slate-500 text-xs">Level {user.level}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-emerald-400 font-semibold">${user.roi_earned.toLocaleString()}</p>
                        {user.roi_details.length > 0 && (
                          <p className="text-slate-500 text-xs">{user.roi_details.length} transaction(s)</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-purple-400 font-semibold">${user.level_income.toLocaleString()}</p>
                        {Object.keys(user.level_breakdown).length > 0 && (
                          <p className="text-slate-500 text-xs">
                            {Object.entries(user.level_breakdown).slice(0, 2).map(([k, v]) => `${k}: $${v}`).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-yellow-400 font-medium">{user.current_rank}</p>
                        {user.awards.next_award && (
                          <p className="text-slate-500 text-xs">Next: {user.awards.next_award.name}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {user.roi_stopped && (
                            <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">ROI Stopped</span>
                          )}
                          {user.level_income_stopped && (
                            <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">Level Stopped</span>
                          )}
                          {!user.roi_stopped && !user.level_income_stopped && (
                            <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {user.roi_stopped ? (
                            <button onClick={() => handleActivateROI(user.user_id, user.name)}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                              ▶ ROI
                            </button>
                          ) : (
                            <button onClick={() => handleStopROI(user.user_id, user.name)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                              ⏸ ROI
                            </button>
                          )}
                          {user.level_income_stopped ? (
                            <button onClick={() => handleActivateLevelIncome(user.user_id, user.name)}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                              ▶ Level
                            </button>
                          ) : (
                            <button onClick={() => handleStopLevelIncome(user.user_id, user.name)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                              ⏸ Level
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-semibold text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}>
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
