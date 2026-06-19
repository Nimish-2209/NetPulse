import StatusBadge from "./StatusBadge";

export default function IncidentTable({ canResolve, incidents, onResolve }) {
  if (!incidents.length) {
    return <p className="empty-state">No incidents.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incident</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Opened</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <strong>{incident.title}</strong>
                {incident.description ? <small>{incident.description}</small> : null}
              </td>
              <td>
                <StatusBadge value={incident.severity} />
              </td>
              <td>
                <StatusBadge value={incident.status} />
              </td>
              <td>{new Date(incident.openedAt).toLocaleString()}</td>
              <td>
                {canResolve && incident.status !== "resolved" ? (
                  <button className="secondary-button" type="button" onClick={() => onResolve(incident)}>
                    Resolve
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
