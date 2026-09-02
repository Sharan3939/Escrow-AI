import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as aiController from "../controllers/ai.controller.js";

const router = Router();

router.post(
  "/analyze",
  authMiddleware,
  asyncHandler(aiController.analyze)
);

export default router;
