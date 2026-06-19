import StatusBadge from "./StatusBadge";

export default function ServiceCard({ canRunCheck, service, selected, onRunCheck, onSelect }) {
  return (
    <article className={`service-card ${selected ? "selected" : ""}`}>
      <button className="card-main" type="button" onClick={() => onSelect(service)}>
        <span>
          <strong>{service.name}</strong>
          <small>{service.url}</small>
        </span>
        <StatusBadge value={service.currentStatus} />
      </button>
      <div className="card-meta">
        <span>{service.checkIntervalSeconds}s interval</span>
        <span>{service.timeoutMs}ms timeout</span>
      </div>
      {canRunCheck ? (
        <button className="secondary-button" type="button" onClick={() => onRunCheck(service)}>
          Run check
        </button>
      ) : null}
    </article>
  );
}
