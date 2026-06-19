import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db.js";
import {
  Check,
  Incident,
  Service,
  Team,
  TeamMember,
  User
} from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env")
});

const demoUser = {
  name: "Nimish Demo",
  email: "demo@netpulse.local",
  password: "password123"
};

const demoTeam = {
  name: "Connectify Demo Team",
  slug: "connectify-demo-team"
};

const demoServices = [
  {
    name: "Speedify Website",
    url: "https://speedify.com",
    currentStatus: "operational",
    latencyBase: 82
  },
  {
    name: "Login API",
    url: "https://api.example.com/login/health",
    currentStatus: "degraded",
    latencyBase: 420
  },
  {
    name: "Billing API",
    url: "https://api.example.com/billing/health",
    currentStatus: "down",
    latencyBase: 1600
  }
];

function checkTime(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60 * 1000);
}

async function upsertChecks({ service, team, status, latencyBase }) {
  const existingCount = await Check.countDocuments({
    teamId: team._id,
    serviceId: service._id
  });

  if (existingCount > 0) return;

  const checks = Array.from({ length: 12 }, (_, index) => {
    const minutesAgo = (12 - index) * 5;
    const isFailure = status === "down" && index > 7;
    const isSlow = status === "degraded" && index > 5;
    const latencyMs = isFailure
      ? 5000
      : latencyBase + index * 14 + (index % 3) * 18;

    return {
      teamId: team._id,
      serviceId: service._id,
      status: isFailure ? "failure" : "success",
      latencyMs,
      statusCode: isFailure ? undefined : 200,
      checkedAt: checkTime(minutesAgo),
      errorMessage: isFailure ? "Request timed out" : undefined
    };
  });

  if (status === "degraded") {
    checks[checks.length - 1].latencyMs = Math.max(checks[checks.length - 1].latencyMs, 1250);
  }

  await Check.insertMany(checks);
}

async function seed() {
  await connectDB();

  const passwordHash = await bcrypt.hash(demoUser.password, 12);
  const user = await User.findOneAndUpdate(
    { email: demoUser.email },
    {
      name: demoUser.name,
      email: demoUser.email,
      passwordHash
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const team = await Team.findOneAndUpdate(
    { slug: demoTeam.slug },
    {
      name: demoTeam.name,
      slug: demoTeam.slug,
      createdBy: user._id
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await TeamMember.findOneAndUpdate(
    { teamId: team._id, userId: user._id },
    { teamId: team._id, userId: user._id, role: "admin" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const services = [];

  for (const demoService of demoServices) {
    const service = await Service.findOneAndUpdate(
      { teamId: team._id, name: demoService.name },
      {
        teamId: team._id,
        name: demoService.name,
        url: demoService.url,
        checkIntervalSeconds: 60,
        timeoutMs: 5000,
        currentStatus: demoService.currentStatus,
        createdBy: user._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    services.push({ service, demoService });
    await upsertChecks({
      service,
      team,
      status: demoService.currentStatus,
      latencyBase: demoService.latencyBase
    });
  }

  const loginService = services.find(({ demoService }) => demoService.name === "Login API").service;
  const billingService = services.find(({ demoService }) => demoService.name === "Billing API").service;

  await Incident.findOneAndUpdate(
    { teamId: team._id, serviceId: loginService._id, title: "Login API latency elevated" },
    {
      teamId: team._id,
      serviceId: loginService._id,
      title: "Login API latency elevated",
      description: "Synthetic checks show sustained latency above the team threshold.",
      severity: "medium",
      status: "acknowledged",
      assignedTo: user._id,
      openedAt: checkTime(48)
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Incident.findOneAndUpdate(
    { teamId: team._id, serviceId: billingService._id, title: "Billing API unreachable" },
    {
      teamId: team._id,
      serviceId: billingService._id,
      title: "Billing API unreachable",
      description: "Recent uptime checks timed out from the monitor worker.",
      severity: "high",
      status: "open",
      assignedTo: user._id,
      openedAt: checkTime(26)
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log("Seeded NetPulse demo data");
  console.log(`Email: ${demoUser.email}`);
  console.log(`Password: ${demoUser.password}`);
  console.log(`Team: ${demoTeam.name}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
