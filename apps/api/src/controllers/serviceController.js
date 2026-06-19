import { Service } from "../models/index.js";
import { runServiceCheck } from "../services/monitoringService.js";
import { emitToTeam } from "../sockets/statusSocket.js";

function serializeService(service) {
  return {
    id: service._id,
    teamId: service.teamId,
    name: service.name,
    url: service.url,
    checkIntervalSeconds: service.checkIntervalSeconds,
    timeoutMs: service.timeoutMs,
    currentStatus: service.currentStatus,
    createdBy: service.createdBy,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}

function assertValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function listServices(req, res) {
  const services = await Service.find({ teamId: req.params.teamId }).sort({ createdAt: -1 });
  res.json({ services: services.map(serializeService) });
}

export async function createService(req, res) {
  const { name, url, checkIntervalSeconds = 60, timeoutMs = 5000 } = req.body;

  if (!name || !url) {
    return res.status(400).json({ message: "Service name and URL are required" });
  }

  if (!assertValidUrl(url)) {
    return res.status(400).json({ message: "Service URL must start with http:// or https://" });
  }

  const service = await Service.create({
    teamId: req.params.teamId,
    name,
    url,
    checkIntervalSeconds,
    timeoutMs,
    createdBy: req.user._id
  });

  emitToTeam(req.params.teamId, "service:created", { service: serializeService(service) });

  res.status(201).json({ service: serializeService(service) });
}

export async function getService(req, res) {
  const service = await Service.findOne({ _id: req.params.serviceId, teamId: req.params.teamId });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  emitToTeam(req.params.teamId, "service:updated", { service: serializeService(service) });

  res.json({ service: serializeService(service) });
}

export async function updateService(req, res) {
  const allowedUpdates = ["name", "url", "checkIntervalSeconds", "timeoutMs", "currentStatus"];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.url && !assertValidUrl(updates.url)) {
    return res.status(400).json({ message: "Service URL must start with http:// or https://" });
  }

  const service = await Service.findOneAndUpdate(
    { _id: req.params.serviceId, teamId: req.params.teamId },
    updates,
    { new: true, runValidators: true }
  );

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  res.json({ service: serializeService(service) });
}

export async function deleteService(req, res) {
  const service = await Service.findOneAndDelete({
    _id: req.params.serviceId,
    teamId: req.params.teamId
  });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  emitToTeam(req.params.teamId, "service:deleted", { serviceId: service._id });

  res.status(204).send();
}

export async function runCheck(req, res) {
  const service = await Service.findOne({ _id: req.params.serviceId, teamId: req.params.teamId });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  const result = await runServiceCheck(service);
  const updatedService = await Service.findById(service._id);
  const serializedService = serializeService(updatedService);

  emitToTeam(req.params.teamId, "service:updated", { service: serializedService });
  emitToTeam(req.params.teamId, "check:created", {
    service: serializedService,
    check: result.check
  });

  res.status(201).json({
    service: serializedService,
    check: result.check
  });
}
