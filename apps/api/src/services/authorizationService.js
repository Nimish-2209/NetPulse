import { TeamMember } from "../models/index.js";

export const ROLE_RANK = {
  viewer: 1,
  maintainer: 2,
  admin: 3
};

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function hasRequiredRole(userRole, minimumRole = "viewer") {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}

export async function getTeamMembership({ teamId, userId }) {
  return TeamMember.findOne({ teamId, userId });
}

export async function assertTeamRole({ teamId, userId, minimumRole = "viewer" }) {
  if (!teamId) {
    throw createHttpError(400, "Team id is required");
  }

  const membership = await getTeamMembership({ teamId, userId });

  if (!membership) {
    throw createHttpError(403, "You do not have access to this team");
  }

  if (!hasRequiredRole(membership.role, minimumRole)) {
    throw createHttpError(403, "You do not have permission for this action");
  }

  return membership;
}
