import mongoose from "mongoose";

/**
 * Installment
 * The full EMI schedule is generated at loan creation time and saved row by row.
 * Each document = one monthly installment for one loan.
 *
 * Why save the full schedule upfront?
 *  — Members can see their entire repayment plan immediately.
 *  — Overdue detection is a simple date query (dueDate < today AND status = pending).
 *  — No recalculation needed on each repayment.
 *
 * Status flow:
 *   pending → paid         (full EMI received)
 *   pending → partial      (less than full EMI received)
 *   pending → overdue      (dueDate passed, not yet paid — set by cron/manual trigger)
 *   overdue → paid         (member pays after due date)
 *   overdue → partial      (partial payment after due date)
 */

const InstallmentSchema = new mongoose.Schema(
  {
    // ── Parent References
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Denormalized from Loan for faster per-member queries
    },

    // ── Schedule Position
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
      // 1, 2, 3 … tenureMonths
    },
    dueDate: {
      type: Date,
      required: true,
      // disbursedDate + installmentNumber months (same calendar day)
    },

    // ── Amounts Scheduled at Loan Creation (immutable after save) ───────────
    openingBalance: {
      type: Number,
      required: true,
      // Outstanding principal at the START of this installment period
    },
    emiAmount: {
      type: Number,
      required: true,
      // Total EMI = principalPortion + interestPortion
      // (Last EMI may differ slightly due to rounding cleanup)
    },
    principalPortion: {
      type: Number,
      required: true,
      // Portion of EMI that reduces the principal
    },
    interestPortion: {
      type: Number,
      required: true,
      // Portion of EMI that is interest = openingBalance × monthlyRate
    },
    remainingBalanceAfter: {
      type: Number,
      required: true,
      // openingBalance − principalPortion (0 on the last installment)
    },

    // ── Actual Payment (filled in when admin records payment)
    status: {
      type: String,
      enum: ["pending", "paid", "partial", "overdue"],
      default: "pending",
      index: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0,
      // Actual rupees received — may be less than emiAmount in partial case
    },
    shortfallAmount: {
      type: Number,
      default: 0,
      // emiAmount − paidAmount (0 when fully paid)
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "cheque", "online", null],
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Admin who recorded the payment
    },

    // ── Linked Ledger Entry
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      // The immutable Transaction record created when this payment was confirmed
    },

    // ── Data Migration Flag
    isHistorical: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── Unique: one installment per position per loan
InstallmentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });

// ── For per-member dashboard queries
InstallmentSchema.index({ memberId: 1, status: 1 });

// ── For overdue detection job
InstallmentSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model("Installment", InstallmentSchema);
