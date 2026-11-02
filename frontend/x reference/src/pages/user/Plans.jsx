import { useState } from 'react'
import { aiPlans } from '../../data/mockData'
import PageHeader from '../../components/PageHeader'

export default function UserPlans() {
  const [subscribed, setSubscribed] = useState(2)

  return (
    <div className="space-y-6">
      <PageHeader title="AI Plans" subtitle="Subscribe to automated trading plans" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {aiPlans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-[#0f1629] border rounded-2xl p-5 flex flex-col transition-all ${subscribed === plan.id ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
          >
            {subscribed === plan.id && (
              <div className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full self-start mb-3 border border-blue-500/30">
                Active Plan
              </div>
            )}
            <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
            <p className="text-slate-400 text-xs mb-4 flex-1">{plan.description}</p>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Monthly Fee</span>
                <span className="text-white font-semibold">${plan.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Min Deposit</span>
                <span className="text-white">${plan.minDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Max Profit</span>
                <span className="text-emerald-400 font-semibold">Up to {plan.maxProfit}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subscribers</span>
                <span className="text-white">{plan.subscribers.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-slate-500 text-xs mb-2">Trading Pairs</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(plan.pairs) ? plan.pairs : [plan.pairs]).map((p) => (
                  <span key={p} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">{p}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSubscribed(plan.id)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${subscribed === plan.id ? 'bg-slate-700 text-slate-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {subscribed === plan.id ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {/* Subscription info */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Subscription Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Plan', 'Start Date', 'End Date', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="text-left text-slate-400 font-medium py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50">
                <td className="py-3 px-4 text-white">Growth Bot</td>
                <td className="py-3 px-4 text-slate-300">2024-03-01</td>
                <td className="py-3 px-4 text-slate-300">2024-04-01</td>
                <td className="py-3 px-4 text-slate-300">$149.00</td>
                <td className="py-3 px-4"><span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-3 px-4 text-white">Starter Bot</td>
                <td className="py-3 px-4 text-slate-300">2024-02-01</td>
                <td className="py-3 px-4 text-slate-300">2024-03-01</td>
                <td className="py-3 px-4 text-slate-300">$49.00</td>
                <td className="py-3 px-4"><span className="bg-slate-500/15 text-slate-400 border border-slate-500/30 text-xs px-2.5 py-0.5 rounded-full">Expired</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
