import express from "express";
import {
  createIncident,
  listIncidents,
  updateIncident
} from "../controllers/incidentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeamRole } from "../middleware/teamAccessMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireTeamRole("viewer"));

router.get("/", asyncHandler(listIncidents));
router.post("/", requireTeamRole("maintainer"), asyncHandler(createIncident));
router.patch("/:incidentId", requireTeamRole("maintainer"), asyncHandler(updateIncident));

export default router;
