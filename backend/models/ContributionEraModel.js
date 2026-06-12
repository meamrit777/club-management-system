import mongoose from "mongoose";

/**
 * ContributionEra
 * Every time the monthly contribution amount changes, a new era is created.
 * This model stores the full history so that:
 *   — Historical contributions can be validated against the correct amount.
 *   — Reports can show "₹500/month (Jan 2022 – Dec 2022)" accurately.
 *   — The system always knows what amount is currently due.
 *
 * Club history (as per design doc):
 *   Era 1 → ₹500  from 2022-01 to 2022-12
 *   Era 2 → ₹1000 from 2023-01 to 2023-12
 *   Era 3 → ₹1500 from 2024-01 to 2024-12
 *   Era 4 → ₹2000 from 2025-01 (current, no end date)
 *
 * Only ONE era can have isCurrent: true at any time.
 * The pre-save hook automatically closes the previous era when a new one is created.
 */

const ContributionEraSchema = new mongoose.Schema(
  {
    // ── Amount & Validity
    amount: {
      type: Number,
      required: [true, "Monthly contribution amount is required"],
      min: [1, "Amount must be positive"],
    },
    effectiveFrom: {
      type: String,
      required: [true, "effectiveFrom is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "effectiveFrom must be in YYYY-MM format"],
      // The first month this amount applies
    },
    effectiveTo: {
      type: String,
      default: null,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "effectiveTo must be in YYYY-MM format"],
      // Null means this era is still active (no end date yet)
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
      // Only one document should ever have isCurrent: true
    },

    // ── Who Changed It
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "changedBy is required"],
    },

    note: {
      type: String,
      trim: true,
      default: null,
      // Optional explanation for why the amount changed
    },
  },
  {
    timestamps: true,
  },
);

// ── Auto-close previous era when new one is saved as current
ContributionEraSchema.pre("save", async function () {
  if (!this.isNew || !this.isCurrent) return;

  const previous = await mongoose.model("ContributionEra").findOne({
    isCurrent: true,
    _id: { $ne: this._id },
  });

  if (previous) {
    await mongoose.model("ContributionEra").updateOne(
      { _id: previous._id },
      {
        $set: {
          isCurrent: false,
          effectiveTo: getPreviousMonth(this.effectiveFrom),
        },
      },
    );
  }
});

// ── Helper: get YYYY-MM of the month before a given YYYY-MM
function getPreviousMonth(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

// ── Index: enforce unique effectiveFrom (two eras can't start on the same month)
ContributionEraSchema.index({ effectiveFrom: 1 }, { unique: true });

// ── Static: get the era for a specific month string (YYYY-MM)
ContributionEraSchema.statics.getEraForMonth = async function (month) {
  // Find an era where effectiveFrom <= month AND (effectiveTo >= month OR effectiveTo is null)
  return this.findOne({
    effectiveFrom: { $lte: month },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: month } }],
  });
};

export default mongoose.model("ContributionEra", ContributionEraSchema);
