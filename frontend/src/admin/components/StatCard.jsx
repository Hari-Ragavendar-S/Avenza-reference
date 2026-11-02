export default function StatCard({ title, value, sub, icon, color = 'blue' }) {
  return (
    <div className={`admin-stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <p className="stat-card-title">{title}</p>
        {icon && (
          <div className={`stat-card-icon icon-${color}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="stat-card-value">{value}</p>
      {sub && <p className="stat-card-sub">{sub}</p>}
    </div>
  );
}
