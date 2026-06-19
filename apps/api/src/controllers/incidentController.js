import {
  createTeamIncident,
  listTeamIncidents,
  updateTeamIncident
} from "../services/incidentService.js";
import { emitToTeam } from "../sockets/statusSocket.js";

export async function listIncidents(req, res) {
  const incidents = await listTeamIncidents(req.params.teamId);
  res.json({ incidents });
}

export async function createIncident(req, res) {
  const incident = await createTeamIncident({
    teamId: req.params.teamId,
    ...req.body
  });

  emitToTeam(req.params.teamId, "incident:created", { incident });

  res.status(201).json({ incident });
}

export async function updateIncident(req, res) {
  const incident = await updateTeamIncident({
    teamId: req.params.teamId,
    incidentId: req.params.incidentId,
    body: req.body
  });

  emitToTeam(req.params.teamId, "incident:updated", { incident });

  res.json({ incident });
}
