import mongoose from "mongoose";

/**
 * Transaction — The Immutable Financial Ledger
 *
 * Every single rupee movement in or out of the club pool is recorded here.
 * Records are NEVER edited or deleted. Corrections are made by posting a new
 * MANUAL_ADJUSTMENT entry with a mandatory note explaining the correction.
 *
 * direction:
 *   "in"  = money entering the pool (contributions, loan repayments, entry fees, penalties)
 *   "out" = money leaving the pool  (loan disbursements, expenses)
 *
 * Total Pool = SUM(amount WHERE direction="in") − SUM(amount WHERE direction="out")
 */

export const TRANSACTION_TYPES = {
  CONTRIBUTION_PAID: "CONTRIBUTION_PAID", // Member paid their monthly amount
  CONTRIBUTION_PENALTY: "CONTRIBUTION_PENALTY", // Penalty charged on unpaid/late contribution
  LOAN_DISBURSED: "LOAN_DISBURSED", // Cash given out to a borrower
  LOAN_REPAYMENT: "LOAN_REPAYMENT", // EMI received (principal + interest split stored)
  LOAN_CLOSED_EARLY: "LOAN_CLOSED_EARLY", // Member paid remaining principal to close early
  LOAN_TOPUP_CLOSE: "LOAN_TOPUP_CLOSE", // Old loan's remaining balance rolled into top-up
  MEMBER_ENTRY_FEE: "MEMBER_ENTRY_FEE", // New member paid their entry share + 10% premium
  EXPENSE: "EXPENSE", // Club operational expense (money out)
  MANUAL_ADJUSTMENT: "MANUAL_ADJUSTMENT", // Admin correction — note is MANDATORY
  PENALTY_WAIVED: "PENALTY_WAIVED", // Admin waived a penalty (reversal entry)
};

const TransactionSchema = new mongoose.Schema(
  {
    // ── Core
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: [true, "Transaction type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    direction: {
      type: String,
      enum: ["in", "out"],
      required: [true, "Direction (in/out) is required"],
    },

    // ── References (all optional — depends on transaction type)
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Null only for EXPENSE or MANUAL_ADJUSTMENT with no specific member
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
      // Set for: LOAN_DISBURSED, LOAN_REPAYMENT, LOAN_CLOSED_EARLY, LOAN_TOPUP_CLOSE
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installment",
      default: null,
      // Set for: LOAN_REPAYMENT (which installment was being paid)
    },
    contributionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contribution",
      default: null,
      // Set for: CONTRIBUTION_PAID, CONTRIBUTION_PENALTY, PENALTY_WAIVED
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContributionCycle",
      default: null,
      // Set for contribution-related transactions
    },

    // ── Repayment Breakdown (only for LOAN_REPAYMENT)
    principalComponent: {
      type: Number,
      default: null,
      // Portion of the EMI that reduced the outstanding principal
    },
    interestComponent: {
      type: Number,
      default: null,
      // Portion of the EMI that was pure interest income for the club
    },

    // ── Payment Details
    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
      // Actual date of the payment (may be backdated for historical data entry)
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "cheque", "online", "internal", null],
      default: null,
      // "internal" = used for LOAN_TOPUP_CLOSE and PENALTY_WAIVED (no actual cash)
    },

    // ── Who Recorded This
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "recordedBy is required — every transaction must have an author"],
    },

    // ── Note
    note: {
      type: String,
      trim: true,
      default: null,
      // MANDATORY for MANUAL_ADJUSTMENT — enforced in the controller
    },

    // ── Data Migration
    isHistorical: {
      type: Boolean,
      default: false,
      // true = backdated entry entered during the 3-year data backfill
    },

    // ── Optional Running Balance Snapshot
    poolBalanceAfter: {
      type: Number,
      default: null,
      // Total pool value immediately after this transaction was posted.
      // Useful for audit/debugging but expensive to keep live — populate optionally.
    },
  },
  {
    timestamps: true,
    // No updatedAt matters here since records are immutable,
    // but keeping it for ORM-level audit convenience.
  },
);

// ── Immutability Guard
// Any attempt to update an existing transaction throws.
// Only Transaction.create() is permitted.
TransactionSchema.pre(
  ["updateOne", "findOneAndUpdate", "updateMany", "replaceOne", "findByIdAndUpdate"],
  function () {
    throw new Error(
      "Transactions are immutable. Create a new MANUAL_ADJUSTMENT entry to correct errors.",
    );
  },
);

// ── Indexes
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ direction: 1 });
TransactionSchema.index({ memberId: 1, date: -1 });
TransactionSchema.index({ loanId: 1 });
TransactionSchema.index({ cycleId: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ isHistorical: 1 });

// ── Static helper: calculate current pool balance
TransactionSchema.statics.getPoolBalance = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: "$direction",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let inflow = 0;
  let outflow = 0;
  let inCount = 0;
  let outCount = 0;

  result.forEach((r) => {
    if (r._id === "in") {
      inflow = r.total;
      inCount = r.count;
    }
    if (r._id === "out") {
      outflow = r.total;
      outCount = r.count;
    }
  });

  return {
    totalInflow: Math.round(inflow * 100) / 100,
    totalOutflow: Math.round(outflow * 100) / 100,
    netBalance: Math.round((inflow - outflow) * 100) / 100,
    transactionCount: inCount + outCount,
  };
};

// ── Static helper: get pool balance broken down by type
TransactionSchema.statics.getPoolBreakdown = async function () {
  return this.aggregate([
    {
      $group: {
        _id: { type: "$type", direction: "$direction" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.direction": 1, "_id.type": 1 } },
  ]);
};

export default mongoose.model("Transaction", TransactionSchema);
