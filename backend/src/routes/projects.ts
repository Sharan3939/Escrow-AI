import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as projectController from "../controllers/project.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  asyncHandler(projectController.createProject)
);
router.get("/freelancer/projects", authMiddleware, asyncHandler(projectController.getFreelancerProjects));
router.get("/", asyncHandler(projectController.getProjects));
router.get("/:id", asyncHandler(projectController.getProjectById));
router.post(
  "/:id/accept",
  authMiddleware,
  asyncHandler(projectController.acceptProject)
);
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(projectController.updateProject)
);
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(projectController.deleteProject)
);

export default router;

