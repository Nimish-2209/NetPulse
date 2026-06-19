import express from "express";
import {
  createService,
  deleteService,
  getService,
  listServices,
  runCheck,
  updateService
} from "../controllers/serviceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireTeamRole } from "../middleware/teamAccessMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireTeamRole("viewer"));

router.get("/", asyncHandler(listServices));
router.post("/", requireTeamRole("maintainer"), asyncHandler(createService));
router.get("/:serviceId", asyncHandler(getService));
router.patch("/:serviceId", requireTeamRole("maintainer"), asyncHandler(updateService));
router.delete("/:serviceId", requireTeamRole("admin"), asyncHandler(deleteService));
router.post("/:serviceId/checks/run", requireTeamRole("maintainer"), asyncHandler(runCheck));

export default router;
