import { TeamMember } from "../models/index.js";

const ROLE_RANK = {
  viewer: 1,
  maintainer: 2,
  admin: 3
};

export function requireTeamRole(minimumRole = "viewer") {
  return async function teamRoleMiddleware(req, res, next) {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({ message: "Team id is required" });
    }

    const membership = await TeamMember.findOne({
      teamId,
      userId: req.user._id
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have access to this team" });
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[minimumRole]) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }

    req.teamMember = membership;
    next();
  };
}
