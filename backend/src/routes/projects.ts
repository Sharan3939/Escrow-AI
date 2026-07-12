import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as projectController from "../controllers/project.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  asyncHandler(projectController.createProject)
);
router.get("/", asyncHandler(projectController.getProjects));
router.get("/:id", asyncHandler(projectController.getProjectById));
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(projectController.updateProject)
);

export default router;
