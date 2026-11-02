import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatISTDate } from '../../utils/dateFormatter'

export default function UserDeposit() {
  const [network, setNetwork] = useState('usdt_bsc')
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, deps] = await Promise.all([
          api.get('/admin/settings/public', false),
          api.get('/wallet/deposits'),
        ])
        const key = network === 'bnb' ? 'bnb_receiver_address' : 'usdt_receiver_address'
        setReceiverAddress(settings[key] || '')
        setDeposits(deps)
      } catch {}
    }
    load()
  }, [network])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/wallet/deposit', {
        amount: parseFloat(amount),
        tx_hash: txHash,
        network: 'BNB Smart Chain',
        token: network === 'bnb' ? 'BNB' : 'USDT',
      })
      setSuccess('Deposit submitted. Admin will confirm within 30 minutes.')
      setAmount('')
      setTxHash('')
      const deps = await api.get('/wallet/deposits')
      setDeposits(deps)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit" subtitle="Add funds to your FX Wallet" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Deposit via BNB Smart Chain</h3>

          <div>
            <label className="text-slate-400 text-xs mb-2 block">Select Token</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ key: 'usdt_bsc', label: 'USDT', sub: 'BEP-20' }, { key: 'bnb', label: 'BNB', sub: 'BEP-20' }].map((n) => (
                <button key={n.key} onClick={() => setNetwork(n.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${network === n.key ? 'border-blue-500/50 bg-blue-600/10' : 'border-slate-700 bg-[#1a2035] hover:border-slate-600'}`}>
                  <div className="w-9 h-9 bg-yellow-500/20 rounded-full flex items-center justify-center text-sm font-bold text-yellow-400">{n.label.charAt(0)}</div>
                  <span className={`text-sm font-semibold ${network === n.key ? 'text-blue-400' : 'text-slate-300'}`}>{n.label}</span>
                  <span className="text-slate-500 text-xs">{n.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[{ step: '01', title: 'Get Receiver Address', desc: 'Contact support or check the address shown in your deposit instructions.' },
              { step: '02', title: 'Send Payment', desc: `Send ${network === 'bnb' ? 'BNB' : 'USDT'} on BNB Smart Chain to the provided address.` },
              { step: '03', title: 'Submit Transaction', desc: 'Enter the amount and transaction hash below to confirm your deposit.' }
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <p className="text-white text-sm font-semibold mb-0.5">{s.title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl p-4">
            <p className="text-yellow-400 text-xs font-semibold mb-1">Important</p>
            <p className="text-slate-400 text-xs">Only send {network === 'bnb' ? 'BNB' : 'USDT'} on BNB Smart Chain. Wrong network = permanent loss.</p>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Submit Deposit</h3>

          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Amount (USD equivalent)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 500"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[100, 500, 1000, 5000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">${v.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Transaction Hash (TxID)</label>
              <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} required placeholder="0x..."
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500" />
              <p className="text-slate-500 text-xs mt-1.5">Find this in your wallet's transaction history.</p>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Token</label>
              <div className="bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm">
                {network === 'bnb' ? 'BNB — BNB Smart Chain' : 'USDT — BNB Smart Chain (BEP-20)'}
              </div>
            </div>
            <button type="submit" disabled={loading || !amount || !txHash}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
              {loading ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800"><h3 className="text-white font-semibold">Deposit History</h3></div>
        {deposits.length === 0 ? <div className="p-10 text-center text-slate-500">No deposits yet.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Token', 'Amount', 'Tx Hash', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-white">{d.token}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">+${d.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{d.tx_hash?.slice(0, 16)}...</td>
                    <td className="py-3 px-4"><Badge status={d.status === 'completed' ? 'Completed' : d.status === 'pending' ? 'Pending' : 'Rejected'} /></td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatISTDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
