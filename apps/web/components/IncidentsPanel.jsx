import IncidentTable from "./IncidentTable";
import StatusBadge from "./StatusBadge";

export default function IncidentsPanel({
  busy,
  canMaintain,
  incidentForm,
  incidents,
  members,
  onAddTimelineEntry,
  onAssignIncident,
  onCreateIncident,
  onResolveIncident,
  selectedService,
  selectedServiceId,
  setIncidentForm
}) {
  return (
    <section className="panel" id="incidents">
      <div className="section-heading">
        <h3>Incidents</h3>
        {selectedService ? <StatusBadge value={selectedService.currentStatus} /> : null}
      </div>

      {canMaintain ? (
        <form className="inline-form incident-form" onSubmit={onCreateIncident}>
          <input
            value={incidentForm.title}
            onChange={(event) => setIncidentForm({ ...incidentForm, title: event.target.value })}
            placeholder="Investigate latency spike"
            required
          />
          <select
            value={incidentForm.severity}
            onChange={(event) => setIncidentForm({ ...incidentForm, severity: event.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={incidentForm.assignedTo}
            onChange={(event) => setIncidentForm({ ...incidentForm, assignedTo: event.target.value })}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
          <button className="primary-button" disabled={busy || !selectedServiceId} type="submit">
            Create
          </button>
        </form>
      ) : (
        <p className="permission-note">Viewer access is read-only for incidents.</p>
      )}

      <div className="incident-list">
        <IncidentTable
          canMaintain={canMaintain}
          incidents={incidents}
          members={members}
          onAddTimelineEntry={onAddTimelineEntry}
          onAssign={onAssignIncident}
          onResolve={onResolveIncident}
        />
      </div>
    </section>
  );
}
