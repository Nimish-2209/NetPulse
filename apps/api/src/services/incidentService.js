import { Incident, Service } from "../models/index.js";

const ALLOWED_INCIDENT_UPDATES = ["title", "description", "severity", "status", "assignedTo"];

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function serializeIncident(incident) {
  return {
    id: incident._id,
    teamId: incident.teamId,
    serviceId: incident.serviceId,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    assignedTo: incident.assignedTo,
    openedAt: incident.openedAt,
    resolvedAt: incident.resolvedAt,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt
  };
}

function pickIncidentUpdates(body) {
  const updates = {};

  for (const key of ALLOWED_INCIDENT_UPDATES) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (updates.status === "resolved") {
    updates.resolvedAt = new Date();
  }

  if (updates.status && updates.status !== "resolved") {
    updates.resolvedAt = null;
  }

  return updates;
}

export async function listTeamIncidents(teamId) {
  const incidents = await Incident.find({ teamId }).sort({ openedAt: -1 });
  return incidents.map(serializeIncident);
}

export async function createTeamIncident({
  teamId,
  serviceId,
  title,
  description,
  severity = "medium",
  assignedTo
}) {
  if (!serviceId || !title) {
    throw createHttpError(400, "Service and title are required");
  }

  const service = await Service.findOne({ _id: serviceId, teamId });

  if (!service) {
    throw createHttpError(404, "Service not found");
  }

  const incident = await Incident.create({
    teamId,
    serviceId,
    title,
    description,
    severity,
    assignedTo
  });

  return serializeIncident(incident);
}

export async function updateTeamIncident({ teamId, incidentId, body }) {
  const incident = await Incident.findOneAndUpdate(
    { _id: incidentId, teamId },
    pickIncidentUpdates(body),
    { new: true, runValidators: true }
  );

  if (!incident) {
    throw createHttpError(404, "Incident not found");
  }

  return serializeIncident(incident);
}

export async function ensureOpenIncidentForServiceFailure({
  service,
  title,
  description,
  severity = "high"
}) {
  const incident = await Incident.findOneAndUpdate(
    { teamId: service.teamId, serviceId: service._id, status: { $ne: "resolved" } },
    {
      $setOnInsert: {
        teamId: service.teamId,
        serviceId: service._id,
        title,
        description,
        severity,
        status: "open",
        openedAt: new Date()
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  return serializeIncident(incident);
}
