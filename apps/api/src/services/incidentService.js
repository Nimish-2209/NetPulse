import { Incident, Service, TeamMember } from "../models/index.js";

const ALLOWED_INCIDENT_UPDATES = ["title", "description", "severity", "status", "assignedTo"];

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function serializeUser(user) {
  if (!user) return null;

  if (user._id) {
    return {
      id: user._id,
      name: user.name,
      email: user.email
    };
  }

  return {
    id: user
  };
}

function serializeTimelineEvent(event) {
  return {
    id: event._id,
    type: event.type,
    message: event.message,
    actor: serializeUser(event.actorId),
    createdAt: event.createdAt
  };
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
    assignedTo: serializeUser(incident.assignedTo),
    openedAt: incident.openedAt,
    resolvedAt: incident.resolvedAt,
    timeline: (incident.timeline || []).map(serializeTimelineEvent),
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

  if (updates.assignedTo === "") {
    updates.assignedTo = null;
  }

  return updates;
}

async function populateIncident(incident) {
  await incident.populate([
    { path: "assignedTo", select: "name email" },
    { path: "timeline.actorId", select: "name email" }
  ]);

  return incident;
}

function createTimelineEvent({ type, message, actorId }) {
  return {
    type,
    message,
    actorId,
    createdAt: new Date()
  };
}

async function assertAssignableUser({ teamId, assignedTo }) {
  if (!assignedTo) return null;

  const member = await TeamMember.findOne({ teamId, userId: assignedTo }).populate("userId", "name email");

  if (!member) {
    throw createHttpError(400, "Assigned user must be a member of this team");
  }

  return member;
}

export async function listTeamIncidents(teamId) {
  const incidents = await Incident.find({ teamId })
    .populate("assignedTo", "name email")
    .populate("timeline.actorId", "name email")
    .sort({ openedAt: -1 });

  return incidents.map(serializeIncident);
}

export async function createTeamIncident({
  teamId,
  serviceId,
  title,
  description,
  severity = "medium",
  assignedTo,
  actorId
}) {
  if (!serviceId || !title) {
    throw createHttpError(400, "Service and title are required");
  }

  const service = await Service.findOne({ _id: serviceId, teamId });

  if (!service) {
    throw createHttpError(404, "Service not found");
  }

  const assigneeMember = await assertAssignableUser({ teamId, assignedTo });
  const timeline = [
    createTimelineEvent({
      type: "created",
      message: "Incident created",
      actorId
    })
  ];

  if (assigneeMember) {
    timeline.push(
      createTimelineEvent({
        type: "assigned",
        message: `Assigned to ${assigneeMember.userId.name}`,
        actorId
      })
    );
  }

  const incident = await Incident.create({
    teamId,
    serviceId,
    title,
    description,
    severity,
    assignedTo: assignedTo || undefined,
    timeline
  });

  await populateIncident(incident);
  return serializeIncident(incident);
}

export async function updateTeamIncident({ teamId, incidentId, body, actorId }) {
  const incident = await Incident.findOne({ _id: incidentId, teamId });

  if (!incident) {
    throw createHttpError(404, "Incident not found");
  }

  const updates = pickIncidentUpdates(body);
  const timelineEvents = [];

  if (updates.assignedTo !== undefined) {
    const nextAssignee = updates.assignedTo || null;
    const currentAssignee = incident.assignedTo?.toString() || null;

    if (String(nextAssignee || "") !== String(currentAssignee || "")) {
      const assigneeMember = await assertAssignableUser({ teamId, assignedTo: nextAssignee });

      timelineEvents.push(
        createTimelineEvent({
          type: assigneeMember ? "assigned" : "unassigned",
          message: assigneeMember ? `Assigned to ${assigneeMember.userId.name}` : "Incident unassigned",
          actorId
        })
      );
    }
  }

  if (updates.status && updates.status !== incident.status) {
    const statusEventType = updates.status === "resolved" || updates.status === "acknowledged"
      ? updates.status
      : "updated";

    timelineEvents.push(
      createTimelineEvent({
        type: statusEventType,
        message: `Status changed to ${updates.status}`,
        actorId
      })
    );
  }

  if (
    updates.title !== undefined ||
    updates.description !== undefined ||
    updates.severity !== undefined
  ) {
    timelineEvents.push(
      createTimelineEvent({
        type: "updated",
        message: "Incident details updated",
        actorId
      })
    );
  }

  for (const [key, value] of Object.entries(updates)) {
    incident[key] = value;
  }

  incident.timeline.push(...timelineEvents);
  await incident.save();
  await populateIncident(incident);

  return serializeIncident(incident);
}

export async function addTeamIncidentTimelineEntry({ teamId, incidentId, message, actorId }) {
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    throw createHttpError(400, "Timeline message is required");
  }

  const incident = await Incident.findOne({ _id: incidentId, teamId });

  if (!incident) {
    throw createHttpError(404, "Incident not found");
  }

  incident.timeline.push(
    createTimelineEvent({
      type: "comment",
      message: trimmedMessage,
      actorId
    })
  );

  await incident.save();
  await populateIncident(incident);

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
        openedAt: new Date(),
        timeline: [
          createTimelineEvent({
            type: "created",
            message: "Incident opened by failed uptime check"
          })
        ]
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  return serializeIncident(incident);
}
