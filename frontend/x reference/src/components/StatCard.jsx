export default function StatCard({ title, value, sub, trend, trendUp, icon, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    green: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
    red: 'from-red-600/20 to-red-600/5 border-red-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/20',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
  }
  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm">{title}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendUp ? '+' : ''}{trend}
            </span>
          )}
          {sub && <span className="text-slate-500 text-xs">{sub}</span>}
        </div>
      )}
    </div>
  )
}
