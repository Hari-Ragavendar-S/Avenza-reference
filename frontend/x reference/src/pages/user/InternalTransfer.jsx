import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

export default function UserInternalTransfer() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toFxuId, setToFxuId] = useState('')
  const [toUserInfo, setToUserInfo] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [amount, setAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [successResult, setSuccessResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadWallet = async () => {
    try { const w = await api.get('/wallet/'); setWallet(w) }
    catch {} finally { setLoading(false) }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const txs = await api.get('/wallet/transactions?limit=200')
      setHistory(txs.filter(t => t.type === 'internal_transfer_out' || t.type === 'internal_transfer_in'))
    } catch {} finally { setHistoryLoading(false) }
  }

  useEffect(() => { loadWallet(); loadHistory() }, [])

  const lookupUser = async () => {
    setLookupError(''); setToUserInfo(null)
    if (!toFxuId.trim()) return
    try {
      const data = await api.get(`/wallet/user-lookup/${toFxuId.trim().toUpperCase()}`)
      setToUserInfo(data)
    } catch (err) { setLookupError(err.message || 'User not found or not in your downline') }
  }

  const handleSubmit = () => {
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt < 1) { setError('Minimum transfer is $1'); return }
    if (!toUserInfo) { setError('Please look up a valid downline user first'); return }
    if (amt > (wallet?.balance || 0)) { setError('Insufficient FXU Wallet balance'); return }
    setShowConfirm(true)
  }

  const confirmTransfer = async () => {
    setShowConfirm(false); setTransferring(true); setError('')
    try {
      const res = await api.post(`/wallet/transfer-to-user?to_fxu_id=${toUserInfo.fxu_id}&amount=${parseFloat(amount)}`, {})
      const updatedWallet = await api.get('/wallet/')
      setWallet(updatedWallet)
      setSuccessResult({
        amountSent: res.amount_sent ?? parseFloat(amount),
        amountReceived: res.amount_received ?? parseFloat(amount),
        recipientName: res.recipient_name,
        recipientFxuId: res.recipient_fxu_id,
        newBalance: updatedWallet.balance,
      })
      setToFxuId(''); setToUserInfo(null); setAmount('')
      loadHistory()
    } catch (err) { setError(err.message || 'Transfer failed. Please try again.') }
    finally { setTransferring(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Internal Transfer" subtitle="Send FXU Wallet funds to your downline or direct referrals — no fees" />

      {/* Success overlay */}
      {successResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-emerald-500/40 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl">Transfer Successful!</h2>
              <p className="text-emerald-100 text-sm mt-1">Funds sent instantly — no fees</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-[#1a2035] rounded-2xl p-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-base flex-shrink-0">
                  {successResult.recipientName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{successResult.recipientName}</p>
                  <p className="text-emerald-400 text-xs font-mono">{successResult.recipientFxuId}</p>
                </div>
              </div>
              <div className="bg-[#1a2035] rounded-2xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Sent</span>
                  <span className="text-white font-bold">${successResult.amountSent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">They Received</span>
                  <span className="text-emerald-400 font-bold text-base">${successResult.amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2.5">
                  <span className="text-slate-400">Your New Balance</span>
                  <span className="text-white font-bold">${successResult.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs text-center">Recorded in transaction history with "Internal Transfer" badge.</p>
              <button onClick={() => setSuccessResult(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && toUserInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Confirm Transfer</h3>
            <p className="text-slate-400 text-xs mb-4">No fees — full amount credited instantly</p>
            <div className="bg-[#1a2035] rounded-xl p-4 space-y-2.5 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">To</span>
                <div className="text-right">
                  <p className="text-white font-semibold">{toUserInfo.name}</p>
                  <p className="text-slate-400 text-xs font-mono">{toUserInfo.fxu_id}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-white font-bold">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Fee</span>
                <span className="text-emerald-400 font-semibold">Free (0%)</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2.5">
                <span className="text-slate-300 font-medium">{toUserInfo.name} Receives</span>
                <span className="text-emerald-400 font-bold text-base">${parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-yellow-400 text-xs mb-5">⚠️ Transfers are irreversible. Verify the FXU ID before confirming.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={confirmTransfer} disabled={transferring}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                {transferring ? 'Processing...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Balance bar */}
          <div className="bg-[#1a2035] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs">FXU Wallet Balance</p>
              <p className="text-white font-bold text-lg">
                {loading ? '...' : `$${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Service Fee</p>
              <p className="text-emerald-400 font-bold">Free</p>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Recipient */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block font-medium">
              Recipient FXU ID <span className="text-slate-600">(downline or direct referral only)</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={toFxuId}
                onChange={(e) => { setToFxuId(e.target.value.toUpperCase()); setToUserInfo(null); setLookupError('') }}
                onKeyDown={(e) => e.key === 'Enter' && lookupUser()}
                placeholder="e.g. FXU1234"
                className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500 uppercase" />
              <button onClick={lookupUser} disabled={!toFxuId.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                Find
              </button>
            </div>
            {lookupError && <p className="text-red-400 text-xs mt-1.5">{lookupError}</p>}
            {toUserInfo && (
              <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
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
            <label className="text-slate-400 text-xs mb-1.5 block font-medium">Amount — Min $1</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" min="1" step="0.01"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[10, 25, 50, 100, 500].map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">${v}</button>
              ))}
            </div>
          </div>

          {/* Preview — no fee */}
          {amount && parseFloat(amount) >= 1 && (
            <div className="bg-[#1a2035] border border-emerald-500/20 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">You Send</span>
                <span className="text-white font-semibold">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Fee</span>
                <span className="text-emerald-400 font-semibold">Free (0%)</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-300 font-medium">{toUserInfo ? toUserInfo.name : 'Recipient'} Receives</span>
                <span className="text-emerald-400 font-bold text-base">${parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={transferring || !toUserInfo || !amount || parseFloat(amount) < 1 || parseFloat(amount) > (wallet?.balance || 0)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
            {transferring ? 'Processing...'
              : toUserInfo && amount && parseFloat(amount) >= 1
                ? `Send $${parseFloat(amount).toFixed(2)} to ${toUserInfo.name}`
                : 'Send Funds'}
          </button>
        </div>

        {/* Info */}
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">How It Works</h3>
          <div className="space-y-3">
            {[
              { icon: '👥', title: 'Downline Only', desc: 'You can only transfer to users in your direct referrals or downline team.' },
              { icon: '🎁', title: 'Zero Fees', desc: 'No service fee. Send $100 → recipient gets exactly $100.' },
              { icon: '⚡', title: 'Instant Credit', desc: "Recipient's FXU Wallet is credited immediately with a notification." },
              { icon: '📋', title: 'Fully Recorded', desc: 'Both sender and recipient see it in transaction history with "Internal Transfer" badge.' },
            ].map(s => (
              <div key={s.title} className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{s.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 text-xs">⚠️ Transfers are irreversible. Always verify the FXU ID before confirming.</p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h3 className="text-white font-semibold">Transfer History</h3>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No internal transfers yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {history.map(tx => {
              const isSent = tx.type === 'internal_transfer_out'
              return (
                <div key={tx.id} className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSent ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
                      <svg className={`w-4 h-4 ${isSent ? 'text-red-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSent ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{isSent ? 'Sent' : 'Received'}</p>
                      <p className="text-slate-500 text-xs truncate">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className={`font-semibold text-sm ${isSent ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isSent ? '−' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-600 text-xs">{formatIST(tx.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
