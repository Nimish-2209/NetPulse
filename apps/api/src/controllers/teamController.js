import { Team, TeamMember, User } from "../models/index.js";
import { slugify } from "../utils/slugify.js";

function serializeTeam(team, role) {
  return {
    id: team._id,
    name: team.name,
    slug: team.slug,
    role
  };
}

function serializeMember(member) {
  return {
    id: member._id,
    role: member.role,
    user: {
      id: member.userId._id,
      name: member.userId.name,
      email: member.userId.email
    },
    joinedAt: member.createdAt
  };
}

async function assertNotLastAdmin(member) {
  if (member.role !== "admin") return;

  const adminCount = await TeamMember.countDocuments({
    teamId: member.teamId,
    role: "admin"
  });

  if (adminCount <= 1) {
    const error = new Error("A team must keep at least one admin");
    error.statusCode = 400;
    throw error;
  }
}

export async function listTeams(req, res) {
  const memberships = await TeamMember.find({ userId: req.user._id }).populate("teamId");

  res.json({
    teams: memberships.map((membership) => serializeTeam(membership.teamId, membership.role))
  });
}

export async function createTeam(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Team name is required" });
  }

  const team = await Team.create({
    name,
    slug: `${slugify(name)}-${req.user._id.toString().slice(-6)}`,
    createdBy: req.user._id
  });

  await TeamMember.create({
    userId: req.user._id,
    teamId: team._id,
    role: "admin"
  });

  res.status(201).json({ team: serializeTeam(team, "admin") });
}

export async function getTeam(req, res) {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  res.json({ team: serializeTeam(team, req.teamMember.role) });
}

export async function listTeamMembers(req, res) {
  const members = await TeamMember.find({ teamId: req.params.teamId })
    .populate("userId", "name email")
    .sort({ role: 1, createdAt: 1 });

  res.json({ members: members.map(serializeMember) });
}

export async function addTeamMember(req, res) {
  const { email, role = "viewer" } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!["admin", "maintainer", "viewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found. Ask them to register first." });
  }

  const existingMember = await TeamMember.findOne({
    userId: user._id,
    teamId: req.params.teamId
  });

  if (existingMember) {
    return res.status(409).json({ message: "User is already on this team" });
  }

  const member = await TeamMember.create({
    userId: user._id,
    teamId: req.params.teamId,
    role
  });

  await member.populate("userId", "name email");

  res.status(201).json({ member: serializeMember(member) });
}

export async function updateTeamMember(req, res) {
  const { role } = req.body;

  if (!["admin", "maintainer", "viewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const member = await TeamMember.findOne({
    _id: req.params.memberId,
    teamId: req.params.teamId
  });

  if (!member) {
    return res.status(404).json({ message: "Team member not found" });
  }

  if (member.role === "admin" && role !== "admin") {
    await assertNotLastAdmin(member);
  }

  member.role = role;
  await member.save();
  await member.populate("userId", "name email");

  res.json({ member: serializeMember(member) });
}

export async function removeTeamMember(req, res) {
  const member = await TeamMember.findOne({
    _id: req.params.memberId,
    teamId: req.params.teamId
  });

  if (!member) {
    return res.status(404).json({ message: "Team member not found" });
  }

  await assertNotLastAdmin(member);
  await member.deleteOne();

  res.status(204).send();
}
