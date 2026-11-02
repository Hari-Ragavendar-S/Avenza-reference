import { useState } from 'react'
import { aiPlans } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'

const botStatus = {
  active: true,
  plan: 'Growth Bot',
  startDate: '2024-03-01',
  totalTrades: 142,
  winRate: 68.3,
  totalProfit: 2840.50,
  todayProfit: 124.30,
  pairs: ['EUR/USD', 'USD/JPY', 'GBP/USD'],
  riskLevel: 'Medium',
}

export default function UserAIBot() {
  const [isActive, setIsActive] = useState(botStatus.active)

  return (
    <div className="space-y-6">
      <PageHeader title="AI Trade Bot" subtitle="Automated trading powered by machine learning" />

      {/* Bot status */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
              <svg className={`w-7 h-7 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{botStatus.plan}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className={`text-sm ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isActive ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors ${isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'}`}
          >
            {isActive ? 'Stop Bot' : 'Start Bot'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-white">{botStatus.totalTrades}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{botStatus.winRate}%</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Profit</p>
          <p className="text-2xl font-bold text-emerald-400">+${botStatus.totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Today's Profit</p>
          <p className="text-2xl font-bold text-emerald-400">+${botStatus.todayProfit}</p>
        </div>
      </div>

      {/* Bot config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Bot Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Risk Level</label>
              <select className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500">
                <option>Low</option>
                <option selected>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Max Lot Size</label>
              <input type="number" defaultValue="1.0" step="0.1" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Daily Loss Limit ($)</label>
              <input type="number" defaultValue="200" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Trading Pairs</label>
              <div className="flex flex-wrap gap-2">
                {botStatus.pairs.map((p) => (
                  <span key={p} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1.5 rounded-lg">{p}</span>
                ))}
                <button className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">+ Add</button>
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
              Save Configuration
            </button>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Bot Activity</h3>
          <div className="space-y-3">
            {[
              { pair: 'EUR/USD', action: 'BUY 0.5 lots', result: '+$45.20', time: '14:32' },
              { pair: 'USD/JPY', action: 'SELL 1.0 lots', result: '+$78.40', time: '13:15' },
              { pair: 'GBP/USD', action: 'BUY 0.3 lots', result: '-$12.10', time: '11:48' },
              { pair: 'EUR/USD', action: 'SELL 0.8 lots', result: '+$92.30', time: '10:22' },
              { pair: 'USD/JPY', action: 'BUY 0.5 lots', result: '+$34.80', time: '09:05' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{a.pair}</p>
                    <p className="text-slate-500 text-xs">{a.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${a.result.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{a.result}</p>
                  <p className="text-slate-500 text-xs">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
