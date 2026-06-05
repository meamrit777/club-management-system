import mongoose from "mongoose";

/**
 * Tracks every significant admin action in the system.
 *
 * Separate from the Transaction ledger:
 *   Transaction = WHAT money moved
 *   AuditLog    = WHO did WHAT to WHICH record, and WHEN
 *
 * This collection is append-only — no records are ever edited or deleted.
 */

const AuditLogSchema = new mongoose.Schema({
  // ── What Happened
  action: {
    type: String,
    required: [true, "action is required"],
    trim: true,
    uppercase: true,
    // Examples:
    //   USER_LOGIN, USER_LOGOUT, PASSWORD_CHANGED, PASSWORD_RESET
    //   MEMBER_CREATED, MEMBER_UPDATED, MEMBER_DEACTIVATED, MEMBER_ROLE_CHANGED
    //   LOAN_APPLIED, LOAN_APPROVED, LOAN_REJECTED, LOAN_DISBURSED
    //   LOAN_REPAYMENT_RECORDED, LOAN_AUTO_CLOSED, LOAN_EARLY_CLOSED, LOAN_TOPUP
    //   CONTRIBUTION_MARKED_PAID, CONTRIBUTION_PENALTY_APPLIED, PENALTY_WAIVED
    //   CYCLE_OPENED, CYCLE_CLOSED
    //   CONTRIBUTION_ERA_CREATED
    //   MEMBER_ENTRY_FEE_RECORDED, EXPENSE_RECORDED, MANUAL_ADJUSTMENT
    //   SETTINGS_CHANGED
  },

  // ── Who Did It
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "performedBy is required"],
    index: true,
  },

  // ── What Was Affected
  targetType: {
    type: String,
    required: [true, "targetType is required"],
    enum: [
      "User",
      "Loan",
      "Installment",
      "Contribution",
      "ContributionCycle",
      "ContributionEra",
      "Transaction",
      "Settings",
      "System",
    ],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    // _id of the document that was created/modified
  },
  targetLabel: {
    type: String,
    trim: true,
    default: null,
    // Human-readable label stored at log-time so it stays readable even if the
    // underlying document changes later.
    // e.g., "Loan ₹50,000 — Rahul Singh (EMI 12 months)"
  },

  // ── Before / After Snapshots
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    // Plain object representing the relevant fields BEFORE the change
    // e.g., { status: "pending" }
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    // Plain object representing the relevant fields AFTER the change
    // e.g., { status: "active", disbursedDate: "2025-06-01" }
  },

  // ── Request Context (for security audit)
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
    // Browser/app user-agent string — helps identify if it was web or mobile
  },

  // ── When
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // ── Optional Note
  note: {
    type: String,
    trim: true,
    default: null,
    // Free-text context — required for certain high-impact actions like
    // PENALTY_WAIVED and MANUAL_ADJUSTMENT
  },
});

// ── Indexes
AuditLogSchema.index({ performedBy: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);
