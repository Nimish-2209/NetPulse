import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";

let mongoServer;
let app;

async function registerUser({
  email = "nimish@example.com",
  name = "Nimish",
  password = "password123",
  teamName = "Connectify Demo Team"
} = {}) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ email, name, password, teamName });

  assert.equal(response.status, 201);
  return response.body;
}

before(async () => {
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  mock.restoreAll();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("NetPulse API", () => {
  it("reports health", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.service, "NetPulse API");
  });

  it("registers a user, creates a team, and returns current session", async () => {
    const registration = await registerUser();

    assert.ok(registration.token);
    assert.equal(registration.user.email, "nimish@example.com");
    assert.equal(registration.team.name, "Connectify Demo Team");
    assert.equal(registration.team.role, "admin");

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registration.token}`);

    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "nimish@example.com");
    assert.equal(me.body.teams.length, 1);
    assert.equal(me.body.teams[0].role, "admin");
  });

  it("logs in with registered credentials", async () => {
    await registerUser();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nimish@example.com", password: "password123" });

    assert.equal(response.status, 200);
    assert.ok(response.body.token);
    assert.equal(response.body.user.email, "nimish@example.com");
    assert.equal(response.body.teams[0].role, "admin");
  });

  it("creates a service and records a successful check", async () => {
    const registration = await registerUser();
    const token = registration.token;
    const teamId = registration.team.id;

    const createdService = await request(app)
      .post(`/api/teams/${teamId}/services`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "NetPulse API",
        url: "https://example.com/health"
      });

    assert.equal(createdService.status, 201);
    assert.equal(createdService.body.service.currentStatus, "unknown");

    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      status: 200
    }));

    const check = await request(app)
      .post(`/api/teams/${teamId}/services/${createdService.body.service.id}/checks/run`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(check.status, 201);
    assert.equal(check.body.service.currentStatus, "operational");
    assert.equal(check.body.check.status, "success");
    assert.equal(check.body.check.statusCode, 200);

    const history = await request(app)
      .get(`/api/teams/${teamId}/services/${createdService.body.service.id}/checks`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(history.status, 200);
    assert.equal(history.body.checks.length, 1);
  });

  it("creates and resolves an incident", async () => {
    const registration = await registerUser();
    const token = registration.token;
    const teamId = registration.team.id;

    const service = await request(app)
      .post(`/api/teams/${teamId}/services`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Login API", url: "https://example.com/login-health" });

    const incident = await request(app)
      .post(`/api/teams/${teamId}/incidents`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceId: service.body.service.id,
        title: "Investigate login latency",
        severity: "high",
        description: "Synthetic login checks are slow."
      });

    assert.equal(incident.status, 201);
    assert.equal(incident.body.incident.status, "open");

    const resolved = await request(app)
      .patch(`/api/teams/${teamId}/incidents/${incident.body.incident.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolved" });

    assert.equal(resolved.status, 200);
    assert.equal(resolved.body.incident.status, "resolved");
    assert.ok(resolved.body.incident.resolvedAt);
  });

  it("allows admins to add members and viewers to read without writing", async () => {
    const admin = await registerUser({
      email: "admin@example.com",
      name: "Admin",
      teamName: "Ops Team"
    });
    const viewer = await registerUser({
      email: "viewer@example.com",
      name: "Viewer",
      teamName: "Viewer Personal Team"
    });

    const member = await request(app)
      .post(`/api/teams/${admin.team.id}/members`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ email: "viewer@example.com", role: "viewer" });

    assert.equal(member.status, 201);
    assert.equal(member.body.member.role, "viewer");

    const readServices = await request(app)
      .get(`/api/teams/${admin.team.id}/services`)
      .set("Authorization", `Bearer ${viewer.token}`);

    assert.equal(readServices.status, 200);

    const writeService = await request(app)
      .post(`/api/teams/${admin.team.id}/services`)
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ name: "Forbidden API", url: "https://example.com" });

    assert.equal(writeService.status, 403);
  });
});
