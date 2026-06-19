import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import checkRoutes from "./routes/checkRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import "./models/index.js";

export function isAllowedDevOrigin(origin) {
  if (!origin) return true;

  const configuredOrigin = process.env.WEB_ORIGIN;
  if (configuredOrigin && origin === configuredOrigin) return true;

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (process.env.NODE_ENV === "production" && process.env.WEB_ORIGIN) {
          return callback(null, origin === process.env.WEB_ORIGIN);
        }

        return callback(null, isAllowedDevOrigin(origin));
      }
    })
  );
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NetPulse API" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/teams", teamRoutes);
  app.use("/api/teams/:teamId/services", serviceRoutes);
  app.use("/api/teams/:teamId/services/:serviceId/checks", checkRoutes);
  app.use("/api/teams/:teamId/incidents", incidentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
