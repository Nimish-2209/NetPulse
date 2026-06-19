import { isIP } from "node:net";

const DEFAULT_TIMEOUT_MS = 5000;

function normalizeTargetUrl(rawUrl) {
  const trimmedUrl = String(rawUrl || "").trim();

  if (!trimmedUrl) {
    const error = new Error("Website URL is required");
    error.statusCode = 400;
    throw error;
  }

  const candidateUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  const parsedUrl = new URL(candidateUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    const error = new Error("URL must start with http:// or https://");
    error.statusCode = 400;
    throw error;
  }

  if (parsedUrl.username || parsedUrl.password) {
    const error = new Error("URL credentials are not supported");
    error.statusCode = 400;
    throw error;
  }

  return parsedUrl;
}

function isBlockedHostname(hostname) {
  const normalizedHostname = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipVersion = isIP(normalizedHostname);
  const isPrivateIpv4 =
    ipVersion === 4 &&
    (normalizedHostname === "0.0.0.0" ||
      normalizedHostname.startsWith("127.") ||
      normalizedHostname.startsWith("10.") ||
      normalizedHostname.startsWith("169.254.") ||
      normalizedHostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHostname));
  const isPrivateIpv6 =
    ipVersion === 6 &&
    (normalizedHostname === "::1" ||
      normalizedHostname.startsWith("fc") ||
      normalizedHostname.startsWith("fd") ||
      normalizedHostname.startsWith("fe80:"));

  return (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname.endsWith(".local") ||
    isPrivateIpv4 ||
    isPrivateIpv6
  );
}

function createVerdict({ online, statusCode }) {
  if (online && statusCode >= 400) {
    return "Online, but it answered with attitude.";
  }

  if (online) {
    return "Online. It showed up to work.";
  }

  return "Offline. It did not answer the door.";
}

async function fetchTarget(url, signal) {
  const headResponse = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    signal
  });

  if (![403, 405].includes(headResponse.status)) {
    return headResponse;
  }

  return fetch(url, {
    method: "GET",
    redirect: "follow",
    signal
  });
}

export async function checkPublicUptime(req, res) {
  let targetUrl;

  try {
    targetUrl = normalizeTargetUrl(req.body.url);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }

  if (isBlockedHostname(targetUrl.hostname)) {
    return res.status(400).json({ message: "Public checks cannot target local or private hosts" });
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchTarget(targetUrl, controller.signal);
    const latencyMs = Date.now() - startedAt;
    const online = response.status < 500;

    res.json({
      checkedAt: new Date().toISOString(),
      finalUrl: response.url || targetUrl.toString(),
      latencyMs,
      online,
      status: online ? "online" : "offline",
      statusCode: response.status,
      targetUrl: targetUrl.toString(),
      verdict: createVerdict({ online, statusCode: response.status })
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const timedOut = error.name === "AbortError";

    res.json({
      checkedAt: new Date().toISOString(),
      errorMessage: timedOut ? "Request timed out" : error.message,
      latencyMs,
      online: false,
      status: "offline",
      targetUrl: targetUrl.toString(),
      verdict: createVerdict({ online: false })
    });
  } finally {
    clearTimeout(timeout);
  }
}
