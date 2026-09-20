import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as milestoneController from "../controllers/milestone.controller.js";

const router = Router();

router.get(
  "/project/:projectId",
  asyncHandler(milestoneController.getMilestones)
);
router.get(
  "/:milestoneId",
  asyncHandler(milestoneController.getMilestone)
);
router.get(
  "/:milestoneId/can-release",
  asyncHandler(milestoneController.checkCanRelease)
);
router.post(
  "/:milestoneId/submit",
  authMiddleware,
  asyncHandler(milestoneController.submitMilestone)
);
router.post(
  "/:milestoneId/review",
  authMiddleware,
  asyncHandler(milestoneController.reviewMilestone)
);
router.post(
  "/:milestoneId/release",
  authMiddleware,
  asyncHandler(milestoneController.releaseMilestone)
);
router.post(
  "/:milestoneId/resolve-dispute",
  authMiddleware,
  asyncHandler(milestoneController.resolveDispute)
);

export default router;
