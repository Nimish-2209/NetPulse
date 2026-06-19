import express from "express";
import {
  addTeamMember,
  createInvitation,
  createTeam,
  getTeamMetrics,
  getTeam,
  listInvitations,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeamMember
} from "../controllers/teamController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeamRole } from "../middleware/teamAccessMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listTeams));
router.post("/", asyncHandler(createTeam));
router.get("/:teamId", requireTeamRole("viewer"), asyncHandler(getTeam));
router.get("/:teamId/metrics", requireTeamRole("viewer"), asyncHandler(getTeamMetrics));
router.get("/:teamId/members", requireTeamRole("viewer"), asyncHandler(listTeamMembers));
router.post("/:teamId/members", requireTeamRole("admin"), asyncHandler(addTeamMember));
router.patch("/:teamId/members/:memberId", requireTeamRole("admin"), asyncHandler(updateTeamMember));
router.delete("/:teamId/members/:memberId", requireTeamRole("admin"), asyncHandler(removeTeamMember));
router.get("/:teamId/invitations", requireTeamRole("admin"), asyncHandler(listInvitations));
router.post("/:teamId/invitations", requireTeamRole("admin"), asyncHandler(createInvitation));

export default router;
