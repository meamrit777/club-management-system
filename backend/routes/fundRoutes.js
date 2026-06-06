import express from "express";
import {
  entryFeePreview,
  getDashboardSummary,
  getLedger,
  getPoolSummary,
  recordExpense,
  recordManualAdjustment,
  recordMemberEntryFee,
} from "../controllers/fundController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Pool summary
router.get("/pool", protect, getPoolSummary);

// Dashboard summary
router.get("/dashboard", protect, authorizeRoles("Admin", "SuperAdmin"), getDashboardSummary);

// Full ledger
router.get("/ledger", protect, authorizeRoles("Admin", "SuperAdmin"), getLedger);

// Entry fee preview
router.get("/entry-fee-preview", protect, authorizeRoles("Admin", "SuperAdmin"), entryFeePreview);

// Record member entry fee
router.post("/member-entry", protect, authorizeRoles("Admin", "SuperAdmin"), recordMemberEntryFee);

// Record expense
router.post("/expense", protect, authorizeRoles("Admin", "SuperAdmin"), recordExpense);

// Manual adjustment
router.post("/manual-adjustment", protect, authorizeRoles("SuperAdmin"), recordManualAdjustment);

export default router;
