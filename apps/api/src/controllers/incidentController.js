import { Incident, Service } from "../models/index.js";
import { emitToTeam } from "../sockets/statusSocket.js";

function serializeIncident(incident) {
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

export async function listIncidents(req, res) {
  const incidents = await Incident.find({ teamId: req.params.teamId }).sort({ openedAt: -1 });
  res.json({ incidents: incidents.map(serializeIncident) });
}

export async function createIncident(req, res) {
  const { serviceId, title, description, severity = "medium", assignedTo } = req.body;

  if (!serviceId || !title) {
    return res.status(400).json({ message: "Service and title are required" });
  }

  const service = await Service.findOne({ _id: serviceId, teamId: req.params.teamId });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  const incident = await Incident.create({
    teamId: req.params.teamId,
    serviceId,
    title,
    description,
    severity,
    assignedTo
  });

  const serializedIncident = serializeIncident(incident);

  emitToTeam(req.params.teamId, "incident:created", { incident: serializedIncident });

  res.status(201).json({ incident: serializedIncident });
}

export async function updateIncident(req, res) {
  const updates = {};
  const allowedUpdates = ["title", "description", "severity", "status", "assignedTo"];

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.status === "resolved") {
    updates.resolvedAt = new Date();
  }

  if (updates.status && updates.status !== "resolved") {
    updates.resolvedAt = null;
  }

  const incident = await Incident.findOneAndUpdate(
    { _id: req.params.incidentId, teamId: req.params.teamId },
    updates,
    { new: true, runValidators: true }
  );

  if (!incident) {
    return res.status(404).json({ message: "Incident not found" });
  }

  const serializedIncident = serializeIncident(incident);

  emitToTeam(req.params.teamId, "incident:updated", { incident: serializedIncident });

  res.json({ incident: serializedIncident });
}
