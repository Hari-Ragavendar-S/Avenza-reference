import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { appKit, getAddress, getUSDTBalance, sendUSDT, isConnected } from '../../lib/web3'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatIST } from '../../utils/dateFormatter'

const TX_TYPES = {
  deposit: { label: 'FXU Deposit', bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  roi: { label: 'Profit', bg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  commission: { label: 'Level Income', bg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' },
  direct_referral: { label: 'Direct Referral', bg: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  level_income: { label: 'Level Income', bg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' },
  admin_credit: { label: 'Admin Credit', bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  award: { label: 'Reward', bg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  investment_return: { label: 'Investment', bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' },
  withdrawal: { label: 'Withdrawal', bg: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  withdrawal_pending: { label: 'Withdrawal', bg: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  withdrawal_refund: { label: 'Refund', bg: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
  admin_debit: { label: 'Admin Debit', bg: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  transfer_from_roi: { label: 'Transfer', bg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  transfer_from_level: { label: 'Transfer', bg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  transfer_from_rewards: { label: 'Transfer', bg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  transfer_out: { label: 'Sent', bg: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  transfer_in: { label: 'Received', bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  internal_transfer_out: { label: 'Internal Transfer', bg: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  internal_transfer_in: { label: 'Internal Transfer', bg: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
}

const isCredit = (type) => !['withdrawal', 'withdrawal_pending', 'admin_debit'].includes(type)

export default function UserFXUWallet({ defaultTab = 'overview' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || defaultTab)
  const [txFilter, setTxFilter] = useState('all')
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)

  // Deposit state
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [usdtBalance, setUsdtBalance] = useState(0)
  const [usdtAmount, setUsdtAmount] = useState('')
  const [depositing, setDepositing] = useState(false)
  const [depositStep, setDepositStep] = useState(null) // 'sending' | 'confirming' | 'crediting'
  const [depositError, setDepositError] = useState('')
  const [depositSuccess, setDepositSuccess] = useState('')
  const [depositResult, setDepositResult] = useState(null) // holds { amount, txHash, newBalance }

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawPurpose, setWithdrawPurpose] = useState('')
  const [withdrawOtp, setWithdrawOtp] = useState('')
  const [withdrawStep, setWithdrawStep] = useState(1)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')

  // Pagination
  const [txPage, setTxPage] = useState(1)
  const TX_PER_PAGE = 5

  const loadData = async () => {
    try {
      const [w, tx, dep, wit] = await Promise.all([
        api.get('/wallet/'),
        api.get('/wallet/transactions?limit=200'),
        api.get('/wallet/deposits'),
        api.get('/wallet/withdrawals'),
      ])
      setWallet(w)
      setTransactions(tx)
      setDeposits(dep)
      setWithdrawals(wit)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadData()

    const unsub = appKit.subscribeAccount((account) => {
      if (account.address) {
        setConnected(true)
        setWalletAddress(account.address)
        getUSDTBalance(account.address).then(setUsdtBalance)
      } else {
        setConnected(false)
        setWalletAddress('')
        setUsdtBalance(0)
      }
    })

    const addr = getAddress()
    if (addr) {
      setConnected(true)
      setWalletAddress(addr)
      getUSDTBalance(addr).then(setUsdtBalance)
    }

    // Auto-refresh every 30 seconds to pick up new profit credits
    const refreshTimer = setInterval(() => {
      loadData()
    }, 30000)

    return () => {
      if (unsub) unsub()
      clearInterval(refreshTimer)
    }
  }, [])

  const handleConnect = () => appKit.open()

  const handleDeposit = async () => {
    setDepositError('')
    setDepositResult(null)
    const amount = parseFloat(usdtAmount)
    if (!amount || amount < 1) { setDepositError('Minimum deposit is 1 USDT'); return }
    setDepositing(true)
    setDepositStep('sending') // 'sending' | 'confirming' | 'crediting'
    try {
      const settings = await api.get('/admin/settings/public', false)
      const receiverAddress = settings.platform_usdt_address || settings.usdt_receiver_address
      if (!receiverAddress || receiverAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Deposit address not configured. Contact support.')
      }
      // Step 1 — send on blockchain
      const txHash = await sendUSDT(receiverAddress, amount)
      // Step 2 — auto-confirm on backend
      setDepositStep('confirming')
      await api.post('/wallet/deposit/auto-confirm', {
        tx_hash: txHash,
        bnb_amount: 0,
        usd_amount: amount,
        network: 'BNB Smart Chain',
        token: 'USDT',
      })
      // Step 3 — credit & refresh
      setDepositStep('crediting')
      await loadData()
      getUSDTBalance(walletAddress).then(setUsdtBalance)
      const updatedWallet = await api.get('/wallet/')
      setDepositResult({
        amount,
        txHash,
        newBalance: updatedWallet.balance,
      })
      setUsdtAmount('')
    } catch (err) {
      setDepositError(err.message || 'Transaction failed')
    } finally {
      setDepositing(false)
      setDepositStep(null)
    }
  }

  const requestWithdrawOtp = async () => {
    setWithdrawError('')
    if (!withdrawAmount || parseFloat(withdrawAmount) < 10) { setWithdrawError('Minimum withdrawal is $10'); return }
    if (!withdrawAddress) { setWithdrawError('Enter your USDT wallet address'); return }
    if (!withdrawPurpose) { setWithdrawError('Enter purpose for withdrawal'); return }
    try {
      await api.post('/wallet/withdrawal/request-otp', {})
      setWithdrawStep(2)
    } catch (err) { setWithdrawError(err.message) }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawing(true)
    try {
      await api.post('/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        wallet_address: withdrawAddress,
        network: 'BNB Smart Chain',
        token: 'USDT',
        purpose: withdrawPurpose,
        otp: withdrawOtp,
      })
      setWithdrawSuccess('Withdrawal request submitted. Admin will process within 24 hours.')
      setWithdrawAmount('')
      setWithdrawAddress('')
      setWithdrawPurpose('')
      setWithdrawOtp('')
      setWithdrawStep(1)
      await loadData()
    } catch (err) { setWithdrawError(err.message) }
    finally { setWithdrawing(false) }
  }

  const withdrawFee = parseFloat(withdrawAmount || 0) * 0.05
  const withdrawNet = parseFloat(withdrawAmount || 0) - withdrawFee

  const isCredit = (type) => !['withdrawal', 'withdrawal_pending', 'admin_debit', 'transfer_out', 'internal_transfer_out'].includes(type)

  const filteredTx = txFilter === 'all' ? transactions
    : transactions.filter((t) => {
      if (txFilter === 'roi') return t.type === 'roi'
      if (txFilter === 'level') return ['commission', 'direct_referral', 'level_income'].includes(t.type)
      if (txFilter === 'rewards') return t.type === 'award'
      if (txFilter === 'deposit') return t.type === 'deposit'
      if (txFilter === 'withdrawal') return ['withdrawal', 'withdrawal_pending', 'withdrawal_refund'].includes(t.type)
      if (txFilter === 'investment') return ['investment_return', 'transfer_from_roi', 'transfer_from_level', 'transfer_from_rewards'].includes(t.type)
      return true
    })

  const totalTxPages = Math.ceil(filteredTx.length / TX_PER_PAGE)
  const pagedTx = filteredTx.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="FXU Wallet" subtitle="Your complete financial hub" />

      {/* ✅ Deposit Congratulations Overlay */}
      {depositResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-emerald-500/40 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Green top band */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-center">
              {/* Animated checkmark */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl">Deposit Successful!</h2>
              <p className="text-emerald-100 text-sm mt-1">Your FXU Wallet has been credited</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Big amount */}
              <div className="text-center py-2">
                <p className="text-slate-400 text-xs mb-1">Amount Deposited</p>
                <p className="text-5xl font-bold text-emerald-400">
                  ${depositResult.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-slate-400 text-sm mt-1">USDT · BNB Smart Chain</p>
              </div>

              {/* Stats */}
              <div className="bg-[#1a2035] rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">FXU Wallet Balance</span>
                  <span className="text-white font-bold text-base">
                    ${depositResult.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Network</span>
                  <span className="text-yellow-400 font-medium">BEP-20 · BSC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">Confirmed</span>
                </div>
                <div className="flex justify-between items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">Tx Hash</span>
                  <a
                    href={`https://bscscan.com/tx/${depositResult.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs text-right break-all transition-colors"
                  >
                    {depositResult.txHash.slice(0, 14)}...{depositResult.txHash.slice(-8)}
                  </a>
                </div>
              </div>

              <p className="text-slate-500 text-xs text-center">
                Recorded in your transaction history. You can now invest or withdraw.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setDepositResult(null); setTab('transactions') }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  View History
                </button>
                <button
                  onClick={() => { setDepositResult(null); navigate('/investments') }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Invest Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">FXU Wallet Balance</p>
            <p className="text-5xl font-bold text-white">${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-slate-400 text-sm mt-2">Available for investment & withdrawal</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Locked</p>
              <p className="text-yellow-400 font-bold">${(wallet?.locked_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Total Profit</p>
              <p className="text-emerald-400 font-bold">${(wallet?.total_roi || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Commission</p>
              <p className="text-blue-400 font-bold">${(wallet?.total_commission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0a0e1a]/60 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs mb-1">Deposited</p>
              <p className="text-white font-bold">${(wallet?.total_deposited || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'deposit', label: 'Deposit USDT' },
          { key: 'withdraw', label: 'Withdraw' },
          { key: 'transactions', label: 'Transactions' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Recent Deposits</h3>
              {deposits.length === 0 ? <p className="text-slate-500 text-sm">No deposits yet.</p> : (
                <div className="space-y-2">
                  {deposits.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                      <div>
                        <p className="text-white text-sm">{d.token} — BSC</p>
                        <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noreferrer" className="text-blue-400 text-xs font-mono hover:text-blue-300">{d.tx_hash?.slice(0, 14)}...</a>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-semibold text-sm">+${d.amount.toLocaleString()}</p>
                        <Badge status="Completed" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Recent Withdrawals</h3>
              {withdrawals.length === 0 ? <p className="text-slate-500 text-sm">No withdrawals yet.</p> : (
                <div className="space-y-2">
                  {withdrawals.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                      <div>
                        <p className="text-white text-sm">{w.token} — BSC</p>
                        <p className="text-slate-500 text-xs">{formatIST(w.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-semibold text-sm">-${w.amount.toLocaleString()}</p>
                        <Badge status={w.status === 'completed' ? 'Completed' : 'Pending'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT TAB */}
      {tab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-semibold">Deposit USDT — BEP-20</h3>
            {depositError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{depositError}</div>}
            {depositSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{depositSuccess}</div>}

            {/* Connect wallet */}
            <div className={`rounded-xl border p-4 transition-all ${connected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-[#1a2035]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${connected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {connected ? '✓' : '1'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Connect Wallet</p>
                    {connected && <p className="text-slate-400 text-xs font-mono mt-0.5">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>}
                  </div>
                </div>
                {connected ? (
                  <div className="text-right">
                    <p className="text-emerald-400 text-xs font-semibold">Connected</p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <p className="text-slate-400 text-xs">{usdtBalance > 0 ? `${usdtBalance.toFixed(2)} USDT` : '— USDT'}</p>
                      <button
                        onClick={() => walletAddress && getUSDTBalance(walletAddress).then(setUsdtBalance)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Refresh USDT balance"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className={`rounded-xl border p-4 transition-all ${!connected ? 'border-slate-700/50 bg-[#1a2035]/50 opacity-50 pointer-events-none' : 'border-slate-700 bg-[#1a2035]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-white text-sm font-medium">Enter USDT Amount (min 1 USDT)</p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input type="number" value={usdtAmount} onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="1.00" min="1" step="1"
                    className="w-full bg-[#0f1629] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">USDT</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[10, 50, 100, 500, 1000].map((v) => (
                    <button key={v} onClick={() => setUsdtAmount(String(v))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">${v}</button>
                  ))}
                </div>
                {usdtAmount && (
                  <div className="bg-[#0f1629] rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-semibold">{usdtAmount} USDT = ${usdtAmount}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Network</span><span className="text-yellow-400">BNB Smart Chain (BEP-20)</span></div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Your USDT Balance</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">{usdtBalance > 0 ? `${usdtBalance.toFixed(2)} USDT` : <span className="text-slate-500 italic">tap refresh to load</span>}</span>
                        <button
                          onClick={() => walletAddress && getUSDTBalance(walletAddress).then(setUsdtBalance)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Refresh balance"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs pt-0.5">Note: You need a small amount of BNB (~$0.10) for gas fees. Your wallet may show "0 BNB" but your USDT balance is separate.</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleDeposit} disabled={depositing || !connected || !usdtAmount || parseFloat(usdtAmount) < 1}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all text-sm">
              {depositing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {depositStep === 'sending' && 'Sending USDT on blockchain...'}
                  {depositStep === 'confirming' && 'Confirming transaction...'}
                  {depositStep === 'crediting' && 'Crediting FXU Wallet...'}
                  {!depositStep && 'Processing...'}
                </span>
              ) : `Deposit ${usdtAmount ? `${usdtAmount} USDT` : 'USDT'}`}
            </button>

            {/* Gas fee warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 text-sm font-semibold mb-1">Need BNB for Gas Fees</p>
                  <p className="text-slate-400 text-xs leading-relaxed">You need a small amount of BNB (~$0.10-0.50) to pay blockchain transaction fees. If you see "Insufficient BNB" error, add some BNB to your wallet first.</p>
                </div>
              </div>
            </div>

            {/* Step progress indicator shown while depositing */}
            {depositing && (
              <div className="bg-[#1a2035] rounded-xl p-4 space-y-2.5">
                {[
                  { key: 'sending', label: 'Sending USDT on BSC blockchain', sub: 'Approve in your wallet app' },
                  { key: 'confirming', label: 'Confirming transaction', sub: 'Waiting for blockchain confirmation' },
                  { key: 'crediting', label: 'Crediting FXU Wallet', sub: 'Instant — no waiting required' },
                ].map((s, i) => {
                  const stepOrder = ['sending', 'confirming', 'crediting']
                  const currentIdx = stepOrder.indexOf(depositStep)
                  const thisIdx = stepOrder.indexOf(s.key)
                  const isDone = thisIdx < currentIdx
                  const isActive = s.key === depositStep
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                        isDone ? 'bg-emerald-500 text-white' :
                        isActive ? 'bg-blue-500 text-white' :
                        'bg-slate-700 text-slate-500'
                      }`}>
                        {isDone ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isActive ? (
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : i + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>{s.label}</p>
                        {isActive && <p className="text-slate-500 text-xs">{s.sub}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4 space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />Automatic — wallet credited instantly after blockchain confirmation.</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />Supports MetaMask, Trust Wallet, Coinbase, OKX and 300+ wallets.</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />USDT BEP-20 on BNB Smart Chain only. Min 1 USDT.</p>
            </div>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-semibold">How USDT Deposit Works</h3>
            <div className="space-y-4">
              {[
                { step: '01', title: 'Connect Your Wallet', desc: 'Click Connect to open the wallet selector. Choose MetaMask, Trust Wallet, or any WalletConnect wallet.' },
                { step: '02', title: 'Enter USDT Amount', desc: 'Enter how much USDT you want to deposit. Minimum is 1 USDT. Amount is credited 1:1 to your FXU Wallet.' },
                { step: '03', title: 'Confirm in Wallet', desc: 'Click Deposit. Your wallet opens — approve the USDT transfer. USDT is sent directly on-chain to the platform address.' },
                { step: '04', title: 'Instant Credit', desc: 'Once confirmed on BSC blockchain, your FXU Wallet is credited automatically. No waiting, no admin approval.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-0.5">{s.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {tab === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-semibold">Withdraw USDT</h3>
            {withdrawError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{withdrawError}</div>}
            {withdrawSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{withdrawSuccess}</div>}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-blue-300 text-sm">Available: <span className="font-bold text-white">${(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> · 5% fee · Min $10 · Processed in 24hrs</p>
            </div>

            {withdrawStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Amount (USD) — Min $10</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Min $10"
                      className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  {parseFloat(withdrawAmount) >= 10 && (
                    <div className="mt-2 bg-[#1a2035] rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-slate-400">Requested</span><span className="text-white">${parseFloat(withdrawAmount).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Fee (5%)</span><span className="text-red-400">-${withdrawFee.toFixed(2)}</span></div>
                      <div className="flex justify-between border-t border-slate-700 pt-1"><span className="text-slate-300 font-medium">You Receive</span><span className="text-emerald-400 font-bold">${withdrawNet.toFixed(2)} USDT</span></div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">USDT Wallet Address (BEP-20)</label>
                  <input type="text" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="0x..."
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Purpose</label>
                  <input type="text" value={withdrawPurpose} onChange={(e) => setWithdrawPurpose(e.target.value)} placeholder="e.g. Personal use, Business..."
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <button onClick={requestWithdrawOtp} disabled={!withdrawAmount || parseFloat(withdrawAmount) < 5 || !withdrawAddress || !withdrawPurpose}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  Send OTP to Email
                </button>
              </div>
            )}

            {withdrawStep === 2 && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-emerald-400 text-xs">OTP sent to your registered email. Valid for 10 minutes.</p>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">OTP Code</label>
                  <input value={withdrawOtp} onChange={(e) => setWithdrawOtp(e.target.value)} required maxLength={6} placeholder="000000"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="bg-[#1a2035] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white">${parseFloat(withdrawAmount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Fee (5%)</span><span className="text-red-400">-${withdrawFee.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-medium">You Receive</span><span className="text-emerald-400 font-bold">${withdrawNet.toFixed(2)} USDT</span></div>
                  <div className="flex justify-between pt-1"><span className="text-slate-400">To</span><span className="text-slate-300 font-mono text-xs">{withdrawAddress.slice(0, 12)}...{withdrawAddress.slice(-6)}</span></div>
                </div>
                <button type="submit" disabled={withdrawing || withdrawOtp.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {withdrawing ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
                <button type="button" onClick={() => setWithdrawStep(1)} className="w-full text-slate-400 hover:text-white text-sm transition-colors">Back</button>
              </form>
            )}
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Withdrawal History</h3>
            {withdrawals.length === 0 ? <p className="text-slate-500 text-sm">No withdrawals yet.</p> : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="bg-[#1a2035] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white text-sm font-medium">USDT — BSC</p>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">{w.wallet_address?.slice(0, 16)}...</p>
                        {w.purpose && <p className="text-slate-500 text-xs mt-0.5">Purpose: {w.purpose}</p>}
                      </div>
                      <Badge status={w.status === 'completed' ? 'Completed' : w.status === 'rejected' ? 'Rejected' : 'Pending'} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{formatIST(w.created_at)}</span>
                      <div className="text-right">
                        <p className="text-red-400 font-semibold">-${w.amount?.toFixed(2)}</p>
                        {w.withdrawal_fee > 0 && <p className="text-slate-500">Fee: ${w.withdrawal_fee?.toFixed(2)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'deposit', label: 'FXU Deposits' },
              { key: 'roi', label: 'Profit' },
              { key: 'level', label: 'Level Income' },
              { key: 'rewards', label: 'Rewards' },
              { key: 'investment', label: 'Investment Plans' },
              { key: 'withdrawal', label: 'Withdrawals' },
            ].map((f) => (
              <button key={f.key} onClick={() => { setTxFilter(f.key); setTxPage(1) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${txFilter === f.key ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <p className="text-slate-400 text-xs">{filteredTx.length} transactions</p>
              <div className="flex items-center gap-3">
                <p className="text-slate-500 text-xs">Page {txPage} of {totalTxPages || 1}</p>
                <button onClick={loadData} className="text-slate-400 hover:text-white transition-colors p-1" title="Refresh">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            </div>
            {pagedTx.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No transactions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Type', 'Amount', 'Balance After', 'Description', 'Date'].map((h) => (
                        <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTx.map((t) => {
                      const txInfo = TX_TYPES[t.type] || { label: t.type, bg: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' }
                      const credit = isCredit(t.type)
                      return (
                        <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${txInfo.bg}`}>{txInfo.label}</span>
                          </td>
                          <td className={`py-3 px-4 font-semibold whitespace-nowrap ${credit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {credit ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">${t.balance_after.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">{t.description || '-'}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{formatIST(t.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination */}
            {totalTxPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs rounded-xl transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalTxPages, 5) }, (_, i) => {
                    const page = totalTxPages <= 5 ? i + 1 : txPage <= 3 ? i + 1 : txPage >= totalTxPages - 2 ? totalTxPages - 4 + i : txPage - 2 + i
                    return (
                      <button key={page} onClick={() => setTxPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${txPage === page ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs rounded-xl transition-colors">
                  Next
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
