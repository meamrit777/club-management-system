import mongoose from "mongoose";

/**
 * Contribution
 * One record per member per month cycle.
 *
 * These records are created automatically when a ContributionCycle is opened —
 * the system creates one Contribution for every active member at that moment.
 * New members who join mid-year get their first Contribution record in the next
 * cycle that opens after their join date.
 *
 * Status flow:
 *   unpaid  → paid     (full amountDue received)
 *   unpaid  → partial  (some amount received, remainder still pending)
 *   unpaid  → waived   (admin waives the full contribution — rare)
 *   partial → paid     (remaining amount received later)
 *
 * Penalty flow (independent of payment status):
 *   penaltyApplied = 0  → admin applies penalty  → penaltyApplied > 0
 *   penaltyApplied > 0  → admin waives penalty   → isPenaltyWaived = true, penaltyApplied = 0
 */

const ContributionSchema = new mongoose.Schema(
  {
    // ── References
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContributionCycle",
      required: [true, "cycleId is required"],
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "memberId is required"],
      index: true,
    },

    // ── Denormalised month for fast queries
    month: {
      type: String,
      required: [true, "month is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
      // Copied from ContributionCycle.month so we can query
      // "all contributions for member X in 2024" without a join
    },

    // ── Amount
    amountDue: {
      type: Number,
      required: [true, "amountDue is required"],
      // Snapshot of the era amount at cycle-open time
    },
    amountPaid: {
      type: Number,
      default: 0,
    },

    // ── Penalty
    penaltyApplied: {
      type: Number,
      default: 0,
      // Rupee amount of penalty charged (not the rate — the actual amount)
    },
    penaltyRate: {
      type: Number,
      default: 20,
      // % APR rate used when the penalty was calculated (snapshot)
    },
    isPenaltyWaived: {
      type: Boolean,
      default: false,
    },
    penaltyWaivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    penaltyWaivedNote: {
      type: String,
      trim: true,
      default: null,
      // Admin must explain why they waived the penalty
    },
    penaltyWaivedAt: {
      type: Date,
      default: null,
    },

    // ── Payment Status
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "waived"],
      default: "unpaid",
      index: true,
    },

    // ── Payment Details
    paymentMethod: {
      type: String,
      enum: ["cash", "cheque", "online", null],
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
      // Actual date payment was made (may differ from confirmedAt)
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Admin who confirmed the payment in the system
    },

    // ── Linked Ledger Entry
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      // The Transaction record created when payment was confirmed
    },

    // ── Data Migration
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

// ── One contribution per member per cycle — no duplicates
ContributionSchema.index({ cycleId: 1, memberId: 1 }, { unique: true });

// ── For member history page
ContributionSchema.index({ memberId: 1, month: -1 });

// ── For cycle management page (list all members for a cycle)
ContributionSchema.index({ cycleId: 1, status: 1 });

// ── Static: get summary for a cycle
ContributionSchema.statics.getCycleSummary = async function (cycleId) {
  return this.aggregate([
    { $match: { cycleId: new mongoose.Types.ObjectId(cycleId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalPaid: { $sum: "$amountPaid" },
        totalPenalty: { $sum: "$penaltyApplied" },
      },
    },
  ]);
};

// ── Static: get a member's total paid (for pool calculation)
ContributionSchema.statics.getMemberTotalPaid = async function (memberId) {
  const result = await this.aggregate([
    { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
    { $group: { _id: null, total: { $sum: "$amountPaid" } } },
  ]);
  return result[0]?.total || 0;
};

export default mongoose.model("Contribution", ContributionSchema);
