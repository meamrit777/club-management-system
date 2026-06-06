import express from "express";
import {
  applyPenalty,
  closeCycle,
  createContributionEra,
  getContributionEras,
  getCycleContributions,
  getCycles,
  getMemberContributions,
  markContributionPaid,
  openCycle,
  waisePenalty,
} from "../controllers/contributionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import canViewUser from "../middlewares/canViewUser.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Contribution Cycles
router.get("/cycles", protect, authorizeRoles("Admin", "SuperAdmin"), getCycles);

router.post("/cycles/open", protect, authorizeRoles("Admin", "SuperAdmin"), openCycle);

router.put("/cycles/:cycleId/close", protect, authorizeRoles("Admin", "SuperAdmin"), closeCycle);

router.get(
  "/cycles/:cycleId/contributions",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  getCycleContributions,
);

// Individual Contributions
router.put(
  "/:contributionId/pay",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  markContributionPaid,
);

router.put(
  "/:contributionId/apply-penalty",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  applyPenalty,
);

router.put(
  "/:contributionId/waive-penalty",
  protect,
  authorizeRoles("Admin", "SuperAdmin"),
  waisePenalty,
);

// Member contribution history
router.get("/member/:memberId", protect, canViewUser, getMemberContributions);

// Contribution Eras
router.get("/eras", protect, authorizeRoles("Admin", "SuperAdmin"), getContributionEras);

router.post("/eras", protect, authorizeRoles("Admin", "SuperAdmin"), createContributionEra);

export default router;
