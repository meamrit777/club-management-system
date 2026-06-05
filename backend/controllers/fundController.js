import asyncHandler from "express-async-handler";
import Loan from "../models/LoanModel.js";
import Transaction from "../models/TransactionModel.js";
import User from "../models/UserModel.js";
import { auditLog } from "../utils/auditLogger.js";
import { calculateEntryFee } from "../utils/emiCalculator.js";

/**
 * @desc    Get full fund pool breakdown
 *          Total Pool = all inflows − all outflows
 *          Available = Total Pool − outstanding active loan principals
 * @route   GET /api/fund/pool
 * @access  Private (members see read-only summary; admins see full breakdown)
 */
export const getPoolSummary = asyncHandler(async (req, res) => {
  // Aggregate all transactions by type
  const breakdown = await Transaction.aggregate([
    {
      $group: {
        _id: { type: "$type", direction: "$direction" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalContributions = 0;
  let totalInterestReceived = 0;
  let totalPenaltiesReceived = 0;
  let totalEntryFees = 0;
  let totalLoansGiven = 0;
  let totalRepaymentsReceived = 0;
  let totalExpenses = 0;

  breakdown.forEach(({ _id, total }) => {
    switch (_id.type) {
      case "CONTRIBUTION_PAID":
        totalContributions += total;
        break;
      case "LOAN_REPAYMENT":
        totalRepaymentsReceived += total;
        break;
      case "LOAN_CLOSED_EARLY":
        totalRepaymentsReceived += total;
        break;
      case "LOAN_TOPUP_CLOSE":
        totalRepaymentsReceived += total;
        break;
      case "CONTRIBUTION_PENALTY":
        totalPenaltiesReceived += total;
        break;
      case "MEMBER_ENTRY_FEE":
        totalEntryFees += total;
        break;
      case "LOAN_DISBURSED":
        totalLoansGiven += total;
        break;
      case "EXPENSE":
        totalExpenses += total;
        break;
    }
  });

  const totalPool =
    totalContributions +
    totalInterestReceived +
    totalPenaltiesReceived +
    totalEntryFees +
    totalRepaymentsReceived -
    totalLoansGiven -
    totalExpenses;

  // Outstanding active loans (money still out in the market)
  const activeLoansAgg = await Loan.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: null, outstanding: { $sum: "$principal" } } },
  ]);
  const outstanding = activeLoansAgg[0]?.outstanding || 0;

  // Available = what's actually in the pool (not lent out)
  const availableForLending = totalPool - outstanding;

  const activeMembers = await User.countDocuments({ status: "active", role: "member" });

  res.status(200).json({
    success: true,
    data: {
      totalPool: Math.round(totalPool * 100) / 100,
      availableForLending: Math.round(availableForLending * 100) / 100,
      outstandingLoans: Math.round(outstanding * 100) / 100,
      activeMembers,
      perMemberShare: Math.round((totalPool / (activeMembers || 1)) * 100) / 100,
      breakdown: {
        totalContributions,
        totalInterestReceived,
        totalPenaltiesReceived,
        totalEntryFees,
        totalRepaymentsReceived,
        totalLoansGiven,
        totalExpenses,
      },
    },
  });
});

/**
 * @desc    Get full transaction ledger (filterable, paginated)
 * @route   GET /api/fund/ledger
 * @access  Admin, Super Admin
 */
export const getLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, type, direction, memberId, from, to, isHistorical } = req.query;

  const skip = (page - 1) * limit;
  const filter = {};

  if (type) filter.type = type;
  if (direction) filter.direction = direction;
  if (memberId) filter.memberId = memberId;
  if (isHistorical !== undefined) filter.isHistorical = isHistorical === "true";
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("memberId", "name memberNumber")
      .populate("recordedBy", "name role")
      .populate("loanId", "principal tenureMonths")
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: transactions,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc    Record a new member entry fee (after admin approval)
 * @route   POST /api/fund/member-entry
 * @access  Admin, Super Admin
 */
export const recordMemberEntryFee = asyncHandler(async (req, res) => {
  const { memberId, amountPaid, paymentMethod, date, notes } = req.body;

  if (!memberId || !amountPaid || !paymentMethod)
    throw new Error("memberId, amountPaid, and paymentMethod are required");

  const member = await User.findById(memberId);
  if (!member) throw new Error("Member not found");

  // Calculate what the entry fee should have been
  const activeMembers = await User.countDocuments({ status: "active", role: "member" });

  // Get pool value at time of entry
  const { totalPool } = await getPoolValue();

  const { individualShare, premiumAmount, entryFee } = calculateEntryFee(
    totalPool,
    activeMembers,
    parseFloat(process.env.NEW_MEMBER_PREMIUM_PERCENT || 10),
  );

  const txn = await Transaction.create({
    type: "MEMBER_ENTRY_FEE",
    amount: Number(amountPaid),
    direction: "in",
    memberId,
    date: date ? new Date(date) : new Date(),
    paymentMethod,
    recordedBy: req.user._id,
    note: notes || `Entry fee for new member ${member.name}`,
  });

  await auditLog({
    action: "MEMBER_ENTRY_FEE_RECORDED",
    performedBy: req.user._id,
    targetType: "Transaction",
    targetId: txn._id,
    targetLabel: `${member.name} — ₹${amountPaid} entry fee`,
    newValue: { amountPaid, entryFeeCalculated: entryFee },
    req,
  });

  res.status(201).json({
    success: true,
    data: {
      transaction: txn,
      entryFeeBreakdown: {
        individualShare,
        premiumAmount,
        entryFee,
        amountActuallyPaid: Number(amountPaid),
      },
    },
  });
});

/**
 * @desc    Preview new member entry fee calculation (no data changes)
 * @route   GET /api/fund/entry-fee-preview
 * @access  Admin, Super Admin
 */
export const entryFeePreview = asyncHandler(async (req, res) => {
  const activeMembers = await User.countDocuments({ status: "active", role: "member" });
  const { totalPool } = await getPoolValue();

  const result = calculateEntryFee(
    totalPool,
    activeMembers,
    parseFloat(process.env.NEW_MEMBER_PREMIUM_PERCENT || 10),
  );

  res.status(200).json({
    success: true,
    data: { ...result, totalPool, currentMembers: activeMembers },
  });
});

/**
 * @desc    Record a club expense (money going out of pool)
 * @route   POST /api/fund/expense
 * @access  Admin, Super Admin
 */
export const recordExpense = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, date, notes } = req.body;

  if (!amount || !paymentMethod) throw new Error("amount and paymentMethod are required");
  if (!notes) throw new Error("A description/note is required for expenses");

  const txn = await Transaction.create({
    type: "EXPENSE",
    amount: Number(amount),
    direction: "out",
    date: date ? new Date(date) : new Date(),
    paymentMethod,
    recordedBy: req.user._id,
    note: notes,
  });

  await auditLog({
    action: "EXPENSE_RECORDED",
    performedBy: req.user._id,
    targetType: "Transaction",
    targetId: txn._id,
    targetLabel: `Expense ₹${amount} — ${notes}`,
    req,
  });

  res.status(201).json({ success: true, data: txn });
});

/**
 * @desc    Record a manual adjustment (immutable correction entry)
 *          MANDATORY: must include a note explaining why
 * @route   POST /api/fund/manual-adjustment
 * @access  Super Admin only
 */
export const recordManualAdjustment = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin")
    throw new Error("Only super admin can post manual adjustments");

  const { amount, direction, memberId, paymentMethod, date, note } = req.body;

  if (!amount || !direction || !note)
    throw new Error("amount, direction, and a detailed note are required for manual adjustments");

  if (!["in", "out"].includes(direction)) throw new Error("direction must be 'in' or 'out'");

  const txn = await Transaction.create({
    type: "MANUAL_ADJUSTMENT",
    amount: Number(amount),
    direction,
    memberId: memberId || null,
    date: date ? new Date(date) : new Date(),
    paymentMethod: paymentMethod || null,
    recordedBy: req.user._id,
    note,
  });

  await auditLog({
    action: "MANUAL_ADJUSTMENT",
    performedBy: req.user._id,
    targetType: "Transaction",
    targetId: txn._id,
    targetLabel: `Manual ${direction} ₹${amount}`,
    note,
    req,
  });

  res.status(201).json({ success: true, data: txn });
});

/**
 * @desc    Get a quick dashboard summary (for both web and mobile home screen)
 * @route   GET /api/fund/dashboard
 * @access  Admin, Super Admin
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [poolData, activeLoansCount, pendingLoansCount, memberCount, recentTxns] =
    await Promise.all([
      Transaction.aggregate([
        {
          $group: {
            _id: "$direction",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Loan.countDocuments({ status: "active" }),
      Loan.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "active", role: "member" }),
      Transaction.find().populate("memberId", "name memberNumber").sort({ date: -1 }).limit(10),
    ]);

  let inflow = 0;
  let outflow = 0;
  poolData.forEach((p) => {
    if (p._id === "in") inflow = p.total;
    if (p._id === "out") outflow = p.total;
  });

  const netPool = inflow - outflow;

  res.status(200).json({
    success: true,
    data: {
      totalPool: Math.round(netPool * 100) / 100,
      activeLoansCount,
      pendingLoansCount,
      memberCount,
      recentTransactions: recentTxns,
    },
  });
});

// Internal helper (not an express route)
async function getPoolValue() {
  const agg = await Transaction.aggregate([
    { $group: { _id: "$direction", total: { $sum: "$amount" } } },
  ]);
  let inflow = 0,
    outflow = 0;
  agg.forEach((a) => {
    if (a._id === "in") inflow = a.total;
    if (a._id === "out") outflow = a.total;
  });
  return { totalPool: inflow - outflow };
}
