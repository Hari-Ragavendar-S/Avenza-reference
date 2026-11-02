import { useState } from 'react'
import { openOrders, tradeHistory } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'

export default function UserOrders() {
  const [tab, setTab] = useState('open')

  const canceledOrders = tradeHistory.filter((_, i) => i > 4).map((t) => ({ ...t, status: 'Canceled' }))

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Manage your open, completed and canceled orders" />

      <div className="flex gap-2 flex-wrap">
        {['open', 'completed', 'canceled'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            {t} Orders
            <span className="ml-2 text-xs opacity-70">
              {t === 'open' ? openOrders.length : t === 'completed' ? tradeHistory.length : canceledOrders.length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'open' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Pair', 'Type', 'Lots', 'Open Price', 'Current', 'SL', 'TP', 'Profit', 'Margin', 'Action'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{o.pair}</td>
                    <td className="py-3 px-4"><Badge status={o.type} /></td>
                    <td className="py-3 px-4 text-slate-300">{o.lots}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{o.openPrice}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{o.currentPrice}</td>
                    <td className="py-3 px-4 text-red-400 font-mono">{o.sl}</td>
                    <td className="py-3 px-4 text-emerald-400 font-mono">{o.tp}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${o.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {o.profit >= 0 ? '+' : ''}${o.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">${o.margin.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <button className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors">
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'completed' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Pair', 'Type', 'Lots', 'Open Price', 'Close Price', 'Profit', 'Duration', 'Date'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((t) => (
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
                    <td className="py-3 px-4 text-slate-400 text-xs">{t.closeTime?.split(' ')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'canceled' && (
            <div className="p-10 text-center text-slate-500">No canceled orders found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
