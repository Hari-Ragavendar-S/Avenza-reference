import { useState } from 'react'
import { marketPairs } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'

export default function AdminMarkets() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Markets & Trading Pairs"
        subtitle="Manage available trading pairs and market settings"
        action={
          <button onClick={() => setShowAdd(true)} className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            Add Pair
          </button>
        }
      />

      {showAdd && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Add Trading Pair</h3>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Base Currency</label>
              <input type="text" placeholder="EUR" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Quote Currency</label>
              <input type="text" placeholder="USD" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Spread (pips)</label>
              <input type="number" placeholder="0.8" step="0.1" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
          </div>
          <button className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            Add Pair
          </button>
        </div>
      )}

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Pair', 'Price', 'Bid', 'Ask', 'Spread', '24H Change', 'Volume', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketPairs.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 text-white font-semibold">{p.pair}</td>
                  <td className="py-3 px-4 text-white font-mono">{p.price}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{p.bid}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{p.ask}</td>
                  <td className="py-3 px-4 text-slate-300">{p.spread}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${p.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.changePct >= 0 ? '+' : ''}{p.changePct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{p.volume}</td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full">Active</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition-colors">Edit</button>
                      <button className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors">Disable</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
