import { useEffect, useState } from 'react'
import { chartData } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../../api/client'

export default function UserMarket() {
  const [tab, setTab] = useState('crypto')
  const [crypto, setCrypto] = useState([])
  const [forex, setForex] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, f] = await Promise.all([api.get('/market/crypto', false), api.get('/market/forex', false)])
        setCrypto(c || [])
        setForex(f || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Market" subtitle="Live prices — updated every 30 seconds" />

      <div className="flex gap-2">
        {['crypto', 'forex'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {t === 'crypto' ? 'Cryptocurrencies' : 'Forex Pairs'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-slate-500 text-xs">Live</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {tab === 'crypto' && (
            <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Symbol', 'Price (USD)', '24H Change', '24H High', '24H Low', 'Volume'].map((h) => (
                        <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crypto.map((c, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                              {c.symbol?.replace('USDT', '').charAt(0)}
                            </div>
                            <span className="text-white font-semibold">{c.symbol?.replace('USDT', '')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-mono font-semibold">${parseFloat(c.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${parseFloat(c.change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {parseFloat(c.change) >= 0 ? '+' : ''}{parseFloat(c.change).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-mono">${parseFloat(c.high).toLocaleString()}</td>
                        <td className="py-3 px-4 text-red-400 font-mono">${parseFloat(c.low).toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-400">${(parseFloat(c.volume) / 1e6).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'forex' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Forex Rates</h3>
                  <span className="text-slate-500 text-xs">Base: USD</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {forex.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                      <div>
                        <p className="text-white font-semibold text-sm">{f.pair}</p>
                        <p className="text-slate-500 text-xs">{f.base} → {f.quote}</p>
                      </div>
                      <p className="text-white font-mono font-semibold">{f.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-5">EUR/USD Chart (30 days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(4)} width={65} />
                    <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
