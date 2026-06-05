import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { auditLog } from "../utils/auditLogger.js";

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });

/**
 * @desc    Login — returns access + refresh tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new Error("Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password +refreshToken",
  );

  if (!user || !(await user.matchPassword(password))) throw new Error("Invalid email or password");

  if (user.status === "inactive") throw new Error("Account deactivated. Contact admin.");

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await auditLog({
    action: "USER_LOGIN",
    performedBy: user._id,
    targetType: "User",
    targetId: user._id,
    req,
  });

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  res.status(200).json({
    success: true,
    data: { user: userData, accessToken, refreshToken },
    isFirstLogin: user.isFirstLogin,
  });
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) throw new Error("Refresh token required");

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) throw new Error("Invalid refresh token");

  const newAccess = generateAccessToken(user._id);
  const newRefresh = generateRefreshToken(user._id);

  user.refreshToken = newRefresh;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh } });
});

/**
 * @desc    Logout — invalidates refresh token
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  await auditLog({
    action: "USER_LOGOUT",
    performedBy: req.user._id,
    targetType: "User",
    targetId: req.user._id,
    req,
  });

  res.status(200).json({ success: true, message: "Logged out" });
});

/**
 * @desc    Change password (mandatory on first login)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) throw new Error("Current and new password are required");

  if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword)))
    throw new Error("Current password is incorrect");

  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();

  await auditLog({
    action: "PASSWORD_CHANGED",
    performedBy: req.user._id,
    targetType: "User",
    targetId: req.user._id,
    req,
  });

  res.status(200).json({ success: true, message: "Password changed successfully" });
});

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

/**
 * @desc    Store FCM push token for React Native notifications
 * @route   PUT /api/auth/fcm-token
 * @access  Private
 */
export const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw new Error("FCM token is required");

  await User.findByIdAndUpdate(req.user._id, { fcmToken });
  res.status(200).json({ success: true, message: "FCM token updated" });
});
