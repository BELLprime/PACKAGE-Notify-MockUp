export default function StatCard({ icon, tone, label, value, unit, subtext }) {
  return (
    <article className="stat-card-item">
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <p>{label}</p>
      <strong>{value} <em>{unit}</em></strong>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </article>
  )
}
