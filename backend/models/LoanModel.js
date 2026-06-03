import mongoose from "mongoose";

/**
 * Loan
 * One record per loan — covers fresh loans, top-ups, and closed loans.
 * The full amortization schedule lives in the Installment collection.
 *
 * Status flow:
 *   pending → active → closed          (normal completion)
 *   pending → active → early_closed    (member pays remaining principal early)
 *   pending → active → topup_closed    (old loan closed when member takes top-up)
 *   pending → rejected                 (admin rejects application)
 */

const LoanSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Member is required"],
      index: true,
    },
    principal: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [1, "Principal must be positive"],
    },

    interestRate: {
      type: Number,
      required: true,
      default: 15,
      // 15% APR reducing balance — stored so historical loans remain accurate
    },
    tenureMonths: {
      type: Number,
      required: true,
      enum: {
        values: [6, 12, 18, 24],
        message: "Tenure must be 6, 12, 18, or 24 months",
      },
    },

    // ── Calculated at loan creation (stored for fast read)
    emi: {
      type: Number,
      required: true,
    },
    totalPayable: {
      type: Number,
      required: true, // emi × tenureMonths (may vary slightly on last EMI due to rounding)
    },
    totalInterest: {
      type: Number,
      required: true, // totalPayable − principal
    },

    // ── Dates
    disbursedDate: {
      type: Date,
      default: null, // Set when admin approves and moves to active
    },
    expectedCloseDate: {
      type: Date,
      default: null, // disbursedDate + tenureMonths
    },
    actualCloseDate: {
      type: Date,
      default: null, // Set when loan is fully paid / early closed / topup closed
    },

    // ── Status
    status: {
      type: String,
      enum: ["pending", "active", "closed", "topup_closed", "early_closed", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Top-Up Fields (only populated when isTopUp: true)
    isTopUp: {
      type: Boolean,
      default: false,
    },
    previousLoanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
      // Points to the old active loan that was closed when this top-up was created
    },
    previousLoanRemainingBalance: {
      type: Number,
      default: 0,
      // The outstanding principal of the old loan captured at top-up time
    },
    newAmountRequested: {
      type: Number,
      default: 0,
      // The fresh additional cash disbursed to the member in the top-up
    },

    // ── Early Closure
    earlyClosureAmount: {
      type: Number,
      default: null,
      // Only principal is charged — future interest is waived
    },

    // ── Admin
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Null if member applied themselves; set if admin applied on their behalf
    },

    // ── Linked Transactions
    disbursementTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    // ── Data Migration Flag
    isHistorical: {
      type: Boolean,
      default: false,
      // true = entered retroactively during the 3-year data backfill
    },

    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// ── Compound indexes for common query patterns
LoanSchema.index({ memberId: 1, status: 1 });
LoanSchema.index({ status: 1, disbursedDate: -1 });
LoanSchema.index({ disbursedDate: 1 });

// ── Virtual: populate installments on demand
LoanSchema.virtual("installments", {
  ref: "Installment",
  localField: "_id",
  foreignField: "loanId",
});

LoanSchema.set("toJSON", { virtuals: true });
LoanSchema.set("toObject", { virtuals: true });

export default mongoose.model("Loan", LoanSchema);
