import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as escrowController from "../controllers/escrow.controller.js";

const router = Router();

router.post("/create", asyncHandler(escrowController.createEscrow));
router.get("/:projectId", asyncHandler(escrowController.getEscrow));
router.get(
  "/:projectId/can-release",
  asyncHandler(escrowController.checkReleaseEligibility)
);
router.put(
  "/:projectId/status",
  asyncHandler(escrowController.updateEscrowStatus)
);
router.post(
  "/:projectId/resolve-dispute",
  authMiddleware,
  asyncHandler(escrowController.resolveDispute)
);

export default router;
