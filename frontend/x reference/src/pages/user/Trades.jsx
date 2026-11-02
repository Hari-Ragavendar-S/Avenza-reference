import { useState } from 'react'
import { tradeHistory } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'

export default function UserTrades() {
  const [filter, setFilter] = useState('all')

  const totalProfit = tradeHistory.reduce((s, t) => s + t.profit, 0)
  const wins = tradeHistory.filter((t) => t.profit > 0).length
  const winRate = ((wins / tradeHistory.length) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <PageHeader title="Trade History" subtitle="All your closed trades and performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-white">{tradeHistory.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{winRate}%</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Profit</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Winning Trades</p>
          <p className="text-2xl font-bold text-white">{wins}/{tradeHistory.length}</p>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-white font-semibold">Closed Trades</h3>
          <div className="flex gap-2">
            {['all', 'buy', 'sell'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Pair', 'Type', 'Lots', 'Open Price', 'Close Price', 'Profit/Loss', 'Duration', 'Close Time'].map((h) => (
                  <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tradeHistory
                .filter((t) => filter === 'all' || t.type.toLowerCase() === filter)
                .map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{t.pair}</td>
                    <td className="py-3 px-4"><Badge status={t.type} /></td>
                    <td className="py-3 px-4 text-slate-300">{t.lots}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{t.openPrice}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{t.closePrice}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${t.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.profit >= 0 ? '+' : ''}${t.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.duration}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{t.closeTime}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
