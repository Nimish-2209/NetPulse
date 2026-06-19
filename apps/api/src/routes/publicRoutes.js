import express from "express";
import { checkPublicUptime } from "../controllers/publicController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/uptime-check", asyncHandler(checkPublicUptime));

export default router;
