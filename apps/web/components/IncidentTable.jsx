"use client";

import { Fragment, useState } from "react";
import StatusBadge from "./StatusBadge";

function formatTimelineTime(value) {
  return new Date(value).toLocaleString();
}

function getAssigneeName(incident) {
  return incident.assignedTo?.name || "Unassigned";
}

function getTimelineActor(event) {
  return event.actor?.name || "System";
}

export default function IncidentTable({
  canMaintain,
  incidents,
  members,
  onAddTimelineEntry,
  onAssign,
  onResolve
}) {
  const [timelineForms, setTimelineForms] = useState({});

  async function submitTimelineNote(event, incident) {
    event.preventDefault();
    const message = timelineForms[incident.id]?.trim();

    if (!message) return;

    await onAddTimelineEntry(incident, message);
    setTimelineForms((currentForms) => ({ ...currentForms, [incident.id]: "" }));
  }

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
            <th>Assignee</th>
            <th>Opened</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <Fragment key={incident.id}>
              <tr>
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
                <td>
                  {canMaintain ? (
                    <select
                      className="compact-select"
                      value={incident.assignedTo?.id || ""}
                      onChange={(event) => onAssign(incident, event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    getAssigneeName(incident)
                  )}
                </td>
                <td>{new Date(incident.openedAt).toLocaleString()}</td>
                <td>
                  {canMaintain && incident.status !== "resolved" ? (
                    <button className="secondary-button" type="button" onClick={() => onResolve(incident)}>
                      Resolve
                    </button>
                  ) : null}
                </td>
              </tr>
              <tr className="incident-details-row">
                <td colSpan={6}>
                  <div className="timeline-list">
                    {(incident.timeline || []).length ? (
                      incident.timeline.map((event) => (
                        <article className="timeline-event" key={event.id}>
                          <span>
                            <strong>{event.message}</strong>
                            <small>
                              {getTimelineActor(event)} · {formatTimelineTime(event.createdAt)}
                            </small>
                          </span>
                          <StatusBadge value={event.type} />
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">No timeline entries.</p>
                    )}

                    {canMaintain ? (
                      <form className="timeline-form" onSubmit={(event) => submitTimelineNote(event, incident)}>
                        <input
                          value={timelineForms[incident.id] || ""}
                          onChange={(event) =>
                            setTimelineForms((currentForms) => ({
                              ...currentForms,
                              [incident.id]: event.target.value
                            }))
                          }
                          placeholder="Add timeline note"
                        />
                        <button className="secondary-button" type="submit">
                          Add note
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
