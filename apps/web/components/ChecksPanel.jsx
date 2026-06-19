import LatencyChart from "./LatencyChart";
import StatusBadge from "./StatusBadge";

export default function ChecksPanel({ chartChecks, checks, selectedService }) {
  return (
    <section className="panel" id="checks">
      <div className="section-heading">
        <h3>Recent Checks</h3>
        <span className="subtle">{selectedService?.name || "No service selected"}</span>
      </div>

      <LatencyChart checks={chartChecks} />

      <div className="check-list">
        {checks.length ? (
          checks.map((check) => (
            <article key={check._id} className="check-row">
              <StatusBadge value={check.status} />
              <span>{check.latencyMs ?? "-"}ms</span>
              <span>{check.statusCode || check.errorMessage || "No status code"}</span>
              <time>{new Date(check.checkedAt).toLocaleString()}</time>
            </article>
          ))
        ) : (
          <p className="empty-state">No checks.</p>
        )}
      </div>
    </section>
  );
}
