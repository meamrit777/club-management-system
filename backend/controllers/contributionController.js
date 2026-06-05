import asyncHandler from "express-async-handler";
import ContributionCycle from "../models/ContributionCycleModel.js";
import ContributionEra from "../models/ContributionEraModel.js";
import Contribution from "../models/ContributionModel.js";
import Transaction from "../models/TransactionModel.js";
import User from "../models/UserModel.js";
import { auditLog } from "../utils/auditLogger.js";
import { calculateContributionPenalty } from "../utils/emiCalculator.js";

/**
 * @desc    Get all contribution cycles
 * @route   GET /api/contributions/cycles
 * @access  Admin, Super Admin
 */
export const getCycles = asyncHandler(async (req, res) => {
  const { status, year } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (year) filter.month = { $regex: `^${year}-` };

  const cycles = await ContributionCycle.find(filter)
    .populate("openedBy", "name")
    .populate("closedBy", "name")
    .sort({ month: -1 });

  res.status(200).json({ success: true, data: cycles });
});

/**
 * @desc    Open a new contribution cycle for a month
 *          Auto-creates one Contribution record per active member
 * @route   POST /api/contributions/cycles/open
 * @access  Admin, Super Admin
 */
export const openCycle = asyncHandler(async (req, res) => {
  const { month, isHistorical = false } = req.body;

  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("month is required in YYYY-MM format");

  const exists = await ContributionCycle.findOne({ month });
  if (exists) throw new Error(`Cycle for ${month} already exists`);

  // Get the active contribution era for this month
  const era = await ContributionEra.findOne({ isCurrent: true });
  if (!era) throw new Error("No active contribution era found. Set one in Settings first.");

  const activeMembers = await User.find({
    status: "active",
    role: "member",
  }).select("_id");

  const totalExpected = era.amount * activeMembers.length;

  const cycle = await ContributionCycle.create({
    month,
    status: "open",
    contributionAmount: era.amount,
    contributionEraId: era._id,
    totalExpected,
    openedBy: req.user._id,
    isHistorical,
  });

  // Auto-create one Contribution record per member
  const contributions = activeMembers.map((m) => ({
    cycleId: cycle._id,
    memberId: m._id,
    month,
    amountDue: era.amount,
    status: "unpaid",
    isHistorical,
  }));

  await Contribution.insertMany(contributions);

  await auditLog({
    action: "CYCLE_OPENED",
    performedBy: req.user._id,
    targetType: "ContributionCycle",
    targetId: cycle._id,
    targetLabel: `Cycle ${month} — ₹${era.amount} × ${activeMembers.length} members`,
    req,
  });

  res.status(201).json({ success: true, data: { cycle, membersEnrolled: activeMembers.length } });
});

/**
 * @desc    Close a cycle (admin confirms all collections done for that month)
 * @route   PUT /api/contributions/cycles/:cycleId/close
 * @access  Admin, Super Admin
 */
export const closeCycle = asyncHandler(async (req, res) => {
  const cycle = await ContributionCycle.findById(req.params.cycleId);
  if (!cycle) throw new Error("Cycle not found");
  if (cycle.status === "closed") throw new Error("Cycle is already closed");

  // Summarise collections
  const summary = await Contribution.aggregate([
    { $match: { cycleId: cycle._id } },
    {
      $group: {
        _id: null,
        totalCollected: { $sum: "$amountPaid" },
        totalPenalties: { $sum: "$penaltyApplied" },
      },
    },
  ]);

  cycle.status = "closed";
  cycle.closedBy = req.user._id;
  cycle.closedAt = new Date();
  cycle.totalCollected = summary[0]?.totalCollected || 0;
  cycle.totalPenalties = summary[0]?.totalPenalties || 0;
  await cycle.save();

  await auditLog({
    action: "CYCLE_CLOSED",
    performedBy: req.user._id,
    targetType: "ContributionCycle",
    targetId: cycle._id,
    targetLabel: `Cycle ${cycle.month}`,
    newValue: { totalCollected: cycle.totalCollected },
    req,
  });

  res.status(200).json({ success: true, data: cycle });
});

/**
 * @desc    Get all contributions for a cycle (with member details)
 * @route   GET /api/contributions/cycles/:cycleId/contributions
 * @access  Admin, Super Admin
 */
export const getCycleContributions = asyncHandler(async (req, res) => {
  const cycle = await ContributionCycle.findById(req.params.cycleId);
  if (!cycle) throw new Error("Cycle not found");

  const contributions = await Contribution.find({ cycleId: cycle._id })
    .populate("memberId", "name email phone memberNumber")
    .populate("confirmedBy", "name")
    .sort({ "memberId.memberNumber": 1 });

  res.status(200).json({ success: true, data: { cycle, contributions } });
});

/**
 * @desc    Mark a member's contribution as paid for a cycle
 * @route   PUT /api/contributions/:contributionId/pay
 * @access  Admin, Super Admin
 */
export const markContributionPaid = asyncHandler(async (req, res) => {
  const { amountPaid, paymentMethod, paidAt, notes } = req.body;

  if (!amountPaid || !paymentMethod) throw new Error("amountPaid and paymentMethod are required");

  const contribution = await Contribution.findById(req.params.contributionId);
  if (!contribution) throw new Error("Contribution not found");
  if (contribution.status === "paid") throw new Error("Contribution already marked paid");

  const cycle = await ContributionCycle.findById(contribution.cycleId);
  if (cycle?.status === "closed") throw new Error("Cannot edit a closed cycle");

  const paidAmount = Number(amountPaid);
  const isFull = paidAmount >= contribution.amountDue;

  contribution.amountPaid = paidAmount;
  contribution.status = isFull ? "paid" : "partial";
  contribution.paymentMethod = paymentMethod;
  contribution.paidAt = paidAt ? new Date(paidAt) : new Date();
  contribution.confirmedBy = req.user._id;
  if (notes) contribution.notes = notes;

  // Record in ledger
  const txn = await Transaction.create({
    type: "CONTRIBUTION_PAID",
    amount: paidAmount,
    direction: "in",
    memberId: contribution.memberId,
    cycleId: contribution.cycleId,
    contributionId: contribution._id,
    date: contribution.paidAt,
    paymentMethod,
    recordedBy: req.user._id,
    note: notes,
  });

  contribution.transactionId = txn._id;
  await contribution.save();

  await auditLog({
    action: "CONTRIBUTION_MARKED_PAID",
    performedBy: req.user._id,
    targetType: "Contribution",
    targetId: contribution._id,
    targetLabel: `₹${paidAmount} for ${contribution.month}`,
    req,
  });

  res.status(200).json({ success: true, data: contribution });
});

/**
 * @desc    Apply penalty on an unpaid/partial contribution
 * @route   PUT /api/contributions/:contributionId/apply-penalty
 * @access  Admin, Super Admin
 */
export const applyPenalty = asyncHandler(async (req, res) => {
  const { monthsOverdue, customPenaltyAmount } = req.body;

  const contribution = await Contribution.findById(req.params.contributionId).populate("cycleId");
  if (!contribution) throw new Error("Contribution not found");

  if (contribution.status === "paid")
    throw new Error("Contribution is already paid — no penalty applicable");
  if (contribution.isPenaltyWaived)
    throw new Error("Penalty was already waived for this contribution");
  if (contribution.penaltyApplied > 0)
    throw new Error("Penalty already applied. Waive first to re-apply.");

  const unpaidAmount = contribution.amountDue - contribution.amountPaid;
  const penaltyRate = parseFloat(process.env.DEFAULT_PENALTY_RATE || 20);
  const overdueMths = monthsOverdue || 1;

  const penaltyAmount = customPenaltyAmount
    ? Number(customPenaltyAmount)
    : calculateContributionPenalty(unpaidAmount, penaltyRate, overdueMths);

  contribution.penaltyApplied = penaltyAmount;
  contribution.penaltyRate = penaltyRate;
  await contribution.save();

  await Transaction.create({
    type: "CONTRIBUTION_PENALTY",
    amount: penaltyAmount,
    direction: "in",
    memberId: contribution.memberId,
    cycleId: contribution.cycleId._id || contribution.cycleId,
    contributionId: contribution._id,
    date: new Date(),
    paymentMethod: null,
    recordedBy: req.user._id,
    note: `Penalty on unpaid ₹${unpaidAmount} for ${contribution.month}`,
  });

  await auditLog({
    action: "CONTRIBUTION_PENALTY_APPLIED",
    performedBy: req.user._id,
    targetType: "Contribution",
    targetId: contribution._id,
    targetLabel: `Penalty ₹${penaltyAmount} on ${contribution.month}`,
    req,
  });

  res.status(200).json({ success: true, data: contribution });
});

/**
 * @desc    Waive penalty on a contribution (admin must provide reason)
 * @route   PUT /api/contributions/:contributionId/waive-penalty
 * @access  Admin, Super Admin
 */
export const waisePenalty = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new Error("A reason is required to waive a penalty");

  const contribution = await Contribution.findById(req.params.contributionId);
  if (!contribution) throw new Error("Contribution not found");
  if (contribution.penaltyApplied === 0) throw new Error("No penalty to waive");
  if (contribution.isPenaltyWaived) throw new Error("Penalty already waived");

  const waivedAmount = contribution.penaltyApplied;
  contribution.isPenaltyWaived = true;
  contribution.penaltyWaivedBy = req.user._id;
  contribution.penaltyWaivedNote = reason;
  contribution.penaltyApplied = 0;
  await contribution.save();

  await Transaction.create({
    type: "PENALTY_WAIVED",
    amount: waivedAmount,
    direction: "out", // Money that was expected but forgiven
    memberId: contribution.memberId,
    contributionId: contribution._id,
    date: new Date(),
    paymentMethod: "internal",
    recordedBy: req.user._id,
    note: `Penalty waived: ${reason}`,
  });

  await auditLog({
    action: "PENALTY_WAIVED",
    performedBy: req.user._id,
    targetType: "Contribution",
    targetId: contribution._id,
    targetLabel: `Waived ₹${waivedAmount} — ${contribution.month}`,
    note: reason,
    req,
  });

  res.status(200).json({ success: true, data: contribution });
});

/**
 * @desc    Get a member's full contribution history
 * @route   GET /api/contributions/member/:memberId
 * @access  Private (member sees own; admin sees any)
 */
export const getMemberContributions = asyncHandler(async (req, res) => {
  const targetId = req.user.role === "member" ? req.user._id : req.params.memberId;

  const contributions = await Contribution.find({ memberId: targetId })
    .populate("cycleId", "month status contributionAmount")
    .populate("confirmedBy", "name")
    .sort({ month: -1 });

  const totalPaid = contributions.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalPenalties = contributions.reduce((sum, c) => sum + c.penaltyApplied, 0);
  const unpaidCount = contributions.filter((c) => c.status === "unpaid").length;

  res.status(200).json({
    success: true,
    data: {
      contributions,
      summary: { totalPaid, totalPenalties, unpaidCount, totalMonths: contributions.length },
    },
  });
});

/**
 * @desc    Get all contribution eras (amount history over time)
 * @route   GET /api/contributions/eras
 * @access  Admin, Super Admin
 */
export const getContributionEras = asyncHandler(async (req, res) => {
  const eras = await ContributionEra.find()
    .populate("changedBy", "name role")
    .sort({ effectiveFrom: 1 });

  res.status(200).json({ success: true, data: eras });
});

/**
 * @desc    Create a new contribution era (change the monthly amount going forward)
 * @route   POST /api/contributions/eras
 * @access  Admin, Super Admin
 */
export const createContributionEra = asyncHandler(async (req, res) => {
  const { amount, effectiveFrom, note } = req.body;

  if (!amount || !effectiveFrom) throw new Error("amount and effectiveFrom (YYYY-MM) are required");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(effectiveFrom))
    throw new Error("effectiveFrom must be in YYYY-MM format");

  const existing = await ContributionEra.findOne({ effectiveFrom });
  if (existing) throw new Error(`An era already starts from ${effectiveFrom}`);

  const era = await ContributionEra.create({
    amount: Number(amount),
    effectiveFrom,
    isCurrent: true, // Pre-save hook closes the previous era
    changedBy: req.user._id,
    note,
  });

  await auditLog({
    action: "CONTRIBUTION_ERA_CREATED",
    performedBy: req.user._id,
    targetType: "ContributionEra",
    targetId: era._id,
    targetLabel: `₹${amount}/month from ${effectiveFrom}`,
    newValue: { amount, effectiveFrom },
    req,
  });

  res.status(201).json({ success: true, data: era });
});
