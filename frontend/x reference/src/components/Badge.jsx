export default function Badge({ status }) {
  const map = {
    // Status badges
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    Pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'In Progress': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Suspended: 'bg-red-500/15 text-red-400 border-red-500/30',
    Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    Inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    Verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Not Submitted': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    BUY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    SELL: 'bg-red-500/15 text-red-400 border-red-500/30',
    High: 'bg-red-500/15 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    // Transaction type badges
    'FXU Deposit': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'ROI': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Profit': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Reward': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'Level Income': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Withdrawal': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Transfer': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Investment': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    'Direct Referral': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Admin Credit': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Admin Debit': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Refund': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  }
  const cls = map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cls}`}>
      {status}
    </span>
  )
}
