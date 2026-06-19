import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Invitation, User, Team, TeamMember } from "../models/index.js";
import { slugify } from "../utils/slugify.js";

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email
  };
}

export async function register(req, res) {
  const { name, email, password, teamName, inviteToken } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  let invitation;

  if (inviteToken) {
    invitation = await Invitation.findOne({
      token: inviteToken.trim(),
      acceptedAt: null
    }).populate("teamId");

    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invitation is invalid or expired" });
    }

    if (invitation.email !== normalizedEmail) {
      return res.status(400).json({ message: "Invitation email does not match registration email" });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash
  });

  if (invitation) {
    await TeamMember.create({
      userId: user._id,
      teamId: invitation.teamId._id,
      role: invitation.role
    });

    invitation.acceptedAt = new Date();
    await invitation.save();

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: serializeUser(user),
      team: {
        id: invitation.teamId._id,
        name: invitation.teamId.name,
        slug: invitation.teamId.slug,
        role: invitation.role
      }
    });
  }

  const baseTeamName = teamName || `${name}'s Team`;
  const team = await Team.create({
    name: baseTeamName,
    slug: `${slugify(baseTeamName)}-${user._id.toString().slice(-6)}`,
    createdBy: user._id
  });

  await TeamMember.create({
    userId: user._id,
    teamId: team._id,
    role: "admin"
  });

  const token = createToken(user._id);

  return res.status(201).json({
    token,
    user: serializeUser(user),
    team: {
      id: team._id,
      name: team.name,
      slug: team.slug,
      role: "admin"
    }
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const memberships = await TeamMember.find({ userId: user._id }).populate("teamId");

  return res.json({
    token: createToken(user._id),
    user: serializeUser(user),
    teams: memberships.map((membership) => ({
      id: membership.teamId._id,
      name: membership.teamId.name,
      slug: membership.teamId.slug,
      role: membership.role
    }))
  });
}

export async function getMe(req, res) {
  const memberships = await TeamMember.find({ userId: req.user._id }).populate("teamId");

  return res.json({
    user: serializeUser(req.user),
    teams: memberships.map((membership) => ({
      id: membership.teamId._id,
      name: membership.teamId.name,
      slug: membership.teamId.slug,
      role: membership.role
    }))
  });
}
