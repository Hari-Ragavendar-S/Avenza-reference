export default function PageHeader({ title, subtitle }) {
  return (
    <div className="admin-page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}
