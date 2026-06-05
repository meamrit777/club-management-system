import asyncHandler from "express-async-handler";
import AuditLog from "../models/AuditLogModel.js";

// SETTINGS CONTROLLER
// Settings are stored in process.env for simplicity.
// In production you'd store them in a Settings collection — swap easily.

/**
 * @desc    Get all club settings
 * @route   GET /api/settings
 * @access  Admin, Super Admin
 */
export const getSettings = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      interestRate: parseFloat(process.env.DEFAULT_INTEREST_RATE || 15),
      penaltyRate: parseFloat(process.env.DEFAULT_PENALTY_RATE || 20),
      newMemberPremiumPercent: parseFloat(process.env.NEW_MEMBER_PREMIUM_PERCENT || 10),
      validTenures: [6, 12, 18, 24],
      paymentMethods: ["cash", "cheque", "online"],
      maxActiveLoansPerMember: 1,
    },
  });
});

// AUDIT LOG CONTROLLER

/**
 * @desc    Get audit log (paginated + filterable)
 * @route   GET /api/audit-log
 * @access  Super Admin
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, action, performedBy, targetType, from, to } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (action) filter.action = { $regex: action, $options: "i" };
  if (performedBy) filter.performedBy = performedBy;
  if (targetType) filter.targetType = targetType;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("performedBy", "name role email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc    Get audit log for a specific record (e.g. one loan, one member)
 * @route   GET /api/audit-log/:targetType/:targetId
 * @access  Admin, Super Admin
 */
export const getRecordAuditLog = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;

  const logs = await AuditLog.find({ targetType, targetId })
    .populate("performedBy", "name role")
    .sort({ timestamp: -1 });

  res.status(200).json({ success: true, data: logs });
});
