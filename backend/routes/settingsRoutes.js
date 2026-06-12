import express from "express";
import { getAuditLog, getRecordAuditLog, getSettings } from "../controllers/settingsController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Club settings
router.get("/", protect, authorizeRoles("Admin", "SuperAdmin"), getSettings);

// Full audit log
router.get("/audit-log", protect, authorizeRoles("SuperAdmin"), getAuditLog);

// Audit history for a specific record
router.get(
  "/audit-log/:targetType/:targetId",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  getRecordAuditLog,
);

export default router;
