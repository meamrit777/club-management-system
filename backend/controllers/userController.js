// controllers/UserController.js

import asyncHandler from "express-async-handler";

import User from "../models/UserModel.js";
import generateToken from "../utils/generateToken.js";

/**
 * @desc Login user
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Email or Phone and password are required");
  }

  const id = identifier.trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);

  const query = isEmail ? { email: id.toLowerCase() } : { phoneNumber: id };

  const user = await User.findOne(query).select("+password +loginAttempts +lockUntil");

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Account disabled");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    res.status(423);
    throw new Error("Account temporarily locked");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 10) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.loginAttempts = 0;
    }

    await user.save();

    res.status(401);
    throw new Error("Invalid credentials");
  }

  user.loginAttempts = 0;
  user.lockUntil = null;

  await user.save();

  res.json({
    token: generateToken(user),
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    role: user.role,
  });
});

/**
 * @desc Create user
 * @route POST /api/users
 * @access Private
 */
export const createUser = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;

  const { firstName, lastName, email, password, phoneNumber, role } = req.body;

  // Admin cannot create SuperAdmin
  if (loggedInUser.role === "Admin" && role === "SuperAdmin") {
    res.status(403);

    throw new Error("Admin cannot create SuperAdmin");
  }

  const userExists = await User.findOne({
    email,
  });

  if (userExists) {
    res.status(400);

    throw new Error("User already exists");
  }

  const user = await User.create({
    firstName: firstName || "",
    lastName: lastName || "",
    email,
    password: password || process.env.DEFAULT_MEMBER_PASSWORD,
    phoneNumber,
    role: role || "Member",
    createdBy: loggedInUser._id,
  });

  user.password = undefined;

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user,
  });
});

/**
 * @desc Get user by ID (role-aware sensitive fields)
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isSelf = loggedInUser._id.toString() === user._id.toString();

  const isAdminOrAbove = loggedInUser.role === "Admin" || loggedInUser.role === "SuperAdmin";

  // Base response object (always safe fields)
  const responseUser = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  /**
   * SECURITY FIELDS:
   * loginAttempts
   * lockUntil
   * tokenVersion
   *
   * Only visible to:
   * - self
   * - Admin
   * - SuperAdmin
   */
  if (isSelf || isAdminOrAbove) {
    responseUser.loginAttempts = user.loginAttempts;
    responseUser.lockUntil = user.lockUntil;
    responseUser.tokenVersion = user.tokenVersion;
  }

  res.json({
    success: true,
    user: responseUser,
  });
});

/**
 * @desc Update user
 * @route PUT /api/users/:id
 * @access Private
 */
export const updateUser = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);

    throw new Error("User not found");
  }

  // Admin cannot edit SuperAdmin
  if (loggedInUser.role === "Admin" && user.role === "SuperAdmin") {
    res.status(403);

    throw new Error("Admin cannot edit SuperAdmin");
  }

  const { firstName, lastName, email, phoneNumber, role, isActive } = req.body;

  // Prevent self role change
  if (loggedInUser._id.toString() === user._id.toString() && role && role !== user.role) {
    res.status(400);

    throw new Error("You cannot change your own role");
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;
  user.phoneNumber = phoneNumber || user.phoneNumber;

  if (typeof isActive === "boolean") {
    user.isActive = isActive;
  }

  // Only SuperAdmin can assign SuperAdmin
  if (role) {
    if (loggedInUser.role === "Admin" && role === "SuperAdmin") {
      res.status(403);

      throw new Error("Admin cannot assign SuperAdmin role");
    }

    user.role = role;
  }

  const updatedUser = await user.save();

  updatedUser.password = undefined;

  res.json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});

/**
 * @desc Update own profile
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);

    throw new Error("User not found");
  }

  const { firstName, lastName, email, phoneNumber } = req.body;

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;
  user.phoneNumber = phoneNumber || user.phoneNumber;

  const updatedUser = await user.save();

  updatedUser.password = undefined;

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

/**
 * @desc Change own password
 * @route PUT /api/users/change-password
 * @access Private
 */
export const changeMyPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);

    throw new Error("User not found");
  }

  const { oldPassword, newPassword } = req.body;

  const isMatch = await user.matchPassword(oldPassword);

  if (!isMatch) {
    res.status(400);

    throw new Error("Old password is incorrect");
  }

  user.password = newPassword;

  user.passwordChangedAt = new Date();

  // Invalidate all old sessions
  user.tokenVersion += 1;

  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * @desc Reset password
 * @route PUT /api/users/reset-password/:id
 * @access Private
 */
export const resetUserPassword = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Admin cannot reset SuperAdmin
  if (loggedInUser.role === "Admin" && user.role === "SuperAdmin") {
    res.status(403);
    throw new Error("Admin cannot reset SuperAdmin password");
  }

  // Role-based default password from environment
  const rolePasswordMap = {
    Admin: process.env.DEFAULT_ADMIN_PASSWORD,
    Member: process.env.DEFAULT_MEMBER_PASSWORD,
    SuperAdmin: process.env.DEFAULT_SUPER_ADMIN_PASSWORD,
  };

  const defaultPassword = rolePasswordMap[user.role] || process.env.DEFAULT_MEMBER_PASSWORD;

  user.password = defaultPassword;

  user.passwordChangedAt = new Date();
  user.passwordResetBy = loggedInUser._id;

  // Invalidate all sessions
  user.tokenVersion += 1;

  // Unlock account
  user.loginAttempts = 0;
  user.lockUntil = null;

  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully",
    defaultPassword,
  });
});
