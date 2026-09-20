import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as submissionController from "../controllers/submission.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  asyncHandler(submissionController.createSubmission)
);

router.get("/:projectId", asyncHandler(submissionController.getSubmission));

router.post(
  "/:id/review",
  authMiddleware,
  asyncHandler(submissionController.reviewSubmission)
);

export default router;
