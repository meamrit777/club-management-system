import express from "express";

const router = express.Router();

import {
  changeMyPassword,
  createUser,
  loginUser,
  resetUserPassword,
  updateMyProfile,
  updateUser,
} from "../controllers/UserController.js";

import { getUserById } from "../controllers/UserController.js";
import { protect } from "../middlewares/authMiddleware.js";
import canViewUser from "../middlewares/canViewUser.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

// Public
router.post("/login", loginUser);

// Admin + SuperAdmin
router.post("/", protect, authorizeRoles("Admin", "SuperAdmin"), createUser);

router.put("/:id", protect, authorizeRoles("Admin", "SuperAdmin"), updateUser);

// Protected routes (any logged in user)
router.get("/detail/:id", protect, canViewUser, getUserById);

router.put(
  "/reset-password/:id",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  resetUserPassword,
);

// Member self routes
router.put("/profile", protect, updateMyProfile);

router.put("/change-password", protect, changeMyPassword);

export default router;
