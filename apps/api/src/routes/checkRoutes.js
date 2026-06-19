import express from "express";
import { listChecks } from "../controllers/checkController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeamRole } from "../middleware/teamAccessMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireTeamRole("viewer"));

router.get("/", asyncHandler(listChecks));

export default router;
