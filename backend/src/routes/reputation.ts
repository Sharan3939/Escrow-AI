import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as reputationController from "../controllers/reputation.controller.js";

const router = Router();

router.get(
  "/freelancers/:userId/profile",
  asyncHandler(reputationController.getFreelancerProfile)
);
router.get(
  "/freelancers/:userId/reviews",
  asyncHandler(reputationController.getFreelancerReviews)
);
router.post(
  "/projects/:projectId/review",
  authMiddleware,
  asyncHandler(reputationController.submitProjectReview)
);

export default router;
