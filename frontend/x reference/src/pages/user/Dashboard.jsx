import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import { chartData, marketPairs } from '../../data/mockData'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import { formatIST, formatISTDate } from '../../utils/dateFormatter'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { appKit, getAddress, isConnected, getUSDTBalance } from '../../lib/web3'

// Plan color styles cycling for any number of plans
const PLAN_STYLES = [
  { color: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/30', accent: 'text-slate-300', btn: 'bg-slate-600 hover:bg-slate-500' },
  { color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/40', accent: 'text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-500', popular: true },
  { color: 'from-blue-500/20 to-purple-600/10', border: 'border-blue-500/30', accent: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500' },
  { color: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/30', accent: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500' },
  { color: 'from-purple-500/20 to-pink-600/10', border: 'border-purple-500/30', accent: 'text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500' },
]

export default function UserDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState(null)
  const [investments, setInvestments] = useState([])
  const [plans, setPlans] = useState([])
  const [notifications, setNotifications] = useState([])
  const [cryptoPrices, setCryptoPrices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Web3 states
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [usdtBalance, setUsdtBalance] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [w, inv, notif, crypto, p] = await Promise.all([
          api.get('/wallet/'),
          api.get('/investments/my'),
          api.get('/notifications/?limit=5'),
          api.get('/market/crypto', false),
          api.get('/investments/plans', false),
        ])
        setWallet(w)
        setInvestments(inv)
        setNotifications(notif.notifications || [])
        setCryptoPrices(crypto || [])
        setPlans(p || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
    
    // Check wallet connection
    if (isConnected()) {
      const addr = getAddress()
      setWalletConnected(true)
      setWalletAddress(addr)
      loadUSDTBalance(addr)
    }
    
    // Listen for wallet connection changes
    const unsubscribe = appKit.subscribeState((state) => {
      if (state.address) {
        setWalletConnected(true)
        setWalletAddress(state.address)
        loadUSDTBalance(state.address)
      } else {
        setWalletConnected(false)
        setWalletAddress('')
        setUsdtBalance(0)
      }
    })

    // Auto-refresh wallet balance every 60 seconds
    const refreshTimer = setInterval(async () => {
      try {
        const w = await api.get('/wallet/')
        setWallet(w)
      } catch {}
    }, 60000)
    
    return () => {
      unsubscribe()
      clearInterval(refreshTimer)
    }
  }, [])
  
  const loadUSDTBalance = async (address) => {
    try {
      const balance = await getUSDTBalance(address)
      setUsdtBalance(balance)
    } catch (error) {
      console.error('Error loading USDT balance:', error)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeInvestments = investments.filter((i) => i.status === 'active')
  const totalInvested = activeInvestments.reduce((s, i) => s + i.amount, 0)
  const totalRoi = investments.reduce((s, i) => s + i.total_roi_earned, 0)
  
  // Calculate 3X progress
  const earningCap = wallet?.earning_cap || 0
  const totalEarned = wallet?.total_earned || 0
  const capProgress = earningCap > 0 ? (totalEarned / earningCap) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome back, {user?.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Here's your account overview
            {user?.created_at && ` · Joined on ${formatISTDate(user.created_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Live Market</span>
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* 3X Earning Cap Warning */}
      {wallet?.earning_cap_reached && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-400 font-semibold">3X Earning Cap Reached!</p>
            <p className="text-slate-300 text-sm mt-1">You've reached your earning limit. Please make a new investment to continue earning.</p>
            <button onClick={() => navigate('/investments')} className="mt-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Invest Now to Continue
            </button>
          </div>
        </div>
      )}

      {/* 5 Wallets Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* FXU Wallet - Prominent */}
        <div className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="min-w-0">
              <p className="text-slate-300 text-sm mb-1 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                FXU Wallet (Main)
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-white truncate">${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-slate-400 text-xs mt-1">Available for investment & withdrawal</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <button onClick={() => navigate('/fxu-wallet?tab=deposit')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                Deposit
              </button>
              <button onClick={() => navigate('/withdraw')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                Withdraw
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#0a0e1a]/60 rounded-xl px-3 py-2.5">
              <p className="text-slate-500 text-xs mb-1">Locked (Invested)</p>
              <p className="text-yellow-400 font-bold text-sm">${(wallet?.locked_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0a0e1a]/60 rounded-xl px-3 py-2.5">
              <p className="text-slate-500 text-xs mb-1">Total Deposited</p>
              <p className="text-white font-bold text-sm">${(wallet?.total_deposited || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Profit Wallet */}
        <div className="bg-[#0f1629] border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Profit Wallet</p>
          </div>
          <p className="text-xl font-bold text-emerald-400 mb-1">${(wallet?.roi_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Package profit earnings</p>
          <button onClick={() => navigate('/wallet')} className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            Transfer to FXU
          </button>
        </div>

        {/* Level Wallet */}
        <div className="bg-[#0f1629] border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Level Wallet</p>
          </div>
          <p className="text-xl font-bold text-blue-400 mb-1">${(wallet?.level_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Referral commissions</p>
          <button onClick={() => navigate('/wallet')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            Transfer to FXU
          </button>
        </div>

        {/* Rewards Wallet */}
        <div className="bg-[#0f1629] border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Rewards Wallet</p>
          </div>
          <p className="text-xl font-bold text-yellow-400 mb-1">${(wallet?.rewards_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Bonuses & awards</p>
          <button onClick={() => navigate('/wallet')} className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            Transfer to FXU
          </button>
        </div>

        {/* Total Earned (3X Progress) */}
        <div className="bg-[#0f1629] border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Total Earned</p>
          </div>
          <p className="text-xl font-bold text-purple-400 mb-1">${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-2">of ${earningCap.toLocaleString('en-US', { minimumFractionDigits: 2 })} (3X cap)</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5">
            <div className={`h-1.5 rounded-full transition-all ${capProgress >= 100 ? 'bg-red-500' : capProgress >= 80 ? 'bg-yellow-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(capProgress, 100)}%` }} />
          </div>
          <p className="text-slate-500 text-xs">{capProgress.toFixed(1)}% of cap</p>
        </div>
      </div>

      {/* Stats - Keep existing stats but update values */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Investments" value={activeInvestments.length} sub={`$${totalInvested.toLocaleString()}`} color="blue"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
        <StatCard title="Profit Earned" value={`$${(wallet?.roi_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="In Profit Wallet" color="green"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Level Income" value={`$${(wallet?.level_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="In Level Wallet" color="purple"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Rewards" value={`$${(wallet?.rewards_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="In Rewards Wallet" color="yellow"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>} />
      </div>

      {/* Investment Plans — loaded from API */}
      {plans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Investment Plans</h2>
            <button onClick={() => navigate('/investments')} className="text-blue-400 text-xs hover:text-blue-300 transition-colors">View all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.slice(0, 3).map((plan, i) => {
              const style = PLAN_STYLES[i % PLAN_STYLES.length]
              const isSpecial = plan.is_special_offer
              return (
                <div key={plan.id} className={`relative bg-gradient-to-br ${isSpecial ? 'from-yellow-500/15 to-orange-500/10 border-2 border-yellow-500/60' : `${style.color} border ${style.border}`} rounded-2xl p-5 flex flex-col`}>
                  {isSpecial && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">Special Offer</div>}
                  {style.popular && !isSpecial && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">Most Popular</div>}
                  <p className="text-slate-400 text-xs mb-2">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-3xl font-bold ${isSpecial ? 'text-yellow-400' : style.accent}`}>${(plan.min_amount || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-4">{plan.roi_monthly}%/mo profit</p>
                  <button onClick={() => navigate('/investments')}
                    className={`mt-auto w-full ${isSpecial ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : `${style.btn} text-white`} font-semibold py-2.5 rounded-xl transition-colors text-sm`}>
                    Invest Now
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chart + Market */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">EUR/USD</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white font-mono">1.08542</span>
                <span className="text-emerald-400 text-sm font-medium">+0.21%</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(4)} width={65} />
              <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Crypto Prices</h3>
          <div className="space-y-2">
            {(cryptoPrices.length > 0 ? cryptoPrices : marketPairs).slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <p className="text-white text-sm font-medium">{p.symbol || p.pair}</p>
                <div className="text-right">
                  <p className="text-white text-sm font-mono">{p.price ? `$${parseFloat(p.price).toLocaleString()}` : p.price}</p>
                  <p className={`text-xs font-medium ${parseFloat(p.change || p.changePct) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(p.change || p.changePct) >= 0 ? '+' : ''}{parseFloat(p.change || p.changePct).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Active Investments</h3>
            <button onClick={() => navigate('/investments')} className="text-blue-400 text-xs hover:text-blue-300">View all</button>
          </div>
          <div className="space-y-3">
            {activeInvestments.slice(0, 3).map((inv) => (
              <div key={inv.id} className="bg-[#1a2035] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{inv.plan}</span>
                  <Badge status="Active" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-slate-500">Invested</p><p className="text-white font-semibold">${inv.amount.toLocaleString()}</p></div>
                  <div><p className="text-slate-500">Daily Profit</p><p className="text-emerald-400 font-semibold">+${inv.daily_roi.toFixed(4)}</p></div>
                  <div><p className="text-slate-500">Earned</p><p className="text-emerald-400 font-semibold">+${inv.total_roi_earned.toFixed(2)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Notifications</h3>
            <button onClick={() => navigate('/notifications')} className="text-blue-400 text-xs hover:text-blue-300">View all</button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${!n.is_read ? 'bg-blue-500/5 border border-blue-500/10' : 'hover:bg-slate-800/30'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-blue-400' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm">{n.message}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{formatIST(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
