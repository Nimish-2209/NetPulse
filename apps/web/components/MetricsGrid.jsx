export default function MetricsGrid({ currentRole, summary }) {
  return (
    <section className="metrics-grid">
      <article>
        <span>Total services</span>
        <strong>{summary.total}</strong>
      </article>
      <article>
        <span>Down</span>
        <strong>{summary.down}</strong>
      </article>
      <article>
        <span>Degraded</span>
        <strong>{summary.degraded}</strong>
      </article>
      <article>
        <span>Open incidents</span>
        <strong>{summary.openIncidents}</strong>
      </article>
      <article>
        <span>Your role</span>
        <strong className="role-metric">{currentRole}</strong>
      </article>
    </section>
  );
}
