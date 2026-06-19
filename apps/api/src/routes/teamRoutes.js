import express from "express";
import {
  addTeamMember,
  createTeam,
  getTeam,
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
router.get("/:teamId/members", requireTeamRole("admin"), asyncHandler(listTeamMembers));
router.post("/:teamId/members", requireTeamRole("admin"), asyncHandler(addTeamMember));
router.patch("/:teamId/members/:memberId", requireTeamRole("admin"), asyncHandler(updateTeamMember));
router.delete("/:teamId/members/:memberId", requireTeamRole("admin"), asyncHandler(removeTeamMember));

export default router;
