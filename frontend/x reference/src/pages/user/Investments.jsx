import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatISTDate } from '../../utils/dateFormatter'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoIcon from '../../assets/logo-icon.png'

export default function UserInvestments({ defaultTab }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(defaultTab || searchParams.get('tab') || 'plans')
  const [plans, setPlans] = useState([])
  const [myInvestments, setMyInvestments] = useState([])
  const [selected, setSelected] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [investing, setInvesting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const load = async () => {
    try {
      const [p, inv, w] = await Promise.all([
        api.get('/investments/plans', false),
        api.get('/investments/my'),
        api.get('/wallet/'),
      ])
      setPlans(p)
      setMyInvestments(inv)
      setWallet(w)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleInvest = async () => {
    if (!selected) return
    setError('')
    setInvesting(true)
    setShowConfirm(false)
    try {
      await api.post('/investments/invest', { plan_id: selected.id, amount: selected.min_amount })
      setSelected(null)
      await load()
      setTab('active')
    } catch (err) {
      setError(err.message)
    } finally { setInvesting(false) }
  }

  const fixedAmount = selected?.min_amount || 0
  const dailyProfit = selected ? ((fixedAmount * selected.roi_monthly) / 100) : 0
  const totalReturn = selected ? (dailyProfit * selected.lock_months) : 0
  const hasEnoughBalance = wallet ? wallet.balance >= fixedAmount : false

  const planColors = [
    { color: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/30', accent: 'text-slate-300', btn: 'bg-slate-600 hover:bg-slate-500', badge: 'text-slate-400 border-slate-600/50' },
    { color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/40', accent: 'text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-500', badge: 'text-yellow-400 border-yellow-500/40', popular: true },
    { color: 'from-blue-500/20 to-purple-600/10', border: 'border-blue-500/30', accent: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500', badge: 'text-blue-400 border-blue-500/40' },
    { color: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/30', accent: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500', badge: 'text-emerald-400 border-emerald-500/40' },
    { color: 'from-purple-500/20 to-pink-600/10', border: 'border-purple-500/30', accent: 'text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500', badge: 'text-purple-400 border-purple-500/40' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const activeInvestments = myInvestments.filter((i) => i.status === 'active')
  const totalInvested = myInvestments.reduce((s, i) => s + i.amount, 0)
  const totalEarned = myInvestments.reduce((s, i) => s + i.total_roi_earned, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Packages" subtitle="Grow your capital with fixed-return packages" />

      {/* Confirm Investment Modal */}
      {showConfirm && selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-white font-semibold text-lg">Confirm Investment</h3>
              <p className="text-slate-400 text-sm mt-1">Please review your investment details</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-[#1a2035] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Package</span><span className="text-white font-semibold">{selected.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-bold">${fixedAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Daily Profit %</span><span className="text-emerald-400">{selected.roi_monthly}%/day</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Daily Profit</span><span className="text-emerald-400 font-semibold">+${dailyProfit.toFixed(4)}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-3"><span className="text-slate-300 font-medium">Est. Total Return</span><span className="text-emerald-400 font-bold">+${totalReturn.toFixed(2)}</span></div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={handleInvest} disabled={investing}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {investing ? 'Processing...' : 'Confirm & Invest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-white">${totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-400">${totalEarned.toFixed(2)}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Active Packages</p>
          <p className="text-2xl font-bold text-blue-400">{activeInvestments.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-white">{myInvestments.filter((i) => i.status === 'completed').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'plans', label: 'Available Plans' },
          { key: 'active', label: `My Packages${activeInvestments.length > 0 ? ` (${activeInvestments.length})` : ''}` },
          { key: 'history', label: 'History' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PLANS TAB */}
      {tab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan, i) => {
              const style = planColors[i % planColors.length]
              const isSpecial = plan.is_special_offer
              return (
                <div key={plan.id}
                  className={`relative flex flex-col cursor-pointer transition-all hover:scale-[1.02] rounded-2xl p-6
                    ${isSpecial ? 'bg-gradient-to-br from-yellow-500/15 via-orange-500/10 to-yellow-600/15 border-2 border-yellow-500/60 shadow-[0_0_40px_rgba(234,179,8,0.15)]'
                      : `bg-gradient-to-br ${style.color} border ${style.border}`}
                    ${selected?.id === plan.id ? 'ring-2 ring-blue-500/50' : ''}`}
                  onClick={() => setSelected(plan)}>
                  {isSpecial && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse">Special Offer</div>}
                  {style.popular && !isSpecial && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Most Popular</div>}
                  <div className={`self-start text-xs font-semibold px-3 py-1 rounded-full border mb-4 ${isSpecial ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : style.badge}`}>{plan.name}</div>
                  <div className="mb-3">
                    <p className={`text-4xl font-bold ${isSpecial ? 'text-yellow-400' : style.accent}`}>${(plan.min_amount || 0).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-1">Fixed package price</p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#0a0e1a]/60 rounded-lg px-3 py-2 flex-1 text-center">
                      <p className="text-slate-500 text-xs">Daily Profit</p>
                      <p className={`font-bold text-sm ${isSpecial ? 'text-yellow-400' : style.accent}`}>{plan.roi_monthly}%/day</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5 flex-1">
                    {[`Daily profit: ${plan.roi_monthly}% per day`].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isSpecial ? 'text-yellow-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                  {wallet && wallet.balance < (plan.min_amount || 0) ? (
                    <div className="space-y-2">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
                        <p className="text-red-400 text-xs">Insufficient balance</p>
                        <p className="text-slate-500 text-xs">Need ${(plan.min_amount || 0).toLocaleString()} · Have ${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <button disabled className="w-full font-semibold py-3 rounded-xl text-sm bg-slate-700 text-slate-500 cursor-not-allowed">
                        Insufficient Balance
                      </button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setSelected(plan); setError(''); setShowConfirm(true) }}
                      className={`w-full font-semibold py-3 rounded-xl transition-colors text-sm ${isSpecial ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black' : `${style.btn} text-white`}`}>
                      Invest ${(plan.min_amount || 0).toLocaleString()}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ACTIVE PACKAGES TAB */}
      {tab === 'active' && (
        <div>
          {activeInvestments.length === 0 ? (
            <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-12 text-center">
              <img src={logoIcon} alt="FXU" className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-slate-400 text-sm">No active packages yet.</p>
              <button onClick={() => setTab('plans')} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeInvestments.map((inv) => {
                const now = new Date()
                const start = new Date(inv.start_date)
                const end = new Date(inv.end_date)
                const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
                const daysElapsed = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)))
                const daysRemaining = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)))
                const progress = Math.min(100, (daysElapsed / totalDays) * 100)

                return (
                  <div key={inv.id} className="bg-gradient-to-br from-[#0f1629] to-[#1a2035] border border-blue-500/20 rounded-2xl p-5 flex flex-col gap-4">
                    {/* Header with logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logoIcon} alt="FXU" className="w-8 h-8 object-contain" />
                        <div>
                          <p className="text-white font-bold text-sm">{inv.plan}</p>
                          <p className="text-slate-500 text-xs">FXUniverse Package</p>
                        </div>
                      </div>
                      <Badge status="Active" />
                    </div>

                    {/* Amount */}
                    <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
                      <p className="text-slate-500 text-xs mb-1">Invested Amount</p>
                      <p className="text-white font-bold text-xl">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Days progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-blue-400 font-semibold">{daysRemaining} days of profit remaining</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                          style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-xs mt-1.5">
                        <span className="text-slate-600">Day {daysElapsed}</span>
                        <span className="text-slate-600">Day {totalDays}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#0a0e1a]/60 rounded-xl px-3 py-2.5">
                        <p className="text-slate-500 mb-1">Daily Profit</p>
                        <p className="text-emerald-400 font-bold">+${inv.daily_roi.toFixed(4)}</p>
                      </div>
                      <div className="bg-[#0a0e1a]/60 rounded-xl px-3 py-2.5">
                        <p className="text-slate-500 mb-1">Total Earned</p>
                        <p className="text-emerald-400 font-bold">+${inv.total_roi_earned.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex justify-between text-xs text-slate-500 border-t border-slate-800/50 pt-3">
                      <span>Started: {formatISTDate(inv.start_date)}</span>
                      <span>Ends: {formatISTDate(inv.end_date)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800"><h3 className="text-white font-semibold">Investment History</h3></div>
          {myInvestments.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No investments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Package', 'Amount', 'Daily Profit', 'Earned', 'Start', 'End', 'Status'].map((h) => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myInvestments.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{inv.plan}</td>
                      <td className="py-3 px-4 text-slate-300">${inv.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-emerald-400">+${inv.daily_roi.toFixed(4)}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">+${inv.total_roi_earned.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{formatISTDate(inv.start_date)}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{formatISTDate(inv.end_date)}</td>
                      <td className="py-3 px-4"><Badge status={inv.status === 'active' ? 'Active' : inv.status === 'completed' ? 'Completed' : 'Pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
