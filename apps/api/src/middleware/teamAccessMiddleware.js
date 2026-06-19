import { assertTeamRole } from "../services/authorizationService.js";

export function requireTeamRole(minimumRole = "viewer") {
  return async function teamRoleMiddleware(req, res, next) {
    try {
      req.teamMember = await assertTeamRole({
        teamId: req.params.teamId,
        userId: req.user._id,
        minimumRole
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
