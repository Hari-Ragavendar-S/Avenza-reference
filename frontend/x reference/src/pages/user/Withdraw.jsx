import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatIST } from '../../utils/dateFormatter'

const FEE_PCT = 5

export default function UserWithdraw() {
  const [wallet, setWallet] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [purpose, setPurpose] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [windowInfo, setWindowInfo] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [w, wds, win] = await Promise.all([
          api.get('/wallet/'),
          api.get('/wallet/withdrawals'),
          api.get('/wallet/withdrawal-window')
        ])
        setWallet(w)
        setWithdrawals(wds)
        setWindowInfo(win)
      } catch {}
    }
    load()
  }, [])

  const fee = parseFloat(amount || 0) * (FEE_PCT / 100)
  const netAmount = parseFloat(amount || 0) - fee
  const amountNum = parseFloat(amount || 0)
  const isValidAmount = amountNum >= 10 && wallet && amountNum <= wallet.balance

  const requestOtp = async () => {
    setError('')
    if (!isValidAmount) {
      setError(amountNum < 10 ? 'Minimum withdrawal is $10' : 'Insufficient balance')
      return
    }
    if (!address) { setError('Please enter wallet address'); return }
    if (!purpose) { setError('Please enter purpose'); return }
    setLoading(true)
    try {
      await api.post('/wallet/withdrawal/request-otp', {})
      setOtpSent(true)
      setStep(2)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/wallet/withdraw', {
        amount: amountNum,
        wallet_address: address,
        network: 'BNB Smart Chain',
        token: 'USDT',
        purpose,
        otp,
      })
      setSuccess('Withdrawal request submitted successfully. Your request will be processed within 24 hours.')
      setAmount('')
      setAddress('')
      setPurpose('')
      setOtp('')
      setStep(1)
      setOtpSent(false)
      const [w, wds] = await Promise.all([api.get('/wallet/'), api.get('/wallet/withdrawals')])
      setWallet(w)
      setWithdrawals(wds)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" subtitle="Withdraw USDT from your FXU Wallet" />

      {/* Withdrawal Window Status */}
      {windowInfo && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${windowInfo.allowed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/30'}`}>
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${windowInfo.allowed ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={windowInfo.allowed ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <div>
            <p className={`font-semibold text-sm ${windowInfo.allowed ? 'text-emerald-400' : 'text-red-400'}`}>
              {windowInfo.allowed ? 'Withdrawals are open' : 'Withdrawals are currently closed'}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Withdrawal window: {windowInfo.window_start} — {windowInfo.window_end} (IST)
            </p>
          </div>
        </div>
      )}

      {/* Available Balance */}
      {wallet && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-blue-300 text-sm">Available Balance</p>
          </div>
          <p className="text-white font-bold text-lg">${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      )}

      {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Withdrawal Request</h3>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-full">USDT BEP-20</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Amount to Withdraw (USD) — Min $10</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Min $10"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fee Breakdown */}
              {amountNum >= 10 && (
                <div className="bg-[#1a2035] rounded-xl p-4 space-y-2 text-sm border border-slate-700">
                  <p className="text-slate-400 text-xs font-medium mb-3">Fee Breakdown</p>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Requested</span>
                    <span className="text-white font-semibold">${amountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Withdrawal Fee ({FEE_PCT}%)</span>
                    <span className="text-red-400 font-semibold">-${fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-slate-300 font-medium">You Will Receive</span>
                    <span className="text-emerald-400 font-bold">${netAmount.toFixed(2)} USDT</span>
                  </div>
                </div>
              )}

              {/* Wallet Address */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">USDT Wallet Address (BEP-20)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Personal use, Business expense..."
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Processing time notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-yellow-400 text-xs">Withdrawals are processed within 24 hours after admin approval.</p>
              </div>

              <button
                onClick={requestOtp}
                disabled={loading || !isValidAmount || !address || !purpose || (windowInfo && !windowInfo.allowed)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Sending OTP...' : windowInfo && !windowInfo.allowed ? 'Withdrawals Closed' : 'Send OTP to Email'}              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">OTP sent to your registered email. Enter it below to confirm.</p>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">OTP Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Confirmation Summary */}
              <div className="bg-[#1a2035] rounded-xl p-4 space-y-2 text-sm">
                <p className="text-slate-400 text-xs font-medium mb-2">Withdrawal Summary</p>
                <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white">${amountNum.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Fee ({FEE_PCT}%)</span><span className="text-red-400">-${fee.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-medium">You Receive</span><span className="text-emerald-400 font-bold">${netAmount.toFixed(2)} USDT</span></div>
                <div className="flex justify-between pt-1"><span className="text-slate-400">To Address</span><span className="text-slate-300 font-mono text-xs">{address.slice(0, 10)}...{address.slice(-6)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Purpose</span><span className="text-slate-300 text-xs">{purpose}</span></div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-slate-400 hover:text-white text-sm transition-colors">Back</button>
            </form>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <p className="text-slate-500 text-sm">No withdrawals yet.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-[#1a2035] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-medium">USDT — BNB Smart Chain</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{w.wallet_address?.slice(0, 16)}...</p>
                      {w.purpose && <p className="text-slate-500 text-xs mt-0.5">Purpose: {w.purpose}</p>}
                    </div>
                    <Badge status={w.status === 'completed' ? 'Completed' : w.status === 'rejected' ? 'Rejected' : 'Pending'} />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-400">{formatIST(w.created_at)}</span>
                    <div className="text-right">
                      <p className="text-red-400 font-semibold">-${w.amount?.toFixed(2)}</p>
                      {w.withdrawal_fee > 0 && <p className="text-slate-500">Fee: ${w.withdrawal_fee?.toFixed(2)}</p>}
                    </div>
                  </div>
                  {w.status === 'rejected' && (
                    <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                      <p className="text-red-400 text-xs">Rejected — Full amount refunded to FXU Wallet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
