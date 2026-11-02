import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { formatISTDate } from '../../utils/dateFormatter'
import { formatDateIST } from '../../utils/dateFormatter'

// Reusable confirmation modal
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const { loginAsUser } = useAuthStore()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [adjAmount, setAdjAmount] = useState('')
  const [adjType, setAdjType] = useState('credit')
  const [adjReason, setAdjReason] = useState('')
  const [adjMsg, setAdjMsg] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [expandedUser, setExpandedUser] = useState(null)
  const [teamDetails, setTeamDetails] = useState(null)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const load = async (q = '') => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/users?limit=200${q ? `&search=${q}` : ''}`)
      setUsers(data)
      setPage(1) // reset to first page on new load
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadUserDetail = async (user) => {
    setSelected(user)
    setAdjMsg('')
    setDetailLoading(true)
    try {
      const [detail, investments, loginHistory, transactions] = await Promise.all([
        api.get(`/admin/users/${user.id}`),
        api.get(`/admin/users/${user.id}/investments`),
        api.get(`/admin/users/${user.id}/login-history`),
        api.get(`/wallet/transactions?skip=0&limit=10`).catch(() => []),
      ])
      setUserDetail({ ...detail, investments, loginHistory })
    } catch {}
    finally { setDetailLoading(false) }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
    clearTimeout(window._searchTimer)
    window._searchTimer = setTimeout(() => load(e.target.value), 400)
  }

  const toggleSuspend = (user) => {
    setConfirm({
      title: user.is_suspended ? 'Activate User?' : 'Suspend User?',
      message: user.is_suspended
        ? `This will reactivate ${user.name}'s account.`
        : `This will suspend ${user.name}'s account. They won't be able to login.`,
      danger: !user.is_suspended,
      confirmLabel: user.is_suspended ? 'Activate' : 'Suspend',
      action: async () => {
        await api.post(`/admin/users/${user.id}/suspend`, {})
        load(search)
        if (selected?.id === user.id) setSelected(prev => ({ ...prev, is_suspended: !prev.is_suspended }))
        setConfirm(null)
      }
    })
  }

  const handleAdjust = () => {
    if (!adjAmount || !adjReason) return
    setConfirm({
      title: `${adjType === 'credit' ? 'Credit' : 'Debit'} Balance?`,
      message: `${adjType === 'credit' ? 'Add' : 'Remove'} $${parseFloat(adjAmount).toFixed(2)} ${adjType === 'credit' ? 'to' : 'from'} ${selected.name}'s FXU Wallet. Reason: ${adjReason}`,
      confirmLabel: adjType === 'credit' ? 'Credit' : 'Debit',
      danger: adjType === 'debit',
      action: async () => {
        setAdjusting(true)
        setConfirm(null)
        try {
          await api.post('/wallet/admin/adjust', { user_id: selected.id, amount: parseFloat(adjAmount), type: adjType, reason: adjReason })
          setAdjMsg(`✅ Balance ${adjType}ed successfully`)
          setAdjAmount('')
          setAdjReason('')
          load(search)
        } catch (err) { setAdjMsg(err.message) }
        finally { setAdjusting(false) }
      }
    })
  }

  const handleLoginAsUser = (user) => {
    setConfirm({
      title: `Login as ${user.name}?`,
      message: `You will be logged in as ${user.name} (${user.fxu_id}). A "Return to Admin" button will appear at the top of the page.`,
      confirmLabel: 'Login as User',
      danger: false,
      action: async () => {
        setConfirm(null)
        await loginAsUser(user.id)
        navigate('/dashboard')
      }
    })
  }

  const downloadPDF = async (user) => {
    try {
      const [detail, investments] = await Promise.all([
        api.get(`/admin/users/${user.id}`),
        api.get(`/admin/users/${user.id}/investments`),
      ])
      const wallet = detail.wallet || {}
      const lines = [
        `FXUniverse - User Report`,
        `Generated: ${formatDateIST(new Date())}`,
        ``,
        `USER DETAILS`,
        `Name: ${detail.name}`,
        `FXU ID: ${detail.fxu_id}`,
        `Email: ${detail.email}`,
        `Mobile: ${detail.mobile}`,
        `Level: ${detail.level}`,
        `Referred By: ${detail.referred_by || 'Direct'}`,
        `Joined: ${formatDateIST(detail.created_at, false)}`,
        ``,
        `WALLET SUMMARY`,
        `FXU Balance: $${(wallet.balance || 0).toFixed(2)}`,
        `Locked: $${(wallet.locked || 0).toFixed(2)}`,
        `Total Deposited: $${(wallet.total_deposited || 0).toFixed(2)}`,
        `Total Withdrawn: $${(wallet.total_withdrawn || 0).toFixed(2)}`,
        ``,
        `INVESTMENTS (${investments.length} total)`,
        ...investments.map(i => `  ${i.plan} | $${i.amount} | Profit: $${i.total_roi_earned.toFixed(2)} | ${i.status} | ${formatDateIST(i.start_date, false)} - ${formatDateIST(i.end_date, false)}`),
      ]
      const content = lines.join('\n')
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detail.fxu_id}_report_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    }
  }

  const toggleTeamDetails = async (user) => {
    if (expandedUser?.id === user.id) {
      // Collapse
      setExpandedUser(null)
      setTeamDetails(null)
    } else {
      // Expand and load team details
      setExpandedUser(user)
      setLoadingTeam(true)
      try {
        const details = await api.get(`/admin/users/${user.id}/team-details`)
        setTeamDetails(details)
      } catch (err) {
        console.error('Failed to load team details:', err)
        setTeamDetails(null)
      } finally {
        setLoadingTeam(false)
      }
    }
  }

  const totalPages = Math.ceil(users.length / PAGE_SIZE)
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx = (page - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(page * PAGE_SIZE, users.length)

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Users" subtitle={`${users.length} users`} />

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search by name, email or FXU ID..." value={search} onChange={handleSearch}
          className="flex-1 bg-[#0f1629] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500" />
      </div>

      {/* Pagination state */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Users table */}
          <div className="lg:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
            {/* Table header info */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-slate-400 text-xs">
                Showing <span className="text-white font-semibold">{users.length === 0 ? 0 : startIdx}–{endIdx}</span> of <span className="text-white font-semibold">{users.length}</span> users
              </p>
              <p className="text-slate-500 text-xs">Page {page} of {totalPages || 1}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['User', 'FXU ID', 'Level', 'Balance', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">Loading...</td></tr>
                  ) : pagedUsers.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">No users found.</td></tr>
                  ) : pagedUsers.map((u) => (
                  <>
                    {/* Main User Row */}
                    <tr key={u.id} onClick={() => loadUserDetail(u)}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors cursor-pointer ${selected?.id === u.id ? 'bg-slate-800/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">{u.name?.charAt(0)}</div>
                          <div>
                            <p className="text-white text-sm font-medium">{u.name}</p>
                            <p className="text-slate-500 text-xs truncate max-w-[120px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-blue-400 font-mono text-xs">{u.fxu_id}</td>
                      <td className="py-3 px-4"><span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">L{u.unlocked_levels ?? u.level}</span></td>
                      <td className="py-3 px-4 text-white font-semibold">${(u.balance || 0).toLocaleString()}</td>
                      <td className="py-3 px-4"><Badge status={u.is_suspended ? 'Suspended' : u.is_active ? 'Active' : 'Inactive'} /></td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{formatDateIST(u.created_at, false)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); toggleSuspend(u) }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${u.is_suspended ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                            {u.is_suspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleTeamDetails(u) }}
                            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
                            {expandedUser?.id === u.id ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Team Details Row */}
                    {expandedUser?.id === u.id && (
                      <tr>
                        <td colSpan={7} className="bg-[#1a2035] border-b border-slate-800">
                          <div className="p-6 space-y-6">
                            {loadingTeam ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : teamDetails ? (
                              <>
                                {/* Team Members Table */}
                                <div>
                                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                    <span>👥 Team Details</span>
                                    <span className="text-slate-400 text-sm font-normal">({teamDetails.total_team_size} members)</span>
                                  </h4>
                                  
                                  {teamDetails.team_members.length > 0 ? (
                                    <div className="bg-[#0f1629] rounded-xl overflow-hidden">
                                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                        <table className="w-full text-xs">
                                          <thead className="sticky top-0 bg-[#0f1629] border-b border-slate-800">
                                            <tr>
                                              {['FXU ID', 'Name', 'Email', 'Level', 'Rank', 'Investment', 'Status', 'Joined'].map((h) => (
                                                <th key={h} className="text-left text-slate-400 font-medium py-2 px-3 whitespace-nowrap">{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {teamDetails.team_members.slice(0, 20).map((member) => (
                                              <tr key={member.fxu_id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                                <td className="py-2 px-3 text-blue-400 font-mono">{member.fxu_id}</td>
                                                <td className="py-2 px-3 text-white">{member.name}</td>
                                                <td className="py-2 px-3 text-slate-400 truncate max-w-[150px]">{member.email}</td>
                                                <td className="py-2 px-3"><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">L{member.level}</span></td>
                                                <td className="py-2 px-3 text-yellow-400">{member.current_rank}</td>
                                                <td className="py-2 px-3 text-emerald-400 font-semibold">${member.total_investment.toLocaleString()}</td>
                                                <td className="py-2 px-3">
                                                  <span className={`px-2 py-0.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {member.status}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 text-slate-500">{formatDateIST(member.joined_date, false)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {teamDetails.team_members.length > 20 && (
                                        <div className="p-3 bg-slate-800/30 text-center text-slate-400 text-xs">
                                          Showing first 20 of {teamDetails.total_team_size} members
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-sm">No team members yet</p>
                                  )}
                                </div>

                                {/* Level Breakdown */}
                                <div>
                                  <h4 className="text-white font-semibold mb-3">📊 Level Breakdown</h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {Object.entries(teamDetails.level_breakdown).map(([level, count]) => (
                                      <div key={level} className="bg-[#0f1629] rounded-lg p-3 text-center">
                                        <p className="text-slate-400 text-xs mb-1">{level}</p>
                                        <p className="text-white font-bold text-lg">{count}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* User's Last 3 Awards */}
                                {teamDetails.user_last_3_awards.length > 0 && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-3">🏆 Last 3 Awards Claimed</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      {teamDetails.user_last_3_awards.map((award) => (
                                        <div key={award.id} className="bg-[#0f1629] rounded-xl p-3 border border-emerald-500/30">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{award.emoji}</span>
                                            <div>
                                              <p className="text-white font-semibold text-sm">{award.name}</p>
                                              <p className="text-emerald-400 text-xs">${award.reward.toLocaleString()}</p>
                                            </div>
                                          </div>
                                          {award.claimed_at && (
                                            <p className="text-slate-500 text-xs">{formatDateIST(award.claimed_at)}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Team Awards Summary */}
                                {teamDetails.team_awards_summary.length > 0 && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-3">👥 Team Awards Summary (Top 10)</h4>
                                    <div className="space-y-2">
                                      {teamDetails.team_awards_summary.map((member) => (
                                        <div key={member.fxu_id} className="bg-[#0f1629] rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <div>
                                              <p className="text-white font-medium text-sm">{member.name}</p>
                                              <p className="text-blue-400 font-mono text-xs">{member.fxu_id}</p>
                                            </div>
                                            <span className="text-yellow-400 font-semibold text-sm">{member.current_award}</span>
                                          </div>
                                          {member.last_3_awards.length > 0 && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {member.last_3_awards.map((award, idx) => (
                                                <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-lg">
                                                  {award.emoji} {award.name} (${award.reward})
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Download PDF Button */}
                                <div className="flex justify-end">
                                  <button onClick={() => downloadPDF(u)}
                                    className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Full Report
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="text-slate-500 text-center py-4">Failed to load team details</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="text-slate-600 px-1 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                            page === p
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  }
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

        {/* User detail panel */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5 overflow-y-auto max-h-[600px]">
          {detailLoading ? (
            <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : selected ? (
            <div className="space-y-4">
              {/* User header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">{selected.name?.charAt(0)}</div>
                <div>
                  <p className="text-white font-semibold">{selected.name}</p>
                  <p className="text-blue-400 font-mono text-xs">{selected.fxu_id}</p>
                </div>
              </div>

              {/* User info */}
              <div className="space-y-1.5 text-sm">
                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Mobile', value: selected.mobile },
                  { label: 'Level', value: `${selected.unlocked_levels ?? selected.level} Levels Unlocked` },
                  { label: 'Balance', value: `$${(selected.balance || 0).toLocaleString()}` },
                  { label: 'Referred By', value: selected.referred_by || 'Direct' },
                  { label: 'Joined On', value: formatISTDate(selected.created_at) },
                  { label: 'Status', value: selected.is_suspended ? 'Suspended' : selected.is_active ? 'Active' : 'Inactive' },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between py-1.5 border-b border-slate-800/50">
                    <span className="text-slate-400 text-xs">{f.label}</span>
                    <span className="text-white text-xs font-medium">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Wallet balances */}
              {userDetail?.wallet && (
                <div className="bg-[#1a2035] rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-slate-400 font-medium mb-2">Wallet Balances</p>
                  {[
                    { label: 'FXU Wallet', value: userDetail.wallet.balance },
                    { label: 'Locked', value: userDetail.wallet.locked },
                    { label: 'Total Deposited', value: userDetail.wallet.total_deposited },
                    { label: 'Total Withdrawn', value: userDetail.wallet.total_withdrawn },
                  ].map((w) => (
                    <div key={w.label} className="flex justify-between">
                      <span className="text-slate-500">{w.label}</span>
                      <span className="text-white">${(w.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Active investments */}
              {userDetail?.investments?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-2">Active Investments</p>
                  <div className="space-y-2">
                    {userDetail.investments.filter(i => i.status === 'active').slice(0, 3).map((inv) => (
                      <div key={inv.id} className="bg-[#1a2035] rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium">{inv.plan}</span>
                          <Badge status="Active" />
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>${inv.amount.toLocaleString()}</span>
                          <span>Profit: ${inv.total_roi_earned.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last logins */}
              {userDetail?.loginHistory?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-2">Last 3 Logins</p>
                  <div className="space-y-1.5">
                    {userDetail.loginHistory.slice(0, 3).map((h, i) => (
                      <div key={i} className="bg-[#1a2035] rounded-lg p-2 text-xs flex justify-between">
                        <span className="text-slate-400">{h.ip}</span>
                        <span className="text-slate-500">{formatISTDate(h.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-slate-800 pt-4 flex gap-2">
                <button onClick={() => handleLoginAsUser(selected)}
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold py-2.5 rounded-xl transition-colors">
                  Login as User
                </button>
                <button onClick={() => downloadPDF(selected)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors">
                  Download Report
                </button>
              </div>

              {/* Adjust Balance */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-white text-sm font-semibold mb-3">Adjust Balance</p>
                {adjMsg && <p className={`text-xs mb-3 ${adjMsg.includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{adjMsg}</p>}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {['credit', 'debit'].map((t) => (
                      <button key={t} onClick={() => setAdjType(t)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${adjType === t ? (t === 'credit' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-800 text-slate-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="Amount ($)"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Reason"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  <button onClick={handleAdjust} disabled={adjusting || !adjAmount || !adjReason}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    {adjusting ? 'Processing...' : 'Apply Adjustment'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <svg className="w-10 h-10 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <p className="text-sm">Click a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
