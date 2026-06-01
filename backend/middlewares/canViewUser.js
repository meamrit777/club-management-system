// middlewares/canViewUser.js

import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";

/**
 * @desc Authorization middleware to control who can view a user profile
 * @usage Protects GET /api/users/:id
 */
const canViewUser = asyncHandler(async (req, res, next) => {
  const loggedInUser = req.user;
  const targetUserId = req.params.id;

  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  /**
   * -----------------------------
   * ACCESS RULES (FUTURE RBAC)
   * -----------------------------
   *
   * Current behavior:
   * - Everyone can view any user profile (no restriction)
   *
   * Future rules (uncomment when needed):
   *
   * // 1. Users can always view their own profile
   * // if (loggedInUser._id.toString() === targetUserId) {
   * //   return next();
   * // }
   *
   * // 2. Admin can view Members only
   * // if (loggedInUser.role === "Admin" && targetUser.role === "SuperAdmin") {
   * //   res.status(403);
   * //   throw new Error("Admin cannot view SuperAdmin profile");
   * // }
   *
   * // 3. SuperAdmin can view everyone
   * // if (loggedInUser.role === "SuperAdmin") {
   * //   return next();
   * // }
   */

  // CURRENT RULE: allow all access
  req.targetUser = targetUser;
  next();
});

export default canViewUser;
