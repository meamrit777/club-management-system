import asyncHandler from "express-async-handler";
import Contribution from "../models/ContributionModel.js";
import Loan from "../models/LoanModel.js";
import User from "../models/UserModel.js";
import { auditLog } from "../utils/auditLogger.js";

/**
 * @desc    Get all members (paginated, filterable)
 * @route   GET /api/members
 * @access  Admin, Super Admin
 */
export const getMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, role, search } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const [members, total] = await Promise.all([
    User.find(filter)
      .sort({ memberNumber: 1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-password -refreshToken -fcmToken"),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: members,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc    Get single member with loan & contribution summary
 * @route   GET /api/members/:id
 * @access  Admin, Super Admin
 */
export const getMember = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id).select("-password -refreshToken -fcmToken");

  if (!member) throw new Error("Member not found");

  const [activeLoan, contributionStats] = await Promise.all([
    Loan.findOne({ memberId: member._id, status: "active" }),
    Contribution.aggregate([
      { $match: { memberId: member._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalPaid: { $sum: "$amountPaid" },
        },
      },
    ]),
  ]);

  res.status(200).json({ success: true, data: { member, activeLoan, contributionStats } });
});

/**
 * @desc    Create a new member (auto-generates default password)
 * @route   POST /api/members
 * @access  Admin, Super Admin
 */
export const createMember = asyncHandler(async (req, res) => {
  const { name, email, phone, role = "member", joinDate, password } = req.body;

  if (!name || !email || !phone) throw new Error("Name, email, and phone are required");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("A user with this email already exists");

  const defaultPassword = password || `Darbung@${phone.slice(-4)}`;

  const member = await User.create({
    name,
    email,
    phone,
    role,
    password: defaultPassword,
    joinDate: joinDate || new Date(),
    isFirstLogin: true,
  });

  await auditLog({
    action: "MEMBER_CREATED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: member._id,
    targetLabel: `${member.name} (${member.email})`,
    newValue: { name: member.name, email: member.email, role: member.role },
    req,
  });

  const memberData = member.toObject();
  delete memberData.password;

  res.status(201).json({ success: true, data: { member: memberData, defaultPassword } });
});

/**
 * @desc    Update member (name, phone, status, photo only — not email/role)
 * @route   PUT /api/members/:id
 * @access  Admin, Super Admin
 */
export const updateMember = asyncHandler(async (req, res) => {
  const { name, phone, status, profilePhoto } = req.body;

  const before = await User.findById(req.params.id);
  if (!before) throw new Error("Member not found");

  const allowed = {};
  if (name) allowed.name = name;
  if (phone) allowed.phone = phone;
  if (status) allowed.status = status;
  if (profilePhoto !== undefined) allowed.profilePhoto = profilePhoto;

  const updated = await User.findByIdAndUpdate(req.params.id, allowed, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken -fcmToken");

  await auditLog({
    action: "MEMBER_UPDATED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: updated._id,
    targetLabel: updated.name,
    oldValue: { name: before.name, phone: before.phone, status: before.status },
    newValue: allowed,
    req,
  });

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc    Deactivate a member (blocks login, requires no active loan)
 * @route   PUT /api/members/:id/deactivate
 * @access  Admin, Super Admin
 */
export const deactivateMember = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id);
  if (!member) throw new Error("Member not found");
  if (member.role === "super_admin") throw new Error("Cannot deactivate super admin");

  const activeLoan = await Loan.findOne({ memberId: member._id, status: "active" });
  if (activeLoan) throw new Error("Member has an active loan. Close it before deactivating.");

  member.status = "inactive";
  await member.save({ validateBeforeSave: false });

  await auditLog({
    action: "MEMBER_DEACTIVATED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: member._id,
    targetLabel: member.name,
    req,
  });

  res.status(200).json({ success: true, message: `${member.name} deactivated` });
});

/**
 * @desc    Re-activate a previously deactivated member
 * @route   PUT /api/members/:id/activate
 * @access  Super Admin
 */
export const activateMember = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id);
  if (!member) throw new Error("Member not found");
  if (member.status === "active") throw new Error("Member is already active");

  member.status = "active";
  await member.save({ validateBeforeSave: false });

  await auditLog({
    action: "MEMBER_ACTIVATED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: member._id,
    req,
  });

  res.status(200).json({ success: true, message: `${member.name} re-activated` });
});

/**
 * @desc    Reset member password to default (Super Admin only)
 * @route   PUT /api/members/:id/reset-password
 * @access  Super Admin
 */
export const resetMemberPassword = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") throw new Error("Only super admin can reset passwords");

  const member = await User.findById(req.params.id).select("+password");
  if (!member) throw new Error("Member not found");

  const tempPassword = `Darbung@${member.phone.slice(-4)}`;
  member.password = tempPassword;
  member.isFirstLogin = true;
  await member.save();

  await auditLog({
    action: "PASSWORD_RESET",
    performedBy: req.user._id,
    targetType: "User",
    targetId: member._id,
    targetLabel: member.name,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Password reset. Member must change on first login.",
    data: { temporaryPassword: tempPassword },
  });
});

/**
 * @desc    Promote a member to admin role
 * @route   PUT /api/members/:id/promote
 * @access  Super Admin
 */
export const promoteMember = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") throw new Error("Only super admin can promote members");

  const { role } = req.body;
  if (!["admin", "member"].includes(role)) throw new Error("Role must be 'admin' or 'member'");

  const member = await User.findById(req.params.id);
  if (!member) throw new Error("Member not found");
  if (member.role === "super_admin") throw new Error("Cannot change super admin role");

  const oldRole = member.role;
  member.role = role;
  await member.save({ validateBeforeSave: false });

  await auditLog({
    action: "MEMBER_ROLE_CHANGED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: member._id,
    targetLabel: member.name,
    oldValue: { role: oldRole },
    newValue: { role },
    req,
  });

  res.status(200).json({ success: true, data: member, message: `${member.name} is now ${role}` });
});

/**
 * @desc    Get aggregate member stats (for admin dashboard)
 * @route   GET /api/members/overview
 * @access  Admin, Super Admin
 */
export const getMembersOverview = asyncHandler(async (req, res) => {
  const [totalActive, totalInactive, roles] = await Promise.all([
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "inactive" }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  res.status(200).json({
    success: true,
    data: { totalActive, totalInactive, total: totalActive + totalInactive, roles },
  });
});
