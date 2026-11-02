import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'

export default function UserWallet() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  
  const [tab, setTab] = useState(initialTab)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Transfer state
  const [transferFrom, setTransferFrom] = useState('roi')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState('')

  // User-to-user transfer state
  const [toFxuId, setToFxuId] = useState('')
  const [toUserAmount, setToUserAmount] = useState('')
  const [toUserInfo, setToUserInfo] = useState(null)
  const [toUserLookupError, setToUserLookupError] = useState('')
  const [toUserTransferring, setToUserTransferring] = useState(false)
  const [toUserSuccess, setToUserSuccess] = useState('')
  const [toUserError, setToUserError] = useState('')
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)
  const [showWalletTransferConfirm, setShowWalletTransferConfirm] = useState(false)

  const loadWallet = async () => {
    try {
      const w = await api.get('/wallet/')
      setWallet(w)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

  const handleTransfer = async (e) => {
    e.preventDefault()
    setTransferError('')
    setTransferSuccess('')
    
    const amount = parseFloat(transferAmount)
    if (!amount || amount < 1) {
      setTransferError('Minimum transfer amount is $1')
      return
    }

    const sourceBalance = transferFrom === 'roi' ? wallet.roi_wallet 
      : transferFrom === 'level' ? wallet.level_wallet 
      : wallet.rewards_wallet
    
    if (amount > sourceBalance) {
      setTransferError(`Insufficient balance in ${transferFrom} wallet`)
      return
    }

    setShowWalletTransferConfirm(true)
  }

  const confirmWalletTransfer = async () => {
    setShowWalletTransferConfirm(false)
    setTransferring(true)
    try {
      await api.post(`/wallet/transfer?from_wallet=${transferFrom}&amount=${parseFloat(transferAmount)}`, {})
      setTransferSuccess(`Successfully transferred $${parseFloat(transferAmount).toFixed(2)} to FXU Wallet`)
      setTransferAmount('')
      await loadWallet()
    } catch (err) {
      setTransferError(err.message || 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  const lookupUser = async () => {
    setToUserLookupError('')
    setToUserInfo(null)
    if (!toFxuId.trim()) return
    try {
      const data = await api.get(`/wallet/user-lookup/${toFxuId.trim().toUpperCase()}`)
      setToUserInfo(data)
    } catch (err) {
      setToUserLookupError('User not found')
    }
  }

  const handleUserTransfer = async () => {
    setToUserError('')
    const amount = parseFloat(toUserAmount)
    if (!amount || amount < 1) { setToUserError('Minimum transfer is $1'); return }
    if (!toUserInfo) { setToUserError('Please look up a valid user first'); return }
    if (amount > wallet.balance) { setToUserError('Insufficient FXU Wallet balance'); return }
    setShowTransferConfirm(true)
  }

  const confirmUserTransfer = async () => {
    setShowTransferConfirm(false)
    setToUserTransferring(true)
    try {
      const res = await api.post(`/wallet/transfer-to-user?to_fxu_id=${toUserInfo.fxu_id}&amount=${parseFloat(toUserAmount)}`, {})
      const received = res.amount_received ?? parseFloat(toUserAmount)
      setToUserSuccess(`✅ $${parseFloat(toUserAmount).toFixed(2)} sent to ${res.recipient_name} (${res.recipient_fxu_id}). No fees — full amount credited.`)
      setToFxuId('')
      setToUserAmount('')
      setToUserInfo(null)
      await loadWallet()
    } catch (err) {
      setToUserError(err.message || 'Transfer failed')
    } finally {
      setToUserTransferring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const earningCap = wallet?.earning_cap || 0
  const totalEarned = wallet?.total_earned || 0
  const capProgress = earningCap > 0 ? (totalEarned / earningCap) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader title="My Wallets" subtitle="Manage your funds across all wallets" />

      {/* Confirmation Modals */}
      {showWalletTransferConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-white font-semibold mb-2">Confirm Transfer</h3>
            <p className="text-slate-400 text-sm mb-6">Transfer <span className="text-white font-bold">${parseFloat(transferAmount).toFixed(2)}</span> from <span className="text-white capitalize">{transferFrom} Wallet</span> to your FXU Wallet?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowWalletTransferConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={confirmWalletTransfer} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

      {showTransferConfirm && toUserInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Confirm Internal Transfer</h3>
            <p className="text-slate-400 text-xs mb-4">No fees — full amount credited instantly</p>
            <div className="bg-[#1a2035] rounded-xl p-4 mb-4 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">To</span>
                <div className="text-right">
                  <p className="text-white font-semibold">{toUserInfo.name}</p>
                  <p className="text-slate-400 text-xs font-mono">{toUserInfo.fxu_id}</p>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-bold">${parseFloat(toUserAmount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Service Fee</span><span className="text-emerald-400 font-semibold">Free (0%)</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2.5">
                <span className="text-slate-300 font-medium">{toUserInfo.name} Receives</span>
                <span className="text-emerald-400 font-bold text-base">${parseFloat(toUserAmount).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-yellow-400 text-xs mb-5">⚠️ Transfers are irreversible. Verify the recipient's FXU ID before confirming.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowTransferConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={confirmUserTransfer} disabled={toUserTransferring} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {toUserTransferring ? 'Processing...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3X Cap Warning */}
      {wallet?.earning_cap_reached && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-400 font-semibold">3X Earning Cap Reached!</p>
            <p className="text-slate-300 text-sm mt-1">You've earned 3X your investment amount. Make a new investment to continue earning.</p>
          </div>
        </div>
      )}

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* FXU Wallet */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-300 text-sm mb-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                FXU Wallet (Main)
              </p>
              <p className="text-4xl font-bold text-white">${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-slate-400 text-xs mt-2">Use for deposits, investments & withdrawals</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Locked (Invested)</p>
              <p className="text-yellow-400 font-bold">${(wallet?.locked_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Total Deposited</p>
              <p className="text-white font-bold">${(wallet?.total_deposited || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Total Earned (3X Progress) */}
        <div className="bg-[#0f1629] border border-purple-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Total Earned (3X Cap)</p>
          </div>
          <p className="text-2xl font-bold text-purple-400 mb-1">${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-2">of ${earningCap.toLocaleString('en-US', { minimumFractionDigits: 2 })} cap</p>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all ${capProgress >= 100 ? 'bg-red-500' : capProgress >= 80 ? 'bg-yellow-500' : 'bg-purple-500'}`} 
              style={{ width: `${Math.min(capProgress, 100)}%` }} 
            />
          </div>
          <p className="text-slate-500 text-xs">{capProgress.toFixed(1)}% of earning cap</p>
        </div>

        {/* Profit Wallet */}
        <div className="bg-[#0f1629] border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Profit Wallet</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mb-1">${(wallet?.roi_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Daily profit from packages</p>
          <button 
            onClick={() => { setTab('transfer'); setTransferFrom('roi'); }}
            disabled={!wallet?.roi_wallet || wallet.roi_wallet <= 0}
            className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Transfer to FXU
          </button>
        </div>

        {/* Level Wallet */}
        <div className="bg-[#0f1629] border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Level Wallet</p>
          </div>
          <p className="text-2xl font-bold text-blue-400 mb-1">${(wallet?.level_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Referral commissions (L1-L9)</p>
          <button 
            onClick={() => { setTab('transfer'); setTransferFrom('level'); }}
            disabled={!wallet?.level_wallet || wallet.level_wallet <= 0}
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Transfer to FXU
          </button>
        </div>

        {/* Rewards Wallet */}
        <div className="bg-[#0f1629] border border-yellow-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">Rewards Wallet</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400 mb-1">${(wallet?.rewards_wallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-xs mb-3">Bonuses & awards</p>
          <button 
            onClick={() => { setTab('transfer'); setTransferFrom('rewards'); }}
            disabled={!wallet?.rewards_wallet || wallet.rewards_wallet <= 0}
            className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Transfer to FXU
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'transfer', label: 'Transfer Funds' },
          { key: 'send', label: 'Send to User' },
        ].map((t) => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Wallet System Overview</h3>
          <div className="space-y-4">
            <div className="bg-[#1a2035] rounded-xl p-4">
              <h4 className="text-emerald-400 font-semibold mb-2">🟢 Profit Wallet</h4>
              <p className="text-slate-300 text-sm">Receives daily profit earnings from your active investment packages. Transfer to FXU Wallet to use for investments or withdrawals.</p>
            </div>
            <div className="bg-[#1a2035] rounded-xl p-4">
              <h4 className="text-blue-400 font-semibold mb-2">🔵 Level Wallet</h4>
              <p className="text-slate-300 text-sm">Receives referral commissions from your team (Direct 5% + Level 1-9 income). Transfer to FXU Wallet to use funds.</p>
            </div>
            <div className="bg-[#1a2035] rounded-xl p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">🟡 Rewards Wallet</h4>
              <p className="text-slate-300 text-sm">Receives bonuses, awards, and special promotions. Transfer to FXU Wallet to access funds.</p>
            </div>
            <div className="bg-[#1a2035] rounded-xl p-4">
              <h4 className="text-blue-400 font-semibold mb-2">💎 FXU Wallet (Main)</h4>
              <p className="text-slate-300 text-sm">Your main wallet for deposits, investments, and withdrawals. Only this wallet can be used to withdraw funds.</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <h4 className="text-purple-400 font-semibold mb-2">📊 3X Earning Cap System</h4>
              <p className="text-slate-300 text-sm mb-2">You can earn up to 3X your total active investment amount. Once you reach this cap, you need to make a new investment to continue earning.</p>
              <p className="text-slate-400 text-xs">Example: If you invest $1,000, you can earn up to $3,000 total (Profit + Level Income + Rewards).</p>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER TAB */}
      {tab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5">Transfer to FXU Wallet</h3>
            
            {transferError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {transferError}
              </div>
            )}
            
            {transferSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-4">
                {transferSuccess}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-5">
              <div>
                <label className="text-slate-400 text-xs mb-2 block">From Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'roi', label: 'Profit', balance: wallet?.roi_wallet, color: 'emerald' },
                    { key: 'level', label: 'Level', balance: wallet?.level_wallet, color: 'blue' },
                    { key: 'rewards', label: 'Rewards', balance: wallet?.rewards_wallet, color: 'yellow' },
                  ].map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setTransferFrom(w.key)}
                      className={`p-3 rounded-xl border transition-all ${
                        transferFrom === w.key
                          ? `border-${w.color}-500/50 bg-${w.color}-500/10`
                          : 'border-slate-700 bg-[#1a2035] hover:border-slate-600'
                      }`}>
                      <p className={`text-xs font-medium ${transferFrom === w.key ? `text-${w.color}-400` : 'text-slate-400'}`}>
                        {w.label}
                      </p>
                      <p className="text-white text-sm font-bold mt-1">${(w.balance || 0).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-2 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[25, 50, 75, 100].map((pct) => {
                    const sourceBalance = transferFrom === 'roi' ? wallet?.roi_wallet 
                      : transferFrom === 'level' ? wallet?.level_wallet 
                      : wallet?.rewards_wallet
                    const amount = ((sourceBalance || 0) * pct / 100).toFixed(2)
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTransferAmount(amount)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
                        {pct}%
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[#1a2035] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">From</span>
                  <span className="text-white capitalize">{transferFrom} Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">To</span>
                  <span className="text-white">FXU Wallet</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-semibold">${parseFloat(transferAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={transferring || !transferAmount || parseFloat(transferAmount) < 1}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {transferring ? 'Processing...' : 'Transfer Now'}
              </button>
            </form>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Transfer Information</h3>
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-300 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Transfers are instant and free. No fees charged.</span>
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Select Source Wallet</p>
                    <p className="text-slate-400 text-xs mt-0.5">Choose which wallet to transfer from (Profit, Level, or Rewards)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Enter Amount</p>
                    <p className="text-slate-400 text-xs mt-0.5">Type the amount or use percentage buttons for quick selection</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Confirm Transfer</p>
                    <p className="text-slate-400 text-xs mt-0.5">Funds will be instantly available in your FXU Wallet</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a2035] rounded-xl p-4 mt-4">
                <p className="text-slate-400 text-xs mb-2">💡 <span className="font-semibold">Pro Tip:</span></p>
                <p className="text-slate-300 text-xs">Transfer funds to FXU Wallet when you want to make new investments or request withdrawals. Only FXU Wallet can be used for these operations.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND TO USER TAB */}
      {tab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-white font-semibold">Internal Fund Transfer</h3>
              <p className="text-slate-400 text-xs mt-1">Transfer FXU Wallet balance to your downline or direct referrals</p>
            </div>

            {/* Balance + fee info bar */}
            <div className="bg-[#1a2035] rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-slate-500 text-xs">Your FXU Balance</p>
                <p className="text-white font-bold">${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Service Fee</p>
                <p className="text-orange-400 font-bold">5%</p>
              </div>
            </div>

            {toUserSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{toUserSuccess}</div>}
            {toUserError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{toUserError}</div>}

            {/* Recipient lookup */}
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Recipient FXU ID (must be your downline or direct referral)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={toFxuId}
                  onChange={(e) => { setToFxuId(e.target.value.toUpperCase()); setToUserInfo(null); setToUserLookupError('') }}
                  placeholder="e.g. FXU1234"
                  className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500 uppercase"
                />
                <button
                  onClick={lookupUser}
                  disabled={!toFxuId.trim()}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
                >
                  Find
                </button>
              </div>
              {toUserLookupError && <p className="text-red-400 text-xs mt-1.5">{toUserLookupError}</p>}
              {toUserInfo && (
                <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                    {toUserInfo.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{toUserInfo.name}</p>
                    <p className="text-emerald-400 text-xs font-mono">{toUserInfo.fxu_id}</p>
                  </div>
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Amount to Send (USD) — Min $1</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  value={toUserAmount}
                  onChange={(e) => setToUserAmount(e.target.value)}
                  placeholder="1.00"
                  min="1"
                  step="0.01"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100, 500].map((v) => (
                  <button key={v} onClick={() => setToUserAmount(String(v))}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">${v}</button>
                ))}
              </div>
            </div>

            {/* Fee breakdown — live preview */}
            {toUserAmount && parseFloat(toUserAmount) >= 1 && (
              <div className="bg-[#1a2035] rounded-xl p-4 space-y-2 text-sm border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">You Send</span>
                  <span className="text-white font-semibold">${parseFloat(toUserAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Fee (5%)</span>
                  <span className="text-orange-400 font-semibold">−${(parseFloat(toUserAmount) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-300 font-medium">{toUserInfo?.name || 'Recipient'} Receives</span>
                  <span className="text-emerald-400 font-bold">${(parseFloat(toUserAmount) * 0.95).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleUserTransfer}
              disabled={toUserTransferring || !toUserInfo || !toUserAmount || parseFloat(toUserAmount) < 1 || parseFloat(toUserAmount) > (wallet?.balance || 0)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {toUserTransferring
                ? 'Processing...'
                : toUserInfo && toUserAmount && parseFloat(toUserAmount) >= 1
                  ? `Send $${parseFloat(toUserAmount).toFixed(2)} → ${toUserInfo.name} gets $${(parseFloat(toUserAmount) * 0.95).toFixed(2)}`
                  : 'Send Funds'}
            </button>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">How Internal Transfer Works</h3>
            <div className="space-y-3">
              {[
                { icon: '👥', title: 'Downline Only', desc: 'You can only transfer to users in your direct referrals or downline team. Enter their FXU ID and click Find to verify.' },
                { icon: '💸', title: '5% Service Fee', desc: 'A 5% service fee is deducted from the amount you send. Example: Send $100 → recipient gets $95, fee $5.' },
                { icon: '⚡', title: 'Instant Credit', desc: 'Recipient\'s FXU Wallet is credited immediately. They receive a notification with the transfer details.' },
                { icon: '📋', title: 'Recorded in History', desc: 'Both sender and recipient see the transfer in their transaction history with an "Internal Transfer" badge.' },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                  <span className="text-lg flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{s.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                <p className="text-orange-400 text-xs font-medium mb-1">⚠️ Important</p>
                <p className="text-slate-300 text-xs">Transfers are irreversible. Always verify the recipient's FXU ID before confirming. The 5% fee is non-refundable.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
