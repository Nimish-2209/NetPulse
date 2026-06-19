import { Check, Service } from "../models/index.js";
import { ensureOpenIncidentForServiceFailure } from "./incidentService.js";

function getStatusFromResult(ok, latencyMs, latencyThresholdMs = 1000) {
  if (!ok) return "down";
  if (latencyMs > latencyThresholdMs) return "degraded";
  return "operational";
}

export async function runServiceCheck(service) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), service.timeoutMs);

  try {
    const response = await fetch(service.url, {
      method: "GET",
      signal: controller.signal
    });
    const latencyMs = Date.now() - startedAt;
    const ok = response.ok;
    const currentStatus = getStatusFromResult(ok, latencyMs);

    const check = await Check.create({
      teamId: service.teamId,
      serviceId: service._id,
      status: ok ? "success" : "failure",
      latencyMs,
      statusCode: response.status,
      checkedAt: new Date(),
      errorMessage: ok ? undefined : `HTTP ${response.status}`
    });

    await Service.findByIdAndUpdate(service._id, { currentStatus });

    if (!ok) {
      await ensureOpenIncidentForServiceFailure({
        service,
        title: `${service.name} is failing checks`,
        description: `Latest check returned HTTP ${response.status}.`
      });
    }

    return { check, currentStatus };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const errorMessage = error.name === "AbortError" ? "Request timed out" : error.message;

    const check = await Check.create({
      teamId: service.teamId,
      serviceId: service._id,
      status: "failure",
      latencyMs,
      checkedAt: new Date(),
      errorMessage
    });

    await Service.findByIdAndUpdate(service._id, { currentStatus: "down" });
    await ensureOpenIncidentForServiceFailure({
      service,
      title: `${service.name} is unreachable`,
      description: errorMessage
    });

    return { check, currentStatus: "down" };
  } finally {
    clearTimeout(timeout);
  }
}
