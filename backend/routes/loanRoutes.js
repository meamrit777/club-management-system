import express from "express";
import {
  applyForLoan,
  approveLoan,
  earlyCloseLoan,
  emiPreview,
  getLoan,
  getLoans,
  markOverdueInstallments,
  recordRepayment,
  rejectLoan,
  topUpLoan,
} from "../controllers/loanController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Preview EMI
router.get("/emi-preview", protect, emiPreview);

// Get all loans
router.get("/", protect, getLoans);

// Get single loan
router.get("/:id", protect, getLoan);

// Apply for loan
router.post("/apply", protect, applyForLoan);

// Approve loan
router.put("/:id/approve", protect, authorizeRoles("Admin", "SuperAdmin"), approveLoan);

// Reject loan
router.put("/:id/reject", protect, authorizeRoles("Admin", "SuperAdmin"), rejectLoan);

// Record EMI repayment
router.post("/:id/repay", protect, authorizeRoles("Admin", "SuperAdmin"), recordRepayment);

// Early close loan
router.put("/:id/early-close", protect, authorizeRoles("Admin", "SuperAdmin"), earlyCloseLoan);

// Top-up loan
router.post("/:id/topup", protect, authorizeRoles("Admin", "SuperAdmin"), topUpLoan);

// Mark overdue installments
router.post(
  "/mark-overdue",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  markOverdueInstallments,
);

export default router;
