import mongoose from "mongoose";

/**
 * ContributionCycle
 * Represents one calendar month of collection activity.
 * Admin workflow per month:
 *   1. Admin opens the cycle → system auto-creates one Contribution record per active member.
 *   2. As members pay, admin marks each Contribution as paid.
 *   3. Admin closes the cycle when all collections are done (or end of month).
 *
 * One cycle = one month = one document here.
 * Many contributions = one per member for this cycle (in the Contribution collection).
 */

const ContributionCycleSchema = new mongoose.Schema(
  {
    // ── Identity
    month: {
      type: String,
      required: [true, "Month is required"],
      unique: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
      // e.g., "2025-06"
    },

    // ── Status
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
      // open   = admin can still record payments
      // closed = month is finalised, no further edits
    },

    // ── Amount & Era Snapshot
    contributionAmount: {
      type: Number,
      required: [true, "Contribution amount for this cycle is required"],
      // Snapshot of the era amount at cycle-open time.
      // Stored here so the cycle record is self-contained even if eras change later.
    },
    contributionEraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContributionEra",
      default: null,
      // Which era was active when this cycle was opened
    },

    // ── Aggregated Totals (updated when cycle is closed)
    totalExpected: {
      type: Number,
      default: 0,
      // contributionAmount × number of active members at open time
    },
    totalCollected: {
      type: Number,
      default: 0,
      // Sum of all amountPaid across member contributions for this cycle
    },
    totalPenalties: {
      type: Number,
      default: 0,
      // Sum of all penaltyApplied for this cycle
    },

    // ── Member Snapshot
    memberCountAtOpen: {
      type: Number,
      default: 0,
      // How many active members existed when this cycle was opened
    },

    // ── Who Did What
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "openedBy is required"],
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },

    // ── Data Migration
    isHistorical: {
      type: Boolean,
      default: false,
      // true = this cycle was created during the 3-year backfill, not in real-time
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

// ── Indexes for common queries
ContributionCycleSchema.index({ month: 1 });
ContributionCycleSchema.index({ status: 1 });
ContributionCycleSchema.index({ isHistorical: 1 });

// ── Static: get currently open cycle
ContributionCycleSchema.statics.getCurrentCycle = async function () {
  return this.findOne({ status: "open" }).sort({ month: -1 });
};

// ── Static: get cycle by YYYY-MM string
ContributionCycleSchema.statics.findByMonth = async function (month) {
  return this.findOne({ month });
};

export default mongoose.model("ContributionCycle", ContributionCycleSchema);
