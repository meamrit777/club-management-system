import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

import User from "../models/UserModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401);
        throw new Error("User not found");
      }

      // Account disabled
      if (!user.isActive) {
        res.status(401);
        throw new Error("Account disabled");
      }

      // Token invalidated
      if (decoded.tokenVersion !== user.tokenVersion) {
        res.status(401);
        throw new Error("Session expired. Please login again.");
      }

      // Locked account
      if (user.lockUntil && user.lockUntil > Date.now()) {
        res.status(401);
        throw new Error("Account temporarily locked");
      }

      req.user = user;

      next();
    } catch (error) {
      console.error(error);

      res.status(401);

      throw new Error("Unauthorized");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("No token");
  }
});
