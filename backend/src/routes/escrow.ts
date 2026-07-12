import { Router } from "express";
import { asyncHandler } from "../middleware/auth.js";
import * as escrowController from "../controllers/escrow.controller.js";

const router = Router();

router.post("/create", asyncHandler(escrowController.createEscrow));
router.get("/:projectId", asyncHandler(escrowController.getEscrow));
router.put(
  "/:projectId/status",
  asyncHandler(escrowController.updateEscrowStatus)
);

export default router;
